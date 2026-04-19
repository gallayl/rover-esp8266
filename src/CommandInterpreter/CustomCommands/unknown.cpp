#include "unknown.h"
#include "../CommandParser.h"
#include "../../globals.h"
#include <AsyncWebSocket.h>

CustomCommand *unknownCommand = new CustomCommand("", [](String command)
                                                  { webSocket->textAll("{\"message\": \"Unknown command: " + CommandParser::GetCommandName(command) + ".\"}"); });
