#include "move.h"
#include "../../globals.h"
#include "../../message-types.h"
#include "../../pins.h"
#include "../CommandParser.h"
#include <AsyncWebSocket.h>
#include <SimpleTimer.h>
#include <cmath>

constexpr uint32_t MOTOR_TICKCHANGE_NOTIFY_INTERVAL = 100;

Motor* leftMotor = nullptr;
Motor* rightMotor = nullptr;

int16_t lastSentLeft = 0;
int16_t lastSentRight = 0;

String getMotorTickChangeMessage(uint16_t index, int16_t ticks)
{
    char buf[64];
    snprintf(buf, sizeof(buf), R"({"type": %d, "i":%u,"t": %d})", WebSocketMessageTypes::MotorTicksChange, index,
             ticks);
    return {buf};
}

void notifyMotorSpeedChange()
{
    if (leftMotor == nullptr || rightMotor == nullptr)
    {
        return;
    }
    auto newLeft = (int16_t)lroundf(leftMotor->getSignedTicksPerSec());
    auto newRight = (int16_t)lroundf(rightMotor->getSignedTicksPerSec());

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
    // Deferred construction: keeps hardware writes out of static-init and lets us
    // depend on Serial / other facilities the ctor might use later.
    if (leftMotor == nullptr)
    {
        leftMotor = new Motor(LEFT_MOTOR_THROTTLE_PIN, LEFT_MOTOR_DIR_PIN, LEFT_MOTOR_ENCODER_PIN, 0);
    }
    if (rightMotor == nullptr)
    {
        rightMotor = new Motor(RIGHT_MOTOR_THROTTLE_PIN, RIGHT_MOTOR_DIR_PIN, RIGHT_MOTOR_ENCODER_PIN, 1);
    }
    timer->setInterval(MOTOR_SAMPLETIME_MS, motorEncoderEvents);
    timer->setInterval(MOTOR_TICKCHANGE_NOTIFY_INTERVAL, notifyMotorSpeedChange);
    attachInterrupt(LEFT_MOTOR_ENCODER_PIN, leftMotorTick, CHANGE);
    attachInterrupt(RIGHT_MOTOR_ENCODER_PIN, rightMotorTick, CHANGE);
}

static int16_t leftMotorSpeed;
static int16_t rightMotorSpeed;

CustomCommand* move = new CustomCommand(
    "move",
    [](const String& command)
    {
        leftMotorSpeed =
            (int16_t)constrain(CommandParser::GetCommandParameter(command, 1).toInt(), -PWMRANGE, PWMRANGE);
        // Right motor is mounted mirrored on the chassis; negate so positive values mean "forward" for both wheels.
        rightMotorSpeed =
            (int16_t)-constrain(CommandParser::GetCommandParameter(command, 2).toInt(), -PWMRANGE, PWMRANGE);

        leftMotor->SetThrottle(leftMotorSpeed);
        rightMotor->SetThrottle(rightMotorSpeed);
    });

CustomCommand* moveTicks =
    new CustomCommand("moveTicks",
                      [](const String& command)
                      {
                          leftMotorSpeed = (int16_t)CommandParser::GetCommandParameter(command, 1).toInt();
                          // Right motor mirrored — see comment above.
                          rightMotorSpeed = (int16_t)-CommandParser::GetCommandParameter(command, 2).toInt();

                          leftMotor->setPid(leftMotorSpeed);
                          rightMotor->setPid(rightMotorSpeed);
                      });

CustomCommand* configurePid =
    new CustomCommand("configurePid",
                      [](const String& command)
                      {
                          double p = CommandParser::GetCommandParameter(command, 1).toDouble();
                          double i = CommandParser::GetCommandParameter(command, 2).toDouble();
                          double d = CommandParser::GetCommandParameter(command, 3).toDouble();

                          leftMotor->configurePid(p, i, d);
                          rightMotor->configurePid(p, i, d);
                      });

CustomCommand* stop = new CustomCommand("stop",
                                        [](const String& /*command*/)
                                        {
                                            leftMotor->SetThrottle(0);
                                            rightMotor->SetThrottle(0);
                                        });
