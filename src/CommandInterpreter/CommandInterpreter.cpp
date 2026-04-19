#include "CommandInterpreter.h"

CommandInterpreter *CommandInterpreter::instance = nullptr;

void CommandInterpreter::RegisterCommand(CustomCommand *newCommand)
{
    if (newCommand == nullptr)
    {
        return;
    }
    if (this->_registeredCommandsCount >= COMMANDS_SIZE)
    {
        Serial.println("CommandInterpreter: command capacity reached, ignoring registration");
        return;
    }
    this->_registeredCommands[this->_registeredCommandsCount++] = newCommand;
}

String CommandInterpreter::getAvailableCommands()
{
    String commands = "";
    for (uint16_t i = 0; i < this->_registeredCommandsCount; i++)
    {
        commands += this->_registeredCommands[i]->GetCommandName() + ", ";
    }
    return commands;
}

void CommandInterpreter::ExecuteCommand(const String &command)
{
    const size_t cmdLen = command.length();
    for (uint8_t i = 0; i < this->_registeredCommandsCount; i++)
    {
        const String &name = this->_registeredCommands[i]->GetCommandName();
        const size_t nameLen = name.length();
        if (cmdLen < nameLen)
        {
            continue;
        }
        // Match either an exact command or "<name> <args...>" without allocating "<name> ".
        if (!command.startsWith(name))
        {
            continue;
        }
        if (cmdLen == nameLen || command.charAt(nameLen) == ' ')
        {
            this->_registeredCommands[i]->Execute(command);
            return;
        }
    }
    this->_unknownCommand->Execute(command);
}

CommandInterpreter *CommandInterpreter::GetInstance()
{
    if (instance == nullptr)
    {
        CommandInterpreter *ci = new CommandInterpreter(unknownCommand);
        ci->RegisterCommand(restart);
        ci->RegisterCommand(distanceAction);
        ci->RegisterCommand(infoAction);
        ci->RegisterCommand(move);
        ci->RegisterCommand(stop);
        ci->RegisterCommand(moveTicks);
        ci->RegisterCommand(configurePid);
        instance = ci;
    }
    return instance;
}
