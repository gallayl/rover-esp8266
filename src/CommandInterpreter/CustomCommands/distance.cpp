#include "distance.h"
#include "../../globals.h"
#include "../../message-types.h"
#include "../CommandParser.h"
#include <NewPing.h>
#include <AsyncWebSocket.h>
#include <SimpleTimer.h>
#include <math.h>

#define SEND_INTERVAL_TIMEOUT_MS 250
#define DISTANCE_REPORT_THRESHOLD_CM 1.0f

static const int trigPin = D5;
static const int echoPin = D8;

static NewPing sonar(trigPin, echoPin);

float lastSentDistance = 0;

String getDistanceMessage(float distance)
{
    char buf[64];
    snprintf(buf, sizeof(buf), "{\"type\": %d, \"cm\": %.2f}", WebSocketMessageTypes::DistanceChange, (double)distance);
    return String(buf);
}

void sendDistanceEvent()
{
    float distance = sonar.ping_cm(50);
    // Threshold avoids flooding the websocket with sub-cm sensor noise.
    if (fabsf(distance - lastSentDistance) >= DISTANCE_REPORT_THRESHOLD_CM)
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
