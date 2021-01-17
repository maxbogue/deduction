import { Card, Crime, Player, RoleCard } from '@/state';

export enum ConnectionEvents {
  Accuse = 'Accuse',
  SetName = 'SetName',
  SetNote = 'SetNote',
  SetReady = 'SetReady',
  SetRole = 'SetRole',
  SetSkin = 'SetSkin',
  Start = 'Start',
}

export interface AccuseEvent {
  type: ConnectionEvents.Accuse;
  data: Crime;
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

export interface StartEvent {
  type: ConnectionEvents.Start;
}

export type ConnectionEvent =
  | AccuseEvent
  | SetNameEvent
  | SetNoteEvent
  | SetReadyEvent
  | SetRoleEvent
  | SetSkinEvent
  | StartEvent;
