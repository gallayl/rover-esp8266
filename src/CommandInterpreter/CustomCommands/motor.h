#pragma once

#include "../CommandParser.h"
#include "../CustomCommand.h"

#define MOTOR_MIN 0
#define MOTOR_MAX 255
#define MOTOR_COMMAND_INPUT_SIZE 64

#define MOTOR_PWM_FREQ 5000
#define MOTOR_PWM_RESOLUTION 8

typedef struct
{
    int velocityPin;
    int directionPin;
} motor;

motor Motors[] = {
    {0, 0}, {0, 0}, {0, 0}, {0, 0}};

void setupMotors()
{
    for (size_t i = 0; i < 4; i++)
    {
        /* code */
    }
}

CustomCommand *motorAction = new CustomCommand("motor", [](String fullCommand) {
    char input[MOTOR_COMMAND_INPUT_SIZE + 1];
    CommandParser::GetCommandParameter(fullCommand, 1).toCharArray(input, fullCommand.length());
    byte size = fullCommand.length();
    // Add the final 0 to end the C string
    input[size] = 0;
    String result = "{\"event\": \"motorChange\", \"details\": [";
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
            int channel = atoi(command);
            ++separator;

            if (channel >= 0 && channel < 4)
            {
                long value = atol(separator);
                // long pulse = map(abs(value), 0, 100, MOTOR_MIN, MOTOR_MAX);
                // ToDo: Update PIN states here
                // digitalWrite(/** directionPin */ Motors[channel].directionPin, value < 0 ? LOW : HIGH);
                // ledcWrite(/** velocityPin */ Motors[channel].velocityPin, pulse);

                result += "{\"channel\":";
                result += channel;
                result += ", \"value\":";
                result += value;
                result += "},";
            }
        }
        command = strtok(0, ";");
    }
    result = result.substring(0, result.length() - 1);
    result += "]}";

    return result;
});
