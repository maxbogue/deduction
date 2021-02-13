<template>
  <div v-if="onClick" class="card" :class="classes" @click="onClick">
    {{ card.name }}
  </div>
  <div v-else class="card" :class="classes">
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
      type: Function as PropType<() => void>,
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
});
</script>

<style lang="scss">
@import '@/style/constants';

.card {
  padding: $pad-xs $pad-sm;
  margin: $pad-xs;
  border: 1px solid transparent;
  box-shadow: $box-shadow;
  background-color: #fff;
  text-align: center;
  display: inline-block;
  cursor: default;

  &--selectable {
    color: blue;
    cursor: pointer;
  }

  &--selected {
    background-color: #333;
    color: #fff;
  }
}
</style>
