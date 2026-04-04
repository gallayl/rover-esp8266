#pragma once
#include "../../globals.h"
#include <AsyncWebSocket.h>

#define WIFI_CONNECTION_CHECK_INTERVAL 1000

int32_t lastSentRssi = WiFi.RSSI();

extern SimpleTimer *timer;
extern AsyncWebSocket *webSocket;

String getWifiMessage(int32_t rssi)
{
    char buf[64];
    snprintf(buf, sizeof(buf), "{\"type\": %d, \"rssi\": %d}", WebSocketMessageTypes::WifiSignalChange, rssi);
    return String(buf);
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
    timer->setInterval(WIFI_CONNECTION_CHECK_INTERVAL, wifiEvents);
}