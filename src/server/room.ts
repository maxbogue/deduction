import { ConnectionEvent, ConnectionEvents } from '@/deduction/events';
import deduction from '@/deduction/game';
import {
  Connection,
  ConnectionObserver,
  Game,
  GameConfig,
  GameObserver,
} from '@/server/game';
import { Dict } from '@/types';

const GAMES: Dict<GameConfig> = {
  deduction,
};

export class Room implements ConnectionObserver, GameObserver {
  private readonly connections: Connection[] = [];
  private game: Game;
  private gameName = 'deduction';

  constructor() {
    this.game = this.initGame();
  }

  private initGame(): Game {
    return GAMES[this.gameName].init(this);
  }

  addConnection(conn: Connection): void {
    this.connections.push(conn);
    this.updateStateForConnection(conn);
  }

  removeConnection(conn: Connection): void {
    const i = this.connections.indexOf(conn);
    this.connections.splice(i, 1);
    this.game.removeConnection(conn);
    this.updateState();
  }

  processEvent(conn: Connection, event: ConnectionEvent): void {
    let updateAll = true;
    switch (event.type) {
      case ConnectionEvents.Restart:
        this.game = this.initGame();
        break;
      default:
        updateAll = this.game.processEvent(conn, event);
    }
    if (updateAll) {
      this.updateState();
    } else {
      this.updateStateForConnection(conn);
    }
  }

  setGame(game: Game): void {
    this.game = game;
  }

  updateStateForConnection(conn: Connection): void {
    conn.sendState(this.game.getStateForConnection(conn));
  }

  updateState(): void {
    this.connections.forEach(conn => {
      conn.sendState(this.game.getStateForConnection(conn));
    });
  }
}
