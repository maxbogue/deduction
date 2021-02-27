<template>
  <div class="turn-share">
    <Sticky v-if="yourPlayer" :sentinel="turn">
      You need to share {{ numCardsToShare }} more cards.
    </Sticky>
    <CardShare
      v-for="player in players"
      :key="player.role.name"
      :turn="turn"
      :players="players"
      :hand="hand"
      :yourPlayer="yourPlayer"
      :shareWith="player"
      :onShareCard="onShareCard"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import Sticky from '@/components/Sticky.vue';
import CardShare from '@/deduction/components/CardShare.vue';
import { Card, Crime, Player, TurnShareState } from '@/deductionSync/state';
import { Maybe } from '@/types';

export default defineComponent({
  name: 'TurnShare',
  components: {
    CardShare,
    Sticky,
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
    onShareCard: {
      type: Function as PropType<(shareWith: Player, card: Card) => void>,
      required: true,
    },
  },
  computed: {
    numCardsToShare(): number {
      return Object.values(this.turn.sharedCards).filter(x => !x).length;
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
    getSharePlayer(shareWith: Player): Player {
      return this.players[this.turn.sharePlayers[shareWith.role.name]];
    },
    getShareableCards(shareWith: Player): Card[] {
      const cards = Object.values(this.turn.suggestions[shareWith.role.name]);
      return this.hand.filter(h => cards.find(c => c.name === h.name));
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
