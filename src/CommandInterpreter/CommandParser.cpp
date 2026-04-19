#include "CommandParser.h"

String CommandParser::GetCommandName(const String &command)
{
    return CommandParser::GetCommandParameter(command, 0);
}

String CommandParser::GetCommandParameter(const String &command, uint8_t parameterNo)
{
    // Cap input length: a VLA tied to an untrusted string length would overflow the
    // ~4 KB ESP8266 stack on a long websocket frame.
    if (command.length() == 0 || command.length() > MAX_COMMAND_LEN)
    {
        return "";
    }

    char buf[MAX_COMMAND_LEN + 1];
    command.toCharArray(buf, sizeof(buf));
    char *p = buf;
    char *str = NULL;
    int currentSegment = 0;
    while (currentSegment++ <= parameterNo && (str = strtok_r(p, COMMAND_DELIMITER, &p)) != NULL)
    {
    }
    return str ? String(str) : "";
}
