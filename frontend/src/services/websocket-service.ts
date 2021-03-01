import { Injectable, Injector } from '@furystack/inject'
import { ScopedLogger } from '@furystack/logging'
import { ObservableValue } from '@furystack/utils/dist/observable-value'
import { PathHelper } from "@furystack/utils/dist/path-helper"
import { EnvironmentService } from './environment-service'

export interface WebSocketEvent<T = unknown> {
  type: 'incoming' | 'outgoing' | 'connection'
  date: Date
  dataObject?: T
  data: string
}

@Injectable({ lifetime: 'singleton' })
export class WebSocketService {
  public isConnected = new ObservableValue<boolean>(false)

  public eventStream: WebSocketEvent[] = []

  public lastMessage = new ObservableValue<Omit<WebSocketEvent, 'date'>>()

  public send(data: string) {
    if (this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(data)
      this.lastMessage.setValue({ type: 'outgoing', data })
    }
  }

  private socket: WebSocket
  private logger: ScopedLogger

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
  }).bind(this)

  private onClose = (() => {
    this.logger.verbose({ message: 'Closed', data: { socket: this.socket } })
    this.lastMessage.setValue({ type: 'connection', data: 'Socket closed' })
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
      this.lastMessage.setValue({ type: 'incoming', data: ev.data.toString(), dataObject: JSON.parse(ev.data.toString()) })

    } catch (error) {
      this.lastMessage.setValue({ type: 'incoming', data: ev.data.toString() })
    }
    this.logger.verbose({
      message: 'Message received',
      data: { socket: this.socket, data: ev.data },
    })

  }).bind(this)

  private createSocket() {
    const socket = new WebSocket('ws://' + PathHelper.joinPaths(this.env.site, 'ws'))
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

  public dispose() {
    this.socket && this.disposeSocket(this.socket)
    this.lastMessage.dispose()
  }

  constructor(private env: EnvironmentService, injector: Injector) {
    this.logger = injector.logger.withScope('WebSocketService')
    this.socket = this.createSocket()
    this.lastMessage.subscribe(msg => this.eventStream.push({ ...msg, date: new Date }))
  }
}
