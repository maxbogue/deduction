<template>
  <div
    class="ready-toast"
    :style="{ backgroundColor: yourPlayer.role.color }"
    @click="setIsReady(!isReady)"
  >
    {{ isReady ? unreadyPhrase : readyPhrase }}
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import { Player } from '@/deduction/state';
import { Dict } from '@/types';
import { chooseOne } from '@/utils';

const READY_PHRASES = [
  'im ready bro',
  'lets gooooo',
  'we did it',
  'done and done',
  'thank u next',
  '✅', // checkmark emoji
];

const UNREADY_PHRASES = [
  'no wait',
  'oops hang on',
  'gotta check something',
  'hmmm one sec',
  'jk',
  '⏪', // rewind emoji
];

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
  data: () => ({
    readyPhrase: chooseOne(READY_PHRASES),
    unreadyPhrase: chooseOne(UNREADY_PHRASES),
  }),
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
  user-select: none;

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
