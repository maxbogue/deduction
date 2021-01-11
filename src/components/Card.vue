<template>
  <div class="card" :class="{ 'card--selected': selected }">
    {{ card.name }}
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import { Card } from '@/state';

export default defineComponent({
  name: 'Card',
  props: {
    card: {
      type: Object as PropType<Card>,
      required: true,
    },
    selected: {
      type: Boolean,
      default: false,
    },
  },
});
</script>

<style lang="scss">
@import '@/style/constants';

.card {
  padding: $pad-xs;
  color: blue;
  cursor: pointer;
  border: 1px solid transparent;

  &:hover {
    border: 1px solid black;
  }

  &--selected {
    color: green;
  }
}
</style>
