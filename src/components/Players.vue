<template>
  <div class="players">
    <div
      v-for="player in players"
      :key="player.role.name"
      class="players__player"
      :class="classesForPlayer(player)"
      @click="onReconnect(player)"
    >
      <RoleColor class="players__player-color" :role="player.role" />
      <div class="players__player-name">{{ playerToString(player) }}</div>
      <span v-if="player.failedAccusation">&#x1F47B;</span>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import RoleColor from '@/components/RoleColor.vue';
import { Player } from '@/state';
import { Maybe } from '@/types';

export default defineComponent({
  name: 'Players',
  components: {
    RoleColor,
  },
  props: {
    players: {
      type: Array as PropType<Player[]>,
      required: true,
    },
    yourPlayer: {
      type: Object as PropType<Maybe<Player>>,
      default: null,
    },
    onReconnect: {
      type: Function as PropType<(player: Player) => void>,
      required: true,
    },
  },
  methods: {
    classesForPlayer(player: Player) {
      return {
        'players__player--you': player === this.yourPlayer,
        'players__player--disconnected': !player.isConnected,
        'players__player--reconnectable': this.canReconnectAsPlayer(player),
      };
    },
    canReconnectAsPlayer(player: Player): boolean {
      return !this.yourPlayer && !player.isConnected;
    },
    playerToString(player: Player): string {
      const { role, name } = player;
      return `${role.name} [${name}]`;
    },
  },
});
</script>

<style lang="scss">
@import '@/style/constants';

.players {
  @include flex-column;

  &__player {
    display: flex;
    align-items: center;
    cursor: default;

    &--you {
      text-decoration: underline;
    }

    &--disconnected {
      color: red;
    }

    &--reconnectable {
      color: blue;
      cursor: pointer;
    }
  }

  &__player-color {
    margin: 0.8rem;
  }
}
</style>
