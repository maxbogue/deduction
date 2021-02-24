import deductionConfig from '@/deduction/game';
import deductionSyncConfig from '@/deductionSync/game';
import { RoomEvent, RoomEvents } from '@/events';
import {
  Connection,
  ConnectionObserver,
  Game,
  GameConfig,
  GameObserver,
} from '@/server/game';
import { Games } from '@/state';
import { Dict } from '@/types';

const GAMES: Dict<GameConfig> = {
  [Games.Deduction]: deductionConfig,
  [Games.DeductionSync]: deductionSyncConfig,
};

export class Room implements ConnectionObserver, GameObserver {
  private readonly connections: Connection[] = [];
  private game: Game;

  constructor() {
    this.game = deductionSyncConfig.init(this);
  }

  private initGame(): Game {
    return GAMES[this.game.getKind()].init(this);
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

  processEvent(conn: Connection, event: RoomEvent): void {
    let updateAll = true;
    switch (event.kind) {
      case RoomEvents.SetGame:
        break;
      case RoomEvents.Restart:
        this.game = this.initGame();
        break;
      default:
        updateAll = this.game.processEvent(conn, event.event);
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

  private updateStateForConnection(conn: Connection): void {
    conn.sendState({
      numConnections: this.connections.length,
      game: this.game.getStateForConnection(conn),
    });
  }

  private updateState(): void {
    this.connections.forEach(conn => {
      this.updateStateForConnection(conn);
    });
  }
}
