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
      <h2>Solution</h2>
      <div class="game-in-progress__cards">
        <div class="game-in-progress__hand">
          <Card v-for="card in solution" :key="card.name" :card="card" />
        </div>
      </div>
      <h2>Notepad</h2>
      <Notepad
        v-if="state.playerSecrets"
        :skin="state.skin"
        :players="state.players"
        :notes="state.playerSecrets.notes"
        :setNote="setNote"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import CardComponent from '@/components/Card.vue';
import Notepad from '@/components/Notepad.vue';
import { ConnectionEvent, ConnectionEvents } from '@/events';
import { Card, Crime, GameOverState, Player } from '@/state';
import { Maybe } from '@/types';

export default defineComponent({
  name: 'GameOver',
  components: {
    Card: CardComponent,
    Notepad,
  },
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
    setNote(player: Player, card: Card, marks: string[]) {
      this.send({
        type: ConnectionEvents.SetNote,
        player,
        card,
        marks,
      });
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
