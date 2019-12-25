#include "./globals.h"

void setup()
{
    Serial.begin(9600);
    wifiManager.autoConnect("AutoConnectAP");
    Serial.printf("Connected to %s, IP: %s", WiFi.SSID().c_str(), WiFi.localIP().toString().c_str());
    mcuServer->setup();

    if (SPIFFS.begin())
    {
        ftp.begin("admin", "admin");
    }
    setupMotors();
}

void loop()
{
    timer->run();
    if (Serial.available() > 0)
    {
        char c[] = {(char)Serial.read()};
        interpreter->ExecuteCommand(c);
    }
    ftp.handleFTP();
}
