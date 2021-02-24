<template>
  <DeductionSetup
    v-if="state.status === DeductionStatus.Setup"
    :state="state"
    :send="send"
  />
  <DeductionSyncInProgress
    v-else-if="state.status === DeductionStatus.InProgress"
    :state="state"
    :send="send"
  />
  <DeductionSyncOver v-else :state="state" :send="send" />
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import DeductionSetup from '@/deduction/components/GameSetup.vue';
import DeductionSyncInProgress from '@/deductionSync/components/DeductionSyncInProgress.vue';
import DeductionSyncOver from '@/deductionSync/components/DeductionSyncOver.vue';
import { DeductionSyncEvent } from '@/deductionSync/events';
import { DeductionStatus, DeductionSyncState } from '@/deductionSync/state';

export default defineComponent({
  name: 'DeductionSync',
  components: {
    DeductionSetup,
    DeductionSyncInProgress,
    DeductionSyncOver,
  },
  props: {
    state: {
      type: Object as PropType<DeductionSyncState>,
      required: true,
    },
    send: {
      type: Function as PropType<(event: DeductionSyncEvent) => void>,
      required: true,
    },
  },
  data: () => ({
    DeductionStatus,
  }),
});
</script>
