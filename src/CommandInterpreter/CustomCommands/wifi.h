#pragma once

#include <Arduino.h>

extern int8_t lastSentRssi;

String getWifiMessage(int8_t rssi);
void wifiEvents();
void setupWifi();
