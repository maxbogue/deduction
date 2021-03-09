<template>
  <div class="turn-record">
    <Sticky :sentinel="turn">Record your notes.</Sticky>
    <CardShare
      v-for="player in livePlayers"
      :key="player.role.name"
      :turn="turn"
      :players="players"
      :hand="hand"
      :yourPlayer="yourPlayer"
      :shareWith="player"
    />
    <div v-if="turn.accusation">
      <div>Your accusation:</div>
      <Cards :cards="Object.values(turn.accusation)" />
    </div>
    <div v-else-if="yourPlayer && !yourPlayer.isDed">
      <button @click="showAccuse = true">Accuse</button>
    </div>
    <UnreadyPlayers :players="players" :playerIsReady="turn.playerIsReady" />
    <template v-if="showAccuse && !turn.accusation">
      <h2>Accusation</h2>
      <SelectCrime
        class="turn-record__accuse"
        :excludeCards="hand"
        buttonText="Final Accusation"
        :onSelect="onAccuse"
      />
    </template>
    <ReadyToast
      v-if="yourPlayer && !yourPlayer.isDed && !turn.accusation"
      :playerIsReady="turn.playerIsReady"
      :yourPlayer="yourPlayer"
      :setIsReady="setIsReady"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import Sticky from '@/components/Sticky.vue';
import Cards from '@/deduction/components/Cards.vue';
import CardShare from '@/deduction/components/CardShare.vue';
import ReadyToast from '@/deduction/components/ReadyToast.vue';
import SelectCrime from '@/deduction/components/SelectCrime.vue';
import UnreadyPlayers from '@/deduction/components/UnreadyPlayers.vue';
import { isAlive } from '@/deduction/utils';
import { Card, Crime, Player, TurnRecordState } from '@/deductionSync/state';
import { Dict, Maybe } from '@/types';
import { dictFromList } from '@/utils';

interface TurnRecordData {
  showAccuse: boolean;
}

export default defineComponent({
  name: 'TurnRecord',
  components: {
    Cards,
    CardShare,
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
    roleToPlayer(): Dict<Player> {
      return dictFromList(this.players, (acc, p) => {
        acc[p.role.name] = p;
      });
    },
    livePlayers(): Player[] {
      return this.players.filter(isAlive);
    },
    unreadyPlayers(): Player[] {
      return Object.entries(this.turn.playerIsReady)
        .filter(e => !e[1])
        .map(e => this.roleToPlayer[e[0]]);
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

  &__accuse :deep(.select-crime__button) {
    background-color: rgba(255, 24, 12, 0.5);

    &[disabled] {
      background-color: transparent;
    }
  }
}
</style>
