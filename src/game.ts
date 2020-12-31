import WebSocket from 'ws';

interface State {
  playerCount: number;
}

interface Player {
  setGameState(gameState: State): void;
};

interface PlayerObserver {
  removePlayer(player: Player): void;
}

export class Game implements PlayerObserver {
  private readonly players: Set<Player> = new Set()

  addPlayer(player: Player): void {
    this.players.add(player);
    this.updatePlayerStates();
  }

  removePlayer(player: Player): void {
    this.players.delete(player);
    this.updatePlayerStates();
  }

  getState(): State {
    return {
      playerCount: this.players.size,
    };
  }

  updatePlayerStates(): void {
    const state = this.getState();
    this.players.forEach(player => {
      player.setGameState(state);
    });
  }
}

export class WebSocketPlayer implements Player {
  private observer: PlayerObserver;
  private ws: WebSocket;

  constructor(observer: PlayerObserver, websocket: WebSocket) {
    this.observer = observer;
    this.ws = websocket;

    console.log('websocket connected');

    this.ws.on('message', (message: string) => {
      console.log('received: %s', message);
      this.ws.send(`Hello, you sent -> ${message}`);
    });

    this.ws.on('close', () => {
      console.log('closing websocket');
      this.observer.removePlayer(this);
    });
  }

  setGameState(state: State): void {
    this.ws.send(JSON.stringify(state));
  }
}
