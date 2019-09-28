#include "./globals.h"


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

    wifiManager.autoConnect("AutoConnectAP");

    display.ssd1306_command(SSD1306_SETSTARTLINE);

    display.println("");
    display.print("SSID: ");
    display.println(WiFi.SSID());
    display.print("IP: ");
    display.println(WiFi.localIP());
    display.display();
    Serial.printf("Connected to %s, IP: %s", WiFi.SSID().c_str(), WiFi.localIP().toString().c_str());
    mcuServer->setup();

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
