<template>
  <div class="turn-record">
    <Sticky>Record your notes.</Sticky>
    <CardShare
      v-for="player in players"
      :key="player.role.name"
      :turn="turn"
      :players="players"
      :hand="hand"
      :yourPlayer="yourPlayer"
      :shareWith="player"
    />
    <div class="turn-record__buttons">
      <button @click="showAccuse = true">Accuse</button>
    </div>
    <div class="turn-record__unready-players">
      <span>Waiting for: </span>
      <RoleColor
        v-for="player in unreadyPlayers"
        :key="player.role.name"
        :role="player.role"
      />
    </div>
    <template v-if="showAccuse">
      <h2>Accusation</h2>
      <SelectCrime
        class="turn-record__accuse"
        :excludeCards="hand"
        buttonText="Final Accusation"
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
import { defineComponent, PropType } from 'vue';

import Sticky from '@/components/Sticky.vue';
import CardShare from '@/deduction/components/CardShare.vue';
import ReadyToast from '@/deduction/components/ReadyToast.vue';
import RoleColor from '@/deduction/components/RoleColor.vue';
import SelectCrime from '@/deduction/components/SelectCrime.vue';
import { Card, Crime, Player, TurnRecordState } from '@/deductionSync/state';
import { Dict, Maybe } from '@/types';
import { dictFromList } from '@/utils';

interface TurnRecordData {
  showAccuse: boolean;
}

export default defineComponent({
  name: 'TurnRecord',
  components: {
    CardShare,
    ReadyToast,
    RoleColor,
    SelectCrime,
    Sticky,
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
