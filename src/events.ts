import { Games } from '@/state';
import { Maybe } from '@/types';

export enum RoomEvents {
  SetGame = 'SetGame',
  Restart = 'Restart',
  GameEvent = 'GameEvent',
}

export interface SetGameEvent {
  kind: RoomEvents.SetGame;
  game: Maybe<Games>;
}

export interface RestartEvent {
  kind: RoomEvents.Restart;
}

export interface GameEvent {
  kind: RoomEvents.GameEvent;
  event: any;
}

export type RoomEvent = SetGameEvent | RestartEvent | GameEvent;
