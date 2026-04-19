#pragma once

#include <Arduino.h>
#include "../CustomCommand.h"

extern float lastSentDistance;

String getDistanceMessage(float distance);
void sendDistanceEvent();
void setupDistance();

extern CustomCommand *distanceAction;
