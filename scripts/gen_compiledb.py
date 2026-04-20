#!/usr/bin/env python3
"""Generate a merged ``compile_commands.json`` for clangd.

PlatformIO's ``pio run -t compiledb`` only emits compile commands for the
sources of a single environment, and ``pio test`` has no compiledb target.
To get accurate IDE diagnostics for both the firmware (env ``nodemcuv2``)
and the host unit tests (env ``native``) we:

1. Run ``pio run -e nodemcuv2 -t compiledb`` -> firmware sources DB.
2. Run ``pio test -e native --without-uploading --without-testing -vvv`` after
   wiping ``.pio/build/native``, parse the verbose ``g++``/``gcc`` lines, and
   synthesize compile_commands entries for the test sources.
3. Merge both into a single ``compile_commands.json`` at the project root.

Run from anywhere; the script always operates relative to the repo root.
"""

from __future__ import annotations

import json
import re
import shlex
import shutil
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
FIRMWARE_ENV = "nodemcuv2"
TEST_ENV = "native"
OUTPUT = REPO_ROOT / "compile_commands.json"

# Xtensa / ESP8266 GCC driver flags that the host LLVM/clang driver used by
# clang-tidy does not understand. Stripping them keeps the rest of the
# compile command intact so clang can still parse the TU and surface real
# lint findings instead of bailing with clang-diagnostic-error.
XTENSA_UNKNOWN_FLAGS: frozenset[str] = frozenset(
    {
        "-free",
        "-fipa-pta",
        "-mlongcalls",
        "-mtext-section-literals",
    }
)

# Recognises the xtensa cross compilers PlatformIO invokes from the
# compile_commands entries; used to locate the toolchain root so we can
# surface its newlib / libstdc++ headers to clang-tidy's clang parser.
_XTENSA_COMPILER_SUFFIXES: tuple[str, ...] = (
    "xtensa-lx106-elf-g++",
    "xtensa-lx106-elf-gcc",
)


def run(cmd: list[str], **kwargs) -> subprocess.CompletedProcess[str]:
    print(f"[gen_compiledb] $ {' '.join(shlex.quote(c) for c in cmd)}", flush=True)
    return subprocess.run(
        cmd, cwd=REPO_ROOT, text=True, check=True, **kwargs
    )


def firmware_entries() -> list[dict]:
    """Generate the firmware compile_commands via PlatformIO's compiledb target."""
    # `pio run -t compiledb` writes compile_commands.json into the project root,
    # which would clobber our merged output. Capture and immediately move it.
    if OUTPUT.exists():
        OUTPUT.unlink()
    run(["pio", "run", "-e", FIRMWARE_ENV, "-t", "compiledb"])
    if not OUTPUT.exists():
        print(
            f"[gen_compiledb] WARN: pio did not produce {OUTPUT.name} for env "
            f"{FIRMWARE_ENV!r}; firmware entries will be empty",
            file=sys.stderr,
        )
        return []
    data = json.loads(OUTPUT.read_text())
    OUTPUT.unlink()
    toolchain = _detect_xtensa_toolchain(data)
    extra_isystem = _xtensa_isystem_args(toolchain) if toolchain else []
    return [_rewrite_firmware_entry(entry, extra_isystem) for entry in data]


def _entry_tokens(entry: dict) -> list[str]:
    """Extract the argv tokens from a compile_commands entry, in order."""
    args = entry.get("arguments")
    if isinstance(args, list):
        return list(args)
    command = entry.get("command")
    if isinstance(command, str):
        return shlex.split(command)
    return []


def _detect_xtensa_toolchain(entries: list[dict]) -> Path | None:
    """Infer the xtensa toolchain root (``.../toolchain-xtensa``) from an entry.

    PlatformIO emits compile commands whose compiler argv[0] is an absolute
    path like ``.../toolchain-xtensa/bin/xtensa-lx106-elf-g++``; walking up
    two parents gives us the toolchain root.
    """
    for entry in entries:
        for tok in _entry_tokens(entry):
            if not tok.endswith(_XTENSA_COMPILER_SUFFIXES):
                continue
            compiler = Path(tok)
            if not compiler.is_absolute():
                continue
            root = compiler.parent.parent
            if (root / "xtensa-lx106-elf" / "include").is_dir():
                return root
    return None


