<template>
  <div class="unready-players">
    <div>Waiting for:</div>
    <div class="unready-players__colors">
      <RoleColor
        v-for="player in unreadyPlayers"
        :key="player.role.name"
        class="unready-players__color"
        :role="player.role"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import RoleColor from '@/deduction/components/RoleColor.vue';
import { Player } from '@/deduction/state';
import { Dict } from '@/types';
import { dictFromList } from '@/utils';

export default defineComponent({
  name: 'UnreadyPlayers',
  components: {
    RoleColor,
  },
  props: {
    players: {
      type: Array as PropType<Player[]>,
      required: true,
    },
    playerIsReady: {
      type: Object as PropType<Dict<boolean>>,
      required: true,
    },
  },
  computed: {
    roleToPlayer(): Dict<Player> {
      return dictFromList(this.players, (acc, p) => {
        acc[p.role.name] = p;
      });
    },
    unreadyPlayers(): Player[] {
      return Object.entries(this.playerIsReady)
        .filter(e => !e[1])
        .map(e => this.roleToPlayer[e[0]]);
    },
  },
});
</script>

<style lang="scss" scoped>
@import '@/style/constants';

.unready-players {
  padding: $pad-sm;

  &__colors {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  &__color {
    margin: $pad-xs;
  }
}
</style>
