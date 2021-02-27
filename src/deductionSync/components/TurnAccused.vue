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
    <div class="turn-accused__unready-players">
      <span>Waiting for: </span>
      <RoleColor
        v-for="player in unreadyPlayers"
        :key="player.role.name"
        :role="player.role"
      />
    </div>
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
import RoleColor from '@/deduction/components/RoleColor.vue';
import { Player, TurnAccusedState } from '@/deductionSync/state';
import { Dict, Maybe } from '@/types';
import { dictFromList } from '@/utils';

export default defineComponent({
  name: 'TurnAccused',
  components: {
    Cards,
    ReadyToast,
    RoleColor,
    Sticky,
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

  &__unready-players {
    display: flex;
    align-items: center;
    justify-content: center;

    > :not(:first-child) {
      margin-left: $pad-xs;
    }
  }

  &__accuse :deep(.select-crime__button) {
    background-color: rgba(255, 24, 12, 0.5);

    &[disabled] {
      background-color: transparent;
    }
  }
}
</style>