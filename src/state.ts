import { DeductionState } from '@/deduction/state';
import { DeductionSyncState } from '@/deductionSync/state';
import { Maybe } from '@/types';

export enum Games {
  Deduction = 'Deduction',
  DeductionSync = 'Deduction 2.0',
}

interface DeductionGameState {
  kind: Games.Deduction;
  state: DeductionState;
}

interface DeductionSyncGameState {
  kind: Games.DeductionSync;
  state: DeductionSyncState;
}

export type GameState = DeductionGameState | DeductionSyncGameState;

export interface RoomState {
  numConnections: number;
  game: Maybe<GameState>;
}
