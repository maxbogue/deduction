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
import { DeductionEvent, DeductionEvents } from '@/deduction/events';
import { DeductionState, DeductionStatus, RoleCard } from '@/deduction/state';
import { Maybe } from '@/types';

function roleFromState(state: DeductionState): Maybe<RoleCard> {
  if (state.status === DeductionStatus.Setup) {
    return state.playersByConnection[state.connectionId].role;
  }
  if (!state.playerSecrets) {
    return null;
  }
  return state.players[state.playerSecrets.index].role;
}

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
    connected: {
      type: Boolean as PropType<boolean>,
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
  watch: {
    connected(newVal, oldVal) {
      if (newVal && !oldVal) {
        const role = roleFromState(this.state);
        if (role) {
          this.send({
            kind: DeductionEvents.SetRole,
            data: role,
          });
        }
      }
    },
  },
});
</script>
