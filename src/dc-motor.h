#pragma once

#include <Arduino.h>
#include <SimpleTimer.h>
#include <QuickPID.h>

#ifndef PWMRANGE
#define PWMRANGE 1023
#endif

#define MOTOR_SAMPLETIME_MS 100

float getMotorTicksPerSecond(float ticks);

class Motor
{
public:
    Motor(uint8_t throttlePin, uint8_t directionPin, uint8_t feedbackPin, uint8_t index);

    void SetThrottle(int16_t newValue);
    void setPid(int16_t newValue);
    void configurePid(double p, double i, double d);
    uint16_t GetThrottle();
    void encoderEvent();
    void IRAM_ATTR _onTick();
    float getLastSampledTicks();

    uint8_t index;

private:
    uint8_t _throttlePin;
    uint8_t _directionPin;
    uint8_t _feedbackPin;

    bool _usePID = false;
    volatile int32_t _currentTicks;
    float _lastSampledTicks;
    uint16_t _throttleValue = 0;
    float _setPoint = 0, _output = 0;

    QuickPID pid;
};
