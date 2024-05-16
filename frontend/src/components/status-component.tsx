import { createComponent, Shade, ScreenService } from '@furystack/shades'
import { ThemeProviderService } from '@furystack/shades-common-components'
import { MovementService } from '../services/movement-service'
import { DistanceComponent } from './distance-component'

export const StatusComponent = Shade<{ style?: Partial<CSSStyleDeclaration> }>({
  shadowDomName: 'status-component',

  render: ({ injector, useObservable, element }) => {
    const movementService = injector.getInstance(MovementService)

    const [leftSpeed] = useObservable('leftSpeed', movementService.leftSpeed, {
      onChange: (newLeftSpeed) => {
        const el = element.querySelector<HTMLDivElement>('.leftSpeed')
        if (el) {
          Object.assign(el.style, getSpeedColor(newLeftSpeed))
          el.innerText = newLeftSpeed.toString()
        }
      },
    })
    const [rightSpeed] = useObservable('rightSpeed', movementService.rightSpeed, {
      onChange: (newRightSpeed) => {
        const el = element.querySelector<HTMLDivElement>('.rightSpeed')
        if (el) {
          Object.assign(el.style, getSpeedColor(newRightSpeed))
          el.innerText = newRightSpeed.toString()
        }
      },
    })

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
          className="leftSpeed"
          style={{
            borderRadius: '25%',
            width: '15%',
            height: '55%',
            textAlign: 'center',
            transition: 'background-color 0.5s',
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
          className="rightSpeed"
          style={{
            borderRadius: '25%',
            width: '15%',
            height: '55%',
            textAlign: 'center',
            transition: 'background-color 0.5s',
            ...getSpeedColor(rightSpeed),
          }}>
          {rightSpeed.toString()}
        </div>
      </div>
    )
  },
})
