import curry from 'lodash/fp/curry';
import flow from 'lodash/fp/flow';
import intersectionBy from 'lodash/fp/intersectionBy';
import isEqual from 'lodash/fp/isEqual';
import mapValues from 'lodash/fp/mapValues';
import overSome from 'lodash/fp/overSome';
import pick from 'lodash/fp/pick';
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
  PlayerSecrets,
  ProtoPlayer,
  RoleCard,
  Skin,
  TurnState,
  TurnStatus,
} from './state';

type Predicate<T> = (v: T) => boolean;
type Entry<V, K = string> = [K, V];

const not = <T>(p: Predicate<T>): Predicate<T> => flow(p, b => !b);
const getEntryKey = <K, V>(e: [K, V]): K => e[0];
const getEntryValue = <K, V>(e: [K, V]): V => e[1];

const fromEntries = <V>(entries: Array<Entry<V>>) =>
  dictFromList<Entry<V>, V>(entries, (dict, [k, v]: Entry<V>) => {
    dict[k] = v;
  });

const playerHasRole = curry((r: RoleCard, p: Player) => p.role.name === r.name);

function assertExists<T>(v: T | null | undefined): T {
  if (!v) {
    throw new Error('Must be defined.');
  }
  return v;
}

function checkDict<T>(dict: Dict<Maybe<T>>): dict is Dict<T> {
  return Object.values(dict).every(Boolean);
}

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

abstract class Turn {
  protected observer: TurnObserver;

  constructor(observer: TurnObserver) {
    this.observer = observer;
  }

  abstract processEvent(role: RoleCard, event: DeductionSyncEvent): boolean;
  abstract getStateForRole(role: Maybe<RoleCard>): TurnState;

  protected getPlayerById = (i: number): Player => this.observer.players[i];
  protected getPlayerByRoleName = (roleName: string): Player =>
    assertExists(this.observer.players.find(p => p.role.name === roleName));
}

interface TurnObserver {
  readonly players: Player[];
  readonly playerSecrets: PlayerSecrets[];
  setTurn: (turn: Turn) => void;
  gameOver: (winners: Player[]) => void;
  isSolution: (accusation: Crime) => boolean;
}

class TurnSuggest extends Turn {
  private suggestions: Dict<Maybe<Crime>> = {};

  constructor(observer: TurnObserver) {
    super(observer);
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
        console.error(`Invalid event for ${TurnStatus.Suggest}: ${event}`);
    }
    return true;
  }

  getStateForRole(role: Maybe<RoleCard>): TurnState {
    return {
      status: TurnStatus.Suggest,
      suggestion: role ? this.suggestions[role.name] : null,
      playerIsReady: mapValues(Boolean, this.suggestions),
    };
  }

  private findSharePlayer(role: RoleCard, suggestion: Crime): number {
    const cards = Object.values(suggestion);

    const n = this.observer.players.length;
    const s = this.observer.players.findIndex(p => p.role.name === role.name);
    for (let i = 1; i < n; i++) {
      const playerIndex = (i + s) % n;
      const { hand } = this.observer.playerSecrets[playerIndex];
      if (intersectionBy(c => c.name, cards, hand).length > 0) {
        return playerIndex;
      }
    }
    return s;
  }

  private suggest(role: RoleCard, suggestion: Crime) {
    const { suggestions } = this;

    suggestions[role.name] = suggestion;
    if (!checkDict(suggestions)) {
      return;
    }

    const sharePlayers: Dict<number> = dictFromList(
      this.observer.players,
      (dict, p) => {
        dict[p.role.name] = this.findSharePlayer(
          p.role,
          suggestions[p.role.name]
        );
      }
    );

    this.observer.setTurn(
      new TurnShare(this.observer, suggestions, sharePlayers)
    );
  }
}

abstract class TurnSuggested extends Turn {
  protected suggestions: Dict<Crime>;
  protected sharePlayers: Dict<number>;

  constructor(
    observer: TurnObserver,
    suggestions: Dict<Crime>,
    sharePlayers: Dict<number>
  ) {
    super(observer);
    this.suggestions = suggestions;
    this.sharePlayers = sharePlayers;
  }

  abstract processEvent(role: RoleCard, event: DeductionSyncEvent): boolean;
  abstract getStateForRole(role: Maybe<RoleCard>): TurnState;
}

class TurnShare extends TurnSuggested {
  private sharedCards: Dict<Maybe<Card>>;

