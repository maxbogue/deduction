import {
  Card,
  Crime,
  DeductionStatus,
  Player,
  PlayerSecrets,
  SetupState,
  Skin,
  TurnStatus,
} from '@/deduction/state';
import { Dict, Maybe } from '@/types';

export {
  Card,
  Crime,
  DeductionStatus,
  Mark,
  Player,
  PlayerSecrets,
  ProtoPlayer,
  RoleCard,
  SetupState,
  Skin,
  TurnStatus,
} from '@/deduction/state';

export interface PlayerCrime extends Crime {
  playerIndex: number;
}

export interface TurnSuggestState {
  status: TurnStatus.Suggest;
  playerIsReady: Dict<boolean>;
}

export interface TurnShareState {
  status: TurnStatus.Share;
  suggestions: Crime[];
  playerIsReady: Dict<boolean>;
}

export interface TurnRecordState {
  status: TurnStatus.Record;
  suggestions: PlayerCrime[];
  sharedCard: Maybe<Card>;
  playerIsReady: Dict<boolean>;
}

export interface TurnAccusedState {
  status: TurnStatus.Accused;
  failedAccusations: PlayerCrime[];
  playerIsReady: Dict<boolean>;
}

export type TurnState =
  | TurnSuggestState
  | TurnShareState
  | TurnRecordState
  | TurnAccusedState;

interface PostSetupState {
  skin: Skin;
  players: Player[];
  playerSecrets: Maybe<PlayerSecrets>;
}

export interface InProgressState extends PostSetupState {
  status: DeductionStatus.InProgress;
  turnState: TurnState;
}

export interface GameOverState extends PostSetupState {
  status: DeductionStatus.GameOver;
  winners: number[];
  solution: Crime;
}

export type DeductionSyncState = SetupState | InProgressState | GameOverState;
