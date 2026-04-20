#!/usr/bin/env bash
set -euo pipefail

# System tooling that we cannot pull from PyPI / npm: cppcheck (C/C++ static
# analysis) and udev (USB rules for board flashing). clang-format / clang-tidy
# come from the pinned uv environment.
sudo apt-get update
sudo apt-get install -y --no-install-recommends \
    cppcheck \
    udev

# Install uv if not already provided by the base image.
if ! command -v uv >/dev/null 2>&1; then
    echo "[devcontainer] installing uv..."
    pip install --user uv
fi

corepack enable
corepack prepare yarn@4.14.1 --activate

echo "[devcontainer] running unified setup (uv sync + yarn install + compiledb)..."
yarn setup || echo "[devcontainer] WARN: 'yarn setup' failed (re-run 'yarn compiledb' manually after first build)"

cat <<'EOF'

devcontainer ready. Useful commands (all from repo root):
  yarn build:firmware           # build firmware
  yarn build:fs                 # build LittleFS image (auto-rebuilds frontend)
  yarn test:native              # run host unit tests
  yarn lint:cpp                 # cppcheck
  yarn test:frontend            # run vitest
  yarn check                    # format:check + lint + typecheck + test
  yarn ci                       # full CI parity (check + build)

EOF
