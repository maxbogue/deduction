import intersectionBy from 'lodash/fp/intersectionBy';
import isEqual from 'lodash/fp/isEqual';
import mapValues from 'lodash/fp/mapValues';
import shuffle from 'lodash/fp/shuffle';
import sortBy from 'lodash/fp/sortBy';

import { SKINS } from '@/deduction/skins';
import { Connection, Game, GameConfig, GameObserver } from '@/server/game';
import { Games, GameState } from '@/state';
import { ById, Dict, Maybe } from '@/types';
import { dictFromList, pickMany, pickOne, repeat } from '@/utils';

import { DeductionSyncEvent, DeductionSyncEvents } from './events';
import {
  Card,
  Crime,
  DeductionStatus,
  Mark,
  Player,
  PlayerCrime,
  PlayerSecrets,
  ProtoPlayer,
  RoleCard,
  Skin,
  TurnState,
  TurnStatus,
} from './state';

abstract class DeductionSyncGame extends Game {
  getKind(): Games {
    return Games.DeductionSync;
  }
}

class GameSetup extends DeductionSyncGame {
  private playersByConnection: ById<ProtoPlayer> = {};
  private skin: Skin = SKINS.classic;

  removeConnection(conn: Connection): void {
    delete this.playersByConnection[conn.id];
  }

  private setConnectionRole(conn: Connection, role: RoleCard): void {
    if (!this.skin.roles.find(isEqual(role))) {
      console.error(`Invalid role ${role.name} for skin ${this.skin.skinName}`);
      return;
    }

    if (
      Object.values(this.playersByConnection).some(
        p => p.role.name === role.name
      )
    ) {
      return;
    }

    const player = this.playersByConnection[conn.id];
    if (player) {
      player.role = role;
    } else {
      this.playersByConnection[conn.id] = {
        role,
        name: '',
        isReady: false,
      };
    }
  }

  private setName(conn: Connection, name: string) {
    if (this.playersByConnection[conn.id]) {
      this.playersByConnection[conn.id].name = name;
    }
  }

  private setIsReady(conn: Connection, isReady: boolean) {
    if (this.playersByConnection[conn.id]) {
      this.playersByConnection[conn.id].isReady = isReady;
    }
  }

  private setSkin(skinName: string): void {
    if (!SKINS[skinName]) {
      console.error(`Invalid skin ${skinName} for game.`);
      return;
    }

    const skin = SKINS[skinName];

    if (this.skin === skin) {
      console.error('Skin already set.');
    } else {
      this.resetRoles();
      this.skin = skin;
    }
  }

  private resetRoles(): void {
    this.playersByConnection = {};
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
    ).reverse();

    return { solution, hands };
  }

  private start(): void {
    const protoPlayers = Object.values(this.playersByConnection);
    if (protoPlayers.length < 2 || !protoPlayers.every(p => p.isReady)) {
      return;
    }

    const { solution, hands } = this.dealCards(protoPlayers.length);

    const players = shuffle(protoPlayers).map(
      ({ role, name }: ProtoPlayer, i: number): Player => {
        if (!role) {
          throw new TypeError('Role must be set.');
        }
        return {
          role,
          name,
          isConnected: true,
          isDed: false,
          handSize: hands[i].length,
        };
      }
    );

    const game = new GameInProgress(
      this.observer,
      this.skin,
      mapValues(p => p.role, this.playersByConnection),
      players,
      hands,
      solution
    );
    this.observer.setGame(game);
  }

  processEvent(conn: Connection, event: DeductionSyncEvent): boolean {
    switch (event.kind) {
      case DeductionSyncEvents.SetRole:
        this.setConnectionRole(conn, event.data);
        break;
      case DeductionSyncEvents.SetName:
        this.setName(conn, event.data);
        break;
      case DeductionSyncEvents.SetReady:
        this.setIsReady(conn, event.data);
        break;
      case DeductionSyncEvents.SetSkin:
        this.setSkin(event.data);
        break;
      case DeductionSyncEvents.Start:
        this.start();
        break;
      default:
        console.error(`Invalid event for ${DeductionStatus.Setup}: ${event}`);
    }
    return true;
  }

  getStateForConnection(conn: Connection): GameState {
    return {
      kind: Games.DeductionSync,
      state: {
        status: DeductionStatus.Setup,
        skin: this.skin,
        playersByConnection: this.playersByConnection,
        connectionId: conn.id,
      },
    };
  }
}

