import WebSocket from 'ws';

import { Dict, Maybe } from './types';

interface ConnectionDescription {
  role: string;
  name: string;
}

interface PlayerDescription {
  role: string;
  name: string;
  connected: boolean;
}

interface SetupState {
  connections: ConnectionDescription[];
  availableRoles: string[];
}

interface InProgressState {
  players: PlayerDescription[];
}

type State = SetupState | InProgressState;

interface ConnectionObserver {
  removeConnection(conn: Connection): void;
  updateState(): void;
  setConnectionRole(conn: Connection, role: string): void;
}

interface Connection {
  getRole(): string;
  setRole(role: string): void;
  getDescription(): ConnectionDescription;
  sendState(gameState: State): void;
}

const ROLES = ['A', 'B', 'C'];

class Player {
  private role: string;
  private name: string;

  constructor(role: string, name: string) {
    this.role = role;
    this.name = name;
  }

  getRole(): string {
    return this.role;
  }

  getDescription(): PlayerDescription {
    return {
      role: this.role,
      name: this.name,
      connected: false,
    };
  }
};

export class Game implements ConnectionObserver {
  private readonly connections: Connection[] = [];
  private readonly roleToConnection: Dict<Connection> = {};
  private readonly roleToPlayer: Dict<Player> = {};
  private readonly players: Player[] = [];
  private isStarted = false;

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

  getState(): State {
    if (!this.isStarted) {
      return {
        connections: this.connections.map(c => c.getDescription()),
        availableRoles: ROLES.filter(r => !this.roleToConnection[r]),
      };
    }
    return {
      players: this.players.map(p => p.getDescription()),
    };
  }

  updateState(): void {
    const state = this.getState();
    this.connections.forEach(conn => {
      conn.sendState(state);
    });
  }
}

interface SetRoleEvent {
  type: 'setRole';
  data: string;
}

interface SetNameEvent {
  type: 'setName';
  data: string;
}

type ConnectionEvent = SetRoleEvent | SetNameEvent;

export class WebSocketConnection implements Connection {
  private observer: ConnectionObserver;
  private ws: WebSocket;
  private role: string = '';
  // mutable, used during setup
  private name: string = '';

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

  getDescription(): ConnectionDescription {
    return {
      role: this.role,
      name: this.name,
    };
  }

  processEvent(event: ConnectionEvent): void {
    console.log(event);
    if (event.type === 'setRole') {
      this.observer.setConnectionRole(this, event.data);
    } else if (event.type === 'setName') {
      this.name = event.data;
    }
    this.observer.updateState();
  }

  sendState(state: State): void {
    this.ws.send(JSON.stringify({
      type: 'STATE',
      data: state,
    }));
  }
}
