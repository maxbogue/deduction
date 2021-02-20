import { Card, Crime, Mark, Player, RoleCard } from './state';

export enum DeductionSyncEvents {
  Accuse = 'Accuse',
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
  kind: DeductionSyncEvents.Accuse;
  data: Crime;
}

export interface SetNameEvent {
  kind: DeductionSyncEvents.SetName;
  data: string;
}

export interface SetNoteEvent {
  kind: DeductionSyncEvents.SetNote;
  player: Player;
  card: Card;
  marks: Mark[];
}

export interface SetReadyEvent {
  kind: DeductionSyncEvents.SetReady;
  data: boolean;
}

export interface SetRoleEvent {
  kind: DeductionSyncEvents.SetRole;
  data: RoleCard;
}

export interface SetSkinEvent {
  kind: DeductionSyncEvents.SetSkin;
  data: string;
}

export interface ShareCardEvent {
  kind: DeductionSyncEvents.ShareCard;
  shareWith: number;
  shareCard: Card;
}

export interface StartEvent {
  kind: DeductionSyncEvents.Start;
}

export interface SuggestEvent {
  kind: DeductionSyncEvents.Suggest;
  suggestion: Crime;
}

export type DeductionSyncEvent =
  | AccuseEvent
  | SetNameEvent
  | SetNoteEvent
  | SetReadyEvent
  | SetRoleEvent
  | SetSkinEvent
  | ShareCardEvent
  | StartEvent
  | SuggestEvent;
