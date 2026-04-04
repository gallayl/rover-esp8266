import { Shade, createComponent } from '@furystack/shades'
import { Loader } from '@furystack/shades-common-components'

export const FullScreenLoader = Shade({
  customElementName: 'full-screen-loader',
  render: () => {
    return <Loader />
  },
})