abstract class GamePostSetup extends DeductionSyncGame {
  protected readonly skin: Skin;
  readonly solution: Crime;
  readonly players: Player[];
  readonly playerSecrets: PlayerSecrets[];
  protected readonly rolesByConnection: ById<RoleCard> = {};
  protected readonly roleToPlayer: Dict<Player> = {};
  protected readonly roleToPlayerSecrets: Dict<PlayerSecrets> = {};

  constructor(
    observer: GameObserver,
    skin: Skin,
    rolesByConnection: ById<RoleCard>,
    players: Player[],
    playerSecrets: PlayerSecrets[],
    solution: Crime
  ) {
    super(observer);

    this.skin = skin;
    this.rolesByConnection = rolesByConnection;
    this.players = players;
    this.playerSecrets = playerSecrets;
    this.solution = solution;

    for (let i = 0; i < players.length; i++) {
      const player = players[i];
      this.roleToPlayer[player.role.name] = players[i];
      this.roleToPlayerSecrets[player.role.name] = playerSecrets[i];
    }
  }

  removeConnection(conn: Connection): void {
    const role = this.getRole(conn);
    if (role) {
      const player = this.roleToPlayer[role.name];
      if (player) {
        player.isConnected = false;
      }
    }
  }

  protected getRole(conn: Connection): Maybe<RoleCard> {
    return this.rolesByConnection[conn.id] ?? null;
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
      console.error(`Invalid role ${role.name} for skin ${this.skin.skinName}`);
      return;
    }

    if (this.getRole(conn)) {
      // Can't switch roles mid-game.
      return;
    }

    const player = this.roleToPlayer[role.name];
    if (!player || player.isConnected) {
      return;
    }

    this.rolesByConnection[conn.id] = role;
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

interface Turn {
  processEvent(role: RoleCard, event: DeductionSyncEvent): boolean;
  getState: () => TurnState;
}

interface TurnObserver {
  readonly players: Player[];
  readonly playerSecrets: PlayerSecrets[];
  setTurn(turn: Turn): void;
}

class TurnSuggest implements Turn {
  private observer: TurnObserver;
  private suggestions: Dict<Maybe<Crime>> = {};

  constructor(observer: TurnObserver) {
    this.observer = observer;
    this.suggestions = dictFromList(observer.players, (dict, p) => {
      if (!p.isDed) {
        dict[p.role.name] = null;
      }
    });
  }

  processEvent(role: RoleCard, event: DeductionSyncEvent): boolean {
    switch (event.kind) {
      case DeductionSyncEvents.Suggest:
        this.suggest(role, event.suggestion);
        break;
      default:
        console.error(
          `Invalid event for ${TurnStatus.Suggest}: ${event}`
        );
    }
    return true;
  }

  getState(): TurnState {
    return {
      status: TurnStatus.Suggest,
      playerIsReady: mapValues(Boolean, this.suggestions),
    };
  }

  private findSharePlayer(role: RoleCard, suggestion: Crime): Maybe<PlayerCrime> {
    const cards = Object.values(suggestion);

    const n = this.observer.players.length;
    const s = this.observer.players.findIndex(p => p.role.name === role.name);
    for (let i = 1; i < n; i++) {
      const playerIndex = (i + s) % n;
      const { hand } = this.observer.playerSecrets[playerIndex];
      if (intersectionBy(c => c.name, cards, hand).length > 0) {
        return { ...suggestion, playerIndex };
      }
    }
    return null;
  }

