#include "reset.h"
#include <Arduino.h>

CustomCommand *restart = new CustomCommand("restart", [](String command)
                                           { ESP.restart(); });
