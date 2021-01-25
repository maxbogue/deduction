<template>
  <div class="game-over">
    <Players
      :players="state.players"
      :currentPlayer="currentPlayer"
      :onReconnect="reconnectAsPlayer"
    />
    <div>
      <div>Winner is {{ playerToString(winner) }}!</div>
      <h2>Solution</h2>
      <div class="game-in-progress__cards">
        <div class="game-in-progress__hand">
          <Card v-for="card in solution" :key="card.name" :card="card" />
        </div>
      </div>
      <template v-if="state.playerSecrets">
        <h2>Hand</h2>
        <div class="game-in-progress__hand">
          <Card
            v-for="card in state.playerSecrets.hand"
            :key="card.name"
            :card="card"
          />
        </div>
        <h2>Notepad</h2>
        <Notepad
          :skin="state.skin"
          :players="state.players"
          :notes="state.playerSecrets.notes"
          :setNote="setNote"
        />
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import CardComponent from '@/components/Card.vue';
import Notepad from '@/components/Notepad.vue';
import Players from '@/components/Players.vue';
import { ConnectionEvent, ConnectionEvents } from '@/events';
import { Card, Crime, GameOverState, Player } from '@/state';
import { Maybe } from '@/types';

export default defineComponent({
  name: 'GameOver',
  components: {
    Card: CardComponent,
    Notepad,
    Players,
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
    reconnectAsPlayer(player: Player) {
      this.send({
        type: ConnectionEvents.SetRole,
        data: player.role,
      });
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

.game-over {
  padding: $pad-md $pad-lg;
}
</style>
