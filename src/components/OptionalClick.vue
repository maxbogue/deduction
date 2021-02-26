<!--
  Vue doesn't support optionally binding a click handler, and some browsers
  apply styles to clickable elements. This component lets you optionally bind
  a click handler by creating the element two different ways.
-->

<template>
  <component
    :is="is"
    v-if="onClick"
    class="optional-click optional-click--clickable"
    @click="onClick"
  >
    <slot />
  </component>
  <component :is="is" v-else class="optional-click">
    <slot />
  </component>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

export default defineComponent({
  name: 'OptionalClick',
  props: {
    is: {
      type: String,
      default: 'div',
    },
    onClick: {
      type: Function as PropType<() => void>,
      default: null,
    },
  },
});
</script>

<style lang="scss">
@import '@/style/constants';

.optional-click {
  cursor: default;

  &--clickable {
    cursor: pointer;
  }
}
</style>
