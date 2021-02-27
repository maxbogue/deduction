import { DeductionEvents } from '@/deduction/events';

import { Card, Crime, Mark, Player, RoleCard } from './state';

export { DeductionEvents as DeductionSyncEvents } from '@/deduction/events';

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
  shareWith: number;
  shareCard: Card;
}

export interface StartEvent {
  kind: DeductionEvents.Start;
}

export interface SuggestEvent {
  kind: DeductionEvents.Suggest;
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
