#pragma once
#include <Arduino.h>
#include <SimpleTimer.h>

class Motor
{
public:
    Motor(uint8_t throttlePin, uint8_t directionPin, uint8_t feedbackPin, uint16_t maxTicks = 5) : _throttlePin(throttlePin), _directionPin(directionPin), _feedbackPin(feedbackPin), _maxTicks(maxTicks)
    {
        pinMode(throttlePin, OUTPUT);
        pinMode(directionPin, OUTPUT);
        pinMode(feedbackPin, INPUT_PULLDOWN_16);
        this->timer->setInterval(50, this->encoderEvent);
        attachInterrupt(this->_feedbackPin, this->_onTick, CHANGE);
    }

    void encoderEvent()
    {
        if (this->_maxTicks < this->_currentTicks)
        {
            this->_maxTicks = this->_currentTicks;
        }

        /**
         * ToDo: adjust throttle
         */

        this->_currentTicks = 0;
    }

    void SetThrottle(int16_t newValue)
    {
        this->_throttleValue = constrain(abs(newValue), 0, PWMRANGE);
        this->_pwmValue = this->_throttleValue;
        digitalWrite(this->_directionPin, newValue > 0 ? LOW : HIGH);
        analogWrite(this->_throttlePin, this->_pwmValue);
    }

    void ICACHE_RAM_ATTR _onTick()
    {
        this->_currentTicks++;
    }

    uint16_t getMaxTicks()
    {
        return this->_maxTicks;
    }

    uint16_t getCurrentTicks()
    {
        return this->_currentTicks;
    }

private:
    // pins
    uint8_t _throttlePin;
    uint8_t _directionPin;
    uint8_t _feedbackPin;

    // ticks
    uint8_t _maxTicks;
    uint8_t _maxMeasuredTicks;
    uint8_t _currentTicks;

    int16_t _throttleValue = 0;
    int16_t _pwmValue = 0;

    SimpleTimer *timer = new SimpleTimer();
};
