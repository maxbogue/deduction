<template>
  <div class="card" :class="classes" @click="handleClick">
    {{ card.name }}
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import { Card } from '@/state';
import { Dict } from '@/types';

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
    onClick: {
      type: Function as PropType<(card: Card) => void>,
      default: null,
    },
  },
  computed: {
    classes(): Dict<boolean> {
      return {
        'card--selectable': Boolean(this.onClick),
        'card--selected': this.selected,
      };
    },
  },
  methods: {
    handleClick() {
      this.onClick?.(this.card);
    },
  },
});
</script>

<style lang="scss">
@import '@/style/constants';

.card {
  padding: $pad-xs;
  border: 1px solid transparent;

  &--selectable {
    color: blue;
    cursor: pointer;

    &:hover {
      border: 1px solid black;
    }
  }

  &--selected {
    color: green;
  }
}
</style>
