#pragma once

#include <Arduino.h>
#include "../CustomCommand.h"
#include "../../dc-motor.h"

extern Motor* leftMotor;
extern Motor* rightMotor;
extern int16_t lastSentLeft;
extern int16_t lastSentRight;

String getMotorTickChangeMessage(uint16_t index, int16_t ticks);
void notifyMotorSpeedChange();
void motorEncoderEvents();
void setupMotors();

extern CustomCommand* move;
extern CustomCommand* moveTicks;
extern CustomCommand* configurePid;
extern CustomCommand* stop;
