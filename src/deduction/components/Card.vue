<template>
  <OptionalClick class="card" :class="classes" :onClick="onClick">
    {{ card.name }}
  </OptionalClick>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import OptionalClick from '@/components/OptionalClick';
import { Card } from '@/deduction/state';
import { Dict } from '@/types';

export default defineComponent({
  name: 'Card',
  components: {
    OptionalClick,
  },
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

  &--selectable {
    color: blue;
  }

  &--selected {
    background-color: #333;
    color: #fff;
  }
}
</style>
