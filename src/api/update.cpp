#include "update.h"
#include <Arduino.h>
#include <Updater.h>

volatile bool shouldReboot = false;

ArRequestHandlerFunction getUpdateForm = [](AsyncWebServerRequest* request)
{
    request->send(200, "text/html",
                  "<form method='POST' action='/update' enctype='multipart/form-data'><input type='file' "
                  "name='update'><input type='submit' value='Update'></form>");
};

ArRequestHandlerFunction onPostUpdate = [](AsyncWebServerRequest* request)
{
    // Only schedule the reboot if the upload finished cleanly. The main loop's
    // reboot path also re-checks Update state to avoid restarting mid-write.
    shouldReboot = !Update.hasError() && !Update.isRunning();
    AsyncWebServerResponse* response = request->beginResponse(200, "text/plain", shouldReboot ? "OK" : "FAIL");
    response->addHeader("Connection", "close");
    request->send(response);
};

ArUploadHandlerFunction onUploadUpdate =
    [](AsyncWebServerRequest* request, const String& filename, size_t index, uint8_t* data, size_t len, bool final)
{
    if (!index)
    {
        Serial.printf("\nStart Firmware update: %s\n", filename.c_str());
        Update.runAsync(true);
        if (!Update.begin(request->contentLength(), U_FLASH))
        {
            Update.printError(Serial);
        }
    }
    if (!Update.hasError())
    {
        if (Update.write(data, len) != len)
        {
            Update.printError(Serial);
        }
    }
    if (final)
    {
        if (Update.end(true))
        {
            Serial.printf("\nFirmware Update Success: %zuB\n", index + len);
        }
        else
        {
            Update.printError(Serial);
        }
    }
};
