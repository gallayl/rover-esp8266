#include "wifi.h"
#include "../../globals.h"
#include "../../message-types.h"
#include <ESP8266WiFi.h>
#include <AsyncWebSocket.h>
#include <SimpleTimer.h>
#include <limits.h>

#define WIFI_CONNECTION_CHECK_INTERVAL 1000

// Sentinel guarantees the first sample triggers a send, regardless of value.
int32_t lastSentRssi = INT32_MIN;

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
