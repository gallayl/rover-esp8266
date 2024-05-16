#pragma once
#include "../../globals.h"
#include "../../message-types.h"
#include "NewPing.h"
#include "../CommandParser.h"
#include "../CustomCommand.h"
#include <AsyncWebSocket.h>
#include <SimpleTimer.h>

int trigPin = D5;
int echoPin = D8;

extern SimpleTimer *timer;
extern AsyncWebSocket *webSocket;

NewPing sonar(trigPin, echoPin);

float lastSentDistance = 0;

void sendDistanceEvent()
{
    float distance = sonar.ping_cm(50);
    if (lastSentDistance != distance)
    {
        webSocket->textAll(String("{\"type\":" + String(WebSocketMessageTypes::DistanceChange) + ", \"cm\":" + String(distance) + "}"));
        lastSentDistance = distance;
    }
}

void setupDistance()
{
    pinMode(trigPin, OUTPUT);
    pinMode(echoPin, INPUT);
    timer->setInterval(100, sendDistanceEvent);
}

CustomCommand *distanceAction = new CustomCommand("distance", [](String command)
                                                  {
    float distance = sonar.ping_cm(50);
    webSocket->textAll(String("{\"type\":" + String(WebSocketMessageTypes::DistanceChange) + ", \"cm\":" + String(distance) + "}")); });
