# Rover ESP8266

A simple 2WD rover firmware for the **ESP8266 NodeMCU v2** with a motor shield, ultrasonic distance sensor, and quadrature/single-channel wheel encoders. Exposes a websocket-driven control API plus a small static web UI served from the device's LittleFS partition.

## Hardware

- NodeMCU v2 (ESP-12E)
- L293D-style motor shield (or equivalent) wired as:
  - Left motor: throttle GPIO 4, direction GPIO 2, encoder D6 (GPIO 12)
  - Right motor: throttle GPIO 5, direction GPIO 0, encoder D7 (GPIO 13)
- HC-SR04 ultrasonic sensor: trig D5 (GPIO 14), echo D8 (GPIO 15)

Encoder pins use the internal pull-up. If your encoder cannot drive the line low (e.g. push-pull totem-pole output) add an external 10k pulldown and switch the pin mode.

## Devcontainer

The repo ships a `.devcontainer/` config (Cursor / VSCode / GitHub Codespaces
compatible). Reopen in container to get Python 3.12, Node 22, Yarn 4,
PlatformIO, clangd, clang-format, clang-tidy, and cppcheck preinstalled with
the matching VSCode extensions.

## Tooling

All day-to-day commands run from the repo root via `yarn`. Two toolchains
back the scripts:

- **[uv](https://docs.astral.sh/uv/)** owns the Python side (PlatformIO,
  `clang-format`, `clang-tidy`). Versions are pinned in `pyproject.toml` /
  `uv.lock`. `uv sync` materializes the toolchain.
- **Yarn 4** (with workspaces) owns the JS side. The frontend is a workspace
  under `frontend/`; a single root `yarn install` covers everything.

### Prerequisites

- [uv](https://docs.astral.sh/uv/) on PATH.
- Node.js 22+ with Yarn 4 enabled via Corepack: `corepack enable && corepack prepare yarn@4 --activate`.
- `cppcheck` (apt / brew) — only needed for `yarn lint:cpp`.
- The devcontainer (`.devcontainer/`) bundles everything; reopen in container
  to skip the manual setup.

### One-shot setup

```bash
yarn setup   # = uv sync && yarn install --immutable && uv run pio run -t compiledb
```

This installs the pinned Python tooling, the JS workspaces, registers the
Husky pre-commit hook (via `prepare`), and produces `compile_commands.json`
for clangd.

### Root scripts

| Script                | What it does                                                 |
| --------------------- | ------------------------------------------------------------ |
| `yarn setup`          | Bootstrap (uv sync + yarn install + compiledb).              |
| `yarn compiledb`      | Generate merged `compile_commands.json` for clangd.          |
| `yarn build`          | `build:firmware` + `build:fs`.                               |
| `yarn build:firmware` | `pio run` (firmware only, fast).                             |
| `yarn build:fs`       | Build the LittleFS image; bundles the frontend into `data/`. |
| `yarn build:frontend` | Vite build only (no PlatformIO).                             |
| `yarn start`          | `vite` dev server for the frontend.                          |
| `yarn format`         | Format C++ (clang-format) + frontend (prettier/eslint).      |
| `yarn format:check`   | Read-only equivalent (used by CI).                           |
| `yarn lint`           | `lint:cpp` (cppcheck via `pio check`) + `lint:frontend`.     |
| `yarn lint:cpp:tidy`  | clang-tidy on `src/` (warn-only in CI).                      |
| `yarn typecheck`      | `tsc --noEmit` on the frontend workspace.                    |
| `yarn test`           | Native unit tests + frontend (vitest).                       |
| `yarn check`          | `format:check` + `lint` + `typecheck` + `test`.              |
| `yarn ci`             | `check` + `build` — what the workflows run.                  |

Direct PlatformIO commands still work (they're just `uv run pio …` under the
hood); the `yarn` aliases exist so contributors and CI share one entry point.

## Build & flash

```bash
yarn build:firmware              # build firmware (Node not required at runtime, but yarn dispatches)
uv run pio run -t upload         # flash firmware over USB
yarn build:fs                    # build LittleFS image (auto-rebuilds frontend)
uv run pio run -t uploadfs       # upload LittleFS image
uv run pio device monitor -b 115200
```

The `data/` directory is generated and gitignored. Rebuild only the
frontend bundle (without invoking PlatformIO):

```bash
yarn build:frontend   # writes to ../data
```

## Pre-commit hooks

A root-level husky hook runs `lint-staged` against staged files:

- `src/**` and `test/**` `*.{c,cpp,h,hpp}` → `uv run clang-format -i`
- `frontend/**` `*.{ts,tsx,js,...}` → `eslint --fix` + `prettier --write`

`yarn setup` (or any plain `yarn install`) registers the hook through the
`prepare` script. No separate install in `frontend/` is needed — workspaces
hoist everything to the root `node_modules/`.

## Editor / clangd

The repo ships a `.clang-format` (LLVM base, Allman braces, 4-space indent) and a
`.clangd` config. To enable rich C++ IntelliSense in any clangd-capable editor
(Cursor, VSCode, Vim, Emacs, Zed) generate the compilation database after the
first build:

```bash
yarn compiledb       # or: python3 scripts/gen_compiledb.py
```

This wraps `pio run -t compiledb` for the firmware (`nodemcuv2`) and harvests
the verbose `pio test -e native` output for host test sources, then merges both
into a single `compile_commands.json` at the repo root so clangd resolves
includes for `src/` and `test/` alike. The file is gitignored; regenerate after
changing `platformio.ini`, adding sources, or pulling new lib deps.

After first boot, the device starts an `AutoConnectAP` WiFi access point. Connect, configure your home WiFi, then access the rover at the IP printed to serial.

## Endpoints

- `GET /` — Web UI (served from LittleFS).
- `GET /update` — Firmware update form (HTML).
- `POST /update` — OTA firmware upload.
- `GET /heap` — Free heap as plain text.
- `WS /ws` — Command channel + telemetry stream.
- FTP on port 21 (`ftp` / `ftp`) for managing the LittleFS contents.

## Commands (websocket / serial)

| Command              | Args            | Description                                    |
| -------------------- | --------------- | ---------------------------------------------- |
| `move L R`           | int -1023..1023 | Open-loop throttle for left and right motor.   |
| `moveTicks L R`      | int ticks/s     | Closed-loop PID control to a target tick rate. |
| `stop`               | —               | Halt both motors.                              |
| `configurePid P I D` | doubles         | Update PID tunings for both motors at runtime. |
| `distance`           | —               | Force-publish the current ultrasonic reading.  |
| `info`               | —               | Publish device + WiFi diagnostics.             |
| `restart`            | —               | Reboot the device.                             |

## Security note

This firmware is intended for use on a trusted home network. The websocket, `/update` endpoint, and FTP server are **unauthenticated** — anyone on the same LAN can drive the rover, flash arbitrary firmware, or modify the LittleFS contents. Do not expose the device to untrusted networks.
