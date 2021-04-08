import { NippleComponent } from '@furystack/shades-nipple'
import { Shade, createComponent } from '@furystack/shades'
import { MovementService } from '../services/movement-service'
export const JoystickPage = Shade<
  unknown,
  {
    movementService: MovementService
    updateInterval: ReturnType<typeof setInterval>
    sendData?: { leftSpeed: number; rightSpeed: number }
  }
>({
  getInitialState: ({ injector }) => ({
    movementService: injector.getInstance(MovementService),
    updateInterval: setInterval(() => {
      /** */
    }, 100),
  }),
  constructed: ({ updateState, getState }) => {
    clearInterval(getState().updateInterval) // clear initial
    updateState({
      updateInterval: setInterval(() => {
        const { sendData } = getState()
        if (sendData) {
          getState().movementService.move(sendData.leftSpeed, sendData.rightSpeed)
          updateState({ sendData: undefined }, true)
        }
      }, 100),
    })
    return () => clearInterval(getState().updateInterval)
  },
  render: ({ updateState }) => {
    return (
      <div style={{ width: '100%', height: '100%', position: 'relative' }}>
        <NippleComponent
          style={{ position: 'absolute', top: '0', left: '0', width: '100%', height: '100%' }}
          managerOptions={{}}
          onEnd={() => updateState({ sendData: { leftSpeed: 0, rightSpeed: 0 } }, true)}
          onMove={(_ev, data) => {
            const dirMod = data.direction?.y === 'down' ? -1 : 1
            const radMod = Math.cos(data.angle.radian - Math.PI)
            const force = Math.round(data.force)
            const steerForce = Math.round(force / 1.3)
            const leftSpeed = (force + radMod * steerForce) * dirMod
            const rightSpeed = (force - radMod * steerForce) * dirMod

            updateState({ sendData: { leftSpeed, rightSpeed } }, true)
          }}
        />
      </div>
    )
  },
})
