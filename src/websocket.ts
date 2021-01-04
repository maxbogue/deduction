import WebSocket from 'ws';

import { ConnectionEvent, ConnectionEvents } from './events';
import { Connection, ConnectionObserver } from './game';
import { ConnectionDescription, State, Crime } from './state';
import { Dict, Maybe } from './types';

function validateCrime(dict: Crime) {
  let crime = null
  let errors = ''
  if (!dict.role) {
    errors += 'Missing suspect. '
  }
  if (!dict.object) {
    errors += 'Missing object. ' 
  }
  if (!dict.place) {
    errors += 'Missing place. '
  }

  const foundKeys = Object.keys(dict).length
  if (foundKeys !== 3) {
    errors += `Found ${foundKeys}. Expected 3.`
  }

  if (errors) {
    throw new Error(errors)
  }
}


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
      try {
        const event = JSON.parse(message);
        this.processEvent(event);
      } catch (e){
        console.log(e.message)
      }
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
        this.observer.setSkin(event.data);
        break;
      case ConnectionEvents.Start:
        this.observer.start();
        break;
      case ConnectionEvents.Accuse:
        validateCrime(event.data);
        this.observer.accuse(event.data);
        break;
      default:
        console.log('Event not found in processEvent', event)
    }
    this.observer.updateState();
  }

  sendState(state: State): void {
    this.ws.send(JSON.stringify(state));
  }
}
