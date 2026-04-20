#include "wifi.h"
#include "../../globals.h"
#include "../../message-types.h"
#include <ESP8266WiFi.h>
#include <AsyncWebSocket.h>
#include <SimpleTimer.h>
#include <climits>

constexpr uint32_t WIFI_CONNECTION_CHECK_INTERVAL = 1000;

// Sentinel guarantees the first sample triggers a send, regardless of value.
// INT8_MIN (-128 dBm) is well outside any realistic RSSI reading.
int8_t lastSentRssi = INT8_MIN;

String getWifiMessage(int8_t rssi)
{
    char buf[64];
    snprintf(buf, sizeof(buf), R"({"type": %d, "rssi": %d})", WebSocketMessageTypes::WifiSignalChange, rssi);
    return {buf};
}

void wifiEvents()
{
    int8_t rssi = WiFi.RSSI();
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
