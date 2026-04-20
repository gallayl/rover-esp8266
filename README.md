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

## Software dependencies

- [PlatformIO](https://platformio.org/) — install via [uv](https://docs.astral.sh/uv/): `uv tool install 'platformio>=6.1,<7'`
- Node.js 22+ and Yarn 4 (via `corepack enable && corepack prepare yarn@4 --activate`) — only required to build the web UI for the LittleFS image.
- All Arduino library deps are pinned in `platformio.ini` and fetched automatically on first build.

## Build & flash

```bash
# Build firmware (no Node required)
pio run

# Flash firmware over USB
pio run -t upload

# Build & upload the LittleFS image (web UI). Vite is invoked automatically via
# scripts/build_frontend.py; the resulting bundle lands in ./data which is then
# packaged into littlefs.bin.
pio run -t buildfs
pio run -t uploadfs

# Tail serial monitor
pio device monitor -b 115200
```

The `data/` directory is generated and gitignored. To rebuild the frontend
without touching firmware:

```bash
cd frontend
yarn install
yarn build  # writes to ../data
```

## Pre-commit hooks

A root-level husky hook runs `lint-staged` against staged files:

- `src/**` and `test/**` `*.{c,cpp,h,hpp}` → `clang-format -i`
- `frontend/**` `*.{ts,tsx,js,...}` → `eslint --fix` + `prettier --write`

Install once after cloning:

```bash
yarn install
```

`yarn install` at the repo root pulls husky + lint-staged and registers the
hook via the `prepare` script. The frontend keeps its own `yarn install` for
app dependencies.

## Editor / clangd

The repo ships a `.clang-format` (LLVM base, Allman braces, 4-space indent) and a
`.clangd` config. To enable rich C++ IntelliSense in any clangd-capable editor
(Cursor, VSCode, Vim, Emacs, Zed) generate the compilation database after the
first build:

```bash
pio run -t compiledb
```

The resulting `compile_commands.json` is gitignored; regenerate after changing
`platformio.ini` or pulling new lib deps.

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
