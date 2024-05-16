#pragma once
#include "../../globals.h"
#include "../../message-types.h"
#include "NewPing.h"
#include "../CommandParser.h"
#include "../CustomCommand.h"
#include <AsyncWebSocket.h>
#include <SimpleTimer.h>

#define SEND_INTERVAL_TIMEOUT_MS 250

int trigPin = D5;
int echoPin = D8;

extern SimpleTimer *timer;
extern AsyncWebSocket *webSocket;

NewPing sonar(trigPin, echoPin);

float lastSentDistance = 0;

String getDistanceMessage(float distance)
{
    return String("{\"type\": " + String(WebSocketMessageTypes::DistanceChange) + ", \"cm\": " + String(distance) + "}");
}

void sendDistanceEvent()
{
    float distance = sonar.ping_cm(50);
    if (lastSentDistance != distance)
    {
        webSocket->textAll(getDistanceMessage(distance));
        lastSentDistance = distance;
    }
}

void setupDistance()
{
    pinMode(trigPin, OUTPUT);
    pinMode(echoPin, INPUT);
    timer->setInterval(SEND_INTERVAL_TIMEOUT_MS, sendDistanceEvent);
}

CustomCommand *distanceAction = new CustomCommand("distance", [](String command)
                                                  {
    float distance = sonar.ping_cm(50);
    webSocket->textAll(getDistanceMessage(distance)); });
