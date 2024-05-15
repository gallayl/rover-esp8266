import { Shade, createComponent } from '@furystack/shades'
import { Paper } from '@furystack/shades-common-components'

export const ControlTab = Shade({
  shadowDomName: 'control-tab',
  render: () => {
    return <Paper style={{ paddingTop: '4em', margin: '0' }}>Control</Paper>
  },
})
