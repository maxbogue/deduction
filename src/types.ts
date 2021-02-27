export type Maybe<T> = T | null;
export type Predicate<T> = (v: T) => boolean;
export type Entry<V, K = string> = [K, V];
export interface Dict<T> {
  [key: string]: T;
}
export interface ById<T> {
  [id: number]: T;
}
