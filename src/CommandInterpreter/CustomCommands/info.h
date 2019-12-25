#pragma once

#include "../CommandParser.h"
#include "../CustomCommand.h"
#include <WiFiClient.h>
#include <ESP8266WiFi.h>
#include <AsyncWebSocket.h>

extern AsyncWebSocket *webSocket;

CustomCommand *infoAction = new CustomCommand("info", [](String command) {
    String stats = "{";
    stats += "\"SDK version\": \"";
    stats += ESP.getSdkVersion();

    stats += "\",\"CPU Freq(MHz)\": ";
    stats += ESP.getCpuFreqMHz();

    stats += ",\"Free Heap\": ";
    stats += ESP.getFreeHeap();

    stats += ",\"Free sk.space\": ";
    stats += ESP.getFreeSketchSpace();

    stats += ",\"Flash mode\": ";
    stats += ESP.getFlashChipMode();

    stats += ",\"Flash size\": ";
    stats += ESP.getFlashChipSize();

    stats += ",\"Flash speed\": ";
    stats += ESP.getFlashChipSpeed();

    stats += ",\"IP address\": \"";
    stats += WiFi.localIP().toString();

    stats += "\",\"MAC Address\": \"";
    stats += WiFi.macAddress();

    stats += "\",\"Wifi Signal\": \"";
    int32_t rssi = WiFi.RSSI();
    if (rssi > -30)
    {
        stats += "Amazing";
    }
    else if (rssi > -67)
    {
        stats += "Very good";
    }
    else if (rssi > -70)
    {
        stats += "Okay (not good, not terrible)";
    }
    else if (rssi > -80)
    {
        stats += "Not good";
    }
    else if (rssi > -90)
    {
        stats += "Unusable";
    }
    stats += " (";
    stats += rssi;
    stats += " db)";

    stats += "\"}";
    webSocket->textAll(stats);
});