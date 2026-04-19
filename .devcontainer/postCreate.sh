#!/usr/bin/env bash
set -euo pipefail

# System tooling for C++ static analysis + formatting (clangd ships via the
# VSCode extension binary, but we install the CLI counterparts so they're
# available in CI-equivalent commands and pre-commit hooks).
sudo apt-get update
sudo apt-get install -y --no-install-recommends \
    clang-format \
    clang-tidy \
    cppcheck \
    udev

pip install --user -r requirements.txt

corepack enable
corepack prepare yarn@4.14.1 --activate

echo "[devcontainer] installing root dev deps (husky, lint-staged)..."
yarn install

echo "[devcontainer] installing frontend deps..."
(cd frontend && yarn install)

echo "[devcontainer] generating compile_commands.json (clangd index)..."
pio run -t compiledb || echo "[devcontainer] WARN: compiledb generation failed; run 'pio run -t compiledb' manually after first build"

cat <<'EOF'

devcontainer ready. Useful commands:
  pio run                       # build firmware
  pio run -t buildfs            # build LittleFS image (auto-rebuilds frontend)
  pio test -e native            # run host unit tests
  pio check                     # run cppcheck
  yarn --cwd frontend test      # run vitest

EOF
