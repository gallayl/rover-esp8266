#include <unity.h>

#include "../../src/CommandInterpreter/CommandParserCore.h"

using rover::command_parser::kMaxCommandLength;
using rover::command_parser::parseName;
using rover::command_parser::parseParameter;

void setUp(void) {}
void tearDown(void) {}

static void test_empty_input_returns_empty(void)
{
    TEST_ASSERT_TRUE(parseName({}).empty());
    TEST_ASSERT_TRUE(parseParameter({}, 0).empty());
    TEST_ASSERT_TRUE(parseParameter({}, 5).empty());
}

static void test_single_token(void)
{
    auto name = parseName("info");
    TEST_ASSERT_EQUAL_STRING_LEN("info", name.data(), name.size());
    TEST_ASSERT_TRUE(parseParameter("info", 1).empty());
}

static void test_multiple_tokens(void)
{
    constexpr std::string_view input = "move 100 -200";

    auto name = parseName(input);
    TEST_ASSERT_EQUAL_STRING_LEN("move", name.data(), name.size());

    auto a = parseParameter(input, 1);
    TEST_ASSERT_EQUAL_STRING_LEN("100", a.data(), a.size());

    auto b = parseParameter(input, 2);
    TEST_ASSERT_EQUAL_STRING_LEN("-200", b.data(), b.size());

    TEST_ASSERT_TRUE(parseParameter(input, 3).empty());
}

static void test_collapses_consecutive_delimiters(void)
{
    constexpr std::string_view input = "move    100   200";

    auto a = parseParameter(input, 1);
    TEST_ASSERT_EQUAL_STRING_LEN("100", a.data(), a.size());

    auto b = parseParameter(input, 2);
    TEST_ASSERT_EQUAL_STRING_LEN("200", b.data(), b.size());
}

static void test_leading_and_trailing_delimiters(void)
{
    constexpr std::string_view input = "   info   ";

    auto name = parseName(input);
    TEST_ASSERT_EQUAL_STRING_LEN("info", name.data(), name.size());
    TEST_ASSERT_TRUE(parseParameter(input, 1).empty());
}

static void test_only_delimiters(void)
{
    TEST_ASSERT_TRUE(parseName("     ").empty());
    TEST_ASSERT_TRUE(parseParameter("     ", 0).empty());
}

static void test_oversized_input_rejected(void)
{
    std::string oversized(kMaxCommandLength + 1, 'x');
    TEST_ASSERT_TRUE(parseName(oversized).empty());
    TEST_ASSERT_TRUE(parseParameter(oversized, 0).empty());
}

static void test_input_at_exact_max_length(void)
{
    std::string atLimit(kMaxCommandLength, 'a');
    auto name = parseName(atLimit);
    TEST_ASSERT_EQUAL(kMaxCommandLength, name.size());
    TEST_ASSERT_EQUAL_CHAR('a', name[0]);
}

static void test_parameter_index_out_of_range(void)
{
    TEST_ASSERT_TRUE(parseParameter("a b c", 99).empty());
}

static void test_custom_delimiter(void)
{
    auto a = parseParameter("foo,bar,baz", 1, ',');
    TEST_ASSERT_EQUAL_STRING_LEN("bar", a.data(), a.size());
}

int main(int, char**)
{
    UNITY_BEGIN();
    RUN_TEST(test_empty_input_returns_empty);
    RUN_TEST(test_single_token);
    RUN_TEST(test_multiple_tokens);
    RUN_TEST(test_collapses_consecutive_delimiters);
    RUN_TEST(test_leading_and_trailing_delimiters);
    RUN_TEST(test_only_delimiters);
    RUN_TEST(test_oversized_input_rejected);
    RUN_TEST(test_input_at_exact_max_length);
    RUN_TEST(test_parameter_index_out_of_range);
    RUN_TEST(test_custom_delimiter);
    return UNITY_END();
}
