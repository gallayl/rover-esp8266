#pragma once
#include <Arduino.h>
#include <SimpleTimer.h>
#include <FastPID.h>


float Kp=0.1, Ki=0.5, Kd=0, Hz=10;
int output_bits = 8;
bool output_signed = false;

FastPID myPID(Kp, Ki, Kd, Hz, output_bits, output_signed);


class Motor
{
public:
    Motor(uint8_t throttlePin, uint8_t directionPin, uint8_t feedbackPin, uint16_t maxTicks, uint8_t index) : _throttlePin(throttlePin), _directionPin(directionPin), _feedbackPin(feedbackPin), _maxTicks(maxTicks), index(index)
    {
        pinMode(throttlePin, OUTPUT);
        pinMode(directionPin, OUTPUT);
        pinMode(feedbackPin, INPUT_PULLDOWN_16);
    }

    void SetThrottle(int16_t newValue)
    {
        this->_throttleValue = constrain(abs(newValue), 0, PWMRANGE);
        this->_pwmValue = (uint16_t)this->_throttleValue;
        digitalWrite(this->_directionPin, newValue > 0 ? LOW : HIGH);
        analogWrite(this->_throttlePin, this->_pwmValue);
        // Serial.printf("New %s Throttle: %i %\n",this->index == 0 ? "RIGHT" : "LEFT", map(this->_throttleValue, 0, PWMRANGE, 0, 100));
    }

    void encoderEvent()
    {
        if (this->_maxTicks < this->_currentTicks)
        {
            this->_maxTicks = this->_currentTicks;
            // Serial.printf("%s Max Ticks increased to %i \n", this->index == 0 ? "RIGHT" : "LEFT", this->_maxTicks);
        }

        if (this->_throttleValue != 0 && this->_throttleValue < PWMRANGE){
            int8_t throttlePercent = (int8_t)map(this->_throttleValue, 0, PWMRANGE, 0, 100);
            int8_t pwmPercent = (int8_t)map(this->_pwmValue, 0, PWMRANGE, 0, 100);
            int8_t currentPercent = (int8_t)map(this->_currentTicks, 0, this->_maxTicks, 0, 100);
            // int8_t errorPercent = pwmPercent - currentPercent;

            uint16_t newOutput = myPID.step(throttlePercent, currentPercent);

            if (newOutput != pwmPercent) {
                this->_pwmValue = (uint16_t)map(newOutput, 0, 100, 0, PWMRANGE);
                analogWrite(this->_throttlePin, this->_pwmValue);
                Serial.printf("%s PWM adjusted ( throttle / pwm / current): %i\t%i\t%i\t%i\n", this->index == 0 ? "L" : "R", throttlePercent, pwmPercent, currentPercent);
            }
        }
        this->_currentTicks = 0;
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

    uint8_t index;

private:
    // pins
    uint8_t _throttlePin;
    uint8_t _directionPin;
    uint8_t _feedbackPin;

    // ticks
    uint8_t _maxTicks;
    uint8_t _currentTicks;

    int _throttleValue = 0;
    int _pwmValue = 0;
};
