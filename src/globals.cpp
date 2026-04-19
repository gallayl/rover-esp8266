#include "globals.h"

AsyncWebSocket* webSocket = new AsyncWebSocket("/ws");
AsyncWebServer* webServer = new AsyncWebServer(80);
DNSServer dns;

SimpleTimer* timer = new SimpleTimer();

FtpServer ftp;

// Deferred to setup(): see header comment.
CommandInterpreter* interpreter = nullptr;
McuServer* mcuServer = nullptr;

AsyncWiFiManager wifiManager(webServer, &dns);
