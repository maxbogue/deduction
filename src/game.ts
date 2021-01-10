import isEqual from 'lodash/isEqual';

import {
  ConnectionDescription,
  Crime,
  GameState,
  GameStatus,
  PlayerPrivateState,
  PlayerPublicState,
  Skin,
} from '@/state';

import { Dict, Maybe } from './types';
import { pickMany, pickOne, repeat } from './utils';

export interface ConnectionObserver {
  setConnectionRole: (conn: Connection, role: string) => void;
  removeConnection: (conn: Connection) => void;
  setSkin: (skinName: string) => void;
  start: () => void;
  accuse: (role: string, accusation: Crime) => void;
  updateState: () => void;
}

export interface Connection {
  getRole: () => string;
  clearRole: () => void;
  setRole: (role: string) => void;
  isReady: () => boolean;
  getDescription: () => ConnectionDescription;
  sendState: (gameState: GameState) => void;
}

const SKINS: Dict<Skin> = {
  classic: {
    skinName: 'classic',
    roles: [
      'Mlle. Crimson',
      'Gen. Dijon',
      'Dr. Grape',
      'Sr. Tomatillo',
      'Mrs. Juniper',
      'Ms. Ivory',
    ],
    tools: ['Pistol', 'Knife', 'Bat', 'Wire', 'Hydroflask TM', 'Hammer'],
    toolDescriptor: 'Weapon',
    places: [
      'Breakfast Nook',
      'Closet',
      'Office',
      'Bedroom',
      'Rec Room',
      'Den',
      'Entryway',
      'Laundry Room',
      'Master Bath',
      'Pantry',
    ],
  },
  familyCookies: {
    skinName: 'familyCookies',
    roles: ['Doug', 'Harl', 'Steve', 'Katharine', 'Lucy', 'Les', 'Kim'],
    tools: [
      'Lebkuchen',
      'Hazelnut Stick',
      'Gingerbread',
      'Spice Bar',
      'Pecan Puff',
      'Chocolate Walnut',
      'Sand Stars',
      'Almond Thumbprints',
    ],
    toolDescriptor: 'Cookie',
    places: [
      'Pond Street',
      'Pittsfield',
      'Daytona Beach',
      'Buckingham Drive',
      'Aurielle Drive',
      'Nottingham Court',
      'Redwood City',
      'Shelburne Bay',
    ],
  },
};

class Player {
  private readonly role: string;
  private readonly hand: string[];
  private name: string;
  private isConnected = true;
  private failedAccusation: Maybe<Crime> = null;

  constructor(role: string, name: string, hand: string[]) {
    this.role = role;
    this.name = name;
    this.hand = hand;
  }

  setIsConnected(isConnected: boolean) {
    this.isConnected = isConnected;
  }

  getIsConnected(): boolean {
    return this.isConnected;
  }

  kill(accusation: Crime) {
    this.failedAccusation = accusation;
  }

  isDed(): boolean {
    return Boolean(this.failedAccusation);
  }

  getRole(): string {
    return this.role;
  }

  getHand(): string[] {
    return this.hand;
  }

  getPrivateState(): Omit<PlayerPrivateState, 'index'> {
    return {
      hand: this.hand,
    };
  }

  getPublicState(): PlayerPublicState {
    return {
      role: this.role,
      name: this.name,
      isConnected: this.isConnected,
      failedAccusation: this.failedAccusation,
    };
  }
}

export class Game implements ConnectionObserver {
  private readonly connections: Connection[] = [];
  private roleToConnection: Dict<Connection> = {};
  private readonly roleToPlayer: Dict<Player> = {};
  private readonly players: Player[] = [];
  private status: GameStatus = GameStatus.Setup;
  private skin: Skin = SKINS.classic;
  private solution: Maybe<Crime> = null;
  private winner = -1;

  addConnection(conn: Connection): void {
    this.connections.push(conn);
    this.updateState();
  }

  removeConnection(conn: Connection): void {
    const i = this.connections.indexOf(conn);
    this.connections.splice(i, 1);
    const role = conn.getRole();
    if (role) {
      this.roleToPlayer[role]?.setIsConnected(false);
      delete this.roleToConnection[role];
    }
    this.updateState();
  }

  setConnectionRole(conn: Connection, role: string): void {
    if (!this.skin.roles.includes(role)) {
      console.log(`Invalid role ${role} for skin ${this.skin.skinName}`);
      return;
    }

    if (this.roleToConnection[role]) {
      return;
    }

    if (this.status === GameStatus.Setup) {
      const oldRole = conn.getRole();
      if (oldRole) {
        delete this.roleToConnection[oldRole];
      }

      this.roleToConnection[role] = conn;
      conn.setRole(role);
    } else if (this.status === GameStatus.InProgress) {
      const oldRole = conn.getRole();
      if (oldRole) {
        // Can't switch roles mid-game.
        return;
      }

      const player = this.roleToPlayer[role];
      if (!player || player.getIsConnected()) {
        return;
      }

      this.roleToConnection[role] = conn;
      conn.setRole(role);
      player.setIsConnected(true);
    }
  }

