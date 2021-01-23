<template>
  <table class="notepad">
    <tr>
      <th />
      <th v-for="player in players" :key="player.role.name">
        <div class="notepad__player-header">{{ player.name }}</div>
      </th>
    </tr>
    <tr>
      <th :colspan="players.length + 1">Roles</th>
    </tr>
    <tr v-for="card in skin.roles" :key="card.name">
      <th>{{ card.name }}</th>
      <td v-for="player in players" :key="player.role.name">
        <Note
          :marks="getMarks(player, card)"
          :showDropdown="isShownDropdown(player, card)"
          :onUpdate="note => setNote(player, card, note)"
          :toggleDropdown="() => toggleDropdown(player, card)"
        />
      </td>
    </tr>
    <tr>
      <th :colspan="players.length + 1">Places</th>
    </tr>
    <tr v-for="card in skin.places" :key="card.name">
      <th>{{ card.name }}</th>
      <td v-for="player in players" :key="player.role.name">
        <Note
          :marks="getMarks(player, card)"
          :showDropdown="isShownDropdown(player, card)"
          :onUpdate="note => setNote(player, card, note)"
          :toggleDropdown="() => toggleDropdown(player, card)"
        />
      </td>
    </tr>
    <tr>
      <th :colspan="players.length + 1">Tools</th>
    </tr>
    <tr v-for="card in skin.tools" :key="card.name">
      <th>{{ card.name }}</th>
      <td v-for="player in players" :key="player.role.name">
        <Note
          :marks="getMarks(player, card)"
          :showDropdown="isShownDropdown(player, card)"
          :onUpdate="note => setNote(player, card, note)"
          :toggleDropdown="() => toggleDropdown(player, card)"
        />
      </td>
    </tr>
  </table>
</template>

<script lang="ts">
import { defineComponent, PropType, ref } from 'vue';

import Note from '@/components/Note.vue';
import { useEventListener } from '@/composables';
import { Card, Player, Skin } from '@/state';
import { Dict } from '@/types';

const makeNoteKey = (player: Player, card: Card) =>
  `${player.role.name}---${card.name}`;

export default defineComponent({
  name: 'Notepad',
  components: {
    Note,
  },
  props: {
    skin: {
      type: Object as PropType<Skin>,
      required: true,
    },
    players: {
      type: Array as PropType<Player[]>,
      required: true,
    },
    notes: {
      type: Object as PropType<Dict<Dict<string[]>>>,
      required: true,
    },
    setNote: {
      type: Function as PropType<
        (player: Player, card: Card, marks: string[]) => void
      >,
      required: true,
    },
  },
  setup() {
    const shownNoteDropdown = ref('');

    useEventListener(document, 'click', () => {
      shownNoteDropdown.value = '';
    });

    return {
      shownNoteDropdown,
    };
  },
  methods: {
    getMarks(player: Player, card: Card): string[] {
      return this.notes[player.role.name]?.[card.name] ?? [];
    },
    toggleDropdown(player: Player, card: Card) {
      const noteKey = makeNoteKey(player, card);
      this.shownNoteDropdown =
        this.shownNoteDropdown === noteKey ? '' : noteKey;
    },
    isShownDropdown(player: Player, card: Card) {
      return this.shownNoteDropdown === makeNoteKey(player, card);
    },
  },
});
</script>

<style lang="scss">
@import '@/style/constants';

.notepad {
  border-collapse: collapse;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.33);
  background-color: #fff;
  text-align: center;
  cursor: default;
  margin: 0 auto;

  td,
  th {
    border: 1px solid black;
  }

  th {
    font-weight: 600;
    padding: $pad-sm $pad-sm $pad-xs;
  }

  td {
    cursor: pointer;

    &:hover {
      background-color: #eee;
    }
  }

  &__player-header {
    writing-mode: vertical-lr;
    white-space: nowrap;
  }
}
</style>
