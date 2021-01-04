<template>
  <div>
    <div>{{ state }}</div>
    <div><button @click="chooseRole">role me baby</button></div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, ref, Ref } from 'vue';
import { useRoute } from 'vue-router';

import { ConnectionEvent, ConnectionEvents } from '@/events';
import { GameState, GameStatus } from '@/state';
import { Maybe } from '@/types';

export default defineComponent({
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
      id,
      state,
      send,
    }
  },
  methods: {
    chooseRole() {
      if (this.state?.status !== GameStatus.Setup) {
        return;
      }
      this.send({
        type: ConnectionEvents.SetRole,
        data: this.state.availableRoles[0],
      })
    }
  },
});
</script>
