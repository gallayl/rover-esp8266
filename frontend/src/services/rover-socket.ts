import { Injectable } from '@furystack/inject'

@Injectable()
export class RoverSocketService {
  private socket: WebSocket

  /**
   *
   */
  constructor() {
    this.socket = new WebSocket(`ws://192.168.0.220/`)
  }
}
