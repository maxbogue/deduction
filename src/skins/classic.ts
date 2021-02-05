import { CardType, Skin } from '@/state';

export const classic: Skin = {
  skinName: 'classic',
  toolDescriptor: 'Weapon',
  roles: [
    {
      type: CardType.Role,
      name: 'Mlle. Crimson',
      color: '#a20101',
    },
    {
      type: CardType.Role,
      name: 'Lady Tangerine',
      color: '#fe8e16',
    },
    {
      type: CardType.Role,
      name: 'Gen. Dijon',
      color: '#ffc20a',
    },
    {
      type: CardType.Role,
      name: 'Sr. Tomatillo',
      color: '#a7c035',
    },
    {
      type: CardType.Role,
      name: 'Mrs. Juniper',
      color: '#7277ac',
    },
    {
      type: CardType.Role,
      name: 'Dr. Grape',
      color: '#8c38a8',
    },
    {
      type: CardType.Role,
      name: 'Ms. Fuschia',
      color: '#cc0088',
    },
    {
      type: CardType.Role,
      name: 'Chef Taupe',
      color: '#b19b81',
    },
  ],
  tools: [
    {
      type: CardType.Tool,
      name: 'Pistol',
    },
    {
      type: CardType.Tool,
      name: 'Knife',
    },
    {
      type: CardType.Tool,
      name: 'Bat',
    },
    {
      type: CardType.Tool,
      name: 'Wire',
    },
    {
      type: CardType.Tool,
      name: 'Hydroflask TM',
    },
    {
      type: CardType.Tool,
      name: 'Hammer',
    },
  ],
  places: [
    {
      type: CardType.Place,
      name: 'Nook',
    },
    {
      type: CardType.Place,
      name: 'Closet',
    },
    {
      type: CardType.Place,
      name: 'Office',
    },
    {
      type: CardType.Place,
      name: 'Bedroom',
    },
    {
      type: CardType.Place,
      name: 'Den',
    },
    {
      type: CardType.Place,
      name: 'Entryway',
    },
    {
      type: CardType.Place,
      name: 'Master Bath',
    },
    {
      type: CardType.Place,
      name: 'Pantry',
    },
  ],
};
