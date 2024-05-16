import { Shade, attachStyles, createComponent } from '@furystack/shades'
import { ThemeProviderService } from '@furystack/shades-common-components'
import { DistanceService } from '../services/distance-service'

export const DistanceComponent = Shade({
  shadowDomName: 'distance-component',
  render: ({ injector, useObservable, props, element }) => {
    const themeProvider = injector.getInstance(ThemeProviderService)
    const distanceService = injector.getInstance(DistanceService)
    const [distance] = useObservable('distance', distanceService.frontDistance, {
      onChange: (newDistance) => {
        attachStyles(element, { style: getDistanceColor(newDistance) })
        element.innerText = getDistanceLabel(newDistance)
      },
    })

    const getDistanceLabel = (d: number) => {
      return d === 0 ? '' : `${d} cm`
    }

    const getDistanceColor = (d: number) => {
      const backgroundColor =
        d === 0
          ? 'transparent'
          : d < 0.001
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

    attachStyles(element, {
      style: { ...getDistanceColor, ...props.style, transition: 'background-color .5s ease-in-out' },
    })
    return <>{getDistanceLabel(distance)}</>
  },
})