  private suggest(role: RoleCard, suggestion: Crime) {
    this.suggestions[role.name] = suggestion;

    if (!Object.values(this.suggestions).every(Boolean)) {
      return;
    }

    const suggestions: Dict<Maybe<PlayerCrime>> = dictFromList(this.observer.players, (dict, p) => {
      dict[p.role.name] = this.findSharePlayer(p.role, this.suggestions[p.role.name])
    });

    if (Object.values(suggestions).some(Boolean)) {
      // Gather cards
      this.observer.setTurn(new TurnShare(this.observer, suggestions));
    } else {
      this.observer.setTurn(new TurnRecord(this.observer, suggestions));
      this.turnState = {
        status: TurnStatus.Record,
        suggestion,
        sharePlayerIndex: this.turnIndex,
        aharedCard: null,
        playerIsReady: this.initPlayerIsReady(),
      };
      
  }
}
}

abstract class TurnSuggested implements Turn {
  protected observer: TurnObserver;
  protected suggestions: Dict<Maybe<PlayerCrime>>;

  constructor(observer: TurnObserver, suggestions: Dict<Maybe<PlayerCrime>>) {
    this.observer = observer;
    this.suggestions = suggestions;
  }

  abstract processEvent(role: RoleCard, event: DeductionSyncEvent): boolean;
  abstract getState(): TurnState;
}

class TurnShare extends TurnSuggested {
  processEvent(role: RoleCard, event: DeductionSyncEvent): boolean {
    switch (event.kind) {
      case DeductionSyncEvents.ShareCard:
        this.shareCard(role, event.shareWith, event.shareCard);
        break;
      default:
        console.error(
          `Invalid event for ${DeductionStatus.InProgress}: ${event}`
        );
    }
    return true;
  }

  getState(): TurnState {
    return {
      status: TurnStatus.Share,
      suggestions: this.suggestions,
      playerIsReady: {},
    };
  }

  private shareCard(role: RoleCard, with: number; card: Card) {
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
        if (!p.isDed) {
          dict[p.role.name] = false;
        }
      }),
    };
  }
}

abstract class TurnShared extends TurnSuggested {
  protected playerIsReady: Dict<boolean>;

  abstract processEvent(role: RoleCard, event: DeductionSyncEvent): boolean;
  abstract getState(): TurnState;

  constructor(players: Player[]) {
    super();
    this.playerIsReady = dictFromList(players, (dict, p) => {
      if (!p.isDed) {
        dict[p.role.name] = false;
      }
    });
  }
}

class TurnRecord extends TurnShared {
  processEvent(role: RoleCard, event: DeductionSyncEvent): boolean {
    switch (event.kind) {
      case DeductionSyncEvents.SetReady:
        if (role) {
          this.setIsReady(role, event.data);
        }
        break;
      case DeductionSyncEvents.Accuse:
        if (this.isTurnPlayer(role)) {
          this.accuse(role, event.data);
        }
        break;
      default:
        console.error(
          `Invalid event for ${DeductionStatus.InProgress}: ${event}`
        );
    }
    return true;
  }
  getState(): TurnState {
    return {
      status: TurnStatus.Suggest,
      playerIsReady: {},
    };
  }

  private accuse(role: RoleCard, accusation: Crime): void {
    // check that our accusation has the correct format
    this.validateCrimeForCurrentSkin(accusation);

    const player = this.roleToPlayer[role.name];
    if (player.isDed) {
      return;
    }

    if (isEqual(accusation, this.solution)) {
      this.gameOver(player);
      return;
    }

    player.isDed = true;

    this.turnState = {
      status: TurnStatus.Accused,
      failedAccusation: accusation,
      playerIsReady: this.initPlayerIsReady(),
    };
  }
}

class GameInProgress extends GamePostSetup {
  private turn: Turn;

