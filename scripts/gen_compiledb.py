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
    return [_strip_unknown_flags(entry) for entry in data]


def _strip_unknown_flags(entry: dict) -> dict:
    """Remove Xtensa GCC driver flags clang refuses to accept.

    PlatformIO emits entries with either a ``command`` string or an
    ``arguments`` list; handle both so downstream clang-tidy can still
    parse the translation unit.
    """
    if "arguments" in entry and isinstance(entry["arguments"], list):
        entry["arguments"] = [
            arg for arg in entry["arguments"] if arg not in XTENSA_UNKNOWN_FLAGS
        ]
    if "command" in entry and isinstance(entry["command"], str):
        tokens = shlex.split(entry["command"])
        filtered = [tok for tok in tokens if tok not in XTENSA_UNKNOWN_FLAGS]
        entry["command"] = " ".join(shlex.quote(tok) for tok in filtered)
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
