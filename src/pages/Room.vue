<template>
  <div class="room">
    <div v-if="!state">Loading...</div>
    <form v-else-if="!state.game" @submit.prevent="setGame">
      <h1>Select Game</h1>
      <select v-model="gameOption" class="room__select">
        <option v-for="game in Object.values(Games)" :key="game">
          {{ game }}
        </option>
      </select>
      <div>
        <button type="submit">Submit</button>
      </div>
    </form>
    <Deduction
      v-else-if="state.game.kind === Games.Deduction"
      :state="state.game.state"
      :connected="connected"
      :send="sendGameEvent"
    />
    <DeductionSync
      v-else-if="state.game.kind === Games.DeductionSync"
      :state="state.game.state"
      :connected="connected"
      :send="sendGameEvent"
    />
    <Modal v-if="state && !showReconnectingOverlay">Reconnecting...</Modal>
    <hr />
    <div class="room__buttons">
      <button v-if="state && state.game" @click="restart">Restart</button>
      <button v-if="state && state.game" @click="quit">Quit</button>
      <button @click="showStateJson = !showStateJson">Debug</button>
    </div>
    <div v-if="showStateJson" class="room__state">
      {{ JSON.stringify(state, null, 2) }}
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, Ref, ref } from 'vue';
import { useRoute } from 'vue-router';

import Modal from '@/components/Modal.vue';
import { useOffDelayed } from '@/composables';
import { useWebSocket } from '@/composables/websocket';
import Deduction from '@/deduction/components/Deduction.vue';
import DeductionSync from '@/deductionSync/components/DeductionSync.vue';
import { RoomEvent, RoomEvents } from '@/events';
import { Games, RoomState } from '@/state';
import { Maybe } from '@/types';

export default defineComponent({
  name: 'Room',
  components: {
    Deduction,
    DeductionSync,
    Modal,
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

    const quit = () => {
      if (confirm('Are you sure you want to quit the game?')) {
        send({
          kind: RoomEvents.SetGame,
          game: null,
        });
      }
    };

    const sendGameEvent = (event: any) => {
      send({
        kind: RoomEvents.GameEvent,
        event,
      });
    };

    const gameOption: Ref<Maybe<Games>> = ref(null);
    const setGame = () => {
      send({
        kind: RoomEvents.SetGame,
        game: gameOption.value || null,
      });
    };

    return {
      Games,
      connected,
      gameOption,
      quit,
      restart,
      sendGameEvent,
      setGame,
      // Hide short-lived disconnects.
      showReconnectingOverlay: useOffDelayed(connected, 500),
      showStateJson: ref(false),
      state,
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

  &__select {
    font-family: 'Crimson Text', serif;
    font-size: 2.4rem;
  }
}
</style>
