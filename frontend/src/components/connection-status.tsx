import { Shade, createComponent } from '@furystack/shades'
import { WebSocketService } from '../services/websocket-service'

export const ConnectionStatus = Shade({
  shadowDomName: 'connection-status',
  render: ({ injector, useObservable }) => {
    const [isConnected] = useObservable('isConnected', injector.getInstance(WebSocketService).isConnected)

    const [rssi] = useObservable('rssi', injector.getInstance(WebSocketService).rssi)

    const getRssiTitle = (rssi: number) => {
      if (rssi < -80) {
        return 'Bad'
      } else if (rssi < -70) {
        return 'Average'
      } else if (rssi < -60) {
        return 'Good'
      } else {
        return 'Excellent'
      }
    }

    const getRssiIcon = (rssi: number) => {
      if (rssi < -80) {
        return '🔴'
      } else if (rssi < -70) {
        return '🟠'
      } else if (rssi < -60) {
        return '🟡'
      } else {
        return '🟢'
      }
    }

    return (
      <div
        title={`Signal strength: ${getRssiTitle(rssi)} (${rssi} db)`}
        style={{ cursor: 'default', marginRight: '.5em' }}>
        {isConnected ? getRssiIcon(rssi) : '🚫'}
      </div>
    )
  },
})
