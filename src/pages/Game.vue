<template>
  <div class="game">
    <div v-if="!state">Loading...</div>
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
    <button class="game__toggle-state" @click="showStateJson = !showStateJson">
      Toggle State
    </button>
    <div v-if="showStateJson" class="game__state">
      {{ JSON.stringify(state, null, 2) }}
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, Ref, ref } from 'vue';
import { useRoute } from 'vue-router';

import GameInProgress from '@/components/GameInProgress.vue';
import GameOver from '@/components/GameOver.vue';
import GameSetup from '@/components/GameSetup.vue';
import { ConnectionEvent } from '@/events';
import { GameState, GameStatus } from '@/state';
import { Maybe } from '@/types';

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
    const state: Ref<Maybe<GameState>> = ref(null);

    const ws = new WebSocket(`ws://${window.location.host}/api/${id.value}/`);
    ws.addEventListener('message', event => {
      state.value = JSON.parse(event.data);
    });

    const send = (event: ConnectionEvent) => {
      ws.send(JSON.stringify(event));
    };

    return {
      GameStatus,
      state,
      send,
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
  padding: $pad-md;
  background-color: #eee;
  width: 800px;

  &__toggle-state {
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
