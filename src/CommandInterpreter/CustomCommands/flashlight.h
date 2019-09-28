#pragma once

#include "../CommandParser.h"
#include "../CustomCommand.h"

#define FLASHLIGHT_PIN 4

CustomCommand *flashlightAction = new CustomCommand("flashlight", [](String command) {
    pinMode(FLASHLIGHT_PIN, OUTPUT);
    bool flashState = false;
    String param = CommandParser::GetCommandParameter(command, 1);
    if (param == "switch")
    {
        flashState = !digitalRead(FLASHLIGHT_PIN);
    }
    else if (param == "on" || param == "true")
    {
        flashState = true;
    }
    else if (param == "off" || param == "false")
    {
        flashState = false;
    }
    digitalWrite(FLASHLIGHT_PIN, flashState);
    return String("{\"flashlight\": " + String(flashState) + "}");
});
