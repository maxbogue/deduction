<template>
  <div>
    <div>
      {{ getPlayerName(shareWith) }} suggested
      {{ crimeToString(turn.suggestions[shareWith.role.name]) }}.
    </div>
    <div v-if="sharedCard">
      <span>{{ getPlayerName(sharePlayer) }} shared</span>
      <Card :card="sharedCard" />
    </div>
    <div v-else-if="shareWith === sharePlayer">
      No player had a matching card to share.
    </div>
    <template v-else-if="onShareCard && yourPlayer === sharePlayer">
      <div>Choose a card to share:</div>
      <div class="turn-share__cards">
        <Card
          v-for="card in shareableCards"
          :key="card.name"
          :card="card"
          :onClick="() => onShareCard(shareWith, card)"
        />
      </div>
    </template>
    <div v-else-if="hasShared">{{ sharePlayer.name }} shared a card.</div>
    <div v-else>{{ sharePlayer.name }} is choosing a card.</div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import CardComponent from '@/deduction/components/Card.vue';
import {
  Card,
  Crime,
  Player,
  TurnRecordState,
  TurnShareState,
  TurnStatus,
} from '@/deductionSync/state';
import { Maybe } from '@/types';

export default defineComponent({
  name: 'CardShare',
  components: {
    Card: CardComponent,
  },
  props: {
    turn: {
      type: Object as PropType<TurnShareState | TurnRecordState>,
      required: true,
    },
    players: {
      type: Array as PropType<Player[]>,
      required: true,
    },
    hand: {
      type: Array as PropType<Card[]>,
      required: true,
    },
    yourPlayer: {
      type: Object as PropType<Maybe<Player>>,
      default: null,
    },
    shareWith: {
      type: Object as PropType<Player>,
      required: true,
    },
    onShareCard: {
      type: Function as PropType<(shareWith: Player, card: Card) => void>,
      default: null,
    },
  },
  computed: {
    sharePlayer(): Player {
      return this.players[this.turn.sharePlayers[this.shareWith.role.name]];
    },
    hasShared(): boolean {
      if (this.turn.status === TurnStatus.Record) {
        return true;
      }
      return this.turn.playerIsReady[this.sharePlayer.role.name];
    },
    sharedCard(): Maybe<Card> {
      return this.turn.sharedCards[this.shareWith.role.name] ?? null;
    },
    shareableCards(): Card[] {
      const cards = Object.values(
        this.turn.suggestions[this.shareWith.role.name]
      );
      return this.hand.filter(h => cards.find(c => c.name === h.name));
    },
  },
  methods: {
    getPlayerName(player: Player): string {
      return player === this.yourPlayer ? 'You' : player.name;
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

.turn-share {
  @include flex-column;

  &__cards {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-wrap: wrap;
  }
}
</style>
