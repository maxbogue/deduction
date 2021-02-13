<template>
  <div
    class="ready-toast"
    :style="{ backgroundColor: yourPlayer.role.color }"
    @click="setIsReady(!isReady)"
  >
    {{ isReady ? 'no wait' : 'im ready bro' }}
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import { Player } from '@/state';
import { Dict } from '@/types';

export default defineComponent({
  name: 'ReadyToast',
  props: {
    playerIsReady: {
      type: Object as PropType<Dict<boolean>>,
      required: true,
    },
    yourPlayer: {
      type: Object as PropType<Player>,
      default: null,
    },
    setIsReady: {
      type: Function as PropType<(isReady: boolean) => void>,
      required: true,
    },
  },
  computed: {
    isReady(): boolean {
      return this.playerIsReady[this.yourPlayer.role.name];
    },
  },
});
</script>

<style lang="scss" scoped>
@import '@/style/constants';

.ready-toast {
  position: fixed;
  bottom: calc(1em + #{$pad-sm});
  z-index: 10;
  opacity: 95%;
  padding: $pad-sm;
  left: 0;
  width: 100%;
  box-shadow: $box-shadow;
  cursor: pointer;

  @media (min-width: $screen-sm-min) {
    width: $container-sm;
    left: calc(50% - #{$container-sm / 2});
    bottom: $pad-sm;
  }

  @media (min-width: $screen-md-min) {
    width: $container-md;
    left: calc(50% - #{$container-md / 2});
  }

  @media (min-width: $screen-lg-min) {
    width: $container-lg;
    left: calc(50% - #{$container-lg / 2});
  }
}
</style>
