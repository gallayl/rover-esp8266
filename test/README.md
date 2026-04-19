# Tests

Native (host) unit tests live here. Run them with:

```bash
pio test -e native
```

Each subdirectory matching `test_*` is a separate test program, executed by the
PlatformIO + Unity runner. Tests must be hardware-independent: the `native`
environment uses host gcc and excludes `src/` via `build_src_filter`, so tests
should `#include` self-contained headers (e.g. `CommandParserCore.h`) directly.
