import WebSocket from 'ws';

import { Connection, ConnectionObserver } from '@/game';
import { ConnectionDescription, GameState, RoleCard } from '@/state';
import { Maybe } from '@/types';

export class WebSocketConnection implements Connection {
  private observer: ConnectionObserver;
  private ws: WebSocket;

  // mutable, only used during setup
  name = '';
  role: Maybe<RoleCard> = null;
  isReady = false;

  constructor(observer: ConnectionObserver, ws: WebSocket) {
    this.observer = observer;
    this.ws = ws;

    console.log('websocket connected');

    ws.on('message', (message: string) => {
      try {
        const event = JSON.parse(message);
        this.observer.processEvent(this, event);
      } catch (e: unknown) {
        console.log(e instanceof Error ? e.message : e);
      }
    });

    ws.on('close', () => {
      console.log('closing websocket');
      this.observer.removeConnection(this);
    });
  }

  getDescription(): ConnectionDescription {
    return {
      role: this.role,
      name: this.name,
      isReady: this.isReady,
    };
  }

  sendState(state: GameState): void {
    this.ws.send(JSON.stringify(state));
  }
}
