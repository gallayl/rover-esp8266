#pragma once

#include <ESPAsyncWebServer.h>
#include <LittleFS.h>
#include "./CommandInterpreter/CommandInterpreter.h"
#include "./mime.h"
#include "./api/update.h"

class McuServer
{
public:
    McuServer(char *user, char *password, CommandInterpreter *commandInterpreter, AsyncWebSocket *webSocket, AsyncWebServer *webServer) : webSocket(webSocket), webServer(webServer), commandInterpreter(commandInterpreter)
    {
        this->wwwUserName = user;
        this->wwwPassword = password;
    };

    void setup()
    {
        this->webSocket->onEvent([this](AsyncWebSocket *server, AsyncWebSocketClient *client, AwsEventType type, void *arg, uint8_t *data, size_t len)
                                 {
            if (type == WS_EVT_CONNECT)
            {
                Serial.println("Websocket client connection received");
                client->text(String("{\"type\":" + String(WebSocketMessageTypes::MotorTicksChange) + ", \"i\":" + String(leftMotor->index) + ",\"t\": " + String(lastSentLeft) + "}"));
                client->text(String("{\"type\":" + String(WebSocketMessageTypes::MotorTicksChange) + ", \"i\":" + String(rightMotor->index) + ",\"t\": " + String(lastSentRight) + "}"));
                client->text(String("{\"type\":" + String(WebSocketMessageTypes::DistanceChange) + ", \"cm\":" + String(lastSentDistance) + "}"));
            }
            else if (type == WS_EVT_DISCONNECT)
            {
                Serial.println("Client disconnected");
            }
            else if (type == WS_EVT_DATA)
            {
                String str = String((char *)data).substring(0, len);
                Serial.println("Received: " + str);
                this->commandInterpreter->ExecuteCommand(str);
            } });

        this->webServer->addHandler(this->webSocket);

        // Simple Firmware Update Form
        this->webServer->on("/update", HTTP_GET, getUpdateForm);
        this->webServer->on("/update", HTTP_POST, onPostUpdate, onUploadUpdate);

        this->webServer->on("/heap", HTTP_GET, [](AsyncWebServerRequest *request)
                            { request->send(200, MIME_plainText, String(ESP.getFreeHeap())); });

        this->webServer->onNotFound([](AsyncWebServerRequest *req)
                                    { req->send(404, MIME_plainText, "Not found :("); });

        this->webServer->serveStatic("/", LittleFS, "/").setDefaultFile("index.html");

        this->webServer->begin();
    }

    void closeSockets()
    {
        this->webSocket->textAll("Closing connection...");
        this->webSocket->closeAll();
    }

    void broadcast(String text)
    {
        this->webSocket->textAll(text);
    }

private:
    const char *wwwUserName;
    const char *wwwPassword;

    AsyncWebSocket *webSocket;
    AsyncWebServer *webServer;
    CommandInterpreter *commandInterpreter;
};
