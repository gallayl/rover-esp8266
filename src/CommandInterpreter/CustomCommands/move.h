#pragma once
#include "../CommandParser.h"
#include "../CustomCommand.h"
#include "../../dc-motor.h"
#include "../../globals.h"

#define RightMotorSpeed 4
#define RightMotorDir 2
#define RightMotorEncoder D6
#define LeftMotorSpeed 5
#define LeftMotorDir 0
#define LeftMotorEncoder D7

Motor* rightMotor = new Motor(LeftMotorSpeed, LeftMotorDir, LeftMotorEncoder, 28, 0);
Motor* leftMotor = new Motor(RightMotorSpeed, RightMotorDir, RightMotorEncoder, 28, 1);

uint8_t lastSentLeft = 0;
uint8_t lastSentRight = 0;

extern SimpleTimer timer;

void broadcast(String message){
    // mcuServer->broadcast(message);
    // Serial.println(message);
}

void notifyMotorSpeedChange(){
    uint8_t newLeft = map(leftMotor->getCurrentTicks(),0,leftMotor->getMaxTicks(),0,255) ;
    uint8_t newRight = map(rightMotor->getCurrentTicks(),0,rightMotor->getMaxTicks(),0,255);

    if (lastSentLeft != newLeft){
        broadcast("leftMotorChange " + String(map(newLeft, 0, leftMotor->getMaxTicks(), 0, 100)));
        lastSentLeft = newLeft;
    }
    if (lastSentRight != newRight){
        broadcast("rightMotorChange " + String(map(newRight, 0, rightMotor->getMaxTicks(), 0, 100)));
        lastSentRight = newRight;
    }
}

void motorEncoderEvents(){
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
    timer.setInterval(300, notifyMotorSpeedChange);
    timer.setInterval(100, motorEncoderEvents);
    attachInterrupt(RightMotorEncoder,  rightMotorTick, CHANGE);
    attachInterrupt(LeftMotorEncoder,  leftMotorTick, CHANGE);
}

CustomCommand *move = new CustomCommand("move", [](String command) {
    String throttleString = CommandParser::GetCommandParameter(command, 1);
    long throttleValue = throttleString.toInt();

    String steerString = CommandParser::GetCommandParameter(command, 2);
    long steerValue = steerString.toInt();

    leftMotor->SetThrottle(constrain((throttleValue - steerValue) / 2, -PWMRANGE, PWMRANGE));
    rightMotor->SetThrottle(-constrain((throttleValue + steerValue) / 2, -PWMRANGE, PWMRANGE));
    return String("Moving");
});


CustomCommand *stop = new CustomCommand("stop", [](String command) {
    leftMotor->SetThrottle(0);
    rightMotor->SetThrottle(0);
    return String("Stopped");
});