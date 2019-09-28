#pragma once

#include "../CommandParser.h"
#include "../CustomCommand.h"

CustomCommand *reset = new CustomCommand("restart", [](String command) {
    ESP.restart();
    return String("{\"event\": \"restart\"}");
});