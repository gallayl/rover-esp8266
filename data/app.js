import { WebSocketService } from "./sockets.js";
import { VirtualJoystick } from "./joy.js";
import { MovementService } from "./movement.js";

const socket = new WebSocketService({
  host: window.location.hostname,
  port: 80,
  onClose
});

const joystickContainer = document.getElementById("joystickContainer");

let maxSpeedValue = 2048;
document.getElementById("rangeSlider").addEventListener("change", ev => {
  maxSpeedValue = parseInt(ev.currentTarget.value);
});

let steerLock = false;
document.getElementById("steerLock").addEventListener("change", ev => {
  steerLock = ev.currentTarget.checked;
});

const movementJoystick = new VirtualJoystick({
  container: joystickContainer,
  strokeStyle: "#eee",
  mouseSupport: true,
  //limitStickTravel: true,
  // stationaryBase: true,
  baseY: joystickContainer.getBoundingClientRect().height / 2,
  baseX: joystickContainer.getBoundingClientRect().width / 2,
  stickRadius: Math.min(
    joystickContainer.getBoundingClientRect().height / 2,
    joystickContainer.getBoundingClientRect().width / 2
  ) // - 150
});

const movement = new MovementService({
  maxSpeedValue: 1,
  parseMovement: values => {
    const throttle = (values.throttle / 100) * maxSpeedValue;
    const steer = steerLock ? 0 : (values.steer / 100) * maxSpeedValue;
    return {
      throttle,
      steer
    };
  },
  joystick: movementJoystick,
  socket
});

const stopMovement = () => socket.send.bind(socket)("stop");

joystickContainer.addEventListener("mouseup", stopMovement);
joystickContainer.addEventListener("touchend", stopMovement);
