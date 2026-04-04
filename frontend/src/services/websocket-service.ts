import { Injectable, Injected } from '@furystack/inject'
import { type ScopedLogger, getLogger } from '@furystack/logging'
import { ObservableValue, PathHelper } from '@furystack/utils'
import { EnvironmentService } from './environment-service'

/**
 * Keep in sync with the server
 */
export enum WebSocketMessageTypes {
  Unknown = 0,
  MotorTicksChange = 1,
  DistanceChange = 2,
  WifiSignalChange = 3,
}

export interface WebSocketEvent<T> {
  type: 'incoming' | 'outgoing' | 'connection'
  date: Date
  dataObject?: T
  data: string
}

@Injectable({ lifetime: 'singleton' })
export class WebSocketService {
  public isConnected = new ObservableValue<boolean>(false)

  public eventStream: Array<WebSocketEvent<unknown>> = []

  public lastMessage = new ObservableValue<Omit<WebSocketEvent<unknown>, 'date'> | null>(null)

  public rssi = new ObservableValue<number>(0)

  private isRssiChange = (obj: unknown): obj is { type: WebSocketMessageTypes.WifiSignalChange; rssi: number } => {
    const record = obj as Record<string, unknown> | null | undefined
    return record?.type === WebSocketMessageTypes.WifiSignalChange && typeof record.rssi === 'number'
  }

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
    void this.logger.verbose({
      message: 'Connected',
      data: { socket: this.socket },
    })
    this.isConnected.setValue(true)
  }).bind(this)

  private onDisconnect = (() => {
    void this.logger.verbose({
      message: 'Disconnected',
      data: { socket: this.socket },
    })
    this.isConnected.setValue(false)
    this.disposeSocket(this.socket)
    this.socket = this.createSocket()
    this.lastMessage.setValue({ type: 'connection', data: 'Socket disconnected' })
  }).bind(this)

  private onOpen = (() => {
    void this.logger.verbose({ message: 'Opened', data: { socket: this.socket } })
    this.lastMessage.setValue({ type: 'connection', data: 'Socket opened' })
    this.isConnected.setValue(true)
  }).bind(this)

  private onClose = (() => {
    void this.logger.verbose({ message: 'Closed', data: { socket: this.socket } })
    this.lastMessage.setValue({ type: 'connection', data: 'Socket closed' })
    this.isConnected.setValue(false)
    this.socket = this.createSocket()
  }).bind(this)

  private onError = (() => {
    void this.logger.warning({
      message: 'Socket Error',
      data: { socket: this.socket },
    })
    this.lastMessage.setValue({ type: 'connection', data: 'Socket Error' })
  }).bind(this)

  private onMessage = ((ev: MessageEvent<string>) => {
    const rawData = String(ev.data)
    try {
      const dataObject: unknown = JSON.parse(rawData)
      this.lastMessage.setValue({
        type: 'incoming',
        data: rawData,
        dataObject,
      })
      if (this.isRssiChange(dataObject)) {
        this.rssi.setValue(dataObject.rssi)
      }
    } catch {
      this.lastMessage.setValue({ type: 'incoming', data: rawData })
    }
    void this.logger.verbose({
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

  public [Symbol.dispose](): void {
    if (this.socket) {
      this.disposeSocket(this.socket)
    }
    this.lastMessage[Symbol.dispose]()
    this.isConnected[Symbol.dispose]()
    this.rssi[Symbol.dispose]()
  }

  @Injected(EnvironmentService)
  private declare readonly env: EnvironmentService

  public init() {
    this.lastMessage.subscribe((msg) => {
      this.eventStream.push({ ...msg, date: new Date() } as WebSocketEvent<unknown>)
    })
    this.socket = this.createSocket()
  }
}
