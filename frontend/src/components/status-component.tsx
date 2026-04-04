import { createComponent, Shade } from '@furystack/shades'
import type { ObservableValue } from '@furystack/utils'
import { MovementService } from '../services/movement-service'
import { ClientSettings } from '../services/client-settings'

const getSpeedPercent = (speed: number, maxSpeed: number) => {
  return Math.min((speed / (maxSpeed || 1)) * 100, 100)
}

const getSpeedLabel = (speed: number, maxSpeed: number) => {
  return `${getSpeedPercent(speed, maxSpeed).toFixed(2)}%`
}

const getStyle = (speed: number, maxSpeed: number) => {
  const percent = getSpeedPercent(speed, maxSpeed)
  const percentScale = 100 / (percent || 1)
  return {
    height: `calc(${getSpeedPercent(speed, maxSpeed)}% - 64px)`,
    background: `linear-gradient(to top, #00FF00 0%, #FFFF00 ${Math.round(percentScale * 33)}%, #FF0000 ${Math.round(percentScale * 100)}%)`,
  }
}

const SpeedGauge = Shade<{
  speed: ObservableValue<number>
  maxSpeed: ObservableValue<number>
  desiredSpeed: ObservableValue<number>
}>({
  customElementName: 'speed-gauge',
  render: ({ props, useObservable, useHostProps }) => {
    const [speed] = useObservable('speed', props.speed)
    const [maxSpeed] = useObservable('maxSpeed', props.maxSpeed)
    const [desiredSpeed] = useObservable('desiredSpeed', props.desiredSpeed)

    useHostProps({
      style: {
        width: '100%',
        height: '100%',
        position: 'relative',
        border: '1px solid rgba(128,128,128,0.15)',
        background: 'linear-gradient(to top, #003300, #333300, #330000)',
      },
    })

    return (
      <>
        <div
          style={{
            position: 'absolute',
            bottom: '0',
            left: '0',
            minHeight: '64px',
            width: '100%',
            transition: 'height 500ms cubic-bezier(0.215, 0.610, 0.355, 1.000)',
            ...getStyle(speed, maxSpeed),
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: '100%',
            height: '4px',
            background: 'rgba(255,255,255,0.8)',
            transition: 'bottom 500ms cubic-bezier(0.215, 0.610, 0.355, 1.000)',
            bottom: `${getSpeedPercent(Math.abs(desiredSpeed) || 0, maxSpeed)}%`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '16px',
            right: '.5em',
            color: 'black',
          }}
        >
          {getSpeedLabel(speed, maxSpeed)}
        </div>
      </>
    )
  },
})

export const StatusComponent = Shade<{ style?: Partial<CSSStyleDeclaration> }>({
  customElementName: 'status-component',
  render: ({ injector, useObservable }) => {
    const movementService = injector.getInstance(MovementService)
    const clientSettings = injector.getInstance(ClientSettings)

    const [currentSettings] = useObservable('clientSettings', clientSettings.currentSettings)

    const hasFpv = !!currentSettings.fpv.host

    return (
      <div
        style={{
          display: 'flex',
          height: '100%',
          width: '100%',
          color: 'white',
          gap: hasFpv ? '80%' : '16px',
          alignItems: 'space-between',
        }}
      >
        {hasFpv ? (
          <img
            alt="fpv stream"
            src={`${currentSettings.fpv.host}/stream`}
            style={{ position: 'fixed', objectFit: 'contain', width: '100%', height: '100%', top: '0', left: '0' }}
          />
        ) : null}
        <SpeedGauge
          style={{ flexGrow: '1', opacity: hasFpv ? '0.7' : '1' }}
          speed={movementService.leftSpeed}
          maxSpeed={movementService.leftMaxSpeed}
          desiredSpeed={movementService.desiredLeftSpeed}
        />
        <SpeedGauge
          style={{ flexGrow: '1', opacity: hasFpv ? '0.7' : '1' }}
          speed={movementService.rightSpeed}
          maxSpeed={movementService.rightMaxSpeed}
          desiredSpeed={movementService.desiredRightSpeed}
        />
      </div>
    )
  },
})