  constructor(
    observer: TurnObserver,
    suggestions: Dict<Crime>,
    sharePlayers: Dict<number>
  ) {
    super(observer, suggestions, sharePlayers);
    this.sharedCards = dictFromList(observer.players, (dict, p) => {
      const sharePlayerIndex = sharePlayers[p.role.name];
      if (p !== observer.players[sharePlayerIndex]) {
        dict[p.role.name] = null;
      }
    });
    this.checkIfReady();
  }

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

  getStateForRole(role: Maybe<RoleCard>): TurnState {
    return {
      status: TurnStatus.Share,
      suggestions: this.suggestions,
      sharePlayers: this.sharePlayers,
      sharedCards: role ? this.getSharedCardsForRole(role) : {},
      playerIsReady: this.getPlayerIsReady(),
    };
  }

  private getPlayerIsReady(): Dict<boolean> {
    return dictFromList(this.observer.players, (dict, p) => {
      const sharedCards = this.getSharedCardsForRole(p.role);
      dict[p.role.name] = Object.values(sharedCards).every(Boolean);
    });
  }

  private shareCard(role: RoleCard, shareWithIndex: number, card: Card): void {
    const shareWith = this.observer.players[shareWithIndex];
    if (!playerHasRole(role, this.getSharePlayer(shareWith))) {
      return;
    }
    this.sharedCards[shareWith.role.name] = card;
    this.checkIfReady();
  }

  private getSharedCardsForRole(role: RoleCard): Dict<Maybe<Card>> {
    const lookupPlayer = (i: number): Player => this.observer.players[i];

    const shareWithRoleNames = Object.entries(this.sharePlayers)
      .filter(flow(getEntryValue, lookupPlayer, playerHasRole(role)))
      .map(getEntryKey);

    return pick(shareWithRoleNames, this.sharedCards);
  }

  private getSharePlayer(shareWith: Player): Player {
    const sharePlayerIndex = this.sharePlayers[shareWith.role.name];
    return this.observer.players[sharePlayerIndex];
  }

  private checkIfReady() {
    const { sharedCards } = this;
    if (!checkDict(sharedCards)) {
      return;
    }
    this.observer.setTurn(
      new TurnRecord(
        this.observer,
        this.suggestions,
        this.sharePlayers,
        sharedCards
      )
    );
  }
}

class TurnRecord extends TurnSuggested {
  private sharedCards: Dict<Card>;
  private accusations: Dict<Maybe<Crime>>;
  private playerIsReady: Dict<boolean>;

  constructor(
    observer: TurnObserver,
    suggestions: Dict<Crime>,
    sharePlayers: Dict<number>,
    sharedCards: Dict<Card>
  ) {
    super(observer, suggestions, sharePlayers);
    this.sharedCards = sharedCards;
    this.playerIsReady = dictFromList(observer.players, (dict, p) => {
      if (!p.isDed) {
        dict[p.role.name] = false;
      }
    });
    this.accusations = dictFromList(observer.players, (acc, p) => {
      if (!p.isDed) {
        acc[p.role.name] = null;
      }
    });
  }

  processEvent(role: RoleCard, event: DeductionSyncEvent): boolean {
    switch (event.kind) {
      case DeductionSyncEvents.SetReady:
        this.setIsReady(role, event.data);
        break;
      case DeductionSyncEvents.Accuse:
        this.accuse(role, event.data);
        break;
      default:
        console.error(
          `Invalid event for ${DeductionStatus.InProgress}: ${event}`
        );
    }
    return true;
  }

  getStateForRole(role: Maybe<RoleCard>): TurnState {
    return {
      status: TurnStatus.Record,
      suggestions: this.suggestions,
      sharePlayers: this.sharePlayers,
      sharedCards: role ? this.getSharedCardsForRole(role) : {},
      accusation: role ? this.accusations[role.name] : null,
      playerIsReady: this.playerIsReady,
    };
  }

  private accuse(role: RoleCard, accusation: Crime): void {
    const player = this.observer.players.find(p => p.role.name === role.name);
    if (!player || player.isDed) {
      return;
    }
    this.accusations[role.name] = accusation;
    this.playerIsReady[role.name] = true;
    this.checkIfReady();
  }

