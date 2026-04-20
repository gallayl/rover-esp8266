#include "McuServer.h"
#include "./mime.h"
#include "./api/update.h"
#include "./CommandInterpreter/CommandParser.h"
#include "./CommandInterpreter/CustomCommands/move.h"
#include "./CommandInterpreter/CustomCommands/distance.h"
#include "./CommandInterpreter/CustomCommands/wifi.h"
#include <LittleFS.h>
#include <string.h>

McuServer::McuServer(CommandInterpreter* commandInterpreter, AsyncWebSocket* webSocket, AsyncWebServer* webServer)
    : webSocket(webSocket), webServer(webServer), commandInterpreter(commandInterpreter)
{
}

void McuServer::setup()
{
    this->webSocket->onEvent(
        [this](AsyncWebSocket* server, AsyncWebSocketClient* client, AwsEventType type, void* arg, uint8_t* data,
               size_t len)
        {
            if (type == WS_EVT_CONNECT)
            {
                Serial.println("Websocket client connection received");
                client->text(getMotorTickChangeMessage(leftMotor->index, lastSentLeft));
                client->text(getMotorTickChangeMessage(rightMotor->index, lastSentRight));
                client->text(getDistanceMessage(lastSentDistance));
                client->text(getWifiMessage(lastSentRssi));
            }
            else if (type == WS_EVT_DISCONNECT)
            {
                Serial.println("Client disconnected");
            }
            else if (type == WS_EVT_DATA)
            {
                AwsFrameInfo* info = (AwsFrameInfo*)arg;
                // Reject fragmented or multi-frame messages: rover commands fit in a single frame.
                if (info == nullptr || !info->final || info->index != 0 || info->len != len)
                {
                    Serial.println("Dropping fragmented or multi-frame WS message");
                    return;
                }
                if (len == 0 || len > MAX_COMMAND_LEN)
                {
                    Serial.println("Dropping empty or oversized WS message");
                    return;
                }
                // Copy into a NUL-terminated stack buffer; raw `data` is not NUL-terminated and
                // ESP8266's Arduino String has no (const char *, size_t) constructor.
                char buf[MAX_COMMAND_LEN + 1];
                memcpy(buf, data, len);
                buf[len] = '\0';
                String str(buf);
                Serial.println("Received: " + str);
                this->commandInterpreter->ExecuteCommand(str);
            }
        });

    this->webServer->addHandler(this->webSocket);

    // Simple Firmware Update Form
    this->webServer->on("/update", HTTP_GET, getUpdateForm);
    this->webServer->on("/update", HTTP_POST, onPostUpdate, onUploadUpdate);

    this->webServer->on("/heap", HTTP_GET, [](AsyncWebServerRequest* request)
                        { request->send(200, MIME_plainText, String(ESP.getFreeHeap())); });

    this->webServer->onNotFound([](AsyncWebServerRequest* req) { req->send(404, MIME_plainText, "Not found :("); });

    this->webServer->serveStatic("/", LittleFS, "/").setDefaultFile("index.html");

    this->webServer->begin();
}

void McuServer::closeSockets()
{
    this->webSocket->textAll("Closing connection...");
    this->webSocket->closeAll();
}

void McuServer::broadcast(String text)
{
    this->webSocket->textAll(text);
}
