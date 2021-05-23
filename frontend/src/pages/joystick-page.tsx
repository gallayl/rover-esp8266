import { NippleComponent } from '@furystack/shades-nipple'
import { Shade, createComponent } from '@furystack/shades'
import { MovementService } from '../services/movement-service'
import { EnvironmentService } from '../services/environment-service'

export const JoystickPage = Shade<
  unknown,
  {
    movementService: MovementService
    updateInterval: ReturnType<typeof setInterval>
    sendData?: { speed: number; steer: number }
  }
>({
  getInitialState: ({ injector }) => ({
    movementService: injector.getInstance(MovementService),
    updateInterval: setInterval(() => { }, 100),
  }),
  constructed: ({ updateState, getState }) => {
    clearInterval(getState().updateInterval) // clear initial
    updateState({
      updateInterval: setInterval(() => {
        const sendData = getState().sendData
        if (sendData) {
          getState().movementService.move(sendData.speed, sendData.steer)
          updateState({ sendData: undefined }, true)
        }
      }, 100),
    })
    return () => clearInterval(getState().updateInterval)
  },
  render: ({ updateState, injector }) => {
    return (
      <div style={{ width: '100%', height: '100%', position: 'relative' }}>
        <img
          src={`http://${injector.getInstance(EnvironmentService).site}/cam`}
          alt="webcam-image"
          style={{ objectFit: 'cover', width: '100%', height: '100%', zIndex: '-1' }}
          onload={(ev) => {
            const img = ev.target as HTMLImageElement
            if (img.complete && img.isConnected) {
              img.src = `http://${injector.getInstance(EnvironmentService).site}/cam?refresh=${Math.random()}`
            }
          }}
          onerror={(ev) => {
            const img = (ev as any).target as HTMLImageElement
            if (img.complete && img.isConnected) {
              img.src = `http://${injector.getInstance(EnvironmentService).site}/cam?refresh=${Math.random()}`
            }
          }}
        />
        <NippleComponent
          style={{ position: 'absolute', top: '0', left: '0', width: '100%', height: '100%' }}
          managerOptions={{}}
          onEnd={() => updateState({ sendData: { speed: 0, steer: 0 } }, true)}
          onMove={(_ev, data) => {
            const speed = Math.round(data.force * 20 * (data.direction?.y === 'down' ? -1 : 1)) // +/- 300
            const steer = Math.round(Math.cos(data.angle.radian) * 110) // +/-50
            updateState({ sendData: { speed, steer } }, true)
          }}
        />
      </div>
    )
  },
})
