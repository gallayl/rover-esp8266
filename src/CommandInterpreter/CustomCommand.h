#pragma once
#include <Arduino.h>

typedef void (*CommandCallbackFunction)(const String &command);

class CustomCommand
{
public:
    CustomCommand(String name = "commandName", CommandCallbackFunction callback = [](const String &command) {}) : _commandName(name), _onExecute(callback){};

    void Execute(const String &command)
    {
        this->_onExecute(command);
    }

    const String &GetCommandName() const
    {
        return this->_commandName;
    }

protected:
    String _commandName;
    CommandCallbackFunction _onExecute;
};
