<template>
  <div class="game">
    <GameSetup v-if="isStateSetup" :state="state" :send="send" />
    <div class="game__state">{{ JSON.stringify(state, null, 2) }}</div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, Ref, ref } from 'vue';
import { useRoute } from 'vue-router';

import GameSetup from '@/components/GameSetup';
import { ConnectionEvent } from '@/events';
import { GameState, GameStatus } from '@/state';
import { Maybe } from '@/types';

export default defineComponent({
  name: 'Game',
  components: {
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
    const isStateSetup = computed(
      () => state.value?.status === GameStatus.Setup
    );
    return {
      id,
      state,
      send,
      isStateSetup,
    };
  },
  methods: {},
});
</script>

<style lang="scss" scoped>
@import '@/style/constants';

.game {
  font-size: 1.6rem;
  margin: $pad-lg auto $pad-lg;
  padding: $pad-md;
  background-color: #eee;
  width: 800px;

  &__state {
    color: #666;
    font-family: 'Courier New';
    white-space: pre-wrap;
  }
}
</style>
