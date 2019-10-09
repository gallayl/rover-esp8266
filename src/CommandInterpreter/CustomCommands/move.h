#pragma once
#include "../../globals.h"
#include "../CommandParser.h"
#include "../CustomCommand.h"
#include "../../dc-motor.h"
#include <AsyncWebSocket.h>

#define RightMotorSpeed 4
#define RightMotorDir 2
#define RightMotorEncoder D6
#define LeftMotorSpeed 5
#define LeftMotorDir 0
#define LeftMotorEncoder D7

static Motor* rightMotor = new Motor(LeftMotorSpeed, LeftMotorDir, LeftMotorEncoder, 28, 0);
static Motor* leftMotor = new Motor(RightMotorSpeed, RightMotorDir, RightMotorEncoder, 28, 1);

uint8_t lastSentLeft = 0;
uint8_t lastSentRight = 0;

extern SimpleTimer* timer;
extern AsyncWebSocket* webSocket;

void broadcast(String message){
    webSocket->textAll(message);
}

void notifyMotorSpeedChange(){
    uint8_t newLeft = map(leftMotor->getCurrentTicks(),0,leftMotor->getMaxTicks(),0,100) ;
    uint8_t newRight = map(rightMotor->getCurrentTicks(),0,rightMotor->getMaxTicks(),0,100);

    if (lastSentLeft != newLeft){
        broadcast("leftMotorChangePercent " + String(newLeft));
        lastSentLeft = newLeft;
    }
    if (lastSentRight != newRight){
        broadcast("rightMotorChangePercent " + String(newRight));
        lastSentRight = newRight;
    }
}

void motorEncoderEvents(){
    notifyMotorSpeedChange();
    leftMotor->encoderEvent();
    rightMotor->encoderEvent();
}

void ICACHE_RAM_ATTR leftMotorTick(){
    leftMotor->_onTick();
}

void ICACHE_RAM_ATTR rightMotorTick(){
    rightMotor->_onTick();
}


void setupMotors(){
    timer->setInterval(300, motorEncoderEvents);
    attachInterrupt(RightMotorEncoder,  rightMotorTick, CHANGE);
    attachInterrupt(LeftMotorEncoder,  leftMotorTick, CHANGE);
}

CustomCommand *move = new CustomCommand("move", [](String command) {
    long throttleValue = CommandParser::GetCommandParameter(command, 1).toInt();
    long steerValue = CommandParser::GetCommandParameter(command, 2).toInt();
    long leftMotorSpeed = constrain((throttleValue - steerValue) / 2, -PWMRANGE, PWMRANGE);
    long rightMotorSpeed = -constrain((throttleValue + steerValue) / 2, -PWMRANGE, PWMRANGE);

    leftMotor->SetThrottle(leftMotorSpeed);
    rightMotor->SetThrottle(rightMotorSpeed);
    return String("Moving" + String(leftMotorSpeed) + " / " + String(rightMotorSpeed));
});


CustomCommand *stop = new CustomCommand("stop", [](String command) {
    leftMotor->SetThrottle(0);
    rightMotor->SetThrottle(0);
    return String("Stopped");
});