import { Injectable, Injected } from '@furystack/inject'
import { ObservableValue } from '@furystack/utils'
import { WebSocketMessageTypes, WebSocketService } from './websocket-service'
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
    const settings = this.settings.currentSettings.getValue()

    settings.control.type === 'PID'
      ? this.webSocket.send(`moveTicks ${Math.round(leftSpeed)} ${Math.round(rightSpeed)}`)
      : this.webSocket.send(
          `move ${Math.round(leftSpeed * settings.control.throttleSensitivity)} ${Math.round(
            rightSpeed * settings.control.throttleSensitivity,
          )}`,
        )
  }

  private readonly isMotorTicksChange = (
    obj: unknown,
  ): obj is { type: WebSocketMessageTypes.MotorTicksChange; i: number; t: number } => {
    return (
      (obj as any)?.type === WebSocketMessageTypes.MotorTicksChange && !isNaN((obj as any).i) && !isNaN((obj as any).t)
    )
  }

  private readonly isDistanceChange = (
    obj: unknown,
  ): obj is { type: WebSocketMessageTypes.DistanceChange; cm: number } => {
    return (obj as any)?.type === WebSocketMessageTypes.DistanceChange && !isNaN((obj as any).cm)
  }

  @Injected(WebSocketService)
  private declare readonly webSocket: WebSocketService

  @Injected(ClientSettings)
  private declare readonly settings: ClientSettings

  init() {
    this.webSocket.lastMessage.subscribe((message) => {
      const obj = message?.dataObject
      if (this.isMotorTicksChange(obj)) {
        if (obj.i === 0) {
          this.leftSpeed.setValue(parseInt(obj.t as any, 10))
        } else if (obj.i === 1) {
          this.rightSpeed.setValue(parseInt(obj.t as any, 10))
        }
      }
      if (this.isDistanceChange(obj)) {
        this.frontDistance.setValue(obj.cm)
      }
    })
  }
}
