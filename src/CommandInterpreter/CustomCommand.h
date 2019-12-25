#pragma once
#include <Arduino.h>

typedef void (*CommandCallbackFunction)(String command);

class CustomCommand
{
public:
    CustomCommand(String name = "commandName", CommandCallbackFunction callback = [](String command) {}) : _commandName(name), _onExecute(callback){};

    void Execute(String command)
    {
        this->_onExecute(command);
    }

    String GetCommandName()
    {
        return this->_commandName;
    }

protected:
    String _commandName;
    CommandCallbackFunction _onExecute;
};
