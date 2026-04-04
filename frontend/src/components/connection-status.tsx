import { Shade, createComponent } from '@furystack/shades'
import { WebSocketService } from '../services/websocket-service'

export const ConnectionStatus = Shade({
  customElementName: 'connection-status',
  render: ({ injector, useObservable }) => {
    const [isConnected] = useObservable('isConnected', injector.getInstance(WebSocketService).isConnected)

    const [rssi] = useObservable('rssi', injector.getInstance(WebSocketService).rssi)

    const getRssiTitle = (value: number) => {
      if (value < -80) {
        return 'Bad'
      } else if (value < -70) {
        return 'Average'
      } else if (value < -60) {
        return 'Good'
      } else {
        return 'Excellent'
      }
    }

    const getRssiIcon = (value: number) => {
      if (value < -80) {
        return '🔴'
      } else if (value < -70) {
        return '🟠'
      } else if (value < -60) {
        return '🟡'
      } else {
        return '🟢'
      }
    }

    return (
      <div
        title={`Signal strength: ${getRssiTitle(rssi)} (${rssi} db)`}
        style={{ cursor: 'default', marginRight: '.5em' }}
      >
        {isConnected ? getRssiIcon(rssi) : '🚫'}
      </div>
    )
  },
})
