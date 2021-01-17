import WebSocket from 'ws';

import { ConnectionEvent, ConnectionEvents } from '@/events';
import { Connection, ConnectionObserver } from '@/game';
import { ConnectionDescription, Crime, GameState, RoleCard } from '@/state';
import { Maybe } from '@/types';

function validateCrime(crime: Crime) {
  let errors = '';
  if (!crime.role) {
    errors += 'Missing suspect. ';
  }
  if (!crime.tool) {
    errors += 'Missing tool. ';
  }
  if (!crime.place) {
    errors += 'Missing place. ';
  }

  const foundKeys = Object.keys(crime).length;
  if (foundKeys !== 3) {
    errors += `Found ${foundKeys}. Expected 3.`;
  }

  if (errors) {
    throw new Error(errors);
  }
}

export class WebSocketConnection implements Connection {
  private observer: ConnectionObserver;
  private ws: WebSocket;
  private role: Maybe<RoleCard> = null;

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
      } catch (e: unknown) {
        console.log(e instanceof Error ? e.message : e);
      }
    });

    ws.on('close', () => {
      console.log('closing websocket');
      this.observer.removeConnection(this);
    });
  }

  setRole(role: RoleCard): void {
    this.role = role;
  }

  clearRole(): void {
    this.role = null;
    this._isReady = false;
  }

  getRole(): Maybe<RoleCard> {
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
      case ConnectionEvents.SetNote:
        if (this.role) {
          this.observer.setNote(
            this.role,
            event.player,
            event.card,
            event.marks
          );
        }
        break;
      case ConnectionEvents.Accuse:
        if (!this.role) {
          break;
        }
        validateCrime(event.data);
        this.observer.accuse(this.role, event.data);
        break;
      default:
        console.log('Event not found in processEvent', event);
    }
    this.observer.updateState();
  }

  sendState(state: GameState): void {
    this.ws.send(JSON.stringify(state));
  }
}
