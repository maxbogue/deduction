<template>
  <div class="turn-record">
    <Sticky :sentinel="turn">
      <div>
        {{ getPlayerName(turnPlayer) }} suggested
        {{ crimeToString(turn.suggestion) }}.
      </div>
      <div v-if="sharedCard">
        <span>{{ getPlayerName(sharePlayer) }} shared</span>
        <Card :card="sharedCard" />
      </div>
      <div v-else-if="sharePlayer !== turnPlayer">
        {{ getPlayerName(sharePlayer) }} has shared a card.
      </div>
      <div v-else>No player had a matching card to share.</div>
    </Sticky>
    <div v-if="yourPlayer === turnPlayer">
      <button @click="showAccuse = true">Accuse</button>
    </div>
    <UnreadyPlayers :players="players" :playerIsReady="turn.playerIsReady" />
    <template v-if="showAccuse">
      <h2>Accusation</h2>
      <SelectCrime
        class="turn-record__accuse"
        :excludeCards="hand"
        :buttonDisabled="!canAccuse"
        :buttonText="canAccuse ? 'Final Accusation' : 'Waiting...'"
        :onSelect="onAccuse"
      />
    </template>
    <ReadyToast
      v-if="yourPlayer && !yourPlayer.isDed"
      :playerIsReady="turn.playerIsReady"
      :yourPlayer="yourPlayer"
      :setIsReady="setIsReady"
    />
  </div>
</template>

<script lang="ts">
import isEqual from 'lodash/isEqual';
import { defineComponent, PropType } from 'vue';

import Sticky from '@/components/Sticky.vue';
import CardComponent from '@/deduction/components/Card.vue';
import ReadyToast from '@/deduction/components/ReadyToast.vue';
import SelectCrime from '@/deduction/components/SelectCrime.vue';
import UnreadyPlayers from '@/deduction/components/UnreadyPlayers.vue';
import { Card, Crime, Player, TurnRecordState } from '@/deduction/state';
import { Dict, Maybe } from '@/types';
import { dictFromList } from '@/utils';

interface TurnRecordData {
  showAccuse: boolean;
}

export default defineComponent({
  name: 'TurnRecord',
  components: {
    Card: CardComponent,
    ReadyToast,
    SelectCrime,
    Sticky,
    UnreadyPlayers,
  },
  props: {
    turn: {
      type: Object as PropType<TurnRecordState>,
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
    setIsReady: {
      type: Function as PropType<(isReady: boolean) => void>,
      required: true,
    },
    onAccuse: {
      type: Function as PropType<(accusation: Crime) => void>,
      required: true,
    },
  },
  data: (): TurnRecordData => ({
    showAccuse: false,
  }),
  computed: {
    sharePlayer(): Player {
      return this.players[this.turn.sharePlayerIndex];
    },
    sharedCard(): Maybe<Card> {
      return this.turn.sharedCard;
    },
    roleToPlayer(): Dict<Player> {
      return dictFromList(this.players, (acc, p) => {
        acc[p.role.name] = p;
      });
    },
    unreadyPlayers(): Player[] {
      return Object.entries(this.turn.playerIsReady)
        .filter(e => !e[1])
        .map(e => this.roleToPlayer[e[0]]);
    },
    canAccuse(): boolean {
      return isEqual(this.unreadyPlayers, [this.turnPlayer]);
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

.turn-record {
  @include flex-column;
  margin-bottom: $pad-lg;

  &__accuse :deep(.select-crime__button) {
    background-color: rgba(255, 24, 12, 0.5);

    &[disabled] {
      background-color: transparent;
    }
  }
}
</style>
