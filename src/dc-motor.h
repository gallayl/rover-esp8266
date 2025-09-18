#pragma once

#include "./message-types.h"
#include "./globals.h"

#include <Arduino.h>
#include <SimpleTimer.h>
#include <QuickPID.h>

#define PWMRANGE 1023
#define MOTOR_SAMPLETIME_MS 100

const float aggKp = 8, aggKi = 0.2, aggKd = 1;        // aggressive
const float consKp = 1, consKi = 0.05, consKd = 0.25; // conservative
const float maxConservativeGap = 1;                   // if the gap between setpoint and actual is more than this value, use aggressive tuning

int16_t getMotorTicksPerSecond(int16_t ticks)
{
    return (abs(ticks) * (1000 / MOTOR_SAMPLETIME_MS));
}

class Motor
{
public:
    Motor(uint8_t throttlePin, uint8_t directionPin, uint8_t feedbackPin, uint8_t index) : index(index), _throttlePin(throttlePin), _directionPin(directionPin), _feedbackPin(feedbackPin), _currentTicks(0), _lastSampledTicks(0), pid(&(this->_lastSampledTicks), &(this->_output), &(this->_setPoint))
    {
        pinMode(throttlePin, OUTPUT);
        pinMode(directionPin, OUTPUT);
        pinMode(feedbackPin, INPUT_PULLDOWN_16);
        this->pid.SetOutputLimits(100, PWMRANGE);
        this->pid.SetMode(QuickPID::Control::timer);
        this->pid.SetTunings(aggKp, aggKi, aggKd);
        this->pid.SetSampleTimeUs(MOTOR_SAMPLETIME_MS * 1000);
        this->pid.SetControllerDirection(QuickPID::Action::direct);
        this->pid.SetAntiWindupMode(QuickPID::iAwMode::iAwClamp);
        this->pid.Initialize();
    }

    void SetThrottle(int16_t newValue)
    {
        this->_usePID = false;
        this->pid.Reset();
        this->_throttleValue = constrain(abs(newValue), 0, PWMRANGE);
        digitalWrite(this->_directionPin, newValue > 0 ? HIGH : LOW);
        analogWrite(this->_throttlePin, (int)this->_throttleValue);
    }

    void setPid(int16_t newValue)
    {
        if (!this->_usePID)
        {
            this->_usePID = true;
            this->pid.Reset();
            this->pid.Initialize();
        }
        digitalWrite(this->_directionPin, newValue > 0 ? HIGH : LOW);
        this->_setPoint = newValue;
    }

    void configurePid(double p, double i, double d)
    {
        this->pid.SetTunings(p, i, d);
    }

    uint16_t GetThrottle()
    {
        return this->_throttleValue;
    }

    // called in every MOTOR_SAMPLETIME_MS interval
    void encoderEvent()
    {
        this->_lastSampledTicks = this->_currentTicks;
        this->_currentTicks = 0;

        uint16_t desiredTicks = getMotorTicksPerSecond(this->_lastSampledTicks);

        if (this->_usePID)
        {
            float gap = abs(this->_setPoint - desiredTicks);
            if (gap > maxConservativeGap || desiredTicks < 1) // use aggressive if the gap is big or we are not moving
            {
                this->pid.SetTunings(aggKp, aggKi, aggKd);
            }
            else
            {
                this->pid.SetTunings(consKp, consKi, consKd);
            }
            this->pid.Compute();
            analogWrite(this->_throttlePin, (int)abs(round(this->_output)));
        }
    }

    void IRAM_ATTR _onTick()
    {
        this->_currentTicks++;
    }

    uint16_t getLastSampledTicks()
    {
        return this->_lastSampledTicks;
    }

    uint8_t index;

private:
    // pins
    uint8_t _throttlePin;
    uint8_t _directionPin;
    uint8_t _feedbackPin;

    bool _usePID = false;
    float _currentTicks;
    float _lastSampledTicks;
    uint16_t _throttleValue = 0;
    float _setPoint = 0, _output = 0;

    QuickPID pid;
};
