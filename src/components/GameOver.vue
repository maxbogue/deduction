<template>
  <div class="game-over">
    <Players
      :players="state.players"
      :yourPlayer="yourPlayer"
      :onReconnect="reconnectAsPlayer"
    />
    <h2>Game Over!</h2>
    <Sticky>
      <div>Winner is {{ playerToString(winner) }}!</div>
      <div class="game-in-progress__cards">
        <div class="game-in-progress__hand">
          <Card v-for="card in solution" :key="card.name" :card="card" />
        </div>
      </div>
    </Sticky>
    <template v-if="state.playerSecrets">
      <Notepad
        :skin="state.skin"
        :players="state.players"
        :notes="state.playerSecrets.notes"
        :setNote="setNote"
      />
      <div>
        <h2>Hand</h2>
        <div class="game-in-progress__hand">
          <Card
            v-for="card in state.playerSecrets.hand"
            :key="card.name"
            :card="card"
          />
        </div>
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import CardComponent from '@/components/Card.vue';
import Notepad from '@/components/Notepad.vue';
import Players from '@/components/Players.vue';
import Sticky from '@/components/Sticky.vue';
import { ConnectionEvent, ConnectionEvents } from '@/events';
import { Card, Crime, GameOverState, Mark, Player } from '@/state';
import { Maybe } from '@/types';

export default defineComponent({
  name: 'GameOver',
  components: {
    Card: CardComponent,
    Notepad,
    Players,
    Sticky,
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
    yourPlayer(): Maybe<Player> {
      if (!this.state.playerSecrets) {
        return null;
      }
      return this.state.players[this.state.playerSecrets.index];
    },
    connectionPlayer(): string {
      return this.yourPlayer
        ? this.playerToString(this.yourPlayer)
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
    setNote(player: Player, card: Card, marks: Mark[]) {
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
  @include flex-column;
}
</style>
