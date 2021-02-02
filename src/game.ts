import intersectionBy from 'lodash/fp/intersectionBy';
import isEqual from 'lodash/fp/isEqual';
import shuffle from 'lodash/fp/shuffle';
import sortBy from 'lodash/fp/sortBy';

import { ConnectionEvent, ConnectionEvents } from '@/events';
import { SKINS } from '@/skins';
import {
  Card,
  ConnectionDescription,
  Crime,
  GameState,
  GameStatus,
  Mark,
  Player,
  PlayerSecrets,
  RoleCard,
  Skin,
  TurnState,
  TurnStatus,
} from '@/state';
import { Dict, Maybe } from '@/types';
import { dictFromList, pickMany, pickOne, repeat } from '@/utils';

export interface ConnectionObserver {
  removeConnection: (conn: Connection) => void;
  processEvent: (conn: Connection, event: ConnectionEvent) => void;
}

export interface Connection {
  name: string;
  role: Maybe<RoleCard>;
  isReady: boolean;
  getDescription: () => ConnectionDescription;
  sendState: (gameState: GameState) => void;
}

interface GameObserver {
  setGame: (game: Game) => void;
}

export class Room implements ConnectionObserver, GameObserver {
  private readonly connections: Connection[] = [];
  private game: Game;

  constructor() {
    this.game = new GameSetup(this, this.connections);
  }

  addConnection(conn: Connection): void {
    this.connections.push(conn);
    this.updateState();
  }

  removeConnection(conn: Connection): void {
    const i = this.connections.indexOf(conn);
    this.connections.splice(i, 1);
    this.game.removeConnection(conn);
    this.updateState();
  }

  processEvent(conn: Connection, event: ConnectionEvent): void {
    console.log(event);
    let updateAll = true;
    switch (event.type) {
      case ConnectionEvents.Restart:
        this.game = new GameSetup(this, this.connections);
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
    conn.sendState(
      this.game.getStateForConnection(conn, this.connections.indexOf(conn))
    );
  }

  updateState(): void {
    this.connections.forEach((c, i) => {
      c.sendState(this.game.getStateForConnection(c, i));
    });
  }
}

abstract class Game {
  protected readonly observer: GameObserver;

  constructor(observer: GameObserver) {
    this.observer = observer;
  }

  abstract removeConnection(conn: Connection): void;
  abstract getStateForConnection(conn: Connection, i: number): GameState;
  // Returns whether to update state for all connections or just `conn`.
  abstract processEvent(conn: Connection, event: ConnectionEvent): boolean;
}

class GameSetup extends Game {
  private readonly connections: Connection[];
  private roleToConnection: Dict<Connection> = {};
  private skin: Skin = SKINS.classic;

  constructor(observer: GameObserver, connections: Connection[]) {
    super(observer);
    this.connections = connections;
    this.connections.forEach(conn => {
      if (conn.role) {
        this.setConnectionRole(conn, conn.role);
      }
    });
  }

  removeConnection(conn: Connection): void {
    if (conn.role) {
      delete this.roleToConnection[conn.role.name];
    }
  }

  private setConnectionRole(conn: Connection, role: RoleCard): void {
    if (!this.skin.roles.find(isEqual(role))) {
      console.log(`Invalid role ${role.name} for skin ${this.skin.skinName}`);
      return;
    }

    if (this.roleToConnection[role.name]) {
      return;
    }

    if (conn.role) {
      delete this.roleToConnection[conn.role.name];
    }

    this.roleToConnection[role.name] = conn;
    conn.role = role;
  }

