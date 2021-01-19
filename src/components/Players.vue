<template>
  <div class="players">
    <div
      v-for="(player, i) in players"
      :key="player.role.name"
      @click="onReconnect(player)"
    >
      <span v-if="i > 0">&nbsp;|&nbsp;</span>
      <span class="players__player" :class="classesForPlayer(player)">{{
        playerToString(player)
      }}</span>
      <span v-if="player.failedAccusation">&#x1F47B;</span>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import { Player } from '@/state';
import { Maybe } from '@/types';

export default defineComponent({
  name: 'Players',
  props: {
    players: {
      type: Array as PropType<Player[]>,
      required: true,
    },
    currentPlayer: {
      type: Object as PropType<Maybe<Player>>,
      default: null,
    },
    onReconnect: {
      type: Function as PropType<(player: Player) => void>,
      required: true,
    },
  },
  computed: {},
  methods: {
    classesForPlayer(player: Player) {
      return {
        'players__player--you': player === this.currentPlayer,
        'players__player--disconnected': !player.isConnected,
        'players__player--reconnectable': this.canReconnectAsPlayer(player),
      };
    },
    canReconnectAsPlayer(player: Player): boolean {
      return !this.currentPlayer && !player.isConnected;
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
  display: flex;
  justify-content: center;
  font-size: 1.8rem;

  &__player {
    color: green;

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
}
</style>
