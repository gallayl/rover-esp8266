"""Inject a build version + timestamp into the firmware via preprocessor macros.

`BUILD_VERSION` is `git describe --tags --always --dirty` when available, falling
back to the short SHA, or `unknown` outside of a git checkout. `BUILD_DATE` is
the current UTC timestamp in ISO-8601.
"""

from __future__ import annotations

import datetime
import shutil
import subprocess
from pathlib import Path

Import("env")  # type: ignore[name-defined]  # noqa: F821 — provided by SCons


def _git_describe(project_dir: Path) -> str:
    git = shutil.which("git")
    if git is None or not (project_dir / ".git").exists():
        return "unknown"
    try:
        out = subprocess.check_output(
            [git, "describe", "--tags", "--always", "--dirty"],
            cwd=project_dir,
            stderr=subprocess.DEVNULL,
        )
        return out.decode().strip() or "unknown"
    except subprocess.CalledProcessError:
        return "unknown"


_project_dir = Path(env["PROJECT_DIR"])  # type: ignore[name-defined]  # noqa: F821
_version = _git_describe(_project_dir)
_build_date = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

env.Append(  # type: ignore[name-defined]  # noqa: F821
    BUILD_FLAGS=[
        f'-DBUILD_VERSION=\\"{_version}\\"',
        f'-DBUILD_DATE=\\"{_build_date}\\"',
    ]
)

print(f"[inject_version] BUILD_VERSION={_version} BUILD_DATE={_build_date}")
