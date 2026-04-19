# Rover ESP8266

A simple 2WD rover firmware for the **ESP8266 NodeMCU v2** with a motor shield, ultrasonic distance sensor, and quadrature/single-channel wheel encoders. Exposes a websocket-driven control API plus a small static web UI served from the device's LittleFS partition.

## Hardware

- NodeMCU v2 (ESP-12E)
- L293D-style motor shield (or equivalent) wired as:
  - Left motor: throttle GPIO 4, direction GPIO 2, encoder D6 (GPIO 12)
  - Right motor: throttle GPIO 5, direction GPIO 0, encoder D7 (GPIO 13)
- HC-SR04 ultrasonic sensor: trig D5 (GPIO 14), echo D8 (GPIO 15)

Encoder pins use the internal pull-up. If your encoder cannot drive the line low (e.g. push-pull totem-pole output) add an external 10k pulldown and switch the pin mode.

## Software dependencies

- [PlatformIO](https://platformio.org/)
- All Arduino library deps are pinned in `platformio.ini` and fetched automatically on first build.

## Build & flash

```bash
# Build firmware
pio run

# Flash firmware over USB
pio run -t upload

# Build & upload the LittleFS image (web UI)
pio run -t buildfs
pio run -t uploadfs

# Tail serial monitor
pio device monitor -b 115200
```

After first boot, the device starts an `AutoConnectAP` WiFi access point. Connect, configure your home WiFi, then access the rover at the IP printed to serial.

## Endpoints

- `GET /` — Web UI (served from LittleFS).
- `GET /update` — Firmware update form (HTML).
- `POST /update` — OTA firmware upload.
- `GET /heap` — Free heap as plain text.
- `WS /ws` — Command channel + telemetry stream.
- FTP on port 21 (`ftp` / `ftp`) for managing the LittleFS contents.

## Commands (websocket / serial)

| Command | Args | Description |
|---|---|---|
| `move L R` | int -1023..1023 | Open-loop throttle for left and right motor. |
| `moveTicks L R` | int ticks/s | Closed-loop PID control to a target tick rate. |
| `stop` | — | Halt both motors. |
| `configurePid P I D` | doubles | Update PID tunings for both motors at runtime. |
| `distance` | — | Force-publish the current ultrasonic reading. |
| `info` | — | Publish device + WiFi diagnostics. |
| `restart` | — | Reboot the device. |

## Security note

This firmware is intended for use on a trusted home network. The websocket, `/update` endpoint, and FTP server are **unauthenticated** — anyone on the same LAN can drive the rover, flash arbitrary firmware, or modify the LittleFS contents. Do not expose the device to untrusted networks.
