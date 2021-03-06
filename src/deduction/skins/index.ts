import { Skin } from '@/deduction/state';
import { Dict } from '@/types';

import { classic } from './classic';
import { familyCookies } from './familyCookies';

export const SKINS: Dict<Skin> = {
  classic,
  familyCookies,
};
