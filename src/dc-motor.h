#pragma once

#include "./message-types.h"
#include "./globals.h"

#include <Arduino.h>
#include <SimpleTimer.h>
#include <PID_v1.h>

#define PWMRANGE 1023
#define MOTOR_SAMPLETIME_MS 100

double aggKp = 50, aggKi = 0.2, aggKd = 1;

class Motor
{
public:
    Motor(uint8_t throttlePin, uint8_t directionPin, uint8_t feedbackPin, uint8_t index) : index(index), _throttlePin(throttlePin), _directionPin(directionPin), _feedbackPin(feedbackPin), _currentTicks(0), _lastSampledTicks(0), pid(&(this->_currentTicks), &(this->_output), &(this->_setPoint), aggKp, aggKi, aggKd, DIRECT)
    {
        pinMode(throttlePin, OUTPUT);
        pinMode(directionPin, OUTPUT);
        pinMode(feedbackPin, INPUT_PULLDOWN_16);
        this->pid.SetOutputLimits(100, PWMRANGE);
        this->pid.SetMode(AUTOMATIC);
        this->pid.SetTunings(aggKp, aggKi, aggKd);
        this->pid.SetSampleTime(MOTOR_SAMPLETIME_MS);
    }

    void SetThrottle(int16_t newValue)
    {
        this->_usePID = false;
        this->_throttleValue = constrain(abs(newValue), 0, PWMRANGE);
        digitalWrite(this->_directionPin, newValue > 0 ? HIGH : LOW);
        analogWrite(this->_throttlePin, (int)this->_throttleValue);
    }

    void setPid(int16_t newValue)
    {
        this->_usePID = true;
        digitalWrite(this->_directionPin, newValue > 0 ? HIGH : LOW);
        this->_setPoint = abs(newValue);
    }

    void configurePid(double p, double i, double d)
    {
        this->pid.SetTunings(p, i, d);
    }

    uint16_t GetThrottle()
    {
        return this->_throttleValue;
    }

    void encoderEvent()
    {
        if (this->_usePID)
        {
            this->pid.Compute();
            analogWrite(this->_throttlePin, (int)abs(round(this->_output)));
        }
        this->_lastSampledTicks = this->_currentTicks;
        this->_currentTicks = 0;
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
    double _currentTicks;
    double _lastSampledTicks;
    uint16_t _throttleValue = 0;
    double _setPoint = 0, _output = 0;

    PID pid;
};
