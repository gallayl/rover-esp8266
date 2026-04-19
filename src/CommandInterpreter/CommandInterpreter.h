#pragma once

#include <Arduino.h>
#include "./CustomCommand.h"
#include "./CustomCommands/distance.h"
#include "./CustomCommands/info.h"
#include "./CustomCommands/move.h"
#include "./CustomCommands/reset.h"
#include "./CustomCommands/unknown.h"
#include "./CustomCommands/wifi.h"

#define COMMANDS_SIZE 16

class CommandInterpreter
{
private:
    CustomCommand &_unknownCommand;
    static CommandInterpreter *instance;

    uint8_t _registeredCommandsCount = 0;
    void RegisterCommand(const CustomCommand &newCommand);
    CommandInterpreter(CustomCommand &unknownCommandReference) : _unknownCommand(unknownCommandReference) {}

public:
    String getAvailableCommands();
    void ExecuteCommand(String command);
    CustomCommand RegisteredCommands[COMMANDS_SIZE];
    static CommandInterpreter *GetInstance();
};
