<template>
  <div>
    <button v-for="role in state.skin.roles" :key="role">
      {{ role }}
    </button>
    <button v-for="obj in state.skin.objects" :key="obj">
      {{ obj }}
    </button>
    <button v-for="place in state.skin.places" :key="place">
      {{ place }}
    </button>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import { ConnectionEvent, ConnectionEvents } from '@/events';
import { InProgressState, SetupState } from '@/state';

export default defineComponent({
  name: 'GameInProgress',
  props: {
    state: {
      type: Object as PropType<InProgressState>,
      required: true,
    },
    send: {
      type: Function as PropType<(event: ConnectionEvent) => void>,
      required: true,
    },
  },
  methods: {},
});
</script>

<style lang="scss"></style>
