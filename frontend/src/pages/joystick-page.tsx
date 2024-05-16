import { NippleComponent } from '@furystack/shades-nipple'
import { Shade, createComponent } from '@furystack/shades'
import { MovementService } from '../services/movement-service'
import { ClientSettings } from '../services/client-settings'
export const JoystickPage = Shade({
  shadowDomName: 'joystick-page',
  render: ({ injector, useObservable }) => {
    const movementService = injector.getInstance(MovementService)
    const [clientSettings] = useObservable('clientSettings', injector.getInstance(ClientSettings).currentSettings)

    return (
      <div style={{ width: '100%', height: '100%', position: 'relative' }}>
        <NippleComponent
          style={{ position: 'absolute', top: '0', left: '0', width: '100%', height: '100%' }}
          managerOptions={{}}
          onEnd={() => {
            movementService.stop()
          }}
          onMove={(_ev, data) => {
            const steerModifier = data.force * data.vector.x * clientSettings.sensitivity.steer
            const throttleModifier = data.force * data.vector.y * clientSettings.sensitivity.throttle
            const leftSpeed = throttleModifier + steerModifier
            const rightSpeed = throttleModifier - steerModifier
            movementService.move(leftSpeed, rightSpeed)
          }}
        />
      </div>
    )
  },
})
