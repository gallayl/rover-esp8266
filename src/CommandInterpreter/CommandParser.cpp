#include "CommandParser.h"
#include "CommandParserCore.h"

namespace
{
inline String toString(std::string_view view)
{
    if (view.empty())
    {
        return "";
    }
    // Arduino String wants a NUL-terminated buffer; copy the slice into a small
    // stack buffer bounded by the parser's max input length.
    char buf[rover::command_parser::kMaxCommandLength + 1];
    const size_t n = view.size() < sizeof(buf) - 1 ? view.size() : sizeof(buf) - 1;
    memcpy(buf, view.data(), n);
    buf[n] = '\0';
    return {buf};
}
} // namespace

String CommandParser::GetCommandName(const String& command)
{
    return toString(rover::command_parser::parseName({command.c_str(), command.length()}));
}

String CommandParser::GetCommandParameter(const String& command, uint8_t parameterNo)
{
    return toString(rover::command_parser::parseParameter({command.c_str(), command.length()}, parameterNo));
}
