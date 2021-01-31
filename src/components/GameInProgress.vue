<template>
  <div class="game-in-progress">
    <Players
      :players="state.players"
      :yourPlayer="yourPlayer"
      :onReconnect="reconnectAsPlayer"
    />
    <h2>Turn: {{ playerToString(turnPlayer) }}</h2>
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
      <h2>Notepad</h2>
      <Notepad
        :skin="state.skin"
        :players="state.players"
        :notes="state.playerSecrets.notes"
        :setNote="setNote"
      />
      <h2>Hand</h2>
      <div class="game-in-progress__hand">
        <Card
          v-for="card in state.playerSecrets.hand"
          :key="card.name"
          :card="card"
        />
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, provide } from 'vue';

import CardComponent from '@/components/Card.vue';
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
    Card: CardComponent,
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
    provide(SkinKey, props.state.skin);
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
    isYourTurn(): boolean {
      return this.yourPlayer === this.turnPlayer;
    },
    sharePlayer(): Maybe<Player> {
      if (this.turn.status === TurnStatus.Suggest) {
        return null;
      }
      return this.state.players[this.turn.sharePlayerIndex];
    },
    connectionPlayer(): string {
      return this.yourPlayer
        ? this.playerToString(this.yourPlayer)
        : 'observing';
    },
    hand(): Card[] {
      return this.state.playerSecrets?.hand ?? [];
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
    getPlayerName(player: Player): string {
      return player === this.yourPlayer ? 'You' : player.name;
    },
    playerToString(player: Player): string {
      const { role, name } = player;
      return `${role.name} [${name}]`;
    },
    crimeToString(crime: Crime): string {
      const { role, tool, place } = crime;
      return `${role.name} in the ${place.name} with the ${tool.name}`;
    },
  },
});
</script>

<style lang="scss" scoped>
@import '@/style/constants';

.game-in-progress {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: $pad-md $pad-lg;

  &__hand {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-wrap: wrap;
  }

  &__unready-players {
    display: flex;
    align-items: center;

    > :not(:first-child) {
      margin-left: $pad-xs;
    }
  }

  &__turn-buttons {
    margin-top: $pad-sm;
  }

  &__accuse :deep(.select-crime__button) {
    background-color: rgba(255, 24, 12, 0.5);

    &[disabled] {
      background-color: transparent;
    }
  }
}
</style>
