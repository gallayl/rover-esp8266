import { Injectable, Injected } from '@furystack/inject'
import { ObservableValue } from '@furystack/utils'
import { WebSocketMessageTypes, WebSocketService } from './websocket-service'
import { ClientSettings } from './client-settings'

@Injectable({ lifetime: 'singleton' })
export class MovementService {
  public stop(): void {
    this.webSocket.send('move 0 0')
    this.desiredLeftSpeed.setValue(0)
    this.desiredRightSpeed.setValue(0)
  }

  public [Symbol.dispose]() {
    this.moveChangeSubscription[Symbol.dispose]()
    this.lastMoveCommand[Symbol.dispose]()
    this.leftSpeed[Symbol.dispose]()
    this.rightSpeed[Symbol.dispose]()
    this.leftMaxSpeed[Symbol.dispose]()
    this.desiredLeftSpeed[Symbol.dispose]()
    this.rightMaxSpeed[Symbol.dispose]()
    this.desiredRightSpeed[Symbol.dispose]()
  }

  public readonly leftSpeed = new ObservableValue(0)
  public readonly leftMaxSpeed = new ObservableValue(0)
  public readonly desiredLeftSpeed = new ObservableValue(0)

  public readonly rightSpeed = new ObservableValue(0)
  public readonly rightMaxSpeed = new ObservableValue(0)
  public readonly desiredRightSpeed = new ObservableValue(0)

  private lastMoveCommand = new ObservableValue('')

  private moveChangeSubscription = this.lastMoveCommand.subscribe((cmd) => {
    this.webSocket.send(cmd)
  })

  public async move(leftSpeed: number, rightSpeed: number): Promise<void> {
    const settings = this.settings.currentSettings.getValue()
    if (settings.control.type === 'PID') {
      this.desiredLeftSpeed.setValue(leftSpeed)
      this.desiredRightSpeed.setValue(rightSpeed)
      this.lastMoveCommand.setValue(`moveTicks ${Math.round(leftSpeed)} ${Math.round(rightSpeed)}`)
      return
    }
    this.desiredLeftSpeed.setValue(0)
    this.desiredRightSpeed.setValue(0)
    const sensitivity = settings.control.throttleSensitivity
    const roundFactor = sensitivity / 4
    const leftThrottle = Math.round((leftSpeed * sensitivity) / roundFactor) * roundFactor
    const rightThrottle = Math.round((rightSpeed * sensitivity) / roundFactor) * roundFactor
    const cmd = `move ${leftThrottle} ${rightThrottle}`
    this.desiredLeftSpeed.setValue((leftThrottle / 1024) * this.leftMaxSpeed.getValue())
    this.desiredRightSpeed.setValue((rightThrottle / 1024) * this.rightMaxSpeed.getValue())
    this.lastMoveCommand.setValue(cmd)
  }

  private readonly isMotorTicksChange = (
    obj: unknown,
  ): obj is { type: WebSocketMessageTypes.MotorTicksChange; i: number; t: number } => {
    const record = obj as Record<string, unknown> | null | undefined
    return (
      record?.type === WebSocketMessageTypes.MotorTicksChange &&
      typeof record.i === 'number' &&
      typeof record.t === 'number'
    )
  }

  @Injected(WebSocketService)
  private declare readonly webSocket: WebSocketService

  @Injected(ClientSettings)
  private declare readonly settings: ClientSettings

  public init() {
    this.webSocket.lastMessage.subscribe((message) => {
      const obj = message?.dataObject
      if (this.isMotorTicksChange(obj)) {
        if (obj.i === 0) {
          this.leftSpeed.setValue(obj.t)
        } else if (obj.i === 1) {
          this.rightSpeed.setValue(obj.t)
        }
      }
    })

    this.leftSpeed.subscribe((speed) => {
      if (speed > this.leftMaxSpeed.getValue()) {
        this.leftMaxSpeed.setValue(speed)
      }
    })
    this.rightSpeed.subscribe((speed) => {
      if (speed > this.rightMaxSpeed.getValue()) {
        this.rightMaxSpeed.setValue(speed)
      }
    })
  }
}
