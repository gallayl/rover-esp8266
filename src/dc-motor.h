#pragma once
#include <Arduino.h>
#include <SimpleTimer.h>


class Motor
{
public:
    Motor(uint8_t throttlePin, uint8_t directionPin, uint8_t feedbackPin, uint16_t maxTicks, uint8_t index) : index(index), _throttlePin(throttlePin), _directionPin(directionPin), _feedbackPin(feedbackPin), _maxTicks(maxTicks), _currentTicks(0)  {
        pinMode(throttlePin, OUTPUT);
        pinMode(directionPin, OUTPUT);
        pinMode(feedbackPin, INPUT_PULLDOWN_16);
    }

    void SetThrottle(int16_t newValue)
    {
        this->_throttleValue = constrain(abs(newValue), 0, PWMRANGE);
        digitalWrite(this->_directionPin, newValue > 0 ? LOW : HIGH);
        analogWrite(this->_throttlePin, (int)this->_throttleValue);
    }

    void checkMaxTicks(){
        if (this->_maxTicks < this->_currentTicks)
        {
            this->_maxTicks = this->_currentTicks;
        }
    }

    void encoderEvent()
    {
        this->checkMaxTicks();
        this->_currentTicks = 0;
    }

    void ICACHE_RAM_ATTR _onTick()
    {
        this->_currentTicks++;
    }

    uint16_t getMaxTicks()
    {
        this->checkMaxTicks();
        return this->_maxTicks;
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

    // ticks
    uint16_t _maxTicks;
    uint16_t _currentTicks;

    uint16_t _throttleValue = 0;
};
