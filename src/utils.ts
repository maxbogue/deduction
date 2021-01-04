// Generates an array of length n by repeatedly invoking f.
export const repeat = <T>(f: (i: number) => T, n: number): T[] => {
  const ls = [];
  for (let i = 0; i < n; i++) {
    ls.push(f(i));
  }
  return ls;
};

// Removes one random item from the list and returns it.
export const pickOne = <T>(ls: T[]): T => {
  const i = Math.floor(Math.random() * ls.length);
  return ls.splice(i, 1)[0];
};

// Removes n random items from the list and returns them.
export const pickMany = <T>(ls: T[], n: number): T[] =>
  repeat(() => pickOne(ls), n);
