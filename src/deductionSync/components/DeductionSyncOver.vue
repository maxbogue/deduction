<template>
  <div class="game-over">
    <Players
      :players="players"
      :yourPlayer="yourPlayer"
      :onReconnect="reconnectAsPlayer"
    />
    <h2>Game Over!</h2>
    <Sticky>
      <div>Winner is {{ winners.map(p => p.name).join(' and ') }}!</div>
      <div class="game-in-progress__cards">
        <Cards :cards="Object.values(state.solution)" />
      </div>
    </Sticky>
    <template v-if="state.playerSecrets">
      <Notepad
        class="game-over__notepad"
        :skin="state.skin"
        :players="notepadPlayers"
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
import {
  DeductionSyncEvent,
  DeductionSyncEvents,
} from '@/deductionSync/events';
import {
  Card,
  GameOverState,
  Mark,
  Player,
  PlayerSecrets,
} from '@/deductionSync/state';
import { Maybe } from '@/types';

export default defineComponent({
  name: 'DeductionSyncOver',
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
      type: Function as PropType<(event: DeductionSyncEvent) => void>,
      required: true,
    },
  },
  computed: {
    playerSecrets(): Maybe<PlayerSecrets> {
      return this.state.playerSecrets;
    },
    players(): Player[] {
      return this.state.players;
    },
    notepadPlayers(): Player[] {
      if (!this.playerSecrets) {
        return this.players;
      }
      // Rotate the player list to put the current player first.
      const i = this.playerSecrets.index;
      return [...this.players.slice(i), ...this.players.slice(0, i)];
    },
    yourPlayer(): Maybe<Player> {
      return this.state.playerSecrets
        ? this.state.players[this.state.playerSecrets.index]
        : null;
    },
    winners(): Player[] {
      return this.state.winners.map(w => this.state.players[w]);
    },
  },
  methods: {
    reconnectAsPlayer(player: Player) {
      this.send({
        kind: DeductionSyncEvents.SetRole,
        data: player.role,
      });
    },
    setNote(player: Player, card: Card, marks: Mark[]) {
      this.send({
        kind: DeductionSyncEvents.SetNote,
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
