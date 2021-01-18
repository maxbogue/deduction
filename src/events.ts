import { Card, Crime, Player, RoleCard } from '@/state';

export enum ConnectionEvents {
  Accuse = 'Accuse',
  EndTurn = 'EndTurn',
  SetName = 'SetName',
  SetNote = 'SetNote',
  SetReady = 'SetReady',
  SetRole = 'SetRole',
  SetSkin = 'SetSkin',
  ShareCard = 'ShareCard',
  Start = 'Start',
  Suggest = 'Suggest',
}

export interface AccuseEvent {
  type: ConnectionEvents.Accuse;
  data: Crime;
}

export interface EndTurnEvent {
  type: ConnectionEvents.EndTurn;
}

export interface SetNameEvent {
  type: ConnectionEvents.SetName;
  data: string;
}

export interface SetNoteEvent {
  type: ConnectionEvents.SetNote;
  player: Player;
  card: Card;
  marks: string[];
}

export interface SetReadyEvent {
  type: ConnectionEvents.SetReady;
  data: boolean;
}

export interface SetRoleEvent {
  type: ConnectionEvents.SetRole;
  data: RoleCard;
}

export interface SetSkinEvent {
  type: ConnectionEvents.SetSkin;
  data: string;
}

export interface ShareCardEvent {
  type: ConnectionEvents.ShareCard;
  sharedCard: Card;
}

export interface StartEvent {
  type: ConnectionEvents.Start;
}

export interface SuggestEvent {
  type: ConnectionEvents.Suggest;
  suggestion: Crime;
}

export type ConnectionEvent =
  | AccuseEvent
  | EndTurnEvent
  | SetNameEvent
  | SetNoteEvent
  | SetReadyEvent
  | SetRoleEvent
  | SetSkinEvent
  | ShareCardEvent
  | StartEvent
  | SuggestEvent;
