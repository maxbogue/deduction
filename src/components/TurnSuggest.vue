<template>
  <div class="turn-suggest">
    <div v-if="yourPlayer === turnPlayer" class="turn-suggest__your-turn">
      <h2>Suggest</h2>
      <SelectCrime :onSelect="onSuggest" />
    </div>
    <Sticky v-else
      >Waiting for {{ turnPlayer.name }} to make a suggestion.</Sticky
    >
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import SelectCrime from '@/components/SelectCrime.vue';
import Sticky from '@/components/Sticky.vue';
import { Crime, Player } from '@/state';
import { Maybe } from '@/types';

export default defineComponent({
  name: 'TurnSuggest',
  components: {
    SelectCrime,
    Sticky,
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

<style lang="scss" scoped>
@import '@/style/constants';

.turn-suggest {
  @include flex-column;

  h2 {
    margin-top: 0;
  }

  &__your-turn {
    padding: $pad-sm;
  }
}
</style>
