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
  private static readonly MAX_EVENT_STREAM_SIZE = 500
  private static readonly INITIAL_RECONNECT_DELAY = 1000
  private static readonly MAX_RECONNECT_DELAY = 30000

  public isConnected = new ObservableValue<boolean>(false)

  public eventStream: Array<WebSocketEvent<unknown>> = []
  public eventStreamVersion = new ObservableValue(0)

  public lastMessage = new ObservableValue<Omit<WebSocketEvent<unknown>, 'date'> | null>(null)

  public rssi = new ObservableValue<number>(0)

  private reconnectDelay = WebSocketService.INITIAL_RECONNECT_DELAY
  private reconnectTimeoutId: ReturnType<typeof setTimeout> | null = null

  private isRssiChange = (obj: unknown): obj is { type: WebSocketMessageTypes.WifiSignalChange; rssi: number } => {
    const record = obj as Record<string, unknown> | null | undefined
    return record?.type === WebSocketMessageTypes.WifiSignalChange && typeof record.rssi === 'number'
  }

  public send(data: string): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(data)
      this.lastMessage.setValue({ type: 'outgoing', data })
    }
  }

  @Injected((injector) => getLogger(injector).withScope('WebSocketService'))
  declare private logger: ScopedLogger

  private socket!: WebSocket

  private onOpen = (() => {
    void this.logger.verbose({ message: 'Opened', data: { socket: this.socket } })
    this.lastMessage.setValue({ type: 'connection', data: 'Socket opened' })
    this.isConnected.setValue(true)
    this.reconnectDelay = WebSocketService.INITIAL_RECONNECT_DELAY
  }).bind(this)

  private onClose = (() => {
    void this.logger.verbose({ message: 'Closed', data: { socket: this.socket } })
    this.lastMessage.setValue({ type: 'connection', data: 'Socket closed' })
    this.isConnected.setValue(false)
    this.disposeSocket(this.socket)
    this.scheduleReconnect()
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

  private scheduleReconnect() {
    if (this.reconnectTimeoutId !== null) return
    this.reconnectTimeoutId = setTimeout(() => {
      this.reconnectTimeoutId = null
      this.socket = this.createSocket()
    }, this.reconnectDelay)
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, WebSocketService.MAX_RECONNECT_DELAY)
  }

  private createSocket() {
    const socket = new WebSocket(`ws://${PathHelper.joinPaths(this.env.site, 'ws')}`)
    socket.addEventListener('open', this.onOpen)
    socket.addEventListener('close', this.onClose)
    socket.addEventListener('error', this.onError)
    socket.addEventListener('message', this.onMessage)
    return socket
  }

  private disposeSocket(socket: WebSocket) {
    socket.removeEventListener('open', this.onOpen)
    socket.removeEventListener('close', this.onClose)
    socket.removeEventListener('error', this.onError)
    socket.removeEventListener('message', this.onMessage)
  }

  public [Symbol.dispose](): void {
    if (this.reconnectTimeoutId !== null) {
      clearTimeout(this.reconnectTimeoutId)
    }
    if (this.socket) {
      this.disposeSocket(this.socket)
    }
    this.lastMessage[Symbol.dispose]()
    this.isConnected[Symbol.dispose]()
    this.rssi[Symbol.dispose]()
    this.eventStreamVersion[Symbol.dispose]()
  }

  @Injected(EnvironmentService)
  declare private readonly env: EnvironmentService

  public init() {
    this.lastMessage.subscribe((msg) => {
      if (!msg) return
      this.eventStream.push({ ...msg, date: new Date() } as WebSocketEvent<unknown>)
      if (this.eventStream.length > WebSocketService.MAX_EVENT_STREAM_SIZE) {
        this.eventStream.splice(0, this.eventStream.length - WebSocketService.MAX_EVENT_STREAM_SIZE)
      }
      this.eventStreamVersion.setValue(this.eventStreamVersion.getValue() + 1)
    })
    this.socket = this.createSocket()
  }
}
