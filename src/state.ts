import { DeductionState } from '@/deduction/state';
import { DeductionSyncState } from '@/deductionSync/state';

export enum Games {
  Deduction = 'Deduction',
  DeductionSync = 'DeductionSync',
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
  game: GameState;
}
