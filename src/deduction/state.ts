import { ById, Dict, Maybe } from '@/types';

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

export interface Crime {
  role: RoleCard;
  tool: ToolCard;
  place: PlaceCard;
}

export interface ProtoPlayer {
  role: RoleCard;
  name: string;
  isReady: boolean;
}

export interface Player {
  role: RoleCard;
  name: string;
  isConnected: boolean;
  isDed: boolean;
  handSize: number;
}

export enum Mark {
  Q = '?',
  D = '•',
  X = '✕',
  E = '!',
  W = '◦',
  N1 = '1',
  N2 = '2',
  N3 = '3',
  N4 = '4',
  N5 = '5',
  N6 = '6',
  N7 = '7',
}

export interface PlayerSecrets {
  index: number;
  hand: Card[];
  notes: Dict<Dict<Mark[]>>;
}

export enum TurnStatus {
  Suggest = 'Suggest',
  Share = 'Share',
  Record = 'Record',
  Accused = 'Accused',
}

export interface TurnSuggestState {
  status: TurnStatus.Suggest;
}

export interface TurnShareState {
  status: TurnStatus.Share;
  suggestion: Crime;
  sharePlayerIndex: number;
}

export interface TurnRecordState {
  status: TurnStatus.Record;
  suggestion: Crime;
  sharePlayerIndex: number;
  sharedCard: Maybe<Card>;
  playerIsReady: Dict<boolean>;
}

export interface TurnAccusedState {
  status: TurnStatus.Accused;
  failedAccusation: Crime;
  playerIsReady: Dict<boolean>;
}

export type TurnState =
  | TurnSuggestState
  | TurnShareState
  | TurnRecordState
  | TurnAccusedState;

export enum DeductionStatus {
  Setup = 'Setup',
  InProgress = 'InProgress',
  GameOver = 'GameOver',
}

export interface SetupState {
  status: DeductionStatus.Setup;
  skin: Skin;
  playersByConnection: ById<ProtoPlayer>;
  connectionId: number;
}

interface PostSetupState {
  skin: Skin;
  players: Player[];
  playerSecrets: Maybe<PlayerSecrets>;
}

export interface InProgressState extends PostSetupState {
  status: DeductionStatus.InProgress;
  turnIndex: number;
  turnState: TurnState;
}

export interface GameOverState extends PostSetupState {
  status: DeductionStatus.GameOver;
  winner: number;
  solution: Crime;
}

export type DeductionState = SetupState | InProgressState | GameOverState;
