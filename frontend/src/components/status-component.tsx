import { createComponent, Shade, ScreenService } from '@furystack/shades'
import { ThemeProviderService } from '@furystack/shades-common-components'
import { MovementService } from '../services/movement-service'
import { DistanceComponent } from './distance-component'

export const StatusComponent = Shade<{ style?: Partial<CSSStyleDeclaration> }>({
  shadowDomName: 'status-component',

  render: ({ injector, useObservable }) => {
    const movementService = injector.getInstance(MovementService)

    const [leftSpeed] = useObservable('leftSpeed', movementService.leftSpeed)
    const [rightSpeed] = useObservable('rightSpeed', movementService.rightSpeed)

    const themeProvider = injector.getInstance(ThemeProviderService)

    const scr = injector.getInstance(ScreenService)

    console.log(scr.orientation.getValue())

    const getSpeedColor = (speed: number) => {
      const backgroundColor = speed === 0 ? '#222222' : speed === 1 ? '#00FF00' : speed === 2 ? '#FFFF00' : '#FF0000'
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
          <DistanceComponent style={{ padding: '15px', margin: '1em', borderRadius: '5px' }} />
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
