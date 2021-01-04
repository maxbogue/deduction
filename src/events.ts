import { Crime } from '@/state';

export enum ConnectionEvents {
  SetRole = 'SetRole',
  SetName = 'SetName',
  SetReady = 'SetReady',
  SetSkin = 'SetSkin',
  Start = 'Start',
  Accuse = 'Accuse',
}

export interface SetRoleEvent {
  type: ConnectionEvents.SetRole;
  data: string;
}

export interface SetNameEvent {
  type: ConnectionEvents.SetName;
  data: string;
}

export interface SetReadyEvent {
  type: ConnectionEvents.SetReady;
  data: boolean;
}

export interface SetSkinEvent {
  type: ConnectionEvents.SetSkin;
  data: string;
}

export interface StartEvent {
  type: ConnectionEvents.Start;
}

export interface AccuseEvent {
  type: ConnectionEvents.Accuse;
  data: Crime;
}

export type ConnectionEvent =
  | SetRoleEvent
  | SetNameEvent
  | SetReadyEvent
  | StartEvent
  | SetSkinEvent
  | AccuseEvent;
