<script lang="ts">
import {
  ComponentPublicInstance,
  defineComponent,
  h,
  nextTick,
  onMounted,
  Ref,
  ref,
} from 'vue';

import { useEventListener } from '@/composables';
import { Maybe } from '@/types';

export default defineComponent({
  name: 'Sticky',
  setup(_, { slots }) {
    const placeholderRef: Ref<Maybe<HTMLElement>> = ref(null);
    let slotEls: HTMLElement[] = [];

    const isSlotSticky = ref(false);
    const slotTop = ref(0);
    const slotWidth = ref(0);
    const placeholderHeight = ref(0);

    const getPlaceholderTop = () => placeholderRef.value?.offsetTop ?? 0;
    const getRoomWidth = () => {
      const room = document.querySelector('.room');
      return room instanceof HTMLElement ? room.offsetWidth : 0;
    };
    const getSlotHeight = () => slots.default.value?.$el?.offsetHeight ?? 0;

    const syncPlaceholder = () => {
      slotTop.value = getPlaceholderTop();
      slotWidth.value = getRoomWidth();
      placeholderHeight.value = getSlotHeight();
    };

    useEventListener(window, 'scroll', () => {
      isSlotSticky.value = window.scrollY > getPlaceholderTop();
    });

    //watch(state, () => {
    //  console.log('state watcher');
    //  nextTick(syncPlaceholder);
    //});

    onMounted(() => {
      console.log('mounted');
      nextTick(syncPlaceholder);
    });

    setInterval(syncPlaceholder, 100);

    const renderPlaceholder = () =>
      h('div', {
        ref: placeholderRef,
        placeholderRef,
        class: 'sticky__placeholder',
        style: {
          '--placeholder-height': `${placeholderHeight.value}px`,
        },
      });

    const addSlotStyles = node => ({
      ...node,
      class: {
        ...node.class,
        sticky__slot: true,
        'sticky__slot--sticky': isSlotSticky.value,
      },
      style: {
        ...node.style,
        '--slot-top': `${slotTop.value}px`,
        '--slot-width': `${slotWidth.value}px`,
      },
    });
    console.log(slots);

    const renderSlots = () => {
      const slotNodes = slots.default();
      slotEls = slotNodes.map(slot => slot.$el);
      return slotNodes;
    };

    return () => [renderPlaceholder(), ...slotEls.map(addSlotStyles)];
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
    top: var(--slot-top);
    width: var(--slot-width);
    background-color: #eee;
    padding: $pad-lg $pad-md;

    &--sticky {
      position: fixed;
      top: 0;
      box-shadow: $box-shadow;
      z-index: 5;
    }
  }
}
</style>
