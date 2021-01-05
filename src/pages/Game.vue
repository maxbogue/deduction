<template>
  <div>
    <div>{{ state }}</div>
    <button
      v-for="role in state.availableRoles"
      :key="role"
      @click="chooseRoleFor(role)"
    >
      {{ role }}
    </button>
    <button @click="chooseFirstAvailableRole">role me baby</button>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, Ref, ref } from 'vue';
import { useRoute } from 'vue-router';

import { ConnectionEvent, ConnectionEvents } from '@/events';
import { GameState, GameStatus } from '@/state';
import { Maybe } from '@/types';

export default defineComponent({
  name: 'Game',
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
    };
  },
  methods: {
    chooseFirstAvailableRole() {
      if (
        this.state?.status !== GameStatus.Setup ||
        this.state?.availableRoles.length === 0
      ) {
        return;
      }
      this.chooseRoleFor(this.state.availableRoles[0]);
    },
    chooseRoleFor(name: string) {
      if (this.state?.status !== GameStatus.Setup) {
        return;
      }
      this.send({
        type: ConnectionEvents.SetRole,
        data: name,
      });
    },
  },
});
</script>
