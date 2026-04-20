#include "unknown.h"
#include "../CommandParser.h"
#include "../../globals.h"
#include <AsyncWebSocket.h>

// Minimal JSON string escaper for the subset of bytes that would break JSON.
// Caller-supplied input may contain quotes, backslashes or control bytes.
static String jsonEscape(const String& in)
{
    String out;
    out.reserve(in.length() + 2);
    for (size_t i = 0; i < in.length(); i++)
    {
        char c = in.charAt(i);
        switch (c)
        {
        case '"':
            out += "\\\"";
            break;
        case '\\':
            out += "\\\\";
            break;
        case '\b':
            out += "\\b";
            break;
        case '\f':
            out += "\\f";
            break;
        case '\n':
            out += "\\n";
            break;
        case '\r':
            out += "\\r";
            break;
        case '\t':
            out += "\\t";
            break;
        default:
            if ((uint8_t)c < 0x20)
            {
                char buf[8];
                snprintf(buf, sizeof(buf), "\\u%04x", (uint8_t)c);
                out += buf;
            }
            else
            {
                out += c;
            }
            break;
        }
    }
    return out;
}

CustomCommand* unknownCommand =
    new CustomCommand("",
                      [](const String& command)
                      {
                          String name = jsonEscape(CommandParser::GetCommandName(command));
                          webSocket->textAll("{\"message\": \"Unknown command: " + name + ".\"}");
                      });
