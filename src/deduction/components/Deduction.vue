<template>
  <GameSetup
    v-if="state.status === DeductionStatus.Setup"
    :state="state"
    :send="send"
  />
  <GameInProgress
    v-else-if="state.status === DeductionStatus.InProgress"
    :state="state"
    :send="send"
  />
  <GameOver v-else :state="state" :send="send" />
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import GameInProgress from '@/deduction/components/GameInProgress.vue';
import GameOver from '@/deduction/components/GameOver.vue';
import GameSetup from '@/deduction/components/GameSetup.vue';
import { DeductionEvent } from '@/deduction/events';
import { DeductionState, DeductionStatus } from '@/deduction/state';

export default defineComponent({
  name: 'Deduction',
  components: {
    GameInProgress,
    GameOver,
    GameSetup,
  },
  props: {
    state: {
      type: Object as PropType<DeductionState>,
      required: true,
    },
    send: {
      type: Function as PropType<(event: DeductionEvent) => void>,
      required: true,
    },
  },
  data: () => ({
    DeductionStatus,
  }),
});
</script>
