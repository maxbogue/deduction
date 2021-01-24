import { Card, Crime, Player, RoleCard } from '@/state';

export enum ConnectionEvents {
  Accuse = 'Accuse',
  Restart = 'Restart',
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

export interface RestartEvent {
  type: ConnectionEvents.Restart;
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
  | RestartEvent
  | SetNameEvent
  | SetNoteEvent
  | SetReadyEvent
  | SetRoleEvent
  | SetSkinEvent
  | ShareCardEvent
  | StartEvent
  | SuggestEvent;
