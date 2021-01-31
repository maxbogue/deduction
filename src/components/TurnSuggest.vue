<template>
  <div>
    <template v-if="yourPlayer === turnPlayer">
      <h2>Suggest</h2>
      <SelectCrime :onSelect="onSuggest" />
    </template>
    <div v-else>Waiting for {{ turnPlayer.name }} to make a suggestion.</div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import SelectCrime from '@/components/SelectCrime.vue';
import { Crime, Player } from '@/state';
import { Maybe } from '@/types';

export default defineComponent({
  name: 'TurnSuggest',
  components: {
    SelectCrime,
  },
  props: {
    yourPlayer: {
      type: Object as PropType<Maybe<Player>>,
      default: null,
    },
    turnPlayer: {
      type: Object as PropType<Player>,
      required: true,
    },
    onSuggest: {
      type: Function as PropType<(suggestion: Crime) => void>,
      required: true,
    },
  },
});
</script>
