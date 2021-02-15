import { ConnectionEvent } from '@/events';
import { GameState } from '@/state';

export interface ConnectionObserver {
  removeConnection: (conn: Connection) => void;
  processEvent: (conn: Connection, event: ConnectionEvent) => void;
}

export interface Connection {
  readonly id: number;
  sendState: (gameState: GameState) => void;
}

export interface GameObserver {
  setGame: (game: Game) => void;
}

export abstract class Game {
  protected readonly observer: GameObserver;

  constructor(observer: GameObserver) {
    this.observer = observer;
  }

  abstract removeConnection(conn: Connection): void;
  abstract getStateForConnection(conn: Connection): GameState;
  // Returns whether to update state for all connections or just `conn`.
  abstract processEvent(conn: Connection, event: ConnectionEvent): boolean;
}

export interface GameConfig {
  init: (observer: GameObserver) => Game;
}
