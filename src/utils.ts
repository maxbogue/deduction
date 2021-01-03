export const repeat = <T>(f: (i: number) => T, n: number): T[] => {
  const ls = [];
  for (let i = 0; i < n; i++) {
    ls.push(f(i));
  }
  return ls;
};

// Removes one item from the list and returns it.
export const pickOne = <T>(items: T[]): T => {
  const i = Math.floor(Math.random() * items.length);
  return items.splice(i, 1)[0]
};

export const pickMany = <T>(items: T[], n: number): T[] =>
  repeat(() => pickOne(items), n);
