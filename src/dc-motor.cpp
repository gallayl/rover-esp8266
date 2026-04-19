#include "dc-motor.h"
#include <math.h>

static const float aggKp = 8, aggKi = 0.2, aggKd = 1;        // aggressive
static const float consKp = 1, consKi = 0.05, consKd = 0.25; // conservative
static const float maxConservativeGap = 1;                   // if the gap between setpoint and actual is more than this value, use aggressive tuning

float getMotorTicksPerSecond(float ticks)
{
    return fabsf(ticks) * (1000.0f / (float)MOTOR_SAMPLETIME_MS);
}

Motor::Motor(uint8_t throttlePin, uint8_t directionPin, uint8_t feedbackPin, uint8_t index)
    : index(index),
      _throttlePin(throttlePin),
      _directionPin(directionPin),
      _feedbackPin(feedbackPin),
      _currentTicks(0),
      _lastSampledTicks(0),
      pid(&this->_lastSampledTicks, &this->_output, &this->_setPoint)
{
    pinMode(throttlePin, OUTPUT);
    pinMode(directionPin, OUTPUT);
    // INPUT_PULLDOWN is GPIO16-only on ESP8266; encoder pins are GPIO12/13 → use pull-up.
    // attachInterrupt(..., CHANGE) counts both edges so the active level does not matter for the count.
    pinMode(feedbackPin, INPUT_PULLUP);
    this->pid.SetOutputLimits(100, PWMRANGE);
    this->pid.SetMode(QuickPID::Control::timer);
    this->pid.SetTunings(aggKp, aggKi, aggKd);
    this->pid.SetSampleTimeUs(MOTOR_SAMPLETIME_MS * 1000);
    this->pid.SetControllerDirection(QuickPID::Action::direct);
    this->pid.SetAntiWindupMode(QuickPID::iAwMode::iAwClamp);
    this->pid.Initialize();
}

void Motor::SetThrottle(int16_t newValue)
{
    this->_usePID = false;
    this->pid.Reset();
    this->_throttleValue = constrain(abs(newValue), 0, PWMRANGE);
    digitalWrite(this->_directionPin, newValue > 0 ? HIGH : LOW);
    analogWrite(this->_throttlePin, (int)this->_throttleValue);
}

void Motor::setPid(int16_t newValue)
{
    if (!this->_usePID)
    {
        this->_usePID = true;
        this->pid.Reset();
        this->pid.Initialize();
    }
    digitalWrite(this->_directionPin, newValue > 0 ? HIGH : LOW);
    this->_setPoint = (float)newValue;
}

void Motor::configurePid(double p, double i, double d)
{
    this->pid.SetTunings(p, i, d);
}

uint16_t Motor::GetThrottle()
{
    return this->_throttleValue;
}

// called in every MOTOR_SAMPLETIME_MS interval
void Motor::encoderEvent()
{
    noInterrupts();
    int32_t ticks = this->_currentTicks;
    this->_currentTicks = 0;
    interrupts();
    this->_lastSampledTicks = (float)ticks;

    if (this->_usePID)
    {
        // PID output min is 100 (deadband), so it can never command a true stop.
        // Short-circuit when the setpoint is 0 so the motor actually halts.
        if (this->_setPoint == 0.0f)
        {
            analogWrite(this->_throttlePin, 0);
            this->pid.Reset();
            return;
        }

        float desiredTicks = getMotorTicksPerSecond(this->_lastSampledTicks);
        float gap = fabsf(this->_setPoint - desiredTicks);
        if (gap > maxConservativeGap || desiredTicks < 1) // use aggressive if the gap is big or we are not moving
        {
            this->pid.SetTunings(aggKp, aggKi, aggKd);
        }
        else
        {
            this->pid.SetTunings(consKp, consKi, consKd);
        }
        this->pid.Compute();
        analogWrite(this->_throttlePin, (int)fabsf(this->_output));
    }
}

void IRAM_ATTR Motor::_onTick()
{
    this->_currentTicks++;
}

float Motor::getLastSampledTicks()
{
    return this->_lastSampledTicks;
}
