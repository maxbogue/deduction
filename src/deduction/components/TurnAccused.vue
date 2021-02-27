<template>
  <div class="turn-accused">
    <Sticky :sentinel="turn">
      <div>{{ getPlayerName(turnPlayer) }} is ded! &#x1F47B;</div>
      <div>Failed accusation:</div>
      <Cards :cards="Object.values(turn.failedAccusation)" />
    </Sticky>
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
import { Card, Player, TurnAccusedState } from '@/deduction/state';
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
  },
  computed: {
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
