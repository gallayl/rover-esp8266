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

Motor leftMotor = Motor(LeftMotorSpeed, LeftMotorDir, LeftMotorEncoder, 28);
Motor rightMotor = Motor(RightMotorSpeed, RightMotorDir, RightMotorEncoder, 28);

SimpleTimer motorNotifier = SimpleTimer();
SimpleTimer motorEncoderEventTimer = SimpleTimer();


uint8_t lastSentLeft = 0;
uint8_t lastSentRight = 0;

void broadcast(String message){
    // mcuServer->broadcast(message);
}

void ICACHE_RAM_ATTR notifyMotorSpeedChange(){
    uint8_t newLeft = map(leftMotor.getCurrentTicks(),0,leftMotor.getMaxTicks(),0,255) ;
    uint8_t newRight = map(rightMotor.getCurrentTicks(),0,rightMotor.getMaxTicks(),0,255);

    if (lastSentLeft != newLeft){
        broadcast("leftMotorChange " + newLeft);
        lastSentLeft = newLeft;
    }
    if (lastSentRight != newRight){
        broadcast("rightMotorChange " + newRight);
        lastSentRight = newRight;
    }
}

void motorEncoderEvents(){
    leftMotor.encoderEvent();
    rightMotor.encoderEvent();
}

void ICACHE_RAM_ATTR leftMotorTick(){
    leftMotor._onTick();
}

void ICACHE_RAM_ATTR rightMotorTick(){
    rightMotor._onTick();
}


void setupMotors(){
    motorNotifier.setInterval(100, notifyMotorSpeedChange);
    motorEncoderEventTimer.setInterval(25, motorEncoderEvents);
    attachInterrupt(RightMotorEncoder,  rightMotorTick, CHANGE);
    attachInterrupt(LeftMotorEncoder,  leftMotorTick, CHANGE);

}

void moveTick(){
    motorNotifier.run();
    motorEncoderEventTimer.run();
}

CustomCommand *move = new CustomCommand("move", [](String command) {
    String throttleString = CommandParser::GetCommandParameter(command, 1);
    long throttleValue = throttleString.toInt();

    String steerString = CommandParser::GetCommandParameter(command, 2);
    long steerValue = steerString.toInt();

    leftMotor.SetThrottle(constrain((throttleValue - steerValue) / 2, -PWMRANGE, PWMRANGE));
    rightMotor.SetThrottle(-constrain((throttleValue + steerValue) / 2, -PWMRANGE, PWMRANGE));
    return String("Moving");
});


CustomCommand *stop = new CustomCommand("stop", [](String command) {
    leftMotor.SetThrottle(0);
    rightMotor.SetThrottle(0);
    return String("Stopped");
});