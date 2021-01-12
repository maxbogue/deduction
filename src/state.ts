import { Maybe } from '@/types';

export enum GameStatus {
  Setup = 'Setup',
  InProgress = 'InProgress',
  GameOver = 'GameOver',
}

export interface PlayerPublicState {
  role: RoleCard;
  name: string;
  isConnected: boolean;
  failedAccusation: Maybe<Crime>;
}

export interface ConnectionDescription {
  role: Maybe<RoleCard>;
  name: string;
  isReady: boolean;
}

export enum CardType {
  Role = 'Role',
  Tool = 'Tool',
  Place = 'Place',
}

export interface RoleCard {
  type: CardType.Role;
  name: string;
  color: string;
}

export interface ToolCard {
  type: CardType.Tool;
  name: string;
}

export interface PlaceCard {
  type: CardType.Place;
  name: string;
}

export type Card = RoleCard | ToolCard | PlaceCard;

export interface Skin {
  skinName: string;
  roles: RoleCard[];
  tools: ToolCard[];
  toolDescriptor: string;
  places: PlaceCard[];
}

export interface SetupState {
  status: GameStatus.Setup;
  skin: Skin;
  connections: ConnectionDescription[];
  connectionIndex: number;
}

export interface Crime {
  role: RoleCard;
  tool: ToolCard;
  place: PlaceCard;
}

export interface InProgressState {
  status: GameStatus.InProgress;
  skin: Skin;
  players: PlayerPublicState[];
  playerState: Maybe<PlayerPrivateState>;
  solution: Maybe<Crime>;
}

export interface PlayerPrivateState {
  index: number;
  hand: Card[];
}

export interface GameOverState {
  status: GameStatus.GameOver;
  skin: Skin;
  players: PlayerPublicState[];
  playerState: Maybe<PlayerPrivateState>;
  winner: number;
  solution: Crime;
}

export type GameState = SetupState | InProgressState | GameOverState;
