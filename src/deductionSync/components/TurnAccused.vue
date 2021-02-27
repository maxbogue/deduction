<template>
  <div class="turn-accused">
    <Sticky :sentinel="turn">
      {{ Object.keys(turn.failedAccusations).length }} failed accusations were
      made.
    </Sticky>
    <div v-for="player in losers" :key="player.role.name">
      <div>{{ getPlayerName(player) }} is ded! &#x1F47B;</div>
      <div>Failed accusation:</div>
      <Cards :cards="Object.values(turn.failedAccusations[player.role.name])" />
    </div>
    <UnreadyPlayers :players="players" :playerIsReady="turn.playerIsReady" />
    <ReadyToast
      v-if="yourPlayer && !yourPlayer.isDed"
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
import ReadyToast from '@/deduction/components/ReadyToast.vue';
import UnreadyPlayers from '@/deduction/components/UnreadyPlayers.vue';
import { Player, TurnAccusedState } from '@/deductionSync/state';
import { Dict, Maybe } from '@/types';
import { dictFromList } from '@/utils';

export default defineComponent({
  name: 'TurnAccused',
  components: {
    Cards,
    ReadyToast,
    Sticky,
    UnreadyPlayers,
  },
  props: {
    turn: {
      type: Object as PropType<TurnAccusedState>,
      required: true,
    },
    players: {
      type: Array as PropType<Player[]>,
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
  },
  computed: {
    roleToPlayer(): Dict<Player> {
      return dictFromList(this.players, (acc, p) => {
        acc[p.role.name] = p;
      });
    },
    losers(): Player[] {
      return this.players.filter(p => this.turn.failedAccusations[p.role.name]);
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
  },
});
</script>

<style lang="scss" scoped>
@import '@/style/constants';

.turn-accused {
  @include flex-column;
  margin-bottom: $pad-lg;
}
</style>
