#pragma once
#include "../../globals.h"
#include "../CommandParser.h"
#include "../CustomCommand.h"
#include "../../dc-motor.h"
#include <AsyncWebSocket.h>

#define RightMotorSpeed 5
#define RightMotorDir 0
#define RightMotorEncoder D7
#define LeftMotorSpeed 4
#define LeftMotorDir 2
#define LeftMotorEncoder D6

#define MOTOR_TICKCHANGE_NOTIFY_INTERVAL 100

static Motor *leftMotor = new Motor(LeftMotorSpeed, LeftMotorDir, LeftMotorEncoder, 0);
static Motor *rightMotor = new Motor(RightMotorSpeed, RightMotorDir, RightMotorEncoder, 1);

uint16_t lastSentLeft = 0;
uint16_t lastSentRight = 0;

extern SimpleTimer *timer;
extern AsyncWebSocket *webSocket;

String getMotorTickChangeMessage(uint16_t index, uint16_t ticks)
{
    char buf[64];
    snprintf(buf, sizeof(buf), "{\"type\": %d, \"i\":%u,\"t\": %u}", WebSocketMessageTypes::MotorTicksChange, index, ticks);
    return String(buf);
}

void notifyMotorSpeedChange()
{
    uint16_t newLeft = getMotorTicksPerSecond((uint16_t)leftMotor->getLastSampledTicks());
    uint16_t newRight = getMotorTicksPerSecond((uint16_t)rightMotor->getLastSampledTicks());

    if (lastSentLeft != newLeft)
    {
        lastSentLeft = newLeft;
        webSocket->textAll(getMotorTickChangeMessage(leftMotor->index, newLeft));
    }
    if (lastSentRight != newRight)
    {
        lastSentRight = newRight;
        webSocket->textAll(getMotorTickChangeMessage(rightMotor->index, newRight));
    }
}

void motorEncoderEvents()
{
    leftMotor->encoderEvent();
    rightMotor->encoderEvent();
}

void IRAM_ATTR leftMotorTick()
{
    leftMotor->_onTick();
}

void IRAM_ATTR rightMotorTick()
{
    rightMotor->_onTick();
}

void setupMotors()
{
    timer->setInterval(MOTOR_SAMPLETIME_MS, motorEncoderEvents);
    timer->setInterval(MOTOR_TICKCHANGE_NOTIFY_INTERVAL, notifyMotorSpeedChange);
    attachInterrupt(LeftMotorEncoder, leftMotorTick, CHANGE);
    attachInterrupt(RightMotorEncoder, rightMotorTick, CHANGE);
}

int16_t leftMotorSpeed;
int16_t rightMotorSpeed;

CustomCommand *move = new CustomCommand("move", [](String command)
                                        {
    leftMotorSpeed = (int16_t)constrain(round(CommandParser::GetCommandParameter(command, 1).toInt()), -PWMRANGE, PWMRANGE);
    rightMotorSpeed = (int16_t)-constrain(round(CommandParser::GetCommandParameter(command, 2).toInt()), -PWMRANGE, PWMRANGE);

    leftMotor->SetThrottle(leftMotorSpeed);
    rightMotor->SetThrottle(rightMotorSpeed); });

CustomCommand *moveTicks = new CustomCommand("moveTicks", [](String command)
                                             {
    leftMotorSpeed = (int16_t)CommandParser::GetCommandParameter(command, 1).toInt();
    rightMotorSpeed = (int16_t)-CommandParser::GetCommandParameter(command, 2).toInt();

    leftMotor->setPid(leftMotorSpeed);
    rightMotor->setPid(rightMotorSpeed); });

CustomCommand *configurePid = new CustomCommand("configurePid", [](String command)
                                                {
    double p = CommandParser::GetCommandParameter(command, 1).toDouble();
    double i = CommandParser::GetCommandParameter(command, 2).toDouble();
    double d = CommandParser::GetCommandParameter(command, 3).toDouble();

    leftMotor->configurePid(p, i, d);
    rightMotor->configurePid(p, i, d); });

CustomCommand *stop = new CustomCommand("stop", [](String command)
                                        {
    leftMotor->SetThrottle(0);
    rightMotor->SetThrottle(0); });
