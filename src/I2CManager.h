#pragma once

#include <Wire.h>
#include <Arduino.h>

class I2CManager
{
public:
    static void write(uint16_t address, String value)
    {
        Wire.beginTransmission(address);

        int str_len = value.length() + 1;
        char buf[str_len];
        value.toCharArray(buf, str_len);
        char *p = buf;
        char *str;
        while ((str = strtok_r(p, ";", &p)) != NULL)
        {
            if (String(str).startsWith("0x"))
            {
                Wire.write(strtol(str, 0, 16));
            }
            else
            {
                Wire.write(str);
            }
        }

        Wire.endTransmission();
    }

    static uint16_t read(uint16_t address)
    {
        // ToDO
        return address;
    }

    static String getDevices()
    {
        String devices = "";
        Wire.begin();
        byte error, address;
        int nDevices;
        nDevices = 0;
        for (address = 1; address < 127; address++)
        {
            // The i2c_scanner uses the return value of
            // the Write.endTransmisstion to see if
            // a device did acknowledge to the address.
            Wire.beginTransmission(address);
            error = Wire.endTransmission();

            if (error == 0)
            {
                devices += "0x";
                if (address < 16)
                {
                    devices += "0";
                }
                devices += String(address, HEX) + "; ";
                nDevices++;
            }
            else if (error == 4)
            {
                Serial.print("Unknown error at address 0x");
                if (address < 16)
                    Serial.print("0");
                Serial.println(address, HEX);
            }
        }
        return devices;
    };
};