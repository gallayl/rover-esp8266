#pragma once

#include <ESPAsyncWebServer.h>
#include "CommandInterpreter/CommandInterpreter.h"
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

#include "./mime.h"
#include "./api/update.h"

class McuServer
{
public:
    McuServer(char *user, char *password, CommandInterpreter *commandInterpreter, Adafruit_SSD1306 &display) : webSocket(*(new AsyncWebSocket("/ws"))), webServer(*(new AsyncWebServer(80))), commandInterpreter(commandInterpreter), display(display)
    {
        this->wwwUserName = user;
        this->wwwPassword = password;
    };

    void setup()
    {
        this->webSocket.onEvent([this](AsyncWebSocket *server, AsyncWebSocketClient *client, AwsEventType type, void *arg, uint8_t *data, size_t len) {
            if (type == WS_EVT_CONNECT)
            {
                client->text("Connected to Rover ESP32");
            }
            else if (type == WS_EVT_DISCONNECT)
            {
                /** */
            }
            else if (type == WS_EVT_DATA)
            {
                String str = String((char *)data).substring(0, len);
                String response = this->commandInterpreter->ExecuteCommand(str);
                server->textAll(response);
            }
        });

        this->webServer.addHandler(&(this->webSocket));

        // Simple Firmware Update Form
        this->webServer.on("/update", HTTP_GET, getUpdateForm);
        this->webServer.on("/update", HTTP_POST, onPostUpdate, onUploadUpdate);

        this->webServer.on("/heap", HTTP_GET, [](AsyncWebServerRequest *request) {
            request->send(200, MIME_plainText, String(ESP.getFreeHeap()));
        });


        this->webServer.onNotFound([](AsyncWebServerRequest *req) {
            req->send(404, MIME_plainText, "Not found :(");
        });

        this->webServer.serveStatic("/", SPIFFS, "/").setDefaultFile("index.html");

        this->display.println("Starting WEB server...");
        this->display.display();
        this->webServer.begin();

        this->display.println("Initializing CAM...");
        this->display.display();

        this->display.println("MCU Server setup done.");
        this->display.display();
    }

    void closeSockets()
    {
        this->webSocket.textAll("Closing connection...");
        this->webSocket.closeAll();
    }

    void broadcast(String text)
    {
        this->webSocket.textAll(text);
    }

private:
    const char *wwwUserName;
    const char *wwwPassword;

    AsyncWebSocket &webSocket;
    AsyncWebServer &webServer;
    CommandInterpreter *commandInterpreter;
    Adafruit_SSD1306 &display;
};
