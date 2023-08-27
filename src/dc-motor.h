#pragma once
#include <Arduino.h>
#include <SimpleTimer.h>
#include <PID_v1.h>

#define PWMRANGE 1024

double aggKp = 50, aggKi = 0.2, aggKd = 1;
double consKp = 5, consKi = 0.05, consKd = 0.25;

class Motor
{
public:
    Motor(uint8_t throttlePin, uint8_t directionPin, uint8_t feedbackPin, uint8_t index) : index(index), _throttlePin(throttlePin), _directionPin(directionPin), _feedbackPin(feedbackPin), _currentTicks(0), _lastSentTicks(0), pid(&(this->_currentTicks), &(this->_output), &(this->_setPoint), aggKp, aggKi, aggKd, DIRECT)
    {
        pinMode(throttlePin, OUTPUT);
        pinMode(directionPin, OUTPUT);
        pinMode(feedbackPin, INPUT_PULLDOWN_16);
        this->pid.SetOutputLimits(100, PWMRANGE);
        this->pid.SetMode(AUTOMATIC);
        this->pid.SetTunings(aggKp, aggKi, aggKd);
    }

    void SetThrottle(int16_t newValue)
    {
        this->_usePID = false;
        this->_throttleValue = constrain(abs(newValue), 0, PWMRANGE);
        digitalWrite(this->_directionPin, newValue > 0 ? LOW : HIGH);
        analogWrite(this->_throttlePin, (int)this->_throttleValue);
    }

    void setPid(int16_t newValue)
    {
        this->_usePID = true;
        digitalWrite(this->_directionPin, newValue > 0 ? LOW : HIGH);
        this->_setPoint = abs(newValue);
    }

    void configurePid(double p, double i, double d)
    {
        // this->pid.SetTunings(p, i, d);
    }

    uint16_t GetThrottle()
    {
        return this->_throttleValue;
    }

    void encoderEvent()
    {
        if (this->_usePID)
        {
            double gap = abs(this->_setPoint - this->_currentTicks); // distance away from setpoint
            if (gap < 3)
            { // we're close to setpoint, use conservative tuning parameters
                this->pid.SetTunings(consKp, consKi, consKd);
            }
            else
            {
                // we're far from setpoint, use aggressive tuning parameters
                this->pid.SetTunings(aggKp, aggKi, aggKd);
            }

            this->pid.Compute();
            analogWrite(this->_throttlePin, (int)abs(round(this->_output)));
            // webSocket->textAll(String("Setpoint:") + String(this->_setPoint) + String(",input: ") + String(this->_currentTicks) + String(",output: ") + String(this->_output));
        }
        if (this->_currentTicks != this->_lastSentTicks)
        {
            this->_lastSentTicks = this->_currentTicks;
            webSocket->textAll(String("{\"type\": \"motorTicksChange\", \"index\":" + String(this->index) + ",\"ticks\": " + String(this->_currentTicks) + "}"));
        }
        this->_currentTicks = 0;
    }

    void IRAM_ATTR _onTick()
    {
        this->_currentTicks++;
    }

    uint16_t getCurrentTicks()
    {
        return this->_currentTicks;
    }

    uint8_t index;

private:
    // pins
    uint8_t _throttlePin;
    uint8_t _directionPin;
    uint8_t _feedbackPin;

    bool _usePID = false;
    double _currentTicks;
    double _lastSentTicks;
    uint16_t _throttleValue = 0;
    double _setPoint = 0, _output = 0;

    PID pid;
};