def _xtensa_isystem_args(toolchain: Path) -> list[str]:
    """Build ``-isystem`` args pointing at the xtensa newlib + libstdc++ tree.

    Host clang's default search order puts ``-isystem`` entries before the
    implicit system dirs (``/usr/include`` etc.), so injecting the xtensa
    headers here lets clang-tidy find ``sys/config.h`` and picks the
    toolchain's ``sys/types.h`` over glibc's, which otherwise clashes with
    the ESP8266 SDK's ``c_types.h``.
    """
    candidates: list[Path] = []
    cxx_versions = sorted(
        (toolchain / "xtensa-lx106-elf" / "include" / "c++").glob("*"),
        key=lambda p: p.name,
    )
    if cxx_versions:
        cxx = cxx_versions[-1]
        candidates += [cxx, cxx / "xtensa-lx106-elf", cxx / "backward"]
    gcc_versions = sorted(
        (toolchain / "lib" / "gcc" / "xtensa-lx106-elf").glob("*"),
        key=lambda p: p.name,
    )
    if gcc_versions:
        gcc = gcc_versions[-1]
        candidates += [gcc / "include", gcc / "include-fixed"]
    candidates += [
        toolchain / "xtensa-lx106-elf" / "sys-include",
        toolchain / "xtensa-lx106-elf" / "include",
    ]
    args: list[str] = []
    for path in candidates:
        if path.is_dir():
            args += ["-isystem", str(path)]
    return args


def _rewrite_firmware_entry(entry: dict, extra_isystem: list[str]) -> dict:
    """Make a firmware compile entry consumable by host clang-tidy.

    1. Drop xtensa-specific driver flags clang rejects.
    2. Insert ``-isystem`` paths for the xtensa sysroot right after the
       compiler token so they outrank the host system dirs.

    Handles both the ``command`` string and ``arguments`` list shapes that
    PlatformIO may emit.
    """

    def _rewrite(tokens: list[str]) -> list[str]:
        filtered = [t for t in tokens if t not in XTENSA_UNKNOWN_FLAGS]
        if extra_isystem and filtered:
            filtered = filtered[:1] + extra_isystem + filtered[1:]
        return filtered

    if isinstance(entry.get("arguments"), list):
        entry["arguments"] = _rewrite(entry["arguments"])
    if isinstance(entry.get("command"), str):
        tokens = _rewrite(shlex.split(entry["command"]))
        entry["command"] = " ".join(shlex.quote(t) for t in tokens)
    return entry


# Matches verbose pio test compile lines, e.g.:
#   g++ -o .pio/build/native/test/.../foo.o -c -std=gnu++17 ... test/.../foo.cpp
#   gcc -o .pio/build/native/.../bar.o -c ... .pio/.../bar.c
COMPILE_LINE_RE = re.compile(
    r"^(?P<cc>g\+\+|gcc|clang\+\+|clang)\s+-o\s+(?P<out>\S+)\s+-c\s+.*\s(?P<src>\S+\.(?:cpp|cc|cxx|c))\s*$"
)


def test_entries() -> list[dict]:
    """Capture verbose compile commands from a clean native test build.

    We deliberately wipe ``.pio/build/native`` so SCons re-emits every command;
    otherwise an incremental build prints nothing and we'd miss test sources.
    """
    native_build = REPO_ROOT / ".pio" / "build" / TEST_ENV
    if native_build.exists():
        shutil.rmtree(native_build)

    proc = subprocess.run(
        [
            "pio",
            "test",
            "-e",
            TEST_ENV,
            "--without-uploading",
            "--without-testing",
            "-vvv",
        ],
        cwd=REPO_ROOT,
        text=True,
        capture_output=True,
        check=False,
    )
    if proc.returncode != 0:
        sys.stderr.write(proc.stdout)
        sys.stderr.write(proc.stderr)
        raise SystemExit(
            f"[gen_compiledb] pio test build failed (exit {proc.returncode})"
        )

    entries: list[dict] = []
    seen: set[tuple[str, str]] = set()
    for raw_line in proc.stdout.splitlines():
        line = raw_line.strip()
        match = COMPILE_LINE_RE.match(line)
        if not match:
            continue
        src = match.group("src")
        out = match.group("out")
        src_abs = (REPO_ROOT / src).resolve() if not Path(src).is_absolute() else Path(src)
        key = (str(src_abs), out)
        if key in seen:
            continue
        seen.add(key)
        entries.append(
            {
                "command": line,
                "directory": str(REPO_ROOT),
                "file": str(src_abs),
                "output": out,
            }
        )
    return entries


def main() -> int:
    if shutil.which("pio") is None:
        print(
            "[gen_compiledb] ERROR: 'pio' (PlatformIO Core) not found in PATH",
            file=sys.stderr,
        )
        return 1

    fw = firmware_entries()
    tests = test_entries()
    merged = fw + tests
    OUTPUT.write_text(json.dumps(merged, indent=2) + "\n")
    print(
        f"[gen_compiledb] wrote {OUTPUT.relative_to(REPO_ROOT)} "
        f"({len(fw)} firmware + {len(tests)} test entries)"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