  setSkin(skinName: string): void {
    if (!SKINS[skinName]) {
      console.log(`Invalid skin ${skinName} for game.`);
      return;
    }

    if (this.status !== GameStatus.Setup) {
      console.log('Too late to change skin. Game has begun!');
      return;
    }

    const skin = SKINS[skinName];

    if (this.skin === skin) {
      console.log('Skin already set.');
    } else {
      this.resetRoles();
      this.skin = skin;
    }
  }

  resetRoles(): void {
    if (this.status !== GameStatus.Setup) {
      console.log('Too late to reset roles! Game has begun!');
      // option to end game and return to setup state?
      return;
    }

    this.connections.forEach(conn => {
      conn.clearRole();
    });
    this.roleToConnection = {};
  }

  dealCards(numHands: number): string[][] {
    const roles = this.skin.roles.slice();
    const tools = this.skin.tools.slice();
    const places = this.skin.places.slice();

    this.solution = {
      role: pickOne(roles),
      tool: pickOne(tools),
      place: pickOne(places),
    };

    const allCards = [...roles, ...tools, ...places];

    // shuffle the deck

    const count = allCards.length;
    const cardsPerHand = Math.floor(count / numHands);
    const getsExtra = count % numHands;
    return repeat(
      (i: number) =>
        pickMany(allCards, i < getsExtra ? cardsPerHand + 1 : cardsPerHand),
      numHands
    );
  }

  start(): void {
    if (!this.connections.every(c => !c.getRole() || c.isReady())) {
      return;
    }
    const playerConnections = this.connections.filter(c => c.getRole());
    const allHands = this.dealCards(playerConnections.length);

    playerConnections.forEach((conn, i) => {
      const { role, name } = conn.getDescription();
      const newPlayer: Player = new Player(role, name, allHands[i]);
      this.players.push(newPlayer);
      this.roleToPlayer[role] = newPlayer;
    });
    this.status = GameStatus.InProgress;
  }

  validateCrimeForCurrentSkin(crime: Crime): void {
    let errors = '';

    if (!this.skin.roles.includes(crime.role)) {
      errors += `Role ${crime.role} not in current list of suspects ${this.skin.roles}`;
    }
    if (!this.skin.tools.includes(crime.tool)) {
      errors += `Tool ${crime.tool} not in current list of ${this.skin.toolDescriptor}: ${this.skin.tools}`;
    }
    if (!this.skin.places.includes(crime.place)) {
      errors += `Place ${crime.place} not in current list of places ${this.skin.places}`;
    }

    if (errors) {
      throw new Error(errors);
    }
  }

  accuse(role: string, accusation: Crime): void {
    if (this.status !== GameStatus.InProgress) {
      throw new Error('Accusations can only be made once game has started!');
    }

    // check that our accusation has the correct format
    this.validateCrimeForCurrentSkin(accusation);

    const player = this.roleToPlayer[role];
    if (player.isDed()) {
      return;
    }

    if (isEqual(accusation, this.solution)) {
      this.winner = this.players.indexOf(player);
      this.status = GameStatus.GameOver;
    } else {
      player.kill(accusation);
    }

    this.updateState();
  }

  getState(): GameState {
    switch (this.status) {
      case GameStatus.Setup:
        return {
          status: this.status,
          skin: this.skin,
          connections: this.connections.map(c => c.getDescription()),
          connectionIndex: 0,
        };
      case GameStatus.InProgress:
        return {
          status: this.status,
          skin: this.skin,
          players: this.players.map(p => p.getPublicState()),
          solution: this.solution,
          playerState: null,
        };
      case GameStatus.GameOver:
        return {
          status: this.status,
          skin: this.skin,
          players: this.players.map(p => p.getPublicState()),
          winner: this.winner,
          solution: this.solution as Crime,
          playerState: null,
        };
    }
  }

  updateState(): void {
    const state = this.getState();
    this.connections.forEach((conn, i) => {
      const role = conn.getRole();
      switch (state.status) {
        case GameStatus.Setup:
          conn.sendState({
            ...state,
            connectionIndex: i,
          });
          break;
        case GameStatus.InProgress:
        case GameStatus.GameOver: {
          if (!role) {
            conn.sendState(state);
            return;
          }
          const player = this.roleToPlayer[role];
          conn.sendState({
            ...state,
            playerState: {
              ...player.getPrivateState(),
              index: this.players.indexOf(player),
            },
          });
          break;
        }
      }
    });
  }
}
