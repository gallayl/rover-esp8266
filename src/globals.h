#pragma once

#include <LittleFS.h>
#include <ESP8266WiFi.h>
#include <ESPAsyncWebServer.h>
#include <ESPAsyncWiFiManager.h>
#include <ESP8266FtpServer.h>
#include <SimpleTimer.h>
#include <DNSServer.h>

#include "./CommandInterpreter/CommandInterpreter.h"
#include "./McuServer.h"
#include "./api/update.h"
#include "./CommandInterpreter/CustomCommands/distance.h"
#include "./CommandInterpreter/CustomCommands/move.h"
#include "./CommandInterpreter/CustomCommands/wifi.h"

extern AsyncWebSocket* webSocket;
extern AsyncWebServer* webServer;
extern DNSServer dns;
extern SimpleTimer* timer;
extern FtpServer ftp;

// `interpreter` and `mcuServer` are nullptr until setup() — see globals.cpp / main.cpp.
// Constructing them at static-init time would derefence CustomCommand globals from
// other translation units whose construction order is undefined.
extern CommandInterpreter* interpreter;
extern McuServer* mcuServer;

extern AsyncWiFiManager wifiManager;
