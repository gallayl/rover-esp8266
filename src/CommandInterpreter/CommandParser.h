#pragma once

#include <Arduino.h>

#define COMMAND_DELIMITER " "
#define MAX_COMMAND_LEN 128

class CommandParser
{
public:
    static String GetCommandName(const String &command);
    static String GetCommandParameter(const String &command, uint8_t parameterNo);
};
