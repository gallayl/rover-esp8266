#pragma once

#include <cstdint>

/**
 * Keep in sync with client
 */
enum WebSocketMessageTypes : uint8_t
{
    Unknown = 0,
    MotorTicksChange = 1,
    DistanceChange = 2,
    WifiSignalChange = 3,
};