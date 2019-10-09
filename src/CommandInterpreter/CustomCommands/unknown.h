#pragma once

#include "../CommandParser.h"
#include "../CustomCommand.h"
#include <AsyncWebSocket.h>

extern AsyncWebSocket* webSocket;

CustomCommand *unknownCommand = new CustomCommand("", [](String command) {
    webSocket->textAll("{\"message\": \"Unknown command: " + CommandParser::GetCommandName(command) + ".\"}");
});