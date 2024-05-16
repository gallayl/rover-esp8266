import { Injectable, Injected } from '@furystack/inject'
import { ObservableValue } from '@furystack/utils'
import { WebSocketMessageTypes, WebSocketService } from './websocket-service'

@Injectable({ lifetime: 'singleton' })
export class DistanceService {
  public dispose() {
    this.frontDistance.dispose()
  }

  public readonly frontDistance = new ObservableValue(0)

  @Injected(WebSocketService)
  private declare readonly webSocket: WebSocketService

  private readonly isDistanceChange = (
    obj: unknown,
  ): obj is { type: WebSocketMessageTypes.DistanceChange; cm: number } => {
    return (obj as any)?.type === WebSocketMessageTypes.DistanceChange && !isNaN((obj as any).cm)
  }

  public init() {
    this.webSocket.lastMessage.subscribe((message) => {
      const obj = message?.dataObject

      if (this.isDistanceChange(obj)) {
        this.frontDistance.setValue(obj.cm)
      }
    })
  }
}
