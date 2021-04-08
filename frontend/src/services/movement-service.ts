import { Injectable, Injector } from '@furystack/inject'
import { ScopedLogger } from '@furystack/logging'
import { WebSocketService } from './websocket-service'
import { ClientSettings } from './client-settings'

@Injectable({ lifetime: 'singleton' })
export class MovementService {
  private logger: ScopedLogger

  public stop(): void {
    this.logger.verbose({ message: 'Stopped' })
    this.webSocket.send('move 0 0')
  }

  public async move(leftSpeed: number, rightSpeed: number): Promise<void> {
    this.logger.verbose({ message: 'Movement change', data: { leftSpeed, rightSpeed } })
    this.webSocket.send(`moveTicks ${Math.round(leftSpeed)} ${Math.round(rightSpeed)}`)
  }

  constructor(private readonly webSocket: WebSocketService, _settings: ClientSettings, injector: Injector) {
    this.logger = injector.logger.withScope('MovementService')
  }
}
