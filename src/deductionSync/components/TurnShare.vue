<template>
  <div class="turn-share">
    <Sticky :sentinel="turn">
      You need to share {{ numCardsToShare }} more cards.
    </Sticky>
    <div v-for="player in players" :key="player.role.name">
      <div>
        {{ getPlayerName(player) }} suggested
        {{ crimeToString(turn.suggestions[player.role.name]) }}.
      </div>
      <div v-if="turn.sharedCards[player.role.name]">
        <span>{{ getPlayerName(getSharePlayer(player)) }} shared</span>
        <Card :card="turn.sharedCards[player.role.name]" />
      </div>
      <div v-else-if="player === getSharePlayer(player)">
        No player had a matching card to share.
      </div>
      <template v-else-if="yourPlayer === getSharePlayer(player)">
        <div>Choose a card to share:</div>
        <div class="turn-share__cards">
          <Card
            v-for="card in getShareableCards(player)"
            :key="card.name"
            :card="card"
            :onClick="() => onShareCard(player, card)"
          />
        </div>
      </template>
      <div v-else-if="turn.playerIsReady[player.role.name]">
        {{ getSharePlayer(player).name }} shared a card.
      </div>
      <div v-else>{{ getSharePlayer(player).name }} is choosing a card.</div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import Sticky from '@/components/Sticky.vue';
import CardComponent from '@/deduction/components/Card.vue';
import { Card, Crime, Player, TurnShareState } from '@/deductionSync/state';
import { Maybe } from '@/types';

export default defineComponent({
  name: 'TurnShare',
  components: {
    Card: CardComponent,
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
