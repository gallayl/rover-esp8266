export class WebSocketService {
  createSocket() {
    this.socket = new WebSocket(
      `ws://${this.options.host}:${this.options.port}/ws`
    );
    this.socket.onopen = () => {
      this.options.onOpen && this.options.onOpen();
      console.log("WebSocket connected");
    };

    this.socket.onclose = () => {
      this.options.onClose && this.options.onClose();
      console.log("WebSocket disconnected. Reconnecting...");
      try {
        this.createSocket();
      } catch (e) {
        console.warn("Cannot reconnect", e);
      }
    };

    this.socket.onmessage = evt => {
      this.options.onMessage && this.options.onMessage(evt);
      console.log("Message received:", evt.data);
    };
  }

  constructor(
    /** @type {{ host: string, port: number, onOpen: ()=>void, onClose: ()=>void, onMessage: (evt: MessageEvent) => void}} */
    options
  ) {
    this.options = options;
    this.createSocket();
  }

  /**
   *
   * @param {string} message
   */
  send(message) {
    if (this.socket && this.socket.readyState === 1)
      return this.socket.send(message);
  }
}
