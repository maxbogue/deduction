import { Maybe } from '@/types';

export enum GameStatus {
  Setup = 'Setup',
  InProgress = 'InProgress',
}

export interface PlayerPublicState {
  role: string;
  name: string;
  connected: boolean;
}

export interface ConnectionDescription {
  role: string;
  name: string;
  isReady: boolean;
}

export interface Skin {
  skinName: string;
  roles: string[];
  objects: string[];
  objectDescriptor: string;
  places: string[];
}

export interface SetupState {
  status: GameStatus.Setup;
  connections: ConnectionDescription[];
  skin: Skin;
  connectionIndex: number;
}

export interface Crime {
  role: string;
  object: string;
  place: string;
}

export interface InProgressState {
  status: GameStatus.InProgress;
  players: PlayerPublicState[];
  solution: Maybe<Crime>;
  playerState: Maybe<PlayerPrivateState>;
  skin: Skin;
}

export interface PlayerPrivateState {
  hand: string[];
}

export type GameState = SetupState | InProgressState;
