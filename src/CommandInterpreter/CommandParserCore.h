#pragma once

#include <cstddef>
#include <string_view>

// Pure C++17 command tokenizer with no Arduino dependencies. Header-only so the
// `native` PlatformIO env can include it directly without pulling in the rest of
// the firmware sources.
namespace rover::command_parser
{

inline constexpr std::size_t kMaxCommandLength = 128;
inline constexpr char kDefaultDelimiter = ' ';

// Returns the substring view for the requested 0-indexed token. Returns an
// empty view when:
//   - input is empty or longer than kMaxCommandLength (avoids OOB on untrusted
//     websocket frames),
//   - parameterIndex is past the last token,
//   - the input contains only delimiters.
// The returned view aliases the input buffer; the caller must keep it alive.
inline std::string_view parseParameter(std::string_view input, std::size_t parameterIndex,
                                       char delimiter = kDefaultDelimiter) noexcept
{
    if (input.empty() || input.size() > kMaxCommandLength)
    {
        return {};
    }

    std::size_t cursor = 0;
    std::size_t tokenIndex = 0;
    while (cursor < input.size())
    {
        while (cursor < input.size() && input[cursor] == delimiter)
        {
            ++cursor;
        }
        if (cursor >= input.size())
        {
            return {};
        }

        const std::size_t tokenStart = cursor;
        while (cursor < input.size() && input[cursor] != delimiter)
        {
            ++cursor;
        }

        if (tokenIndex == parameterIndex)
        {
            return input.substr(tokenStart, cursor - tokenStart);
        }
        ++tokenIndex;
    }
    return {};
}

inline std::string_view parseName(std::string_view input, char delimiter = kDefaultDelimiter) noexcept
{
    return parseParameter(input, 0, delimiter);
}

} // namespace rover::command_parser
