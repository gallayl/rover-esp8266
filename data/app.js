import { WebSocketService } from './sockets.js'
import { VirtualJoystick } from './joy.js'
import { MovementService } from './movement.js'

let usePID = true

let [p, i, d] = [30, 1, 0.1]

const socket = new WebSocketService({
  host: window.location.hostname,
  port: 80,
  onOpen: () => undefined,
  onClose: () => undefined,
  onMessage: () => undefined,
})

const joystickContainer = document.getElementById('joystickContainer')

const camImageContainer = document.getElementById('camImageContainer')

camImageContainer.onload = () => {
  camImageContainer.setAttribute('src', 'http://192.168.0.38/cam?t=' + new Date().toISOString())
}

document.getElementById('resolutionSelector').onchange = ev => {
  fetch('http://192.168.0.38/setupCam?framesize=' + ev.target.value)
}

document.getElementById('qualitySelector').onchange = ev => {
  fetch('http://192.168.0.38/setupCam?quality=' + ev.target.value)
}

document.getElementById('lightsSelector').onchange = ev => {
  fetch('http://192.168.0.38/lights?front=' + ev.target.value)
}

let maxSpeedValue = 2048
document.getElementById('rangeSlider').addEventListener('change', ev => {
  maxSpeedValue = parseInt(ev.currentTarget.value)
})

document.getElementById('usePid').onchange = ev => {
  usePID = ev.currentTarget.checked
  movement.pid = usePID
  if (usePID) {
    document.getElementById('rangeSlider').style.display = 'none'
    document.getElementById('pidControls').style.display = 'block'
  } else {
    document.getElementById('rangeSlider').style.display = 'block'
    document.getElementById('pidControls').style.display = 'none'
  }
}

const updatePid = () => {
  socket.send(`configurePid ${p} ${i} ${d}`)
}

document.getElementById('pidInputP').onchange = ev => {
  p = parseInt(ev.currentTarget.value) || 0
  updatePid()
}

document.getElementById('pidInputI').onchange = ev => {
  i = parseInt(ev.currentTarget.value) || 0
  updatePid()
}

document.getElementById('pidInputD').onchange = ev => {
  d = parseInt(ev.currentTarget.value) || 0
  updatePid()
}

const movementJoystick = new VirtualJoystick({
  container: joystickContainer,
  strokeStyle: '#eee',
  mouseSupport: true,
  //limitStickTravel: true,
  // stationaryBase: true,
  baseY: joystickContainer.getBoundingClientRect().height / 2,
  baseX: joystickContainer.getBoundingClientRect().width / 2,
  stickRadius: Math.min(
    joystickContainer.getBoundingClientRect().height / 2,
    joystickContainer.getBoundingClientRect().width / 2,
  ), // - 150
})

const movement = new MovementService({
  maxSpeedValue: 1,
  parseMovement: values => {
    if (usePID) {
      return {
        left: (values.throttle - values.steer) / 5,
        right: (values.throttle + values.steer) / 5,
      }
    }
    const throttle = (values.throttle / 100) * maxSpeedValue
    const steer = (values.steer / 100) * maxSpeedValue
    return {
      throttle,
      steer,
    }
  },
  joystick: movementJoystick,
  socket,
})

const stopMovement = () => socket.send.bind(socket)('stop')

joystickContainer.addEventListener('mouseup', stopMovement)
joystickContainer.addEventListener('touchend', stopMovement)
