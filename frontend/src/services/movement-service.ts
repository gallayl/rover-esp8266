import { Injectable, Injector } from '@furystack/inject'
import { ScopedLogger } from '@furystack/logging'
import { WebSocketService } from './websocket-service'
import { ClientSettings } from './client-settings'

@Injectable({ lifetime: 'singleton' })
export class MovementService {
  private logger: ScopedLogger

  stop() {
    this.logger.verbose({ message: 'Stopped' })
    this.webSocket.send('move 0 0')
  }

  async move(throttle: number, steer: number) {
    this.logger.verbose({ message: 'Movement change', data: { throttle, steer } })
    this.webSocket.send(`move ${Math.round(throttle)} ${Math.round(steer)}`)
  }

  constructor(private readonly webSocket: WebSocketService, _settings: ClientSettings, injector: Injector) {
    this.logger = injector.logger.withScope('MovementService')
  }
}
