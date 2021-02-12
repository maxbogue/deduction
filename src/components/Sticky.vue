<template>
  <div class="sticky" :style="cssProps">
    <div ref="placeholderRef" class="sticky__placeholder" />
    <div ref="contentRef" :class="contentClass">
      <slot />
    </div>
  </div>
</template>

<script lang="ts">
import {
  computed,
  ComputedRef,
  defineComponent,
  nextTick,
  onMounted,
  PropType,
  Ref,
  ref,
  toRefs,
  watch,
} from 'vue';

import { useEventListener } from '@/composables';
import { Dict, Maybe } from '@/types';

export default defineComponent({
  name: 'Sticky',
  props: {
    sentinel: {
      type: Object as PropType<unknown>,
      default: null as unknown,
    },
  },
  setup(props) {
    const { sentinel } = toRefs(props);
    const contentRef: Ref<Maybe<HTMLElement>> = ref(null);
    const placeholderRef: Ref<Maybe<HTMLElement>> = ref(null);

    const isSticky = ref(false);
    const contentTop = ref(0);
    const contentWidth = ref(0);
    const placeholderHeight = ref(0);

    const getPlaceholderTop = () => placeholderRef.value?.offsetTop ?? 0;
    const getRoomWidth = () => {
      const room = document.querySelector('.room');
      return room instanceof HTMLElement ? room.offsetWidth : 0;
    };
    const getContentHeight = () => contentRef.value?.offsetHeight ?? 0;

    const syncPlaceholder = () => {
      contentTop.value = getPlaceholderTop();
      contentWidth.value = getRoomWidth();
      placeholderHeight.value = getContentHeight();
    };

    const doubleSync = () => {
      syncPlaceholder();
      nextTick(syncPlaceholder);
    };

    watch(sentinel, doubleSync);
    onMounted(doubleSync);
    useEventListener(window, 'resize', doubleSync);

    useEventListener(window, 'scroll', () => {
      isSticky.value = window.scrollY > getPlaceholderTop();
    });

    const cssProps: ComputedRef<Dict<string>> = computed(() => ({
      '--content-top': `${contentTop.value}px`,
      '--content-width': `${contentWidth.value}px`,
      '--placeholder-height': `${placeholderHeight.value}px`,
    }));

    const contentClass: ComputedRef<Dict<boolean>> = computed(() => ({
      sticky__content: true,
      'sticky__content--sticky': isSticky.value,
    }));

    return {
      contentRef,
      placeholderRef,
      cssProps,
      contentClass,
    };
  },
});
</script>

<style lang="scss" scoped>
@import '@/style/constants';

.sticky {
  &__placeholder {
    width: 100%;
    height: var(--placeholder-height);

    &::before {
      content: ' ';
    }
  }

  &__content {
    margin-top: 0 !important;
    position: absolute;
    top: var(--content-top);
    left: calc(50% - var(--content-width) / 2);
    width: var(--content-width);
    background-color: #eee;
    padding: $pad-sm;

    &--sticky {
      position: fixed;
      top: 0;
      box-shadow: $box-shadow;
      z-index: 5;
      opacity: 95%;
    }
  }
}
</style>
