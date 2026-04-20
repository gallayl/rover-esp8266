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
    CustomCommand* _unknownCommand;
    static CommandInterpreter* instance;

    uint8_t _registeredCommandsCount = 0;
    CustomCommand* _registeredCommands[COMMANDS_SIZE] = {nullptr};
    void RegisterCommand(CustomCommand* newCommand);
    explicit CommandInterpreter(CustomCommand* unknownCommandReference) : _unknownCommand(unknownCommandReference) {}

public:
    String getAvailableCommands();
    void ExecuteCommand(const String& command);
    static CommandInterpreter* GetInstance();
};
