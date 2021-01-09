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
  accuse: (accusation: Crime) => void;
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
    objects: ['Pistol', 'Knife', 'Bat', 'Wire', 'Hydroflask TM', 'Hammer'],
    objectDescriptor: 'Weapon',
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
    objects: [
      'Lebkuchen',
      'Hazelnut Stick',
      'Gingerbread',
      'Spice Bar',
      'Pecan Puff',
      'Chocolate Walnut',
      'Sand Stars',
      'Almond Thumbprints',
    ],
    objectDescriptor: 'Cookie',
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
    return this.connected;
  }

  getRole(): string {
    return this.role;
  }

  getHand(): string[] {
    return this.hand;
  }

  getPrivateState(): PlayerPrivateState {
    return {
      hand: this.hand,
    };
  }

  getPublicState(): PlayerPublicState {
    return {
      role: this.role,
      name: this.name,
      connected: this.connected,
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

    const oldRole = conn.getRole();
    if (oldRole) {
      delete this.roleToConnection[oldRole];
    }

    this.roleToConnection[role] = conn;
    conn.setRole(role);
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
    const objects = this.skin.objects.slice();
    const places = this.skin.places.slice();

    this.solution = {
      role: pickOne(roles),
      object: pickOne(objects),
      place: pickOne(places),
    };

    const allCards = [...roles, ...objects, ...places];

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
      const newPlayer: Player = new Player(role, name, true, allHands[i]);
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
    if (!this.skin.objects.includes(crime.object)) {
      errors += `Object ${crime.object} not in current list of ${this.skin.objectDescriptor}: ${this.skin.objects}`;
    }
    if (!this.skin.places.includes(crime.place)) {
      errors += `Place ${crime.place} not in current list of places ${this.skin.places}`;
    }

    if (errors) {
      throw new Error(errors);
    }
  }

  accuse(accusation: Crime): void {
    // check that our accusation has the correct format
    if (this.status !== GameStatus.InProgress) {
      throw new Error('Accusations can only be made once game has started!');
    }

    console.log('Accusing!');
    this.validateCrimeForCurrentSkin(accusation);

    console.log(isEqual(accusation, this.solution));

    // log accusation with player?
    // if correct, game ends and player wins
    // else, idk... for now just log "sorry"
  }

  getState(): GameState {
    if (this.status === GameStatus.Setup) {
      return {
        status: this.status,
        connections: this.connections.map(c => c.getDescription()),
        skin: this.skin,
      };
    }
    return {
      status: this.status,
      players: this.players.map(p => p.getPublicState()),
      solution: this.solution,
      playerState: null,
      skin: this.skin,
    };
  }

  updateState(): void {
    const state = this.getState();
    this.connections.forEach(conn => {
      const role = conn.getRole();
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
