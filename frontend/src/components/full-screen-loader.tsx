import { Shade, createComponent } from '@furystack/shades'
import { Loader } from '@furystack/shades-common-components'

export const FullScreenLoader = Shade({
  shadowDomName: 'full-screen-loader',
  render: () => {
    return <Loader />
  },
})
