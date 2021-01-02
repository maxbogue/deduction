import WebSocket from 'ws';

import { Dict, Maybe } from './types';

enum GameStatus {
  Setup = 'Setup',
  InProgress = 'InProgress',
}

interface ConnectionDescription {
  role: string;
  name: string;
  isReady: boolean;
}

interface PlayerPublicState {
  role: string;
  name: string;
  connected: boolean;
}

interface SetupState {
  status: GameStatus.Setup;
  connections: ConnectionDescription[];
  availableRoles: string[];
}

interface InProgressState {
  status: GameStatus.InProgress;
  players: PlayerPublicState[];
  playerState: Maybe<PlayerPrivateState>;
}

interface PlayerPrivateState {
  hand: string[];
}

type State = SetupState | InProgressState;

interface ConnectionObserver {
  setConnectionRole(conn: Connection, role: string): void;
  removeConnection(conn: Connection): void;
  start(): void;
  updateState(): void;
}

interface Connection {
  getRole(): string;
  setRole(role: string): void;
  isReady(): boolean;
  getDescription(): ConnectionDescription;
  sendState(gameState: State): void;
}

const ROLES = ['A', 'B', 'C'];
const CARDS = ROLES.concat(['1', '2', '3', '4']);

class Player {
  private readonly role: string;
  private name: string;
  private connected: boolean;
  private readonly hand: string[];

  constructor(role: string, name: string, connected: boolean, hand: string[]) {
    this.role = role;
    this.name = name;
    this.connected = connected;
    this.hand = hand;
  }

  setIsConnected(connected: boolean) {
    this.connected = connected;
  }

  getIsConnected(): boolean {
    return this.connected
  }

  getRole(): string {
    return this.role;
  }

  getHand(): string[] {
    return this.hand;
  }

  getPrivateState(): PlayerPrivateState {
    return {
      hand: this.hand
    };
  } 

  getPublicState(): PlayerPublicState {
    return {
      role: this.role,
      name: this.name,
      connected: this.connected
    };
  }
};

export class Game implements ConnectionObserver {
  private readonly connections: Connection[] = [];
  private readonly roleToConnection: Dict<Connection> = {};
  private readonly roleToPlayer: Dict<Player> = {};
  private readonly players: Player[] = [];
  private status: GameStatus = GameStatus.Setup;

  addConnection(conn: Connection): void {
    this.connections.push(conn);
    this.updateState();
  }

  removeConnection(conn: Connection): void {
    const i = this.connections.indexOf(conn);
    this.connections.splice(i, 1);
    const role = conn.getRole();
    if (role) {
      delete this.roleToConnection[role];
      this.roleToPlayer[role].setIsConnected(false);
    }
    this.updateState();
  }

  setConnectionRole(conn: Connection, role: string) {
    if (!ROLES.includes(role)) {
      throw new Error(`Invalid role: ${role}`);
    }

    if (this.roleToConnection[role]) {
      return;
    }

    const oldRole = conn.getRole();
    if (oldRole) {
      delete this.roleToConnection[oldRole];
    }

    this.roleToConnection[role] = conn;
    conn.setRole(role);
  }

  //addPlayer(role: string, player: Player): void {
    //this.roleToPlayer[role] = player;
    //this.updateState();
  //}

  //removePlayer(player: Player): void {
    ////this.players.delete(player);
    //this.updateState();
  //}

  dealCards(hands: number) : string[][] {
    const count = CARDS.length
    const cardsPerHand = count/hands
    let allHands: string[][] = []
    for (let i=0; i < hands; i++) {
      const begin = i*cardsPerHand;
      const end = begin+cardsPerHand;
      allHands.push(CARDS.slice(begin, end));
    } 
    return allHands
  }

  start(): void {
    if (!this.connections.every(c => !c.getRole() || c.isReady())) {
      return;
    }
    const playerConnections = this.connections.filter(c => c.getRole())
    let allHands = this.dealCards(playerConnections.length)

    playerConnections.forEach(conn => {
      const { role, name } = conn.getDescription();
      const thisHand = allHands.splice(0,1)[0];
      const newPlayer: Player = new Player(role, name, true, thisHand)
      this.players.push(newPlayer);
      this.roleToPlayer[role] = newPlayer;
    });
    this.status = GameStatus.InProgress;
  }

  getState(): State {
    if (this.status === GameStatus.Setup) {
      return {
        status: this.status,
        connections: this.connections.map(c => c.getDescription()),
        availableRoles: ROLES.filter(r => !this.roleToConnection[r]),
      };
    }
    return {
      status: this.status,
      players: this.players.map(p => p.getPublicState()),
      playerState: null,
    };
  }

  getConnectionStatusForPlayer(player: Player): boolean {
    return false
  }

  updateState(): void {
    const state = this.getState();
    this.connections.forEach(conn => {
      const role = conn.getRole()
      if (state.status === GameStatus.InProgress && role) {
        const player = this.roleToPlayer[role];
        conn.sendState({
          ...state,
          playerState: player.getPrivateState(),
        });
      } else {
        conn.sendState(state);
      }
    });
  }
}

enum ConnectionEvents {
  SetRole = 'SetRole',
  SetName = 'SetName',
  SetReady = 'SetReady',
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

interface StartEvent {
  type: ConnectionEvents.Start;
}

type ConnectionEvent = SetRoleEvent | SetNameEvent | SetReadyEvent | StartEvent;

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
