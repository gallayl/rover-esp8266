#pragma once

#include "NewPing.h"

#include "../CommandParser.h"
#include "../CustomCommand.h"
#include <AsyncWebSocket.h>

int trigPin = D5;
int echoPin = D8;

extern AsyncWebSocket *webSocket;

NewPing sonar(trigPin, echoPin);

void setupDistance()
{
    pinMode(trigPin, OUTPUT);
    pinMode(echoPin, INPUT);
}

CustomCommand *distanceAction = new CustomCommand("distance", [](String command) {
    float distance = sonar.ping_cm(50);
    webSocket->textAll(String("Distance:" + String(distance) + "cm"));
});
