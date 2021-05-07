<template>
  <div class="game-in-progress">
    <Players
      class="game-in-progress__players"
      :players="players"
      :yourPlayer="yourPlayer"
      :onReconnect="reconnectAsPlayer"
    />
    <TurnSuggest
      v-if="turn.status === TurnStatus.Suggest"
      :turn="turn"
      :players="players"
      :yourPlayer="yourPlayer"
      :onSuggest="suggest"
    />
    <TurnShare
      v-else-if="turn.status === TurnStatus.Share"
      :turn="turn"
      :players="players"
      :hand="hand"
      :yourPlayer="yourPlayer"
      :onShareCard="shareCard"
    />
    <TurnRecord
      v-else-if="turn.status === TurnStatus.Record"
      :turn="turn"
      :players="players"
      :hand="hand"
      :yourPlayer="yourPlayer"
      :setIsReady="setIsReady"
      :onAccuse="accuse"
    />
    <TurnAccused
      v-else-if="turn.status === TurnStatus.Accused"
      :turn="turn"
      :players="players"
      :yourPlayer="yourPlayer"
      :setIsReady="setIsReady"
    />
    <template v-if="state.playerSecrets">
      <Notepad
        class="game-in-progress__notepad"
        :skin="state.playerSecrets.skin"
        :players="players"
        :turnPlayer="selectedPlayer"
        :suggestion="suggestion"
        :sharePlayer="sharePlayer"
        :notes="state.playerSecrets.notes"
        :setNote="setNote"
        :selectPlayer="i => (selectedPlayerIndex = i)"
      />
      <h2 class="game-in-progress__hand-title">Hand</h2>
      <Cards :cards="state.playerSecrets.hand" />
    </template>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, provide, toRefs } from 'vue';

import { SkinKey } from '@/composables';
import Cards from '@/deduction/components/Cards.vue';
import Notepad from '@/deduction/components/Notepad.vue';
import Players from '@/deduction/components/Players.vue';
import TurnAccused from '@/deductionSync/components/TurnAccused.vue';
import TurnRecord from '@/deductionSync/components/TurnRecord.vue';
import TurnShare from '@/deductionSync/components/TurnShare.vue';
import TurnSuggest from '@/deductionSync/components/TurnSuggest.vue';
import {
  DeductionSyncEvent,
  DeductionSyncEvents,
} from '@/deductionSync/events';
import {
  Card,
  Crime,
  InProgressState,
  Mark,
  Player,
  TurnState,
  TurnStatus,
} from '@/deductionSync/state';
import { Dict, Maybe } from '@/types';

interface InProgressData {
  TurnStatus: typeof TurnStatus;
  notes: Dict<Dict<string>>;
  selectedPlayerIndex: number;
}

export default defineComponent({
  name: 'DeductionSyncInProgress',
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
      type: Function as PropType<(event: DeductionSyncEvent) => void>,
      required: true,
    },
  },
  setup(props) {
    const { state } = toRefs(props);
    provide(SkinKey, state.value.skin);
  },
  data(): InProgressData {
    return {
      TurnStatus,
      notes: {},
      selectedPlayerIndex: this.state.playerSecrets?.index ?? 0,
    };
  },
  computed: {
    turn(): TurnState {
      return this.state.turnState;
    },
    players(): Player[] {
      return this.state.players;
    },
    selectedPlayer(): Player {
      return this.state.players[this.selectedPlayerIndex];
    },
    yourPlayer(): Maybe<Player> {
      if (!this.state.playerSecrets) {
        return null;
      }
      return this.players[this.state.playerSecrets.index];
    },
    sharePlayer(): Maybe<Player> {
      if (
        !this.selectedPlayer ||
        (this.turn.status !== TurnStatus.Share &&
          this.turn.status !== TurnStatus.Record)
      ) {
        return null;
      }
      const selectedRoleName = this.selectedPlayer.role.name;
      const sharePlayerIndex = this.turn.sharePlayers[selectedRoleName];
      return this.players[sharePlayerIndex];
    },
    hand(): Card[] {
      return this.state.playerSecrets?.hand ?? [];
    },
    suggestion(): Maybe<Crime> {
      if (
        !this.selectedPlayer ||
        (this.turn.status !== TurnStatus.Share &&
          this.turn.status !== TurnStatus.Record)
      ) {
        return null;
      }
      return this.turn.suggestions[this.selectedPlayer.role.name];
    },
  },
  methods: {
    suggest(suggestion: Crime) {
      this.send({
        kind: DeductionSyncEvents.Suggest,
        suggestion,
      });
    },
    shareCard(player: Player, card: Card) {
      this.send({
        kind: DeductionSyncEvents.ShareCard,
        shareWith: this.players.indexOf(player),
        shareCard: card,
      });
    },
    setIsReady(isReady: boolean) {
      this.send({
        kind: DeductionSyncEvents.SetReady,
        data: isReady,
      });
    },
    accuse(crime: Crime) {
      this.send({
        kind: DeductionSyncEvents.Accuse,
        data: crime,
      });
    },
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
