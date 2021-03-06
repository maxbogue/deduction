import WebSocket from 'ws';

import { Connection, ConnectionObserver } from '@/server/game';
import { RoomState } from '@/state';

let nextId = 1;

export class WebSocketConnection implements Connection {
  private observer: ConnectionObserver;
  private ws: WebSocket;
  readonly id = nextId++;

  constructor(observer: ConnectionObserver, ws: WebSocket) {
    this.observer = observer;
    this.ws = ws;

    ws.on('message', (message: string) => {
      try {
        const event = JSON.parse(message);
        this.observer.processEvent(this, event);
      } catch (e: unknown) {
        console.error(e instanceof Error ? e.message : e);
      }
    });

    ws.on('close', () => {
      this.observer.removeConnection(this);
    });
  }

  sendState(state: RoomState): void {
    try {
      this.ws.send(JSON.stringify(state));
    } catch (e: unknown) {
      console.error(e instanceof Error ? e.message : e);
    }
  }
}
