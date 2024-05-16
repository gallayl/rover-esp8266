#pragma once

/**
 * Keep in sync with client
 */
enum WebSocketMessageTypes
{
    Unknown = 0,
    MotorTicksChange = 1,
    DistanceChange = 2,
};