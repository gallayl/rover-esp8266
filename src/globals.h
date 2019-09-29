#pragma once

#include "./CommandInterpreter/CommandInterpreter.h"
#include "./McuServer.h"
#include <WiFiClient.h>
#include <Wire.h>
#include <WiFiClientSecure.h>
#include <SimpleTimer.h>
#include <ESP8266FtpServer.h>
#include <ESP8266WiFi.h>          //https://github.com/esp8266/Arduino
#include <ESPAsyncWebServer.h>
#include <ESPAsyncWiFiManager.h>         //https://github.com/tzapu/WiFiManager


AsyncWebServer wifiManagerServer(80);
DNSServer dns;

SimpleTimer timer;

FtpServer ftp;

extern McuServer *mcuServer;
CommandInterpreter *interpreter = CommandInterpreter::GetInstance();
McuServer *mcuServer = new McuServer((char *)"admin", (char *)"admin", interpreter);

AsyncWiFiManager wifiManager(&wifiManagerServer,&dns);
