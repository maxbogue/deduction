<template>
  <div class="game">
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
    <div class="game__buttons">
      <button @click="restart">Restart</button>
      <button @click="showStateJson = !showStateJson">Debug</button>
    </div>
    <div v-if="showStateJson" class="game__state">
      {{ JSON.stringify(state, null, 2) }}
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, ref } from 'vue';
import { useRoute } from 'vue-router';

import GameInProgress from '@/components/GameInProgress.vue';
import GameOver from '@/components/GameOver.vue';
import GameSetup from '@/components/GameSetup.vue';
import { useWebSocket } from '@/composables/websocket';
import { ConnectionEvent, ConnectionEvents } from '@/events';
import { GameState, GameStatus } from '@/state';

export default defineComponent({
  name: 'Game',
  components: {
    GameInProgress,
    GameOver,
    GameSetup,
  },
  setup() {
    const route = useRoute();
    const id = computed(() => route.params.id);
    const url = computed(() => `ws://${window.location.host}/api/${id.value}/`);

    const { connected, state, send } = useWebSocket<GameState, ConnectionEvent>(
      url
    );

    const restart = () => {
      if (confirm('Are you sure you want to restart the game?')) {
        send({ type: ConnectionEvents.Restart });
      }
    };

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

.game {
  font-size: 2.4rem;
  text-align: center;
  margin: $pad-lg auto $pad-lg;
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
