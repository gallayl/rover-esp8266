#pragma once

#include "../CommandParser.h"
#include "../CustomCommand.h"

CustomCommand *unknownCommand = new CustomCommand("", [](String command) {
    String value = "{\"message\": \"Unknown command: " + CommandParser::GetCommandName(command) + ".\"}";
    return value;
});