  constructor(
    observer: GameObserver,
    skin: Skin,
    rolesByConnection: ById<RoleCard>,
    players: Player[],
    hands: Card[][],
    solution: Crime
  ) {
    super(
      observer,
      skin,
      rolesByConnection,
      players,
      hands.map((hand, i) => ({
        index: i,
        hand,
        notes: initNotes(skin, players, i, hand),
      })),
      solution
    );

    this.turn = new TurnSuggest(players);
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

  private checkIfReady() {
    if (
      this.turnState.status !== TurnStatus.Record &&
      this.turnState.status !== TurnStatus.Accused
    ) {
      return;
    }

    if (!Object.values(this.turnState.playerIsReady).every(x => x)) {
      return;
    }

    const playersLeft = this.players.filter(p => !p.isDed);
    if (playersLeft.length > 1) {
      this.endTurn();
    } else {
      this.gameOver(playersLeft[0]);
    }
  }

  private setIsReady(role: RoleCard, isReady: boolean) {
    if (
      this.turnState.status !== TurnStatus.Record &&
      this.turnState.status !== TurnStatus.Accused
    ) {
      return;
    }

    const player = this.roleToPlayer[role.name];
    if (!player.isDed) {
      this.turnState.playerIsReady[role.name] = isReady;
      this.checkIfReady();
    }
  }

  private endTurn() {
    do {
      this.turnIndex = (this.turnIndex + 1) % this.players.length;
    } while (this.players[this.turnIndex].isDed);

    this.turnState = { status: TurnStatus.Suggest };
  }

  private gameOver(winner: Player) {
    const playerSecrets = this.players.map(
      p => this.roleToPlayerSecrets[p.role.name]
    );

    this.observer.setGame(
      new GameOver(
        this.observer,
        this.skin,
        this.rolesByConnection,
        this.players,
        playerSecrets,
        this.solution,
        this.players.indexOf(winner)
      )
    );
  }

  processEvent(conn: Connection, event: DeductionSyncEvent): boolean {
    const role = this.getRole(conn);
    switch (event.kind) {
      case DeductionSyncEvents.SetRole:
        this.setConnectionRole(conn, event.data);
        break;
      case DeductionSyncEvents.SetNote:
        if (role) {
          this.setNote(role, event.player, event.card, event.marks);
        }
        return false;
      case DeductionSyncEvents.Suggest:
        if (this.isTurnPlayer(role)) {
          this.suggest(event.suggestion);
        }
        break;
      case DeductionSyncEvents.ShareCard:
        if (this.isSharePlayer(role)) {
          this.shareCard(event.sharedCard);
        }
        break;
      case DeductionSyncEvents.SetReady:
        if (role) {
          this.setIsReady(role, event.data);
        }
        break;
      case DeductionSyncEvents.Accuse:
        if (this.isTurnPlayer(role)) {
          this.accuse(role, event.data);
        }
        break;
      default:
        console.error(
          `Invalid event for ${DeductionStatus.InProgress}: ${event}`
        );
    }
    return true;
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
    const role = this.getRole(conn);
    return {
      kind: Games.DeductionSync,
      state: {
        status: DeductionStatus.InProgress,
        skin: this.skin,
        players: this.players,
        turnIndex: this.turnIndex,
        turnState: this.getTurnStateForRole(role),
        playerSecrets: role ? this.roleToPlayerSecrets[role.name] : null,
      },
    };
  }
}

class GameOver extends GamePostSetup {
  private readonly winners: number[];

  constructor(
    observer: GameObserver,
    skin: Skin,
    rolesByConnection: ById<RoleCard>,
    players: Player[],
    playerSecrets: PlayerSecrets[],
    solution: Crime,
    winners: number[]
  ) {
    super(observer, skin, rolesByConnection, players, playerSecrets, solution);
    this.winners = winners;
  }

  processEvent(conn: Connection, event: DeductionSyncEvent): boolean {
    const role = this.getRole(conn);
    switch (event.kind) {
      case DeductionSyncEvents.SetRole:
        this.setConnectionRole(conn, event.data);
        break;
      case DeductionSyncEvents.SetNote:
        if (role) {
          this.setNote(role, event.player, event.card, event.marks);
        }
        return false;
      default:
        console.error('Event not found in processEvent', event);
    }
    return true;
  }

  getStateForConnection(conn: Connection): GameState {
    const role = this.getRole(conn);
    return {
      kind: Games.DeductionSync,
      state: {
        status: DeductionStatus.GameOver,
        skin: this.skin,
        players: this.players,
        winners: this.winners,
        solution: this.solution,
        playerSecrets: role ? this.roleToPlayerSecrets[role.name] : null,
      },
    };
  }
}

const config: GameConfig = {
  init: (observer: GameObserver) => new GameSetup(observer),
};

export default config;
