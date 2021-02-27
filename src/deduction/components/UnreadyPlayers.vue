<template>
  <div class="unready-players">
    <span>Waiting for:</span>
    <RoleColor
      v-for="player in unreadyPlayers"
      :key="player.role.name"
      :role="player.role"
    />
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
  display: flex;
  align-items: center;
  justify-content: center;

  > :not(:first-child) {
    margin-left: $pad-xs;
  }
}
</style>
