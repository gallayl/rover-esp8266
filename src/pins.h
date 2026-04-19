#pragma once

#include <Arduino.h>

// Motor shield wiring (NodeMCU v2 / ESP-12E).
#define LEFT_MOTOR_THROTTLE_PIN  4
#define LEFT_MOTOR_DIR_PIN       2
#define LEFT_MOTOR_ENCODER_PIN   D6  // GPIO12

#define RIGHT_MOTOR_THROTTLE_PIN 5
#define RIGHT_MOTOR_DIR_PIN      0
#define RIGHT_MOTOR_ENCODER_PIN  D7  // GPIO13

// HC-SR04 ultrasonic sensor.
#define SONAR_TRIG_PIN D5  // GPIO14
#define SONAR_ECHO_PIN D8  // GPIO15