  private setSkin(skinName: string): void {
    if (!SKINS[skinName]) {
      console.log(`Invalid skin ${skinName} for game.`);
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

  private resetRoles(): void {
    Object.values(this.roleToConnection).forEach(conn => {
      conn.role = null;
      conn.isReady = false;
    });
    this.roleToConnection = {};
  }

  private dealCards(numHands: number) {
    const roles = this.skin.roles.slice();
    const tools = this.skin.tools.slice();
    const places = this.skin.places.slice();

    const solution = {
      role: pickOne(roles),
      tool: pickOne(tools),
      place: pickOne(places),
    };

    const allCards = [...roles, ...tools, ...places];

    // shuffle the deck

    const count = allCards.length;
    const cardsPerHand = Math.floor(count / numHands);
    const getsExtra = count % numHands;
    const hands = repeat(
      (i: number) =>
        sortBy(
          ['type', 'name'],
          pickMany(allCards, i < getsExtra ? cardsPerHand + 1 : cardsPerHand)
        ),
      numHands
    );

    return { solution, hands };
  }

  private start(): void {
    const playerConnections = Object.values(this.roleToConnection);
    if (
      playerConnections.length < 2 ||
      !playerConnections.every(c => c.isReady)
    ) {
      return;
    }

    const { solution, hands } = this.dealCards(playerConnections.length);

    const players = shuffle(playerConnections).map(
      (conn: Connection, i: number): Player => {
        const { role, name } = conn.getDescription();
        if (!role) {
          throw new TypeError('Role must be set.');
        }
        return {
          role,
          name,
          isConnected: true,
          failedAccusation: null,
          handSize: hands[i].length,
        };
      }
    );

    const game = new GameInProgress(
      this.observer,
      this.skin,
      players,
      hands,
      solution
    );
    this.observer.setGame(game);
  }

  processEvent(conn: Connection, event: ConnectionEvent): boolean {
    switch (event.type) {
      case ConnectionEvents.SetRole:
        this.setConnectionRole(conn, event.data);
        break;
      case ConnectionEvents.SetName:
        conn.name = event.data;
        break;
      case ConnectionEvents.SetReady:
        conn.isReady = event.data;
        break;
      case ConnectionEvents.SetSkin:
        this.setSkin(event.data);
        break;
      case ConnectionEvents.Start:
        this.start();
        break;
      default:
        console.error(`Invalid event for ${GameStatus.Setup}: ${event}`);
    }
    return true;
  }

  getStateForConnection(_: Connection, i: number): GameState {
    return {
      status: GameStatus.Setup,
      skin: this.skin,
      connections: this.connections.map(c => c.getDescription()),
      connectionIndex: i,
    };
  }
}

abstract class GamePostSetup extends Game {
  protected readonly skin: Skin;
  protected readonly solution: Crime;
  protected readonly players: Player[];
  protected readonly playerSecrets: PlayerSecrets[];
  protected readonly roleToPlayer: Dict<Player> = {};
  protected readonly roleToPlayerSecrets: Dict<PlayerSecrets> = {};

  constructor(
    observer: GameObserver,
    skin: Skin,
    players: Player[],
    playerSecrets: PlayerSecrets[],
    solution: Crime
  ) {
    super(observer);

    this.skin = skin;
    this.solution = solution;
    this.players = players;
    this.playerSecrets = playerSecrets;

    for (let i = 0; i < players.length; i++) {
      const player = players[i];
      this.roleToPlayer[player.role.name] = players[i];
      this.roleToPlayerSecrets[player.role.name] = playerSecrets[i];
    }
  }

  removeConnection(conn: Connection): void {
    if (conn.role) {
      const player = this.roleToPlayer[conn.role.name];
      if (player) {
        player.isConnected = false;
      }
    }
  }

  protected setNote(
    role: RoleCard,
    playerColumn: Player,
    card: Card,
    marks: Mark[]
  ): void {
    const playerSecrets = this.roleToPlayerSecrets[role.name];
    const playerColumnRole = playerColumn.role.name;
    if (!playerSecrets.notes[playerColumnRole]) {
      playerSecrets.notes[playerColumnRole] = {};
    }
    playerSecrets.notes[playerColumnRole][card.name] = marks;
  }

  protected setConnectionRole(conn: Connection, role: RoleCard): void {
    if (!this.skin.roles.find(isEqual(role))) {
      console.log(`Invalid role ${role.name} for skin ${this.skin.skinName}`);
      return;
    }

    if (conn.role) {
      // Can't switch roles mid-game.
      return;
    }

    const player = this.roleToPlayer[role.name];
    if (!player || player.isConnected) {
      return;
    }

    conn.role = role;
    player.isConnected = true;
  }
}

function initNotes(
  skin: Skin,
  players: Player[],
  i: number,
  hand: Card[]
): Dict<Dict<Mark[]>> {
  const notes: Dict<Dict<Mark[]>> = {};
  players.forEach((player, j) => {
    const d: Dict<Mark[]> = {};
    const f = (card: Card) => {
      const inHand = hand.includes(card);
      if (i === j) {
        d[card.name] = [inHand ? Mark.D : Mark.X];
      } else if (inHand) {
        d[card.name] = [Mark.X];
      }
    };
    skin.roles.forEach(f);
    skin.places.forEach(f);
    skin.tools.forEach(f);
    notes[player.role.name] = d;
  });
  return notes;
}

class GameInProgress extends GamePostSetup {
  private turnIndex = 0;
  private turnState: TurnState = { status: TurnStatus.Suggest };

  constructor(
    observer: GameObserver,
    skin: Skin,
    players: Player[],
    hands: Card[][],
    solution: Crime
  ) {
    super(
      observer,
      skin,
      players,
      hands.map((hand, i) => ({
        index: i,
        hand,
        notes: initNotes(skin, players, i, hand),
      })),
      solution
    );
  }

  private validateCrimeForCurrentSkin(crime: Crime): void {
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

  private isTurnPlayer(role: Maybe<RoleCard>): boolean {
    const turnPlayer = this.players[this.turnIndex];
    return Boolean(role && role.name === turnPlayer.role.name);
  }

  private isSharePlayer(role: Maybe<RoleCard>): boolean {
    if (this.turnState.status === TurnStatus.Suggest) {
      return false;
    }
    const sharePlayer = this.players[this.turnState.sharePlayerIndex];
    return Boolean(role && role.name === sharePlayer.role.name);
  }

  private suggest(suggestion: Crime) {
    if (this.turnState.status !== TurnStatus.Suggest) {
      return;
    }

    const cards = Object.values(suggestion);

    const n = this.players.length;
    for (let i = 1; i < n; i++) {
      const playerIndex = (i + this.turnIndex) % n;
      const { hand } = this.playerSecrets[playerIndex];
      if (intersectionBy(c => c.name, cards, hand).length > 0) {
        this.turnState = {
          status: TurnStatus.Share,
          suggestion,
          sharePlayerIndex: playerIndex,
        };
        return;
      }
    }
    this.turnState = {
      status: TurnStatus.Record,
      suggestion,
      sharePlayerIndex: this.turnIndex,
      sharedCard: null,
      playerIsReady: dictFromList(this.players, (dict, p) => {
        if (!p.failedAccusation) {
          dict[p.role.name] = false;
        }
      }),
    };
  }

  private shareCard(card: Card) {
    if (this.turnState.status !== TurnStatus.Share) {
      return;
    }

    //TODO validate the card

    this.turnState = {
      status: TurnStatus.Record,
      suggestion: this.turnState.suggestion,
      sharePlayerIndex: this.turnState.sharePlayerIndex,
      sharedCard: card,
      playerIsReady: dictFromList(this.players, (dict, p) => {
        if (!p.failedAccusation) {
          dict[p.role.name] = false;
        }
      }),
    };
  }

  private checkIfReady() {
    if (this.turnState.status !== TurnStatus.Record) {
      return;
    }

    if (Object.values(this.turnState.playerIsReady).every(x => x)) {
      this.endTurn();
    }
  }

  private setIsReady(role: RoleCard, isReady: boolean) {
    if (this.turnState.status !== TurnStatus.Record) {
      return;
    }

    const player = this.roleToPlayer[role.name];
    if (!player.failedAccusation) {
      this.turnState.playerIsReady[role.name] = isReady;
      this.checkIfReady();
    }
  }

  private endTurn() {
    do {
      this.turnIndex = (this.turnIndex + 1) % this.players.length;
    } while (this.players[this.turnIndex].failedAccusation);

    this.turnState = { status: TurnStatus.Suggest };
  }

  private accuse(role: RoleCard, accusation: Crime): void {
    if (this.turnState.status !== TurnStatus.Record) {
      return;
    }

    // check that our accusation has the correct format
    this.validateCrimeForCurrentSkin(accusation);

    const player = this.roleToPlayer[role.name];
    if (player.failedAccusation) {
      return;
    }

    if (isEqual(accusation, this.solution)) {
      this.gameOver(player);
      return;
    }

    player.failedAccusation = accusation;
    const playersLeft = this.players.filter(p => !p.failedAccusation);
    if (playersLeft.length > 1) {
      delete this.turnState.playerIsReady[player.role.name];
      this.checkIfReady();
    } else {
      this.gameOver(playersLeft[0]);
    }
  }

  private gameOver(winner: Player) {
    const playerSecrets = this.players.map(
      p => this.roleToPlayerSecrets[p.role.name]
    );

    this.observer.setGame(
      new GameOver(
        this.observer,
        this.skin,
        this.players,
        playerSecrets,
        this.solution,
        this.players.indexOf(winner)
      )
    );
  }

  processEvent(conn: Connection, event: ConnectionEvent): boolean {
    switch (event.type) {
      case ConnectionEvents.SetRole:
        this.setConnectionRole(conn, event.data);
        break;
      case ConnectionEvents.SetName:
        conn.name = event.data;
        break;
      case ConnectionEvents.SetNote:
        if (conn.role) {
          this.setNote(conn.role, event.player, event.card, event.marks);
        }
        return false;
      case ConnectionEvents.Suggest:
        if (this.isTurnPlayer(conn.role)) {
          this.suggest(event.suggestion);
        }
        break;
      case ConnectionEvents.ShareCard:
        if (this.isSharePlayer(conn.role)) {
          this.shareCard(event.sharedCard);
        }
        break;
      case ConnectionEvents.SetReady:
        if (conn.role) {
          this.setIsReady(conn.role, event.data);
        }
        break;
      case ConnectionEvents.Accuse:
        if (!conn.role) {
          break;
        }
        this.validateCrime(event.data);
        this.accuse(conn.role, event.data);
        break;
      default:
        console.error(`Invalid event for ${GameStatus.InProgress}: ${event}`);
    }
    return true;
  }

  private validateCrime(crime: Crime) {
    let errors = '';
    if (!crime.role) {
      errors += 'Missing suspect. ';
    }
    if (!crime.tool) {
      errors += 'Missing tool. ';
    }
    if (!crime.place) {
      errors += 'Missing place. ';
    }

    const foundKeys = Object.keys(crime).length;
    if (foundKeys !== 3) {
      errors += `Found ${foundKeys}. Expected 3.`;
    }

    if (errors) {
      throw new Error(errors);
    }
  }

  private getTurnStateForRole(role: Maybe<RoleCard>): TurnState {
    const showSharedCard = this.isTurnPlayer(role) || this.isSharePlayer(role);
    if (this.turnState.status === TurnStatus.Record && !showSharedCard) {
      return {
        ...this.turnState,
        // Hide the shared card from other players.
        sharedCard: null,
      };
    }
    return this.turnState;
  }

  getStateForConnection(conn: Connection): GameState {
    return {
      status: GameStatus.InProgress,
      skin: this.skin,
      players: this.players,
      turnIndex: this.turnIndex,
      turnState: this.getTurnStateForRole(conn.role),
      playerSecrets: conn.role
        ? this.roleToPlayerSecrets[conn.role.name]
        : null,
    };
  }
}

class GameOver extends GamePostSetup {
  private readonly winner: number;

  constructor(
    observer: GameObserver,
    skin: Skin,
    players: Player[],
    playerSecrets: PlayerSecrets[],
    solution: Crime,
    winner: number
  ) {
    super(observer, skin, players, playerSecrets, solution);
    this.winner = winner;
  }

  processEvent(conn: Connection, event: ConnectionEvent): boolean {
    switch (event.type) {
      case ConnectionEvents.SetRole:
        this.setConnectionRole(conn, event.data);
        break;
      case ConnectionEvents.SetName:
        conn.name = event.data;
        break;
      case ConnectionEvents.SetNote:
        if (conn.role) {
          this.setNote(conn.role, event.player, event.card, event.marks);
        }
        return false;
      default:
        console.log('Event not found in processEvent', event);
    }
    return true;
  }

  getStateForConnection(conn: Connection): GameState {
    return {
      status: GameStatus.GameOver,
      skin: this.skin,
      players: this.players,
      winner: this.winner,
      solution: this.solution,
      playerSecrets: conn.role
        ? this.roleToPlayerSecrets[conn.role.name]
        : null,
    };
  }
}
