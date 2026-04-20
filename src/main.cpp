#include "./globals.h"
#include <Updater.h>

#define FTP_USER "ftp"
#define FTP_PASSWORD "ftp"

#define SERIAL_LINE_BUF_SIZE 64

static char serialLineBuf[SERIAL_LINE_BUF_SIZE];
static size_t serialLineLen = 0;

void setup()
{
    Serial.begin(115200);
    wifiManager.autoConnect("AutoConnectAP");
    Serial.printf("Connected to %s, IP: %s\r\n", WiFi.SSID().c_str(), WiFi.localIP().toString().c_str());

    // Construct singletons before the web server starts so WS connect handlers
    // (which read motor state) never see nullptr motors.
    setupMotors();

    interpreter = CommandInterpreter::GetInstance();
    mcuServer = new McuServer(interpreter, webSocket, webServer);

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
    setupWifi();
}

void loop()
{
    // Re-check Update state to avoid rebooting mid-write if a second OTA
    // request raced the post handler.
    if (shouldReboot && !Update.isRunning())
    {
        delay(100);
        ESP.restart();
    }
    timer->run();

    // Line-buffered serial input: dispatch on \r or \n. Earlier per-char dispatch passed
    // a non-NUL-terminated buffer to String(), causing OOB reads.
    while (Serial.available() > 0)
    {
        char c = (char)Serial.read();
        if (c == '\r' || c == '\n')
        {
            if (serialLineLen > 0)
            {
                serialLineBuf[serialLineLen] = '\0';
                interpreter->ExecuteCommand(String(serialLineBuf));
                serialLineLen = 0;
            }
        }
        else if (serialLineLen < SERIAL_LINE_BUF_SIZE - 1)
        {
            serialLineBuf[serialLineLen++] = c;
        }
        else
        {
            // overflow — discard the line so we don't accept a truncated command
            serialLineLen = 0;
        }
    }
    ftp.handleFTP();
}
