#pragma once
#include "../../globals.h"
#include <AsyncWebSocket.h>
#include <Servo.h>

#define WIFI_CONNECTION_CHECK_INTERVAL 1000

int32_t lastSentRssi = WiFi.RSSI();

String getWifiMessage(int32_t rssi)
{
    return String("{\"type\": " + String(WebSocketMessageTypes::WifiSignalChange) + ", \"rssi\": " + String(rssi) + "}");
}

void wifiEvents()
{
    int32_t rssi = WiFi.RSSI();
    if (rssi != lastSentRssi)
    {
        lastSentRssi = rssi;
        webSocket->textAll(getWifiMessage(rssi));
    }
}

void setupWifi()
{
    timer->setInterval(WIFI_CONNECTION_CHECK_INTERVAL, motorEncoderEvents);
}