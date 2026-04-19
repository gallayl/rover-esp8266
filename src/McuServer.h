#pragma once

#include <ESPAsyncWebServer.h>
#include "./CommandInterpreter/CommandInterpreter.h"

class McuServer
{
public:
    McuServer(CommandInterpreter* commandInterpreter, AsyncWebSocket* webSocket, AsyncWebServer* webServer);
    void setup();
    void closeSockets();
    void broadcast(String text);

private:
    AsyncWebSocket* webSocket;
    AsyncWebServer* webServer;
    CommandInterpreter* commandInterpreter;
};
