#include "reset.h"
#include <Arduino.h>

CustomCommand* restart = new CustomCommand("restart", [](const String& /*command*/) { EspClass::restart(); });
