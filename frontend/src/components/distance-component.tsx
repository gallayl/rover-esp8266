import { Shade, attachStyles, createComponent } from '@furystack/shades'
import { ThemeProviderService } from '@furystack/shades-common-components'
import { MovementService } from '../services/movement-service'

export const DistanceComponent = Shade({
  shadowDomName: 'distance-component',
  render: ({ injector, useObservable, props, element }) => {
    const themeProvider = injector.getInstance(ThemeProviderService)
    const movementService = injector.getInstance(MovementService)
    const [distance] = useObservable('distance', movementService.frontDistance, {
      onChange: (newDistance) => {
        attachStyles(element, { style: getDistanceColor(newDistance) })
        element.innerText = newDistance.toString() + ' cm'
      },
    })

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

    attachStyles(element, { style: { ...getDistanceColor, ...props.style } })
    return <>{distance.toString()} cm</>
  },
})
