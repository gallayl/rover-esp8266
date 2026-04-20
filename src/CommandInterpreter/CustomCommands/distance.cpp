#include "distance.h"
#include "../../globals.h"
#include "../../message-types.h"
#include "../../pins.h"
#include "../CommandParser.h"
#include <NewPing.h>
#include <AsyncWebSocket.h>
#include <SimpleTimer.h>
#include <cmath>

constexpr uint32_t SEND_INTERVAL_TIMEOUT_MS = 250;
constexpr float DISTANCE_REPORT_THRESHOLD_CM = 1.0F;
// Open question: confirm rover use case before changing. 50 cm is the original value.
constexpr size_t SONAR_MAX_DISTANCE_CM = 50;
// Sentinel reported to the client when no echo is received within the configured range.
constexpr float DISTANCE_NO_ECHO = -1.0F;

static NewPing sonar(SONAR_TRIG_PIN, SONAR_ECHO_PIN, SONAR_MAX_DISTANCE_CM);

float lastSentDistance = DISTANCE_NO_ECHO;

String getDistanceMessage(float distance)
{
    char buf[64];
    snprintf(buf, sizeof(buf), R"({"type": %d, "cm": %.2f})", WebSocketMessageTypes::DistanceChange, (double)distance);
    return {buf};
}

static float readDistanceCm()
{
    float distance = sonar.ping_cm(SONAR_MAX_DISTANCE_CM);
    // NewPing returns 0 when no echo is received within range; remap to a sentinel
    // so consumers can distinguish "object touching the sensor" from "out of range".
    return distance == 0.0F ? DISTANCE_NO_ECHO : distance;
}

void sendDistanceEvent()
{
    float distance = readDistanceCm();
    // Threshold avoids flooding the websocket with sub-cm sensor noise; always
    // forward sentinel transitions so the UI can react to "out of range".
    bool sentinelChanged = (distance == DISTANCE_NO_ECHO) != (lastSentDistance == DISTANCE_NO_ECHO);
    if (sentinelChanged || fabsf(distance - lastSentDistance) >= DISTANCE_REPORT_THRESHOLD_CM)
    {
        webSocket->textAll(getDistanceMessage(distance));
        lastSentDistance = distance;
    }
}

void setupDistance()
{
    pinMode(SONAR_TRIG_PIN, OUTPUT);
    pinMode(SONAR_ECHO_PIN, INPUT);
    timer->setInterval(SEND_INTERVAL_TIMEOUT_MS, sendDistanceEvent);
}

CustomCommand* distanceAction = new CustomCommand("distance",
                                                  [](const String& /*command*/)
                                                  {
                                                      float distance = readDistanceCm();
                                                      webSocket->textAll(getDistanceMessage(distance));
                                                  });
