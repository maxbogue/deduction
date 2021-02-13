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
    <template v-if="state.playerSecrets">
      <Notepad
        class="game-in-progress__notepad"
        :skin="state.skin"
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
import { defineComponent, PropType, provide, toRefs } from 'vue';

import Cards from '@/components/Cards.vue';
import Notepad from '@/components/Notepad.vue';
import Players from '@/components/Players.vue';
import TurnRecord from '@/components/TurnRecord.vue';
import TurnShare from '@/components/TurnShare.vue';
import TurnSuggest from '@/components/TurnSuggest.vue';
import { SkinKey } from '@/composables';
import { ConnectionEvent, ConnectionEvents } from '@/events';
import {
  Card,
  Crime,
  InProgressState,
  Mark,
  Player,
  TurnState,
  TurnStatus,
} from '@/state';
import { Dict, Maybe } from '@/types';

interface InProgressData {
  TurnStatus: typeof TurnStatus;
  notes: Dict<Dict<string>>;
}

export default defineComponent({
  name: 'GameInProgress',
  components: {
    Cards,
    Notepad,
    Players,
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
      type: Function as PropType<(event: ConnectionEvent) => void>,
      required: true,
    },
  },
  setup(props) {
    const { state } = toRefs(props);
    provide(SkinKey, state.value.skin);
  },
  data: (): InProgressData => ({
    TurnStatus,
    notes: {},
  }),
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
      if (this.turn.status === TurnStatus.Suggest) {
        return null;
      }
      return this.state.players[this.turn.sharePlayerIndex];
    },
    hand(): Card[] {
      return this.state.playerSecrets?.hand ?? [];
    },
    suggestion(): Maybe<Crime> {
      return this.turn.status === TurnStatus.Suggest
        ? null
        : this.turn.suggestion;
    },
  },
  methods: {
    suggest(suggestion: Crime) {
      this.send({
        type: ConnectionEvents.Suggest,
        suggestion,
      });
    },
    shareCard(card: Card) {
      this.send({
        type: ConnectionEvents.ShareCard,
        sharedCard: card,
      });
    },
    setIsReady(isReady: boolean) {
      this.send({
        type: ConnectionEvents.SetReady,
        data: isReady,
      });
    },
    accuse(crime: Crime) {
      this.send({
        type: ConnectionEvents.Accuse,
        data: crime,
      });
    },
    reconnectAsPlayer(player: Player) {
      this.send({
        type: ConnectionEvents.SetRole,
        data: player.role,
      });
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
