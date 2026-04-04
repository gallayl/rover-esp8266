import { Injectable, Injected } from '@furystack/inject'
import { ObservableValue } from '@furystack/utils'
import { WebSocketMessageTypes, WebSocketService } from './websocket-service'
import { ClientSettings } from './client-settings'

@Injectable({ lifetime: 'singleton' })
export class MovementService {
  private static readonly MOVE_THROTTLE_MS = 50
  private static readonly MAX_SPEED_DECAY = 0.995

  public stop(): void {
    this.webSocket.send('move 0 0')
    this.desiredLeftSpeed.setValue(0)
    this.desiredRightSpeed.setValue(0)
  }

  private initSubscriptions: Array<{ [Symbol.dispose](): void }> = []

  public [Symbol.dispose]() {
    for (const sub of this.initSubscriptions) {
      sub[Symbol.dispose]()
    }
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
  private lastMoveTime = 0

  private moveChangeSubscription = this.lastMoveCommand.subscribe((cmd) => {
    this.webSocket.send(cmd)
  })

  public async move(leftSpeed: number, rightSpeed: number): Promise<void> {
    const now = Date.now()
    if (now - this.lastMoveTime < MovementService.MOVE_THROTTLE_MS) return
    this.lastMoveTime = now

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
  declare private readonly webSocket: WebSocketService

  @Injected(ClientSettings)
  declare private readonly settings: ClientSettings

  public init() {
    this.initSubscriptions.push(
      this.webSocket.lastMessage.subscribe((message) => {
        const obj = message?.dataObject
        if (this.isMotorTicksChange(obj)) {
          if (obj.i === 0) {
            this.leftSpeed.setValue(obj.t)
          } else if (obj.i === 1) {
            this.rightSpeed.setValue(obj.t)
          }
        }
      }),
    )

    this.initSubscriptions.push(
      this.leftSpeed.subscribe((speed) => {
        const currentMax = this.leftMaxSpeed.getValue()
        this.leftMaxSpeed.setValue(Math.max(speed, currentMax * MovementService.MAX_SPEED_DECAY))
      }),
    )
    this.initSubscriptions.push(
      this.rightSpeed.subscribe((speed) => {
        const currentMax = this.rightMaxSpeed.getValue()
        this.rightMaxSpeed.setValue(Math.max(speed, currentMax * MovementService.MAX_SPEED_DECAY))
      }),
    )
  }
}
