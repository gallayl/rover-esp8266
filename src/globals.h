#pragma once

#include "./CommandInterpreter/CommandInterpreter.h"
#include "./McuServer.h"
#include <WiFiClient.h>
#include <Wire.h>
#include <WiFiClientSecure.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <ESP8266FtpServer.h>
#include <ESP8266WiFi.h>          //https://github.com/esp8266/Arduino
#include <ESPAsyncWebServer.h>
#include <ESPAsyncWiFiManager.h>         //https://github.com/tzapu/WiFiManager


AsyncWebServer wifiManagerServer(80);
DNSServer dns;

#define SCREEN_WIDTH 128 // OLED display width, in pixels
#define SCREEN_HEIGHT 32 // OLED display height, in pixels
#define OLED_RESET -1    // Reset pin # (or -1 if sharing Arduino reset pin)
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

FtpServer ftp;

extern McuServer *mcuServer;
CommandInterpreter *interpreter = CommandInterpreter::GetInstance();
McuServer *mcuServer = new McuServer((char *)"admin", (char *)"admin", interpreter, display);

AsyncWiFiManager wifiManager(&wifiManagerServer,&dns);
