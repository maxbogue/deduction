import curry from 'lodash/fp/curry';

import { Player, RoleCard } from './state';

export const playerHasRole = curry(
  (r: RoleCard, p: Player) => p.role.name === r.name
);

export const isAlive = (player: Player): boolean => !player.isDed;
