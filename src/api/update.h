#pragma once

#include <ESPAsyncWebServer.h>

extern volatile bool shouldReboot;
extern ArRequestHandlerFunction getUpdateForm;
extern ArRequestHandlerFunction onPostUpdate;
extern ArUploadHandlerFunction onUploadUpdate;
