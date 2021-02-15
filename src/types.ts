export type Maybe<T> = T | null;
export interface Dict<T> {
  [key: string]: T;
}
export interface ById<T> {
  [id: number]: T;
}
