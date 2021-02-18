<template>
  <div class="room">
    <div v-if="!state">Loading...</div>
    <div v-else-if="!connected">Reconnecting...</div>
    <Deduction
      v-else-if="state.game.kind === Games.Deduction"
      :state="state.game.state"
      :send="sendGameEvent"
    />
    <hr />
    <div class="room__buttons">
      <button @click="restart">Restart</button>
      <button @click="showStateJson = !showStateJson">Debug</button>
    </div>
    <div v-if="showStateJson" class="room__state">
      {{ JSON.stringify(state, null, 2) }}
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { useWebSocket } from '@/composables/websocket';
import Deduction from '@/deduction/components/Deduction.vue';
import { DeductionEvents } from '@/deduction/events';
import { DeductionState, DeductionStatus, RoleCard } from '@/deduction/state';
import { RoomEvent, RoomEvents } from '@/events';
import { Games, RoomState } from '@/state';
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
  name: 'Room',
  components: {
    Deduction,
  },
  setup() {
    const route = useRoute();
    const id = computed(() => route.params.id);
    const protocol = document.location.protocol === 'https:' ? 'wss' : 'ws';
    const url = computed(
      () => `${protocol}://${window.location.host}/api/${id.value}/`
    );

    const { connected, state, send } = useWebSocket<RoomState, RoomEvent>(url);

    const restart = () => {
      if (confirm('Are you sure you want to restart the game?')) {
        send({ kind: RoomEvents.Restart });
      }
    };

    const sendGameEvent = (event: any) =>
      send({
        kind: RoomEvents.GameEvent,
        event,
      });

    watch(connected, (newVal, oldVal) => {
      if (newVal && !oldVal && state.value) {
        const role = roleFromState(state.value.game.state);
        if (role) {
          sendGameEvent({
            kind: DeductionEvents.SetRole,
            data: role,
          });
        }
      }
    });

    return {
      Games,
      connected,
      state,
      sendGameEvent,
      restart,
      showStateJson: ref(false),
    };
  },
});
</script>

<style lang="scss" scoped>
@import '@/style/constants';

.room {
  margin: 0 auto;
  padding: $pad-lg $pad-sm;
  background-color: #eee;
  box-shadow: $box-shadow;

  @media (min-width: $screen-sm-min) {
    width: $container-sm;
  }

  @media (min-width: $screen-md-min) {
    width: $container-md;
  }

  @media (min-width: $screen-lg-min) {
    width: $container-lg;
  }

  > :not(:first-child) {
    margin-top: $pad-lg;
  }

  &__state {
    color: #666;
    font-family: 'Courier New';
    font-size: 1.4rem;
    text-align: left;
    padding: $pad-lg;
    white-space: pre-wrap;
  }
}
</style>
