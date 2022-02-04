<template>
  <div class="game-in-progress">
    <Players
      class="game-in-progress__players"
      :players="state.players"
      :yourPlayer="yourPlayer"
      :turnPlayer="turnPlayer"
      :onReconnect="reconnectAsPlayer"
    />
    <TurnSuggest
      v-if="turn.status === TurnStatus.Suggest"
      :yourPlayer="yourPlayer"
      :turnPlayer="turnPlayer"
      :onSuggest="suggest"
    />
    <TurnShare
      v-else-if="turn.status === TurnStatus.Share"
      :turn="turn"
      :players="state.players"
      :hand="hand"
      :yourPlayer="yourPlayer"
      :turnPlayer="turnPlayer"
      :onShareCard="shareCard"
    />
    <TurnRecord
      v-else-if="turn.status === TurnStatus.Record"
      :turn="turn"
      :players="state.players"
      :hand="hand"
      :yourPlayer="yourPlayer"
      :turnPlayer="turnPlayer"
      :setIsReady="setIsReady"
      :onAccuse="accuse"
    />
    <TurnAccused
      v-else-if="turn.status === TurnStatus.Accused"
      :turn="turn"
      :players="state.players"
      :hand="hand"
      :yourPlayer="yourPlayer"
      :turnPlayer="turnPlayer"
      :setIsReady="setIsReady"
    />
    <template v-if="state.playerSecrets">
      <Notepad
        class="game-in-progress__notepad"
        :players="state.players"
        :turnPlayer="turnPlayer"
        :suggestion="suggestion"
        :sharePlayer="sharePlayer"
        :notes="state.playerSecrets.notes"
        :setNote="setNote"
      />
      <h2 class="game-in-progress__hand-title">Hand</h2>
      <Cards :cards="state.playerSecrets.hand" />
    </template>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import Cards from '@/deduction/components/Cards.vue';
import Notepad from '@/deduction/components/Notepad.vue';
import Players from '@/deduction/components/Players.vue';
import TurnAccused from '@/deduction/components/TurnAccused.vue';
import TurnRecord from '@/deduction/components/TurnRecord.vue';
import TurnShare from '@/deduction/components/TurnShare.vue';
import TurnSuggest from '@/deduction/components/TurnSuggest.vue';
import { DeductionEvent, DeductionEvents } from '@/deduction/events';
import {
  Card,
  Crime,
  InProgressState,
  Mark,
  Player,
  TurnState,
  TurnStatus,
} from '@/deduction/state';
import { Maybe } from '@/types';

export default defineComponent({
  name: 'GameInProgress',
  components: {
    Cards,
    Notepad,
    Players,
    TurnAccused,
    TurnRecord,
    TurnShare,
    TurnSuggest,
  },
  props: {
    state: {
      type: Object as PropType<InProgressState>,
      required: true,
    },
    send: {
      type: Function as PropType<(event: DeductionEvent) => void>,
      required: true,
    },
  },
  setup() {
    return { TurnStatus };
  },
  computed: {
    turn(): TurnState {
      return this.state.turnState;
    },
    yourPlayer(): Maybe<Player> {
      if (!this.state.playerSecrets) {
        return null;
      }
      return this.state.players[this.state.playerSecrets.index];
    },
    turnPlayer(): Player {
      return this.state.players[this.state.turnIndex];
    },
    sharePlayer(): Maybe<Player> {
      if (
        this.turn.status !== TurnStatus.Share &&
        this.turn.status !== TurnStatus.Record
      ) {
        return null;
      }
      return this.state.players[this.turn.sharePlayerIndex];
    },
    hand(): Card[] {
      return this.state.playerSecrets?.hand ?? [];
    },
    suggestion(): Maybe<Crime> {
      if (
        this.turn.status !== TurnStatus.Share &&
        this.turn.status !== TurnStatus.Record
      ) {
        return null;
      }
      return this.turn.suggestion;
    },
  },
  methods: {
    suggest(suggestion: Crime) {
      this.send({
        kind: DeductionEvents.Suggest,
        suggestion,
      });
    },
    shareCard(card: Card) {
      this.send({
        kind: DeductionEvents.ShareCard,
        sharedCard: card,
      });
    },
    setIsReady(isReady: boolean) {
      this.send({
        kind: DeductionEvents.SetReady,
        data: isReady,
      });
    },
    accuse(crime: Crime) {
      this.send({
        kind: DeductionEvents.Accuse,
        data: crime,
      });
    },
    reconnectAsPlayer(player: Player) {
      this.send({
        kind: DeductionEvents.SetRole,
        data: player.role,
      });
    },
    setNote(player: Player, card: Card, marks: Mark[]) {
      this.send({
        kind: DeductionEvents.SetNote,
        player,
        card,
        marks,
      });
    },
  },
});
</script>

<style lang="scss" scoped>
@import '@/style/constants';

.game-in-progress {
  @include flex-column;

  &__players {
    margin-bottom: $pad-sm;
  }

  &__notepad {
    margin-top: $pad-sm;
  }

  &__hand-title {
    margin-top: $pad-lg;
  }
}
</style>
