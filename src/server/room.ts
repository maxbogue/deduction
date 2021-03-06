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
import { Dict, Maybe } from '@/types';

const GAMES: Dict<GameConfig> = {
  [Games.Deduction]: deductionConfig,
  [Games.DeductionSync]: deductionSyncConfig,
};

export class Room implements ConnectionObserver, GameObserver {
  private readonly connections: Connection[] = [];
  private game: Maybe<Game> = null;

  private initGame(): Game {
    if (!this.game) {
      throw new Error("Can't restart outside a game.");
    }
    return GAMES[this.game.getKind()].init(this);
  }

  addConnection(conn: Connection): void {
    this.connections.push(conn);
    this.updateStateForConnection(conn);
  }

  removeConnection(conn: Connection): void {
    const i = this.connections.indexOf(conn);
    this.connections.splice(i, 1);
    this.game?.removeConnection(conn);
    this.updateState();
  }

  processEvent(conn: Connection, event: RoomEvent): void {
    let updateAll = true;
    switch (event.kind) {
      case RoomEvents.SetGame:
        this.game = event.game ? GAMES[event.game].init(this) : null;
        break;
      case RoomEvents.Restart:
        this.game = this.initGame();
        break;
      default:
        if (this.game) {
          updateAll = this.game.processEvent(conn, event.event);
        }
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
      game: this.game?.getStateForConnection(conn) ?? null,
    });
  }

  private updateState(): void {
    this.connections.forEach(conn => {
      this.updateStateForConnection(conn);
    });
  }
}
