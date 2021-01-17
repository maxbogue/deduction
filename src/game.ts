import isEqual from 'lodash/fp/isEqual';

import { SKINS } from '@/skins';
import {
  Card,
  ConnectionDescription,
  Crime,
  GameState,
  GameStatus,
  Player,
  PlayerSecrets,
  RoleCard,
  Skin,
} from '@/state';
import { Dict, Maybe } from '@/types';
import { pickMany, pickOne, repeat } from '@/utils';

export interface ConnectionObserver {
  setConnectionRole: (conn: Connection, role: RoleCard) => void;
  removeConnection: (conn: Connection) => void;
  setSkin: (skinName: string) => void;
  start: () => void;
  setNote: (
    role: RoleCard,
    player: Player,
    card: Card,
    marks: string[]
  ) => void;
  accuse: (role: RoleCard, accusation: Crime) => void;
  updateState: () => void;
}

export interface Connection {
  getRole: () => Maybe<RoleCard>;
  clearRole: () => void;
  setRole: (role: RoleCard) => void;
  isReady: () => boolean;
  getDescription: () => ConnectionDescription;
  sendState: (gameState: GameState) => void;
}

export class Game implements ConnectionObserver {
  private readonly connections: Connection[] = [];
  private roleToConnection: Dict<Connection> = {};
  private readonly roleToPlayer: Dict<Player> = {};
  private readonly roleToPlayerSecrets: Dict<PlayerSecrets> = {};
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
      const player = this.roleToPlayer[role.name];
      if (player) {
        player.isConnected = false;
      }
      delete this.roleToConnection[role.name];
    }
    this.updateState();
  }

  setConnectionRole(conn: Connection, role: RoleCard): void {
    if (!this.skin.roles.find(isEqual(role))) {
      console.log(`Invalid role ${role.name} for skin ${this.skin.skinName}`);
      return;
    }

    if (this.roleToConnection[role.name]) {
      return;
    }

    if (this.status === GameStatus.Setup) {
      const oldRole = conn.getRole();
      if (oldRole) {
        delete this.roleToConnection[oldRole.name];
      }

      this.roleToConnection[role.name] = conn;
      conn.setRole(role);
    } else if (this.status === GameStatus.InProgress) {
      const oldRole = conn.getRole();
      if (oldRole) {
        // Can't switch roles mid-game.
        return;
      }

      const player = this.roleToPlayer[role.name];
      if (!player || player.isConnected) {
        return;
      }

      this.roleToConnection[role.name] = conn;
      conn.setRole(role);
      player.isConnected = true;
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

  dealCards(numHands: number): Card[][] {
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
      if (!role) {
        return;
      }
      const player = { role, name, isConnected: true, failedAccusation: null };
      this.players.push(player);
      this.roleToPlayer[role.name] = player;
      this.roleToPlayerSecrets[role.name] = {
        index: i,
        hand: allHands[i],
        notes: {},
      };
    });
    this.status = GameStatus.InProgress;
  }

  setNote(role: RoleCard, other: Player, card: Card, marks: string[]): void {
    const playerSecrets = this.roleToPlayerSecrets[role.name];
    const otherRole = other.role.name;
    if (!playerSecrets.notes[otherRole]) {
      playerSecrets.notes[otherRole] = {};
    }
    playerSecrets.notes[otherRole][card.name] = marks;
    this.updateState();
  }

  validateCrimeForCurrentSkin(crime: Crime): void {
    let errors = '';

    if (!this.skin.roles.find(isEqual(crime.role))) {
      errors += `Role ${crime.role} not in current list of suspects ${this.skin.roles}`;
    }
    if (!this.skin.tools.find(isEqual(crime.tool))) {
      errors += `Tool ${crime.tool} not in current list of ${this.skin.toolDescriptor}: ${this.skin.tools}`;
    }
    if (!this.skin.places.find(isEqual(crime.place))) {
      errors += `Place ${crime.place} not in current list of places ${this.skin.places}`;
    }

    if (errors) {
      throw new Error(errors);
    }
  }

  accuse(role: RoleCard, accusation: Crime): void {
    if (this.status !== GameStatus.InProgress) {
      throw new Error('Accusations can only be made once game has started!');
    }

    // check that our accusation has the correct format
    this.validateCrimeForCurrentSkin(accusation);

    const player = this.roleToPlayer[role.name];
    if (player.failedAccusation) {
      return;
    }

    if (isEqual(accusation, this.solution)) {
      this.winner = this.players.indexOf(player);
      this.status = GameStatus.GameOver;
    } else {
      player.failedAccusation = accusation;
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
          players: this.players,
          solution: this.solution,
          playerSecrets: null,
        };
      case GameStatus.GameOver:
        return {
          status: this.status,
          skin: this.skin,
          players: this.players,
          winner: this.winner,
          solution: this.solution as Crime,
          playerSecrets: null,
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
          conn.sendState({
            ...state,
            playerSecrets: this.roleToPlayerSecrets[role.name],
          });
          break;
        }
      }
    });
  }
}
