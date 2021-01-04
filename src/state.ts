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

export interface SetupState {
  status: GameStatus.Setup;
  connections: ConnectionDescription[];
  availableRoles: string[];
}

export interface Crime {
  role: string,
  object: string,
  place: string
}

export interface InProgressState {
  status: GameStatus.InProgress;
  players: PlayerPublicState[];
  solution: Maybe<Crime>;
  playerState: Maybe<PlayerPrivateState>;
}

export interface PlayerPrivateState {
  hand: string[];
}

export type GameState = SetupState | InProgressState;
