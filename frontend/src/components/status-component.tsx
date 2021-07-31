import { createComponent, Shade, Screen } from '@furystack/shades'
import { ThemeProviderService } from '@furystack/shades-common-components'
import { MovementService } from '../services/movement-service'

export const StatusComponent = Shade<
  { style?: Partial<CSSStyleDeclaration> },
  { leftSpeed: number; rightSpeed: number; distance: number }
>({
  shadowDomName: 'status-component',
  getInitialState: ({ injector }) => {
    const movementService = injector.getInstance(MovementService)
    return {
      leftSpeed: movementService.leftSpeed.getValue(),
      rightSpeed: movementService.rightSpeed.getValue(),
      distance: movementService.frontDistance.getValue(),
    }
  },
  constructed: ({ injector, updateState }) => {
    const movementService = injector.getInstance(MovementService)
    const observables = [
      movementService.leftSpeed.subscribe((leftSpeed) => {
        updateState({ leftSpeed })
      }),
      movementService.rightSpeed.subscribe((rightSpeed) => {
        updateState({ rightSpeed })
      }),
      movementService.frontDistance.subscribe((distance) => {
        updateState({ distance })
      }),
    ]
    return () => observables.forEach((o) => o.dispose())
  },
  render: ({ getState, injector }) => {
    const { leftSpeed, rightSpeed, distance } = getState()

    const themeProvider = injector.getInstance(ThemeProviderService)

    const scr = injector.getInstance(Screen)

    console.log(scr.orientation.getValue())

    const getSpeedColor = (speed: number) => {
      const backgroundColor = speed === 0 ? '#222222' : speed === 1 ? '#00FF00' : speed === 2 ? '#FFFF00' : '#FF0000'
      const color = themeProvider.getTextColor(backgroundColor)
      return { backgroundColor, color }
    }

    const getDistanceColor = (d: number) => {
      const backgroundColor =
        d < 0.001
          ? '#000000'
          : d < 6
          ? '#FF0000'
          : d < 16
          ? '#FF9900'
          : d < 30
          ? '#FFFF00'
          : d < 40
          ? '#00FF00'
          : '#0000FF'
      const color = themeProvider.getTextColor(backgroundColor)
      return { backgroundColor, color }
    }

    return (
      <div style={{ display: 'flex', height: '100%', width: '100%', color: 'white' }}>
        <div
          style={{
            borderRadius: '25%',
            width: '15%',
            height: '55%',
            textAlign: 'center',
            ...getSpeedColor(leftSpeed),
          }}>
          {leftSpeed.toString()}
        </div>
        <div
          style={{
            width: '70%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.4)',
            display: 'flex',
            flexDirection: 'row',
            alignContent: 'flex-start',
            justifyContent: 'center',
            alignItems: 'flex-start',
          }}>
          <div style={{ padding: '15px', margin: '1em', borderRadius: '5px', ...getDistanceColor(distance) }}>
            {distance.toString()} cm
          </div>
        </div>
        <div
          style={{
            borderRadius: '25%',
            width: '15%',
            height: '55%',
            textAlign: 'center',
            ...getSpeedColor(rightSpeed),
          }}>
          {rightSpeed.toString()}
        </div>
      </div>
    )
  },
})
