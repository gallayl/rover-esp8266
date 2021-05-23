#pragma once
#include "./CustomCommand.h"
#include "./CustomCommands/distance.h"
#include "./CustomCommands/info.h"
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
    CommandInterpreter(CustomCommand &unknownCommandReference = *(new CustomCommand("", [](String command) {}))) : _unknownCommand(unknownCommandReference)
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

    void ExecuteCommand(String command)
    {
        for (uint8_t i = 0; i < COMMANDS_SIZE; i++)
        {
            String commandName = this->RegisteredCommands[i].GetCommandName();
            if (command.equals(commandName) || command.startsWith(commandName + " "))
            {
                this->RegisteredCommands[i].Execute(command);
                return;
            }
        }
        this->_unknownCommand.Execute(command);
    }

    CustomCommand RegisteredCommands[COMMANDS_SIZE];

    static CommandInterpreter *GetInstance()
    {
        if (instance == 0)
        {
            CommandInterpreter *ci = new CommandInterpreter(*unknownCommand);
            ci->RegisterCommand(*reset);
            ci->RegisterCommand(*distanceAction);
            ci->RegisterCommand(*infoAction);
            ci->RegisterCommand(*move);
            ci->RegisterCommand(*stop);
            ci->RegisterCommand(*moveTicks);
            ci->RegisterCommand(*configurePid);
            instance = ci;
        }

        return instance;
    }
};

CommandInterpreter *CommandInterpreter::instance = 0;