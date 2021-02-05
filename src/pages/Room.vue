<template>
  <div class="room">
    <div v-if="!state">Loading...</div>
    <div v-else-if="!connected">Reconnecting...</div>
    <GameSetup
      v-else-if="state.status === GameStatus.Setup"
      :state="state"
      :send="send"
    />
    <GameInProgress
      v-else-if="state.status === GameStatus.InProgress"
      :state="state"
      :send="send"
    />
    <GameOver v-else :state="state" :send="send" />
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

import GameInProgress from '@/components/GameInProgress.vue';
import GameOver from '@/components/GameOver.vue';
import GameSetup from '@/components/GameSetup.vue';
import { useWebSocket } from '@/composables/websocket';
import { ConnectionEvent, ConnectionEvents } from '@/events';
import { GameState, GameStatus, RoleCard } from '@/state';
import { Maybe } from '@/types';

function roleFromState(state: GameState): Maybe<RoleCard> {
  if (state.status === GameStatus.Setup) {
    return state.connections[state.connectionIndex].role;
  }
  if (!state.playerSecrets) {
    return null;
  }
  return state.players[state.playerSecrets.index].role;
}

export default defineComponent({
  name: 'Room',
  components: {
    GameInProgress,
    GameOver,
    GameSetup,
  },
  setup() {
    const route = useRoute();
    const id = computed(() => route.params.id);
    const protocol = document.location.protocol === 'https:' ? 'wss' : 'ws';
    const url = computed(
      () => `${protocol}://${window.location.host}/api/${id.value}/`
    );

    const { connected, state, send } = useWebSocket<GameState, ConnectionEvent>(
      url
    );

    const restart = () => {
      if (confirm('Are you sure you want to restart the game?')) {
        send({ type: ConnectionEvents.Restart });
      }
    };

    watch(connected, (newVal, oldVal) => {
      if (newVal && !oldVal && state.value) {
        const role = roleFromState(state.value);
        if (role) {
          send({
            type: ConnectionEvents.SetRole,
            data: role,
          });
        }
      }
    });

    return {
      GameStatus,
      connected,
      state,
      send,
      restart,
      showStateJson: ref(false),
    };
  },
});
</script>

<style lang="scss" scoped>
@import '@/style/constants';

.room {
  margin: $pad-lg auto $pad-lg;
  padding: $pad-lg $pad-md;
  background-color: #eee;

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
