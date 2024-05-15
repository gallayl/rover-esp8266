import { Shade, createComponent } from '@furystack/shades'
import { WebSocketService } from '../services/websocket-service'

export const ConnectionStatus = Shade({
  shadowDomName: 'connection-status',
  render: ({ injector, useObservable }) => {
    const [isConnected] = useObservable('isConnected', injector.getInstance(WebSocketService).isConnected)
    return <div style={{ cursor: 'default', marginRight: '.5em' }}>{isConnected ? '🟢' : '🔴'}</div>
  },
})
