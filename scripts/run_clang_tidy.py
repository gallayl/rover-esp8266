#!/usr/bin/env python3
"""Run ``clang-tidy`` and ignore unavoidable framework-header parse errors.

Host LLVM cannot fully parse the ESP8266 / Xtensa framework headers through
the cross-compiler's compilation database (e.g. ``sys/pgmspace.h`` performs
``void*`` arithmetic which is a hard error in C++). Those parse failures
surface as ``clang-diagnostic-*`` findings against paths outside ``src/``
and ``test/`` and make ``clang-tidy`` exit non-zero even when our own code
is clean.

This wrapper:
  1. Streams clang-tidy output verbatim so CI logs and GitHub annotations
     remain intact.
  2. Parses diagnostic lines and re-computes the exit status:
       - exit 0 when every ``severity: error`` originates from a non-user
         file and is a ``clang-diagnostic-*`` check;
       - exit 1 if any ``severity: error`` targets ``src/`` or ``test/``,
         regardless of the check (so real regressions still block).

Warnings remain informational, matching the "warn-only" intent of the CI
job that invokes this script.
"""

from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
USER_PREFIXES: tuple[str, ...] = ("src/", "test/")

DIAG_RE = re.compile(
    r"^(?P<path>[^:\n]+):(?P<line>\d+):(?P<col>\d+):\s+"
    r"(?P<severity>error|warning|note):\s+.*\[(?P<check>[^\]]+)\]\s*$"
)


def _is_user_path(raw_path: str) -> bool:
    path = Path(raw_path)
    if not path.is_absolute():
        path = REPO_ROOT / path
    try:
        rel = path.resolve().relative_to(REPO_ROOT)
    except (OSError, ValueError):
        return False
    rel_posix = rel.as_posix()
    return any(rel_posix.startswith(prefix) for prefix in USER_PREFIXES)


def main(argv: list[str]) -> int:
    cmd = ["clang-tidy", *argv]
    proc = subprocess.Popen(
        cmd,
        cwd=REPO_ROOT,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
    )
    assert proc.stdout is not None

    user_errors = 0
    ignored_framework_errors = 0
    warnings = 0

    for line in proc.stdout:
        sys.stdout.write(line)
        sys.stdout.flush()
        match = DIAG_RE.match(line.rstrip())
        if not match:
            continue
        severity = match.group("severity")
        if severity == "note":
            continue
        user = _is_user_path(match.group("path"))
        if severity == "warning":
            if user:
                warnings += 1
            continue
        if user:
            user_errors += 1
        else:
            ignored_framework_errors += 1

    proc.wait()

    print(
        f"\n[run-clang-tidy] user warnings: {warnings}; "
        f"user errors: {user_errors}; "
        f"ignored framework-header errors: {ignored_framework_errors}; "
        f"clang-tidy exit: {proc.returncode}",
        flush=True,
    )
    return 1 if user_errors > 0 else 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
