#include "info.h"
#include "../../globals.h"
#include <ESP8266WiFi.h>
#include <AsyncWebSocket.h>

constexpr size_t INFO_BUFFER_SIZE = 448;

#ifndef BUILD_VERSION
#define BUILD_VERSION "unknown"
#endif

#ifndef BUILD_DATE
#define BUILD_DATE "unknown"
#endif

CustomCommand* infoAction = new CustomCommand(
    "info",
    [](const String& /*command*/)
    {
        int8_t rssi = WiFi.RSSI();
        const char* signalQuality;
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

        // Allocate the JSON buffer on the heap: this lambda runs from the AsyncTCP
        // context, whose stack budget is significantly tighter than the main loop.
        char* buf = (char*)malloc(INFO_BUFFER_SIZE);
        if (buf == nullptr)
        {
            Serial.println("info: malloc failed");
            return;
        }
        snprintf(buf, INFO_BUFFER_SIZE,
                 "{\"Build version\": \"%s\","
                 "\"Build date\": \"%s\","
                 "\"SDK version\": \"%s\","
                 "\"CPU Freq(MHz)\": %u,"
                 "\"Free Heap\": %u,"
                 "\"Free sk.space\": %u,"
                 "\"Flash mode\": %u,"
                 "\"Flash size\": %u,"
                 "\"Flash speed\": %u,"
                 "\"IP address\": \"%s\","
                 "\"MAC Address\": \"%s\","
                 "\"Wifi Signal\": \"%s (%d db)\"}",
                 BUILD_VERSION, BUILD_DATE, EspClass::getSdkVersion(), EspClass::getCpuFreqMHz(),
                 EspClass::getFreeHeap(), EspClass::getFreeSketchSpace(), EspClass::getFlashChipMode(),
                 EspClass::getFlashChipSize(), EspClass::getFlashChipSpeed(), WiFi.localIP().toString().c_str(),
                 WiFi.macAddress().c_str(), signalQuality, rssi);
        webSocket->textAll(buf);
        free(buf);
    });
