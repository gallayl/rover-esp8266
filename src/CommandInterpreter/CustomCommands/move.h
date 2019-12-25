#pragma once
#include "../../globals.h"
#include "../CommandParser.h"
#include "../CustomCommand.h"
#include "../../dc-motor.h"
#include <AsyncWebSocket.h>

#define RightMotorSpeed 4
#define RightMotorDir 2
#define RightMotorEncoder D7
#define LeftMotorSpeed 5
#define LeftMotorDir 0
#define LeftMotorEncoder D6

static Motor* rightMotor = new Motor(LeftMotorSpeed, LeftMotorDir, LeftMotorEncoder, 0);
static Motor* leftMotor = new Motor(RightMotorSpeed, RightMotorDir, RightMotorEncoder, 1);

uint8_t lastSentLeft = 0;
uint8_t lastSentRight = 0;

extern SimpleTimer* timer;
extern AsyncWebSocket* webSocket;

int motorTimeoutTimer;

void broadcast(String message) {
    webSocket->textAll(message);
}

void notifyMotorSpeedChange() {
    uint8_t newLeft = (uint8_t)leftMotor->getCurrentTicks();
    uint8_t newRight = (uint8_t)rightMotor->getCurrentTicks();

    if (lastSentLeft != newLeft) {
        broadcast("lp " + String(newLeft));
        lastSentLeft = newLeft;
    }
    if (lastSentRight != newRight) {
        broadcast("rp " + String(newRight));
        lastSentRight = newRight;
    }
}

void motorEncoderEvents() {
    notifyMotorSpeedChange();
    leftMotor->encoderEvent();
    rightMotor->encoderEvent();
}

void ICACHE_RAM_ATTR leftMotorTick() {
    leftMotor->_onTick();
}

void ICACHE_RAM_ATTR rightMotorTick() {
    rightMotor->_onTick();
}

void motorTimeoutEvent(){
    webSocket->textAll("Motor Timeout triggered.");
    leftMotor->SetThrottle(50);
    rightMotor->SetThrottle(-50);
    delay(500);
    leftMotor->SetThrottle(-50);
    rightMotor->SetThrottle(50);
    delay(500);
    leftMotor->SetThrottle(0);
    rightMotor->SetThrottle(0);
    motorTimeoutTimer = timer->setTimeout(6*1000, motorTimeoutEvent);
}

void setupMotors() {
    timer->setInterval(100, motorEncoderEvents);
    attachInterrupt(RightMotorEncoder,  rightMotorTick, CHANGE);
    attachInterrupt(LeftMotorEncoder,  leftMotorTick, CHANGE);
    motorTimeoutTimer = timer->setTimeout(6*1000, motorTimeoutEvent);
}


int16_t throttleValue;
int16_t steerValue;
int16_t leftMotorSpeed;
int16_t rightMotorSpeed;

CustomCommand *move = new CustomCommand("move", [](String command) {
    throttleValue = (int16_t)CommandParser::GetCommandParameter(command, 1).toInt();
    steerValue = (int16_t)CommandParser::GetCommandParameter(command, 2).toInt();
    leftMotorSpeed = (int16_t)constrain(round((throttleValue - steerValue) / 2), -PWMRANGE, PWMRANGE);
    rightMotorSpeed = (int16_t)-constrain(round((throttleValue + steerValue) / 2), -PWMRANGE, PWMRANGE);

    leftMotor->SetThrottle(leftMotorSpeed);
    rightMotor->SetThrottle(rightMotorSpeed);
    timer->deleteTimer(motorTimeoutTimer);
});

CustomCommand *moveTicks = new CustomCommand("moveTicks", [](String command) {
    leftMotorSpeed = (int16_t)CommandParser::GetCommandParameter(command, 1).toInt();
    rightMotorSpeed = (int16_t)-CommandParser::GetCommandParameter(command, 2).toInt();

    leftMotor->setPid(leftMotorSpeed);
    rightMotor->setPid(rightMotorSpeed);
    timer->deleteTimer(motorTimeoutTimer);
});

CustomCommand *configurePid = new CustomCommand("configurePid", [](String command) {
    double p = (int16_t)CommandParser::GetCommandParameter(command, 1).toDouble();
    double i = (int16_t)CommandParser::GetCommandParameter(command, 2).toDouble();
    double d = (int16_t)CommandParser::GetCommandParameter(command, 2).toDouble();

    leftMotor->configurePid(p,i,d);
    rightMotor->configurePid(p,i,d);
});


CustomCommand *stop = new CustomCommand("stop", [](String command) {
    leftMotor->SetThrottle(0);
    rightMotor->SetThrottle(0);
    motorTimeoutTimer = timer->setTimeout(6*1000, motorTimeoutEvent);
});
