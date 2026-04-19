"""Pre-action that builds the Vite frontend into ./data before LittleFS packaging.

Runs only for the `buildfs` and `uploadfs` targets so plain `pio run` (firmware
only) stays fast and Node-free.
"""

from __future__ import annotations

import os
import shutil
import subprocess
import sys
from pathlib import Path

Import("env")  # type: ignore[name-defined]  # noqa: F821 — provided by SCons


PROJECT_DIR = Path(env["PROJECT_DIR"])  # type: ignore[name-defined]  # noqa: F821
FRONTEND_DIR = PROJECT_DIR / "frontend"
DATA_DIR = PROJECT_DIR / "data"


def _build_frontend(_source, _target, _env):  # noqa: ANN001 — SCons callback signature
    if not FRONTEND_DIR.is_dir():
        print(f"[build_frontend] frontend dir not found at {FRONTEND_DIR}, skipping")
        return

    yarn = shutil.which("yarn")
    if yarn is None:
        sys.stderr.write(
            "[build_frontend] ERROR: `yarn` not found on PATH. "
            "Install Node 22+ and Yarn 4 (corepack enable && corepack prepare yarn@4 --activate) "
            "or build the frontend manually with `cd frontend && yarn install && yarn build`.\n"
        )
        env.Exit(1)  # type: ignore[name-defined]  # noqa: F821

    if not (FRONTEND_DIR / "node_modules").exists():
        print("[build_frontend] node_modules missing, running `yarn install --immutable`")
        subprocess.check_call([yarn, "install", "--immutable"], cwd=FRONTEND_DIR)

    print(f"[build_frontend] building Vite bundle into {DATA_DIR}")
    subprocess.check_call([yarn, "build"], cwd=FRONTEND_DIR)

    if not DATA_DIR.is_dir() or not any(DATA_DIR.iterdir()):
        sys.stderr.write(
            f"[build_frontend] ERROR: build produced no files in {DATA_DIR}. "
            "Check vite.config.ts outDir.\n"
        )
        env.Exit(1)  # type: ignore[name-defined]  # noqa: F821


# PlatformIO invokes the same script for every target. Gate on the active targets
# instead of registering globally so firmware-only builds stay untouched.
_FS_TARGETS = {"buildfs", "uploadfs"}
_active_targets = set(map(str, BUILD_TARGETS))  # type: ignore[name-defined]  # noqa: F821

if _active_targets & _FS_TARGETS:
    env.AddPreAction("$BUILD_DIR/littlefs.bin", _build_frontend)  # type: ignore[name-defined]  # noqa: F821
elif os.environ.get("ROVER_FORCE_FRONTEND_BUILD") == "1":
    _build_frontend(None, None, env)  # type: ignore[name-defined]  # noqa: F821
