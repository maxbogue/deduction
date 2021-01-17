<template>
  <div class="game-over">
    <div class="game-in-progress__connection-player">
      You are {{ connectionPlayer }}
    </div>
    <div class="game-in-progress__players">
      <div
        v-for="player in state.players"
        :key="player.role.name"
        class="game-in-progress__player"
        :class="classesForPlayer(player)"
      >
        {{ playerToString(player) }}
      </div>
    </div>
    <div>
      <div>Winner is {{ playerToString(winner) }}!</div>
      <div>Solution: {{ solution }}</div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import { ConnectionEvent } from '@/events';
import { Crime, GameOverState, Player } from '@/state';
import { Maybe } from '@/types';

export default defineComponent({
  name: 'GameOver',
  props: {
    state: {
      type: Object as PropType<GameOverState>,
      required: true,
    },
    send: {
      type: Function as PropType<(event: ConnectionEvent) => void>,
      required: true,
    },
  },
  computed: {
    currentPlayer(): Maybe<Player> {
      if (!this.state.playerSecrets) {
        return null;
      }
      return this.state.players[this.state.playerSecrets.index];
    },
    connectionPlayer(): string {
      return this.currentPlayer
        ? this.playerToString(this.currentPlayer)
        : 'observing';
    },
    winner(): Player {
      return this.state.players[this.state.winner];
    },
    solution(): Crime {
      return this.state.solution;
    },
  },
  methods: {
    classesForPlayer(player: Player) {
      return {
        'game-in-progress__player--disconnected': !player.isConnected,
      };
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

.game-in-progress {
  &__cards {
    display: flex;
    justify-content: space-around;
  }

  &__card-column {
    display: flex;
    flex-direction: column;
  }

  &__card {
    padding: $pad-xs;
    color: blue;
    cursor: pointer;
    border: 1px solid transparent;

    &:hover {
      border: 1px solid black;
    }

    &--selected {
      color: green;
    }
  }

  &__player {
    color: green;

    &--disconnected {
      color: red;
    }
  }
}
</style>
