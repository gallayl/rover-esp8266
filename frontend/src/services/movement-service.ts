import { Injectable, Injected } from '@furystack/inject'
import { ObservableValue } from '@furystack/utils'
import { WebSocketMessageTypes, WebSocketService } from './websocket-service'
import { ClientSettings } from './client-settings'

@Injectable({ lifetime: 'singleton' })
export class MovementService {
  public stop(): void {
    this.webSocket.send('move 0 0')
  }

  public dispose() {
    this.moveChangeSubscription.dispose()
    this.lastMoveCommand.dispose()
    this.leftSpeed.dispose()
    this.rightSpeed.dispose()
  }

  public readonly leftSpeed = new ObservableValue(0)
  public readonly rightSpeed = new ObservableValue(0)

  private lastMoveCommand = new ObservableValue('')

  private moveChangeSubscription = this.lastMoveCommand.subscribe((cmd) => {
    this.webSocket.send(cmd)
  })

  public async move(leftSpeed: number, rightSpeed: number): Promise<void> {
    console.log('move', { leftSpeed, rightSpeed })
    const settings = this.settings.currentSettings.getValue()
    if (settings.control.type === 'PID') {
      this.lastMoveCommand.setValue(`moveTicks ${Math.round(leftSpeed)} ${Math.round(rightSpeed)}`)
      return
    }
    const sensitivity = settings.control.throttleSensitivity
    const roundFactor = sensitivity / 8
    const cmd = `move ${Math.round((leftSpeed * sensitivity) / roundFactor) * roundFactor} ${
      Math.round((rightSpeed * sensitivity) / roundFactor) * roundFactor
    }`
    this.lastMoveCommand.setValue(cmd)
  }

  private readonly isMotorTicksChange = (
    obj: unknown,
  ): obj is { type: WebSocketMessageTypes.MotorTicksChange; i: number; t: number } => {
    return (
      (obj as any)?.type === WebSocketMessageTypes.MotorTicksChange && !isNaN((obj as any).i) && !isNaN((obj as any).t)
    )
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
    })
  }
}
