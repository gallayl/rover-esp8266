#pragma once

#include "../CommandParser.h"
#include "../../I2CManager.h"
#include "../CustomCommand.h"

CustomCommand *i2cCommand = new CustomCommand("i2c", [](String command) {
    String sub = CommandParser::GetCommandParameter(command, 1);
    if (sub == "scan")
    {
        String devices = "Available I2C Devices: " + I2CManager::getDevices();
        return devices;
    }
    else if (sub == "read")
    {
        uint16_t address = CommandParser::GetCommandParameter(command, 2).toInt();
        I2CManager::read(address);
        return String("ToDo");
    }
    else if (sub == "write")
    {
        uint16_t address = strtol(CommandParser::GetCommandParameter(command, 2).c_str(), 0, 16);
        command.replace("i2c write ", "");
        I2CManager::write(address, command);
        return String("Writed.");
    }

    String fallback = "The awailable I2C Commands are: scan, read, write";
    return fallback;
});