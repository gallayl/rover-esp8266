import { Shade, createComponent } from '@furystack/shades'
import { DistanceService } from '../services/distance-service'

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
  const color = backgroundColor === 'transparent' || backgroundColor === '#000000' ? '#fff' : '#000'
  return { backgroundColor, color }
}

export const DistanceComponent = Shade({
  customElementName: 'distance-component',
  render: ({ injector, useObservable, useHostProps }) => {
    const distanceService = injector.getInstance(DistanceService)
    const [distance] = useObservable('distance', distanceService.frontDistance)

    const colors = getDistanceColor(distance)
    useHostProps({
      style: { ...colors, transition: 'background-color .5s ease-in-out' },
    })

    return <>{getDistanceLabel(distance)}</>
  },
})
