#include "CommandInterpreter.h"

CommandInterpreter *CommandInterpreter::instance = nullptr;

void CommandInterpreter::RegisterCommand(const CustomCommand &newCommand)
{
    if (this->_registeredCommandsCount >= COMMANDS_SIZE)
    {
        Serial.println("CommandInterpreter: command capacity reached, ignoring registration");
        return;
    }
    this->RegisteredCommands[this->_registeredCommandsCount++] = newCommand;
}

String CommandInterpreter::getAvailableCommands()
{
    String commands = "";
    for (uint16_t commandId = 0; commandId < this->_registeredCommandsCount; commandId++)
    {
        commands += this->RegisteredCommands[commandId].GetCommandName() + ", ";
    }
    return commands;
}

void CommandInterpreter::ExecuteCommand(String command)
{
    for (uint8_t i = 0; i < this->_registeredCommandsCount; i++)
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

CommandInterpreter *CommandInterpreter::GetInstance()
{
    if (instance == nullptr)
    {
        CommandInterpreter *ci = new CommandInterpreter(*unknownCommand);
        ci->RegisterCommand(*restart);
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
