import { Injectable, Injected } from '@furystack/inject'
import { ObservableValue } from '@furystack/utils'
import { WebSocketService } from './websocket-service'
import { ClientSettings } from './client-settings'

@Injectable({ lifetime: 'singleton' })
export class MovementService {
  public stop(): void {
    this.webSocket.send('move 0 0')
  }

  public readonly leftSpeed = new ObservableValue(0)
  public readonly rightSpeed = new ObservableValue(0)
  public readonly frontDistance = new ObservableValue(0)

  public async move(leftSpeed: number, rightSpeed: number): Promise<void> {
    this.settings.currentSettings.getValue().control.type === 'PID'
      ? this.webSocket.send(`moveTicks ${Math.round(leftSpeed)} ${Math.round(rightSpeed)}`)
      : this.webSocket.send(
          `move ${Math.round(leftSpeed * this.settings.currentSettings.getValue().sensitivity.throttle)} ${Math.round(
            rightSpeed * this.settings.currentSettings.getValue().sensitivity.throttle,
          )}`,
        )
  }

  private readonly isMotorTicksChange = (
    obj: unknown,
  ): obj is { type: 'motorTicksChange'; index: number; ticks: number } => {
    return (obj as any)?.type === 'motorTicksChange' && !isNaN((obj as any).index) && !isNaN((obj as any).ticks)
  }

  private readonly isDistanceChange = (obj: unknown): obj is { type: 'distance'; distanceCm: number } => {
    return (obj as any)?.type === 'distance' && !isNaN((obj as any).distanceCm)
  }

  @Injected(WebSocketService)
  private declare readonly webSocket: WebSocketService

  @Injected(ClientSettings)
  private declare readonly settings: ClientSettings

  init() {
    this.webSocket.lastMessage.subscribe((message) => {
      const obj = message?.dataObject
      if (this.isMotorTicksChange(obj)) {
        if (obj.index === 0) {
          this.leftSpeed.setValue(parseInt(obj.ticks as any, 10))
        } else if (obj.index === 1) {
          this.rightSpeed.setValue(parseInt(obj.ticks as any, 10))
        }
      }
      if (this.isDistanceChange(obj)) {
        this.frontDistance.setValue(obj.distanceCm)
      }
    })
  }
}
