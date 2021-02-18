import { RoomEvent } from '@/events';
import { Games, GameState, RoomState } from '@/state';

export interface ConnectionObserver {
  removeConnection: (conn: Connection) => void;
  processEvent: (conn: Connection, event: RoomEvent) => void;
}

export interface Connection {
  readonly id: number;
  sendState: (state: RoomState) => void;
}

export interface GameObserver {
  setGame: (game: Game) => void;
}

export abstract class Game {
  protected readonly observer: GameObserver;

  constructor(observer: GameObserver) {
    this.observer = observer;
  }

  abstract getKind(): Games;
  abstract removeConnection(conn: Connection): void;
  abstract getStateForConnection(conn: Connection): GameState;
  // Returns whether to update state for all connections or just `conn`.
  abstract processEvent(conn: Connection, event: unknown): boolean;
}

export interface GameConfig {
  init: (observer: GameObserver) => Game;
}
