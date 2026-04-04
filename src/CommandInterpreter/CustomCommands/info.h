#pragma once

#include "../CommandParser.h"
#include "../CustomCommand.h"
#include <WiFiClient.h>
#include <ESP8266WiFi.h>
#include <AsyncWebSocket.h>

extern AsyncWebSocket *webSocket;

CustomCommand *infoAction = new CustomCommand("info", [](String command) {
    int32_t rssi = WiFi.RSSI();
    const char *signalQuality;
    if (rssi > -30)
        signalQuality = "Amazing";
    else if (rssi > -67)
        signalQuality = "Very good";
    else if (rssi > -70)
        signalQuality = "Okay (not good, not terrible)";
    else if (rssi > -80)
        signalQuality = "Not good";
    else
        signalQuality = "Unusable";

    char buf[384];
    snprintf(buf, sizeof(buf),
        "{\"SDK version\": \"%s\","
        "\"CPU Freq(MHz)\": %u,"
        "\"Free Heap\": %u,"
        "\"Free sk.space\": %u,"
        "\"Flash mode\": %u,"
        "\"Flash size\": %u,"
        "\"Flash speed\": %u,"
        "\"IP address\": \"%s\","
        "\"MAC Address\": \"%s\","
        "\"Wifi Signal\": \"%s (%d db)\"}",
        ESP.getSdkVersion(),
        ESP.getCpuFreqMHz(),
        ESP.getFreeHeap(),
        ESP.getFreeSketchSpace(),
        ESP.getFlashChipMode(),
        ESP.getFlashChipSize(),
        ESP.getFlashChipSpeed(),
        WiFi.localIP().toString().c_str(),
        WiFi.macAddress().c_str(),
        signalQuality, rssi);
    webSocket->textAll(buf);
});