import WebSocket from 'ws';

import { Dict, Maybe } from './types';
import { Connection, ConnectionObserver, ConnectionDescription, State } from './game';

enum ConnectionEvents {
  SetRole = 'SetRole',
  SetName = 'SetName',
  SetReady = 'SetReady',
  SetSkin = 'SetSkin',
  Start = 'Start',
}

interface SetRoleEvent {
  type: ConnectionEvents.SetRole;
  data: string;
}

interface SetNameEvent {
  type: ConnectionEvents.SetName;
  data: string;
}

interface SetReadyEvent {
  type: ConnectionEvents.SetReady;
  data: boolean;
}

interface SetSkinEvent {
  type: ConnectionEvents.SetSkin;
  data: string;
}

interface StartEvent {
  type: ConnectionEvents.Start;
}

type ConnectionEvent = SetRoleEvent | SetNameEvent | SetReadyEvent | StartEvent | SetSkinEvent;

export class WebSocketConnection implements Connection {
  private observer: ConnectionObserver;
  private ws: WebSocket;
  private role = '';

  // mutable, only used during setup
  private name = '';
  private _isReady = false;

  constructor(observer: ConnectionObserver, ws: WebSocket) {
    this.observer = observer;
    this.ws = ws;

    console.log('websocket connected');

    ws.on('message', (message: string) => {
      const event = JSON.parse(message);
      this.processEvent(event);
    });

    ws.on('close', () => {
      console.log('closing websocket');
      this.observer.removeConnection(this);
    });
  }

  setRole(role: string): void {
    this.role = role;
  }

  clearRole(): void {
    this.setRole('');
    this._isReady = false;
  }

  getRole(): string {
    return this.role;
  }

  isReady(): boolean {
    return this._isReady;
  }

  getDescription(): ConnectionDescription {
    return {
      role: this.role,
      name: this.name,
      isReady: this._isReady,
    };
  }

  processEvent(event: ConnectionEvent): void {
    console.log(event);
    switch (event.type) {
      case ConnectionEvents.SetRole:
        this.observer.setConnectionRole(this, event.data);
        break;
      case ConnectionEvents.SetName:
        this.name = event.data;
        break;
      case ConnectionEvents.SetReady:
        this._isReady = event.data;
        break;
      case ConnectionEvents.SetSkin:
        this.observer.setSkin(event.data)
        break
      case ConnectionEvents.Start:
        this.observer.start();
        break;
    }
    this.observer.updateState();
  }

  sendState(state: State): void {
    this.ws.send(JSON.stringify(state));
  }
}
