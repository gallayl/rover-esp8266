import { Injectable, Injected } from '@furystack/inject'
import { ObservableValue } from '@furystack/utils'
import { WebSocketMessageTypes, WebSocketService } from './websocket-service'

@Injectable({ lifetime: 'singleton' })
export class DistanceService {
  private messageSubscription?: { [Symbol.dispose](): void }

  public [Symbol.dispose]() {
    this.messageSubscription?.[Symbol.dispose]()
    this.frontDistance[Symbol.dispose]()
  }

  public readonly frontDistance = new ObservableValue(0)

  @Injected(WebSocketService)
  declare private readonly webSocket: WebSocketService

  private readonly isDistanceChange = (
    obj: unknown,
  ): obj is { type: WebSocketMessageTypes.DistanceChange; cm: number } => {
    const record = obj as Record<string, unknown> | null | undefined
    return record?.type === WebSocketMessageTypes.DistanceChange && typeof record.cm === 'number'
  }

  public init() {
    this.messageSubscription = this.webSocket.lastMessage.subscribe((message) => {
      const obj = message?.dataObject

      if (this.isDistanceChange(obj)) {
        this.frontDistance.setValue(obj.cm)
      }
    })
  }
}
