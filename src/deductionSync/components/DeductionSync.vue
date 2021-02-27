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
import {
  DeductionSyncEvent,
  DeductionSyncEvents,
} from '@/deductionSync/events';
import {
  DeductionStatus,
  DeductionSyncState,
  RoleCard,
} from '@/deductionSync/state';
import { Maybe } from '@/types';

function roleFromState(state: DeductionSyncState): Maybe<RoleCard> {
  if (state.status === DeductionStatus.Setup) {
    return state.playersByConnection[state.connectionId].role;
  }
  if (!state.playerSecrets) {
    return null;
  }
  return state.players[state.playerSecrets.index].role;
}

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
    connected: {
      type: Boolean as PropType<boolean>,
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
  watch: {
    connected(newVal, oldVal) {
      if (newVal && !oldVal) {
        const role = roleFromState(this.state);
        if (role) {
          this.send({
            kind: DeductionSyncEvents.SetRole,
            data: role,
          });
        }
      }
    },
  },
});
</script>
