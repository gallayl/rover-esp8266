#pragma once

// #include <ESP8266HTTPUpdateServer.h>

ArRequestHandlerFunction getUpdateForm = ([](AsyncWebServerRequest *request) {
    request->send(200, "text/html", "<form method='POST' action='/update' enctype='multipart/form-data'><input type='file' name='update'><input type='submit' value='Update'></form>");
});

ArRequestHandlerFunction onPostUpdate = ([](AsyncWebServerRequest *request) {
    boolean shouldReboot = !Update.hasError();
    AsyncWebServerResponse *response = request->beginResponse(200, "text/plain", shouldReboot ? "OK" : "FAIL");
    response->addHeader("Connection", "close");
    request->send(response);
});

ArUploadHandlerFunction onUploadUpdate = ([](AsyncWebServerRequest *request, String filename, size_t index, uint8_t *data, size_t len, bool final) {
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
            Serial.printf("\nFirmware Update Success: %uB\nRestarting MCU...\n", index + len);
            ESP.restart();
        }
        else
        {
            Update.printError(Serial);
        }
    }
});
