import { Injectable, Injected } from '@furystack/inject'
import { type ScopedLogger, getLogger } from '@furystack/logging'
import { ObservableValue, PathHelper } from '@furystack/utils'
import { EnvironmentService } from './environment-service'

export interface WebSocketEvent<T> {
  type: 'incoming' | 'outgoing' | 'connection'
  date: Date
  dataObject?: T
  data: string
}

@Injectable({ lifetime: 'singleton' })
export class WebSocketService {
  public isConnected = new ObservableValue<boolean>(false)

  public eventStream: WebSocketEvent<unknown>[] = []

  public lastMessage = new ObservableValue<Omit<WebSocketEvent<unknown>, 'date'> | null>(null)

  public send(data: string): void {
    if (this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(data)
      this.lastMessage.setValue({ type: 'outgoing', data })
    }
  }

  @Injected((injector) => getLogger(injector).withScope('WebSocketService'))
  private declare logger: ScopedLogger

  private socket!: WebSocket

  private onConnect = (() => {
    this.logger.verbose({
      message: 'Connected',
      data: { socket: this.socket },
    })
    this.isConnected.setValue(true)
  }).bind(this)

  private onDisconnect = (() => {
    this.logger.verbose({
      message: 'Disconnected',
      data: { socket: this.socket },
    })
    this.isConnected.setValue(false)
    this.disposeSocket(this.socket)
    this.socket = this.createSocket()
    this.lastMessage.setValue({ type: 'connection', data: 'Socket disconnected' })
  }).bind(this)

  private onOpen = (() => {
    this.logger.verbose({ message: 'Opened', data: { socket: this.socket } })
    this.lastMessage.setValue({ type: 'connection', data: 'Socket opened' })
    this.isConnected.setValue(true)
  }).bind(this)

  private onClose = (() => {
    this.logger.verbose({ message: 'Closed', data: { socket: this.socket } })
    this.lastMessage.setValue({ type: 'connection', data: 'Socket closed' })
    this.isConnected.setValue(false)
    this.socket = this.createSocket()
  }).bind(this)

  private onError = (() => {
    this.logger.warning({
      message: 'Socket Error',
      data: { socket: this.socket },
    })
    this.lastMessage.setValue({ type: 'connection', data: 'Socket Error' })
  }).bind(this)

  private onMessage = ((ev: MessageEvent) => {
    try {
      this.lastMessage.setValue({
        type: 'incoming',
        data: ev.data.toString(),
        dataObject: JSON.parse(ev.data.toString()),
      })
    } catch (error) {
      this.lastMessage.setValue({ type: 'incoming', data: ev.data.toString() })
    }
    this.logger.verbose({
      message: 'Message received',
      data: { socket: this.socket, data: ev.data },
    })
  }).bind(this)

  private createSocket() {
    const socket = new WebSocket(`ws://${PathHelper.joinPaths(this.env.site, 'ws')}`)
    socket.addEventListener('connect', this.onConnect)
    socket.addEventListener('disconnect', this.onDisconnect)
    socket.addEventListener('open', this.onOpen)
    socket.addEventListener('close', this.onClose)
    socket.addEventListener('error', this.onError)
    socket.addEventListener('message', this.onMessage)
    return socket
  }

  private disposeSocket(socket: WebSocket) {
    socket.removeEventListener('connect', this.onConnect)
    socket.removeEventListener('disconnect', this.onDisconnect)
    socket.removeEventListener('open', this.onOpen)
    socket.removeEventListener('close', this.onClose)
    socket.removeEventListener('error', this.onError)
    socket.removeEventListener('message', this.onMessage)
  }

  public dispose(): void {
    this.socket && this.disposeSocket(this.socket)
    this.lastMessage.dispose()
  }

  @Injected(EnvironmentService)
  private declare readonly env: EnvironmentService

  init() {
    this.lastMessage.subscribe((msg) => this.eventStream.push({ ...msg, date: new Date() } as WebSocketEvent<unknown>))
    this.socket = this.createSocket()
  }
}
