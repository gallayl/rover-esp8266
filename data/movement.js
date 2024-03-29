import { VirtualJoystick } from './joy.js'
import { WebSocketService } from './sockets.js'

/**
 * @typedef MovementValues
 * @property {number} throttle
 * @property {number} steer
 * @property {number} maxSpeed
 */

/**
 * @typedef MovementServiceOptions
 * @property {VirtualJoystick} joystick
 * @property {WebSocketService} socket
 * @property { (values: MovementValues)=>MovementValues } parseMovement Parses a percentage of throttle to a relative value to enable customization of an acceleration characteristics
 * @property {number } maxSpeedValue
 */
export class MovementService {
  pid = true

  constructor(/** @type {MovementServiceOptions} */ options) {
    /** @type {string} */
    this.lastState = ''

    /** @type {MovementServiceOptions} */
    this.options = {
      ...options,
    }

    setInterval(() => {
      var state = {
        dx: this.options.joystick.deltaX(),
        dy: -this.options.joystick.deltaY(),
      }
      var stateStringified = JSON.stringify(state)
      if (this.lastState !== stateStringified) {
        this.lastState = stateStringified
        const plainMovement = {
          throttle: state.dy,
          steer: state.dx,
          maxSpeed: this.options.maxSpeedValue,
        }
        const parsedMovement = options.parseMovement(plainMovement)
        if (!parsedMovement) {
          return
        }
        if (this.pid) {
          this.options.socket.send(`moveTicks ${parsedMovement.left} ${parsedMovement.right}`)
          return
        }
        parsedMovement.throttle = Math.round(parsedMovement.throttle * this.options.maxSpeedValue)
        parsedMovement.steer = Math.round(parsedMovement.steer * this.options.maxSpeedValue)

        if (parsedMovement.throttle && parsedMovement.steer) {
          this.options.socket.send(`move ${parsedMovement.throttle} ${parsedMovement.steer}`)
        }
      }
    }, 200)
  }
}
