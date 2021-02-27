import { Card, Crime, Mark, Player, RoleCard } from '@/deduction/state';

export enum DeductionEvents {
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
  kind: DeductionEvents.Accuse;
  data: Crime;
}

export interface SetNameEvent {
  kind: DeductionEvents.SetName;
  data: string;
}

export interface SetNoteEvent {
  kind: DeductionEvents.SetNote;
  player: Player;
  card: Card;
  marks: Mark[];
}

export interface SetReadyEvent {
  kind: DeductionEvents.SetReady;
  data: boolean;
}

export interface SetRoleEvent {
  kind: DeductionEvents.SetRole;
  data: RoleCard;
}

export interface SetSkinEvent {
  kind: DeductionEvents.SetSkin;
  data: string;
}

export interface ShareCardEvent {
  kind: DeductionEvents.ShareCard;
  sharedCard: Card;
}

export interface StartEvent {
  kind: DeductionEvents.Start;
}

export interface SuggestEvent {
  kind: DeductionEvents.Suggest;
  suggestion: Crime;
}

export type SetupEvent =
  | SetNameEvent
  | SetReadyEvent
  | SetRoleEvent
  | StartEvent;

export type DeductionEvent =
  | SetupEvent
  | AccuseEvent
  | SetNoteEvent
  | SetSkinEvent
  | ShareCardEvent
  | SuggestEvent;
