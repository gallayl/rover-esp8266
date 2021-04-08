#pragma once
#include <Arduino.h>
#include <SimpleTimer.h>
#include <PID_v1.h>

double aggKp = 200, aggKi = 0.3, aggKd = 0.01;
double consKp = 10, consKi = 0.05, consKd = 0.25;

class Motor
{
public:
    Motor(uint8_t throttlePin, uint8_t directionPin, uint8_t feedbackPin, uint8_t index) : index(index), _throttlePin(throttlePin), _directionPin(directionPin), _feedbackPin(feedbackPin), _currentTicks(0), pid(&(this->_currentTicks), &(this->_output), &(this->_setPoint), aggKp, aggKi, aggKd, DIRECT)
    {
        pinMode(throttlePin, OUTPUT);
        pinMode(directionPin, OUTPUT);
        pinMode(feedbackPin, INPUT_PULLDOWN_16);
        this->pid.SetOutputLimits(0, PWMRANGE);
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
            // double gap = abs(this->_setPoint - this->_currentTicks); //distance away from setpoint
            // if (gap < 5)
            // { //we're close to setpoint, use conservative tuning parameters
            //     this->pid.SetTunings(consKp, consKi, consKd);
            // }
            // else
            // {
            //     //we're far from setpoint, use aggressive tuning parameters
            //     this->pid.SetTunings(aggKp, aggKi, aggKd);
            // }

            this->pid.Compute();
            analogWrite(this->_throttlePin, (int)abs(round(this->_output)));
            webSocket->textAll(String("{\"sp\":") + String(this->_setPoint) + String(",\"in\": ") + String(this->_currentTicks) + String(",\"out\": ") + String(this->_output) + ",\"idx\":" + this->index + "}");
        }
        this->_currentTicks = 0;
    }

    void ICACHE_RAM_ATTR _onTick()
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
    uint16_t _throttleValue = 0;
    double _setPoint = 0, _output = 0;

    PID pid;
};
