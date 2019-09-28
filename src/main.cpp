#include "CommandInterpreter/CommandInterpreter.h"
#include "McuServer.h"
#include <WiFiClient.h>
#include <Wire.h>
#include <WiFiClientSecure.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <ESP8266FtpServer.h>
#include <ESP8266WiFi.h>          //https://github.com/esp8266/Arduino
#include <ESPAsyncWebServer.h>
#include <ESPAsyncWiFiManager.h>         //https://github.com/tzapu/WiFiManager


AsyncWebServer wifiManagerServer(80);
DNSServer dns;

#define SCREEN_WIDTH 128 // OLED display width, in pixels
#define SCREEN_HEIGHT 32 // OLED display height, in pixels
#define OLED_RESET -1    // Reset pin # (or -1 if sharing Arduino reset pin)
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

FtpServer ftp;
int16_t throttleValue = 0;
int16_t steerValue = 0;

CommandInterpreter *interpreter = CommandInterpreter::GetInstance();
McuServer server = McuServer((char *)"admin", (char *)"admin", interpreter, display);

void setup()
{
    Wire.begin();
    Serial.begin(9600);
    display.begin(SSD1306_SWITCHCAPVCC, 0x3c);

    display.setTextSize(1);      // Normal 1:1 pixel scale
    display.setTextColor(WHITE); // Draw white text
    display.setCursor(0, 0);     // Start at top-left corner
    display.clearDisplay();

    pwm.resetDevices();
    pwm.init(B000000);
    pwm.setPWMFrequency(60); // Analog servos run at ~60 Hz updates

    display.print("Initializing WIFi.");
    display.display();

    AsyncWiFiManager wifiManager(&wifiManagerServer,&dns);
    wifiManager.autoConnect("AutoConnectAP");

    display.ssd1306_command(SSD1306_SETSTARTLINE);

    display.println("");
    display.print("SSID: ");
    display.println(WiFi.SSID());
    display.print("IP: ");
    display.println(WiFi.localIP());
    display.display();
    Serial.printf("Connected to %s, IP: %s", WiFi.SSID().c_str(), WiFi.localIP().toString().c_str());
    server.setup();

    if (SPIFFS.begin())
    {
        ftp.begin("admin", "admin");
    }
}

void loop()
{
    if (Serial.available() > 0)
    {
        char c[] = {(char)Serial.read()};
        display.println(interpreter->ExecuteCommand(c));
        display.display();
    }
    ftp.handleFTP();
}
