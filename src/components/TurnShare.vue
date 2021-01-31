<template>
  <div class="turn-share">
    <div>
      {{ getPlayerName(turnPlayer) }} suggested
      {{ crimeToString(turn.suggestion) }}.
    </div>
    <template v-if="yourPlayer === sharePlayer">
      <div>Choose a card to share:</div>
      <div class="turn-share__cards">
        <Card
          v-for="card in shareableCards"
          :key="card.name"
          :card="card"
          :onClick="() => onShareCard(card)"
        />
      </div>
    </template>
    <div v-else>{{ sharePlayer.name }} is choosing a card.</div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import CardComponent from '@/components/Card.vue';
import { Card, Crime, Player, TurnShareState } from '@/state';
import { Maybe } from '@/types';

export default defineComponent({
  name: 'TurnShare',
  components: {
    Card: CardComponent,
  },
  props: {
    turn: {
      type: Object as PropType<TurnShareState>,
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
    turnPlayer: {
      type: Object as PropType<Player>,
      required: true,
    },
    onShareCard: {
      type: Function as PropType<(card: Card) => void>,
      required: true,
    },
  },
  computed: {
    sharePlayer(): Player {
      return this.players[this.turn.sharePlayerIndex];
    },
    suggestedCards(): Card[] {
      return Object.values(this.turn.suggestion);
    },
    shareableCards(): Card[] {
      return this.hand.filter(h =>
        this.suggestedCards.find(c => c.name === h.name)
      );
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
