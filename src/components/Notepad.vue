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
          @change="note => setNote(player, role, note)"
        />
      </td>
    </tr>
    <tr>
      <th :colspan="players.length + 1">Tools</th>
    </tr>
    <tr v-for="tool in skin.tools" :key="tool.name">
      <th>{{ tool.name }}</th>
      <td v-for="player in players" :key="player.role.name" />
    </tr>
    <tr>
      <th :colspan="players.length + 1">Places</th>
    </tr>
    <tr v-for="place in skin.places" :key="place.name">
      <th>{{ place.name }}</th>
      <td v-for="player in players" :key="player.role.name">
        <Note
          :note="getNote(player, place)"
          @change="note => setNote(player, place, note)"
        />
      </td>
    </tr>
  </table>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import Note from '@/components/Note.vue';
import { Card, PlayerPublicState, Skin } from '@/state';
import { Dict } from '@/types';

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
  computed: {},
  methods: {
    getNote(player: PlayerPublicState, card: Card): string {
      return this.notes[player.role.name]?.[card.name] ?? '';
    },
    setNote(player: PlayerPublicState, card: Card, note: string) {
      this.$emit('set-note', player, card, note);
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
    padding: $pad-sm $pad-sm $pad-xs;
  }

  th {
    font-weight: 600;
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
