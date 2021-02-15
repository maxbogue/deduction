<template>
  <div class="players">
    <div
      v-for="player in players"
      :key="player.role.name"
      :class="classesForPlayer(player)"
      @click="onReconnect(player)"
    >
      <RoleColor class="players__player-color" :role="player.role" />
      <div v-if="player.isDed">&#x1F47B;&nbsp;</div>
      <div v-else-if="player === turnPlayer">&#x1F50D;&nbsp;</div>
      <div :class="classesForPlayerName(player)">
        {{ playerToString(player) }}
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import RoleColor from '@/deduction/components/RoleColor.vue';
import { Player } from '@/deduction/state';
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
    turnPlayer: {
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
        players__player: true,
        'players__player--you': player === this.yourPlayer,
        'players__player--disconnected': !player.isConnected,
        'players__player--reconnectable': this.canReconnectAsPlayer(player),
      };
    },
    classesForPlayerName(player: Player) {
      return {
        'players__player-name': true,
        'players__player-name--you': player === this.yourPlayer,
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
  align-items: flex-start;

  &__player {
    display: flex;
    align-items: center;
    cursor: default;

    &--disconnected {
      color: red;
    }

    &--reconnectable {
      color: blue;
      cursor: pointer;
    }
  }

  &__player-color {
    margin: 0.6rem;
  }

  &__player-name {
    &--you {
      text-decoration: underline;
    }
  }
}
</style>
