#pragma once

#include "../CommandParser.h"
#include "../CustomCommand.h"
#include <Wire.h>
#include "PCA9685.h"

#define SERVOMIN 100 // this is the 'minimum' pulse length count (out of 4096)
#define SERVOMAX 550 // this is the 'maximum' pulse length count (out of 4096)

#define PWM_COMMAND_INPUT_SIZE 64

PCA9685 pwm;

CustomCommand *pwmCommand = new CustomCommand("pwm", [](String fullCommand) {
    char input[PWM_COMMAND_INPUT_SIZE + 1];
    CommandParser::GetCommandParameter(fullCommand, 1).toCharArray(input, fullCommand.length());
    byte size = fullCommand.length();
    // Add the final 0 to end the C string
    input[size] = 0;
    String result = "{\"event\": \"pwmChange\", \"details\": [";
    // Read each command pair
    char *command = strtok(input, ";");
    while (command != 0)
    {
        // Split the command in two values
        char *separator = strchr(command, '=');
        if (separator != 0)
        {
            // Actually split the string in 2: replace ':' with 0
            *separator = 0;
            // avoid 8-15 (DC motor short circuit)
            int channel = constrain(atoi(command), 0, 7);
            ++separator;
            long end = constrain(atol(separator), 0, 4095);
            pwm.setChannelPWM(channel, end);
            result += "{\"channel\":";
            result += channel;
            result += ", \"end\":";
            result += end;
            result += "},";
        }
        command = strtok(0, ";");
    }
    result = result.substring(0, result.length() - 1);
    result += "]}";

    return result;
});