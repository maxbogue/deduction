import { DeductionState } from '@/deduction/state';

export enum Games {
  Deduction = 'Deduction',
}

interface DeductionGameState {
  kind: Games.Deduction;
  state: DeductionState;
}

export type GameState = DeductionGameState;

export interface RoomState {
  numConnections: number;
  game: GameState;
}
