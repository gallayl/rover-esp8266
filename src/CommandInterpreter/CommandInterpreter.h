#pragma once
#include "./CustomCommand.h"
#include "./CustomCommands/flashlight.h"
#include "./CustomCommands/i2c.h"
#include "./CustomCommands/info.h"
#include "./CustomCommands/pwm.h"
#include "./CustomCommands/move.h"
#include "./CustomCommands/reset.h"
#include "./CustomCommands/unknown.h"

#define COMMANDS_SIZE 128

class CommandInterpreter
{
private:
    CustomCommand &_unknownCommand;
    static CommandInterpreter *instance;

    uint8_t _registeredCommandsCount = 0;
    void RegisterCommand(CustomCommand newCommand)
    {
        this->RegisteredCommands[this->_registeredCommandsCount] = newCommand;
        this->_registeredCommandsCount++;
    }
    CommandInterpreter(CustomCommand &unknownCommandReference = *(new CustomCommand("", [](String command) { return String("Unknown command."); }))) : _unknownCommand(unknownCommandReference)
    {
    }

public:
    String getAvailableCommands()
    {
        String commands = "";

        uint16_t commandId;
        for (commandId = 0; commandId < this->_registeredCommandsCount; commandId++)
        {
            commands += this->RegisteredCommands[commandId].GetCommandName() + ", ";
        };
        return commands;
    }

    String ExecuteCommand(String command)
    {
        for (uint8_t i = 0; i < COMMANDS_SIZE; i++)
        {
            String commandName = this->RegisteredCommands[i].GetCommandName();
            if (command.equals(commandName) || command.startsWith(commandName + " "))
            {
                String result = this->RegisteredCommands[i].Execute(command);
                return result;
            }
        }
        String result = this->_unknownCommand.Execute(command);
        return result;
    }

    CustomCommand RegisteredCommands[COMMANDS_SIZE];

    static CommandInterpreter *GetInstance()
    {
        if (instance == 0)
        {
            CommandInterpreter *ci = new CommandInterpreter(*unknownCommand);
            ci->RegisterCommand(*reset);
            ci->RegisterCommand(*i2cCommand);
            ci->RegisterCommand(*infoAction);
            ci->RegisterCommand(*pwmCommand);
            ci->RegisterCommand(*flashlightAction);
            ci->RegisterCommand(*move);
            ci->RegisterCommand(*stop);
            instance = ci;
        }

        return instance;
    }
};

CommandInterpreter *CommandInterpreter::instance = 0;