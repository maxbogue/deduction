import { Maybe } from '@/types';

export enum GameStatus {
  Setup = 'Setup',
  InProgress = 'InProgress',
  GameOver = 'GameOver',
}

export interface PlayerPublicState {
  role: string;
  name: string;
  isConnected: boolean;
  failedAccusation: Maybe<Crime>;
}

export interface ConnectionDescription {
  role: string;
  name: string;
  isReady: boolean;
}

export interface Skin {
  skinName: string;
  roles: string[];
  tools: string[];
  toolDescriptor: string;
  places: string[];
}

export interface SetupState {
  status: GameStatus.Setup;
  skin: Skin;
  connections: ConnectionDescription[];
  connectionIndex: number;
}

export interface Crime {
  role: string;
  tool: string;
  place: string;
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
  hand: string[];
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
