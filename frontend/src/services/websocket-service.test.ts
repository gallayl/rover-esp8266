import { describe, expect, it } from 'vitest'
import { WebSocketMessageTypes } from './websocket-service'

// Sentinel test: the firmware in src/message-types.h pins these numeric values.
// Drifting them silently breaks every websocket payload the rover sends, so a
// failure here means either the contract changed (update both sides) or the
// enum was refactored (update this assertion).
describe('WebSocketMessageTypes', () => {
  it('matches the firmware protocol numbering', () => {
    expect(WebSocketMessageTypes.Unknown).toBe(0)
    expect(WebSocketMessageTypes.MotorTicksChange).toBe(1)
    expect(WebSocketMessageTypes.DistanceChange).toBe(2)
    expect(WebSocketMessageTypes.WifiSignalChange).toBe(3)
  })

  it('exposes exactly the documented members', () => {
    const numericKeys = Object.keys(WebSocketMessageTypes).filter((k) => Number.isNaN(Number(k)))
    expect(numericKeys.sort()).toEqual(['DistanceChange', 'MotorTicksChange', 'Unknown', 'WifiSignalChange'])
  })
})
