#pragma once

#include <Arduino.h>

extern int32_t lastSentRssi;

String getWifiMessage(int32_t rssi);
void wifiEvents();
void setupWifi();
