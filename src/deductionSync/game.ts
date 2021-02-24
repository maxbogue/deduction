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
  processEvent: (role: RoleCard, event: DeductionSyncEvent) => boolean;
  getStateForRole: (role: Maybe<RoleCard>) => TurnState;
}

interface TurnObserver {
  readonly players: Player[];
  readonly playerSecrets: PlayerSecrets[];
  setTurn: (turn: Turn) => void;
  gameOver: (winners: Player[]) => void;
}

function checkDict<T>(dict: Dict<Maybe<T>>): dict is Dict<T> {
  return Object.values(dict).every(Boolean);
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
        console.error(`Invalid event for ${TurnStatus.Suggest}: ${event}`);
    }
    return true;
  }

  getStateForRole(role: Maybe<RoleCard>): TurnState {
    return {
      status: TurnStatus.Suggest,
      yourSuggestion: role ? this.suggestions[role.name] : null,
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

abstract class TurnSuggested implements Turn {
  protected observer: TurnObserver;
  protected suggestions: Dict<Crime>;
  protected sharePlayers: Dict<number>;

  constructor(
    observer: TurnObserver,
    suggestions: Dict<Crime>,
    sharePlayers: Dict<number>
  ) {
    this.observer = observer;
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

  getStateForRole(): TurnState {
    return {
      status: TurnStatus.Share,
      suggestions: this.suggestions,
      sharePlayers: this.sharePlayers,
      playerIsReady: mapValues(Boolean, this.sharedCards),
    };
  }

  private shareCard(role: RoleCard, shareWith: number, card: Card): void {
    //TODO validate the card
  }
}

//abstract class TurnShared extends TurnSuggested {
//  protected sharedCards: Dict<Maybe<Card>>;
//  protected playerIsReady: Dict<boolean>;
//
//  abstract processEvent(role: RoleCard, event: DeductionSyncEvent): boolean;
//  abstract getStateForRole(role: Maybe<RoleCard>): TurnState;
//
//  constructor(
//    observer: TurnObserver,
//    suggestions: Dict<Maybe<PlayerCrime>>,
//    sharedCards: Dict<Maybe<Card>>
//  ) {
//    super(observer, suggestions);
//    this.sharedCards = sharedCards;
//    this.playerIsReady = dictFromList(observer.players, (dict, p) => {
//      if (!p.isDed) {
//        dict[p.role.name] = false;
//      }
//    });
//  }
//
//  protected checkIfReady() {
//    if (!Object.values(this.playerIsReady).every(x => x)) {
//      return;
//    }
//
//    //TODO handle accusations
//    const playersLeft = this.observer.players.filter(p => !p.isDed);
//    if (playersLeft.length > 1) {
//      this.observer.setTurn(new TurnSuggest(this.observer));
//    }
//  }
//
//  protected setIsReady(role: RoleCard, isReady: boolean) {
//    const player = this.observer.players.find(p => p.role.name === role.name);
//    if (player && !player.isDed) {
//      this.playerIsReady[role.name] = isReady;
//      this.checkIfReady();
//    }
//  }
//}

//class TurnRecord extends TurnShared {
//  private accusations: Dict<Crime>;
//
//  processEvent(role: RoleCard, event: DeductionSyncEvent): boolean {
//    switch (event.kind) {
//      case DeductionSyncEvents.SetReady:
//        this.setIsReady(role, event.data);
//        break;
//      case DeductionSyncEvents.Accuse:
//        this.accuse(role, event.data);
//        break;
//      default:
//        console.error(
//          `Invalid event for ${DeductionStatus.InProgress}: ${event}`
//        );
//    }
//    return true;
//  }
//
//  getStateForRole(role: Maybe<RoleCard>): TurnState {
//    return {
//      status: TurnStatus.Record,
//      suggestions: this.suggestions,
//      sharePlayerIndex: this.sharePlayerIndex,
//      sharedCard: this.sharedCards[role.name],
//      playerIsReady: this.playerIsReady,
//    };
//  }
//
//  private accuse(role: RoleCard, accusation: Crime): void {
//    const player = this.roleToPlayer[role.name];
//    if (player.isDed) {
//      return;
//    }
//
//    if (isEqual(accusation, this.solution)) {
//      this.observer.gameOver([player]);
//      return;
//    }
//
//    player.isDed = true;
//
//    //TODO: switch to accused state
//  }
//}

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
