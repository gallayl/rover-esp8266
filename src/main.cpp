#include "./globals.h"

#define FTP_USER "ftp"
#define FTP_PASSWORD "ftp"

void setup()
{
    Serial.begin(9600);
    wifiManager.autoConnect("AutoConnectAP");
    Serial.printf("Connected to %s, IP: %s\r\n", WiFi.SSID().c_str(), WiFi.localIP().toString().c_str());
    mcuServer->setup();
    setupDistance();

    Serial.println("Setting up File System and FTP server");
    if (LittleFS.begin())
    {
        ftp.begin(FTP_USER, FTP_PASSWORD);
        Serial.println("LittleFS mounted, FTP server started");
    }
    else
    {
        if (LittleFS.format())
        {
            Serial.println("Formatted LittleFS");
        }
        else
        {
            Serial.println("Failed to format LittleFS");
        }
    }
    setupMotors();
    setupWifi();
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
