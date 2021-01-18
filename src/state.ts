import { Dict, Maybe } from '@/types';

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

export interface ConnectionDescription {
  role: Maybe<RoleCard>;
  name: string;
  isReady: boolean;
}

export interface Player {
  role: RoleCard;
  name: string;
  isConnected: boolean;
  failedAccusation: Maybe<Crime>;
}

export interface PlayerSecrets {
  index: number;
  hand: Card[];
  notes: Dict<Dict<string[]>>;
}

export enum TurnStatus {
  Suggest = 'Suggest',
  Share = 'Share',
  Record = 'Record',
}

export interface TurnSuggestState {
  status: TurnStatus.Suggest;
}

export interface TurnShareState {
  status: TurnStatus.Share;
  suggestion: Crime;
  sharingPlayerIndex: number;
}

export interface TurnRecordState {
  status: TurnStatus.Record;
  sharedPlayerIndex: number;
  sharedCard: Maybe<Card>;
}

export type TurnState = TurnSuggestState | TurnShareState | TurnRecordState;

export enum GameStatus {
  Setup = 'Setup',
  InProgress = 'InProgress',
  GameOver = 'GameOver',
}

export interface SetupState {
  status: GameStatus.Setup;
  skin: Skin;
  connections: ConnectionDescription[];
  connectionIndex: number;
}

interface PostSetupState {
  skin: Skin;
  players: Player[];
  playerSecrets: Maybe<PlayerSecrets>;
}

export interface InProgressState extends PostSetupState {
  status: GameStatus.InProgress;
  solution: Maybe<Crime>;
  turnIndex: number;
  turnState: TurnState;
}

export interface GameOverState extends PostSetupState {
  status: GameStatus.GameOver;
  winner: number;
  solution: Crime;
}

export type GameState = SetupState | InProgressState | GameOverState;
