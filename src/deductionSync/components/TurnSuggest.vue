<template>
  <div class="turn-suggest">
    <h2>Suggest</h2>
    <template v-if="turn.suggestion">
      <Sticky>You suggested {{ crimeToString(turn.suggestion) }}.</Sticky>
      <UnreadyPlayers :players="players" :playerIsReady="turn.playerIsReady" />
    </template>
    <template v-else>
      <Sticky>Make a suggestion.</Sticky>
      <SelectCrime :onSelect="onSuggest" />
    </template>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import Sticky from '@/components/Sticky.vue';
import SelectCrime from '@/deduction/components/SelectCrime.vue';
import UnreadyPlayers from '@/deduction/components/UnreadyPlayers.vue';
import { Crime, Player, TurnSuggestState } from '@/deductionSync/state';
import { Maybe } from '@/types';

export default defineComponent({
  name: 'TurnSuggest',
  components: {
    SelectCrime,
    Sticky,
    UnreadyPlayers,
  },
  props: {
    turn: {
      type: Object as PropType<TurnSuggestState>,
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
    onSuggest: {
      type: Function as PropType<(suggestion: Crime) => void>,
      required: true,
    },
  },
  methods: {
    crimeToString(crime: Crime): string {
      const { role, tool, place } = crime;
      return `${role.name} in the ${place.name} with the ${tool.name}`;
    },
  },
});
</script>

<style lang="scss" scoped>
@import '@/style/constants';

.turn-suggest {
  @include flex-column;

  h2 {
    margin-top: 0;
  }
}
</style>
