import flow from 'lodash/fp/flow';

import { Dict, Entry, Maybe, Predicate } from '@/types';

// Generates an array of length n by repeatedly invoking f.
export const repeat = <T>(f: (i: number) => T, n: number): T[] => {
  const ls = [];
  for (let i = 0; i < n; i++) {
    ls.push(f(i));
  }
  return ls;
};

export const dictFromList = <E, K>(
  ls: E[],
  f: (acc: Dict<K>, x: E, i: number) => void
): Dict<K> => {
  const dict: Dict<K> = {};
  ls.forEach((x, i) => {
    f(dict, x, i);
  });
  return dict;
};

// Returns one random item from the list.
export const chooseOne = <T>(ls: T[]): T =>
  ls[Math.floor(Math.random() * ls.length)];

// Removes one random item from the list and returns it.
export const pickOne = <T>(ls: T[]): T => {
  const i = Math.floor(Math.random() * ls.length);
  return ls.splice(i, 1)[0];
};

// Removes n random items from the list and returns them.
export const pickMany = <T>(ls: T[], n: number): T[] =>
  repeat(() => pickOne(ls), n);

export const not = <T>(p: Predicate<T>): Predicate<T> => flow(p, b => !b);
export const getEntryKey = <K, V>(e: [K, V]): K => e[0];
export const getEntryValue = <K, V>(e: [K, V]): V => e[1];

export const fromEntries = <V>(entries: Array<Entry<V>>): Dict<V> =>
  dictFromList<Entry<V>, V>(entries, (dict, [k, v]: Entry<V>) => {
    dict[k] = v;
  });

export function assertExists<T>(v: T | null | undefined): T {
  if (!v) {
    throw new Error('Must be defined.');
  }
  return v;
}

export function checkDict<T>(dict: Dict<Maybe<T>>): dict is Dict<T> {
  return Object.values(dict).every(Boolean);
}
