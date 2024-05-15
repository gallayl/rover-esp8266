import { NippleComponent } from '@furystack/shades-nipple'
import { Shade, createComponent } from '@furystack/shades'
import { MovementService } from '../services/movement-service'
export const JoystickPage = Shade({
  shadowDomName: 'joystick-page',
  render: ({ injector }) => {
    const movementService = injector.getInstance(MovementService)

    return (
      <div style={{ width: '100%', height: '100%', position: 'relative' }}>
        <NippleComponent
          style={{ position: 'absolute', top: '0', left: '0', width: '100%', height: '100%' }}
          managerOptions={{}}
          onEnd={() => {
            movementService.stop()
          }}
          onMove={(_ev, data) => {
            const dirMod = data.direction?.y === 'down' ? -1 : 1
            const radMod = Math.cos(data.angle.radian - Math.PI)
            const force = Math.round(data.force)
            const steerForce = Math.round(force / 1.3)
            const leftSpeed = (force + radMod * steerForce) * dirMod
            const rightSpeed = (force - radMod * steerForce) * dirMod
            movementService.move(leftSpeed, rightSpeed)
          }}
        />
      </div>
    )
  },
})