  private getSharedCardsForRole(role: RoleCard): Dict<Maybe<Card>> {
    const isSharePlayer = flow(
      getEntryValue,
      this.getPlayerById,
      playerHasRole(role)
    );
    const isShareWithPlayer = flow(
      getEntryKey,
      this.getPlayerByRoleName,
      playerHasRole(role)
    );

    const shareWithRoleNames = Object.entries(this.sharePlayers)
      .filter(overSome([isSharePlayer, isShareWithPlayer]))
      .map(getEntryKey);

    return pick(shareWithRoleNames, this.sharedCards);
  }

  private setIsReady(role: RoleCard, isReady: boolean) {
    if (this.accusations[role.name]) {
      return;
    }

    const player = this.observer.players.find(playerHasRole(role));
    if (player && !player.isDed) {
      this.playerIsReady[role.name] = isReady;
      this.checkIfReady();
    }
  }

  private checkIfReady() {
    if (!Object.values(this.playerIsReady).every(x => x)) {
      return;
    }

    const checkEntryValue = flow(getEntryValue, Boolean) as <T>(
      e: [string, Maybe<T>]
    ) => e is [string, T];
    const accusationEntries: Array<[string, Crime]> = Object.entries(
      this.accusations
    ).filter(checkEntryValue);

    const loserEntries = accusationEntries.filter(
      flow(getEntryValue, not(this.isSolution))
    );
    const losers = loserEntries.map(
      flow(getEntryKey, this.getPlayerByRoleName)
    );

    losers.forEach(loser => {
      loser.isDed = true;
    });

    const winners = accusationEntries
      .filter(flow(getEntryValue, this.isSolution))
      .map(flow(getEntryKey, this.getPlayerByRoleName));

    if (winners.length > 0) {
      this.observer.gameOver(winners);
      return;
    }

    const playersLeft = this.observer.players.filter(p => !p.isDed);
    if (playersLeft.length < 2) {
      this.observer.gameOver(playersLeft);
      return;
    }

    if (losers.length > 0) {
      this.observer.setTurn(
        new TurnAccused(this.observer, fromEntries(loserEntries))
      );
    } else {
      // No accusations; back to beginning.
      this.observer.setTurn(new TurnSuggest(this.observer));
    }
  }

  private isSolution = (accusation: Crime): boolean =>
    accusation ? this.observer.isSolution(accusation) : false;
}

class TurnAccused extends Turn {
  private failedAccusations: Dict<Crime>;
  private playerIsReady: Dict<boolean>;

  constructor(observer: TurnObserver, failedAccusations: Dict<Crime>) {
    super(observer);
    this.failedAccusations = failedAccusations;
    this.playerIsReady = dictFromList(observer.players, (dict, p) => {
      if (!p.isDed) {
        dict[p.role.name] = false;
      }
    });
  }

  processEvent(role: RoleCard, event: DeductionSyncEvent): boolean {
    switch (event.kind) {
      case DeductionSyncEvents.SetReady:
        this.setIsReady(role, event.data);
        break;
      default:
        console.error(`Invalid event for ${TurnStatus.Accused}: ${event}`);
    }
    return true;
  }

  getStateForRole(): TurnState {
    return {
      status: TurnStatus.Accused,
      failedAccusations: this.failedAccusations,
      playerIsReady: this.playerIsReady,
    };
  }

  protected checkIfReady() {
    if (Object.values(this.playerIsReady).every(x => x)) {
      this.observer.setTurn(new TurnSuggest(this.observer));
    }
  }

  protected setIsReady(role: RoleCard, isReady: boolean) {
    const player = this.observer.players.find(playerHasRole(role));
    if (player && !player.isDed) {
      this.playerIsReady[role.name] = isReady;
      this.checkIfReady();
    }
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

    this.turn = new TurnSuggest(this);
  }

  setTurn(turn: Turn) {
    this.turn = turn;
  }

  isSolution(accusation: Crime): boolean {
    return isEqual(accusation, this.solution);
  }

  gameOver(winners: Player[]) {
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
        winners.map(w => this.players.indexOf(w))
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
      default:
        if (role) {
          this.turn.processEvent(role, event);
        }
    }
    return true;
  }

  getStateForConnection(conn: Connection): GameState {
    const role = this.getRole(conn);
    return {
      kind: Games.DeductionSync,
      state: {
        status: DeductionStatus.InProgress,
        skin: this.skin,
        players: this.players,
        playerSecrets: role ? this.roleToPlayerSecrets[role.name] : null,
        turnState: this.turn.getStateForRole(role),
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
