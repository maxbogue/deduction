import WebSocket from 'ws';

import { Dict, Maybe } from './types';
import { pickOne, pickMany, repeat } from './utils';

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
  solution: Maybe<Crime>;
  playerState: Maybe<PlayerPrivateState>;
}

interface PlayerPrivateState {
  hand: string[];
}

type State = SetupState | InProgressState;

interface ConnectionObserver {
  setConnectionRole(conn: Connection, role: string): void;
  removeConnection(conn: Connection): void;
  setSkin(skinName: string): void;
  start(): void;
  updateState(): void;
}

interface Connection {
  getRole(): string;
  clearRole(): void;
  setRole(role: string): void;
  isReady(): boolean;
  getDescription(): ConnectionDescription;
  sendState(gameState: State): void;
}

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

interface Crime {
  role: string,
  object: string,
  place: string
}

export class Game implements ConnectionObserver {
  private readonly connections: Connection[] = [];
  private roleToConnection: Dict<Connection> = {};
  private readonly roleToPlayer: Dict<Player> = {};
  private readonly players: Player[] = [];
  private status: GameStatus = GameStatus.Setup;
  private skin: Skin = SKINS["classic"];
  private solution: Maybe<Crime> = null; 

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
    if (!this.skin.roles.includes(role)) {
      console.log(`Invalid role ${role} for skin ${this.skin.skinName}`);
      return
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

  setSkin(skinName: string) {
    if (!SKINS[skinName]) {
      console.log(`Invalid skin ${skinName} for game.`)
      return
    }

    if (this.status !== GameStatus.Setup) {
      console.log('Too late to change skin. Game has begun!');
      return
    }

    const skin = SKINS[skinName]
      
    if (this.skin === skin) {
      console.log("Skin already set.");
    } else {
      this.resetRoles();
      this.skin = skin;
    }
  }
  //addPlayer(role: string, player: Player): void {
    //this.roleToPlayer[role] = player;
    //this.updateState();
  //}

  //removePlayer(player: Player): void {
    ////this.players.delete(player);
    //this.updateState();
  //}

  resetRoles() {
    if (this.status === GameStatus.Setup){
      this.connections.forEach(conn => {
        conn.clearRole();
      });
      this.roleToConnection = {};
    } else {
      console.log('Too late to reset roles! Game has begun!')
      // option to end game and return to setup state?
    }
  }

  dealCards(numHands: number) : string[][] {
    const roles = this.skin.roles.slice();
    const objects = this.skin.objects.slice();
    const places = this.skin.places.slice();

    this.solution = {
      role: pickOne(roles),
      object: pickOne(objects),
      place: pickOne(places),
    }

    const allCards = [...roles, ...objects, ...places];

    // shuffle the deck

    const count = allCards.length
    const cardsPerHand = Math.floor(count / numHands);
    const getsExtra = count % numHands;
    return repeat(
      (i: number) => pickMany(allCards, i < getsExtra ? cardsPerHand + 1 : cardsPerHand),
      numHands
    );
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
        availableRoles: this.skin.roles.filter(r => !this.roleToConnection[r]),
      };
    }
    return {
      status: this.status,
      players: this.players.map(p => p.getPublicState()),
      solution: this.solution,
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

interface Skin {
  skinName: string,
  roles: string[],
  objects: string[],
  objectDescriptor: string,
  places: string[],
}

const SKINS: Dict<Skin> = {
  classic: {
    skinName: "classic",
    roles: ['Mlle. Crimson', 'Gen. Dijon', 'Dr. Grape', 'Sr. Tomatillo', 'Mrs. Juniper', "Ms. Ivory"],
    objects: ['Pistol', 'Knife', 'Bat', 'Wire', 'Hydroflask TM', 'Hammer'],
    objectDescriptor: "Weapon",
    places: ['Breakfast Nook', 'Closet', 'Office', 'Bedroom', 'Rec Room', 'Den', 'Entryway', 'Laundry Room', 'Master Bath', 'Pantry'],
  },
  familyCookies: {
    skinName: "familyCookies",
    roles: ['Doug', 'Harl', 'Steve', 'Katharine', 'Lucy', 'Les', 'Kim'],
    objects: ['Lebkuchen', 'Hazelnut Stick', 'Gingerbread', 'Spice Bar', 'Pecan Puff', 'Chocolate Walnut', 'Sand Stars', 'Almond Thumbprints'],
    objectDescriptor: "Cookie",
    places: ['Pond Street', 'Pittsfield', 'Daytona Beach', 'Buckingham Drive', 'Aurielle Drive', 'Nottingham Court', 'Redwood City', 'Shelburne Bay']
  },
}

enum ConnectionEvents {
  SetRole = 'SetRole',
  SetName = 'SetName',
  SetReady = 'SetReady',
  SetSkin = 'SetSkin',
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

interface SetSkinEvent {
  type: ConnectionEvents.SetSkin;
  data: string;
}

interface StartEvent {
  type: ConnectionEvents.Start;
}

type ConnectionEvent = SetRoleEvent | SetNameEvent | SetReadyEvent | StartEvent | SetSkinEvent;

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
        this.observer.setSkin(event.data)
        break
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
