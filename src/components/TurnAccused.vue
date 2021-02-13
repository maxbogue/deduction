<template>
  <div class="turn-accused">
    <Sticky :sentinel="turn">
      <div>{{ getPlayerName(turnPlayer) }} is ded! &#x1F47B;</div>
      <div>Failed accusation:</div>
      <Cards :cards="Object.values(turn.failedAccusation)" />
    </Sticky>
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

import Cards from '@/components/Cards.vue';
import ReadyToast from '@/components/ReadyToast.vue';
import RoleColor from '@/components/RoleColor.vue';
import Sticky from '@/components/Sticky.vue';
import { Card, Player, TurnAccusedState } from '@/state';
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
