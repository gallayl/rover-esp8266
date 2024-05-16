import { createComponent, Shade, attachStyles } from '@furystack/shades'
import { MovementService } from '../services/movement-service'
import { ObservableValue } from '@furystack/utils'

const getSpeedPercent = (speed: number, maxSpeed: number) => {
  return (speed / (maxSpeed || 1)) * 100
}

const getSpeedLabel = (speed: number, maxSpeed: number) => {
  return `${getSpeedPercent(speed, maxSpeed).toFixed(2)}%`
}

const getStyle = (speed: number, maxSpeed: number) => {
  const percent = getSpeedPercent(speed, maxSpeed)
  const percentScale = 100 / (percent || 1)
  return {
    style: {
      height: `calc(${getSpeedPercent(speed, maxSpeed)}% - 64px)`,
      background: `linear-gradient(to top, #00FF00 0%, #FFFF00 ${Math.round(percentScale * 33)}%, #FF0000 ${Math.round(percentScale * 100)}%)`,
    },
  }
}

const SpeedGauge = Shade<{ speed: ObservableValue<number>; maxSpeed: ObservableValue<number> }>({
  shadowDomName: 'speed-gauge',
  render: ({ props, element, useDisposable }) => {
    useDisposable('speed', () =>
      props.speed.subscribe((newSpeed) => {
        element.querySelector<HTMLDivElement>('.speedLabel')!.innerText = getSpeedLabel(
          newSpeed,
          props.maxSpeed.getValue(),
        )
        attachStyles(
          element.querySelector<HTMLDivElement>('.speedGauge')!,
          getStyle(newSpeed, props.maxSpeed.getValue()),
        )
      }),
    )

    useDisposable('maxSpeed', () =>
      props.maxSpeed.subscribe((newMaxSpeed) => {
        element.querySelector<HTMLDivElement>('.speedLabel')!.innerText = getSpeedLabel(
          props.speed.getValue(),
          newMaxSpeed,
        )
        attachStyles(
          element.querySelector<HTMLDivElement>('.speedGauge')!,
          getStyle(props.speed.getValue(), newMaxSpeed),
        )
      }),
    )

    const speed = props.speed.getValue()
    const maxSpeed = props.maxSpeed.getValue()

    attachStyles(element, {
      style: {
        width: '100%',
        height: '100%',
        position: 'relative',
        border: '1px solid rgba(128,128,128,0.15)',
        background: 'linear-gradient(to top, #005500, #555500, #550000)',
      },
    })

    return (
      <>
        <div
          className="speedGauge"
          style={{
            position: 'absolute',
            bottom: '0',
            left: '0',
            minHeight: '64px',
            width: '100%',
            transition: 'height 500ms cubic-bezier(0.215, 0.610, 0.355, 1.000)',
            ...getStyle(speed, maxSpeed).style,
          }}></div>
        <div
          className="speedLabel"
          style={{
            position: 'absolute',
            bottom: '16px',
            right: '32px',
            color: 'black',
          }}>
          {getSpeedLabel(speed, maxSpeed)}
        </div>
      </>
    )
  },
})

export const StatusComponent = Shade<{ style?: Partial<CSSStyleDeclaration> }>({
  shadowDomName: 'status-component',
  render: ({ injector }) => {
    const movementService = injector.getInstance(MovementService)

    return (
      <div style={{ display: 'flex', height: '100%', width: '100%', color: 'white', gap: '16px' }}>
        <SpeedGauge
          style={{ flexGrow: '1' }}
          speed={movementService.leftSpeed}
          maxSpeed={movementService.leftMaxSpeed}
        />
        <SpeedGauge
          style={{ flexGrow: '1' }}
          speed={movementService.rightSpeed}
          maxSpeed={movementService.rightMaxSpeed}
        />
      </div>
    )
  },
})
