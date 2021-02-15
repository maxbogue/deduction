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
        <Cards :cards="Object.values(state.solution)" />
      </div>
    </Sticky>
    <template v-if="state.playerSecrets">
      <Notepad
        class="game-over__notepad"
        :skin="state.skin"
        :players="state.players"
        :notes="state.playerSecrets.notes"
        :setNote="setNote"
      />
      <div>
        <h2>Hand</h2>
        <Cards :cards="state.playerSecrets.hand" />
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import Sticky from '@/components/Sticky.vue';
import Cards from '@/deduction/components/Cards.vue';
import Notepad from '@/deduction/components/Notepad.vue';
import Players from '@/deduction/components/Players.vue';
import { ConnectionEvent, ConnectionEvents } from '@/deduction/events';
import { Card, GameOverState, Mark, Player } from '@/deduction/state';
import { Maybe } from '@/types';

export default defineComponent({
  name: 'GameOver',
  components: {
    Cards,
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

  &__notepad {
    margin-top: $pad-sm;
  }
}
</style>
