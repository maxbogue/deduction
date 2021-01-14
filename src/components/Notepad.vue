<template>
  <table class="notepad">
    <tr>
      <th />
      <th v-for="player in players" :key="player.role">
        <div class="notepad__player-header">{{ player.role.name }}</div>
      </th>
    </tr>
    <tr>
      <th :colspan="players.length + 1">Roles</th>
    </tr>
    <tr v-for="role in skin.roles" :key="role.name">
      <th>{{ role.name }}</th>
      <td v-for="player in players" :key="player.role.name">
        <Note
          :note="getNote(player, role)"
          :show-dropdown="isShownDropdown(player, role)"
          @update="setNote(player, role, $event)"
          @toggle-dropdown="toggleDropdown(player, role)"
        />
      </td>
    </tr>
    <tr>
      <th :colspan="players.length + 1">Tools</th>
    </tr>
    <tr v-for="tool in skin.tools" :key="tool.name">
      <th>{{ tool.name }}</th>
      <td v-for="player in players" :key="player.role.name">
        <Note
          :note="getNote(player, tool)"
          :show-dropdown="isShownDropdown(player, tool)"
          @update="setNote(player, tool, $event)"
          @toggle-dropdown="toggleDropdown(player, tool)"
        />
      </td>
    </tr>
    <tr>
      <th :colspan="players.length + 1">Places</th>
    </tr>
    <tr v-for="place in skin.places" :key="place.name">
      <th>{{ place.name }}</th>
      <td v-for="player in players" :key="player.role.name">
        <Note
          :note="getNote(player, place)"
          :show-dropdown="isShownDropdown(player, place)"
          @update="setNote(player, place, $event)"
          @toggle-dropdown="toggleDropdown(player, place)"
        />
      </td>
    </tr>
  </table>
</template>

<script lang="ts">
import { defineComponent, PropType, ref } from 'vue';

import Note from '@/components/Note.vue';
import { useEventListener } from '@/composables';
import { Card, PlayerPublicState, Skin } from '@/state';
import { Dict } from '@/types';

const makeNoteKey = (player: PlayerPublicState, card: Card) =>
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
      type: Array as PropType<PlayerPublicState[]>,
      required: true,
    },
    notes: {
      type: Object as PropType<Dict<Dict<string>>>,
      required: true,
    },
  },
  setup() {
    const shownNoteDropdown = ref('');

    useEventListener(document, () => {
      shownNoteDropdown.value = '';
    });

    return {
      shownNoteDropdown,
    };
  },
  methods: {
    getNote(player: PlayerPublicState, card: Card): string {
      return this.notes[player.role.name]?.[card.name] ?? '';
    },
    setNote(player: PlayerPublicState, card: Card, note: string) {
      this.$emit('set-note', player, card, note);
    },
    toggleDropdown(player: PlayerPublicState, card: Card) {
      const noteKey = makeNoteKey(player, card);
      this.shownNoteDropdown =
        this.shownNoteDropdown === noteKey ? '' : noteKey;
    },
    isShownDropdown(player: PlayerPublicState, card: Card) {
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
    text-orientation: sideways-right;
  }
}
</style>
