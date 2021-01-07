<template>
  <div>
    <button
      v-for="role in state.availableRoles"
      :key="role"
      @click="chooseRoleFor(role)"
    >
      {{ role }}
    </button>
    <button @click="chooseFirstAvailableRole">role me baby</button>
    <button @click="setReady">Ready!</button>
    <button @click="startGame">Start!</button>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import { ConnectionEvent, ConnectionEvents } from '@/events';
import { SetupState } from '@/state';

export default defineComponent({
  name: 'GameSetup',
  props: {
    state: {
      type: Object as PropType<SetupState>,
      required: true,
    },
    send: {
      type: Function as PropType<(event: ConnectionEvent) => void>,
      required: true,
    },
  },
  methods: {
    chooseFirstAvailableRole() {
      if (this.state.availableRoles.length === 0) {
        return;
      }
      this.chooseRoleFor(this.state.availableRoles[0]);
    },
    chooseRoleFor(name: string) {
      this.send({
        type: ConnectionEvents.SetRole,
        data: name,
      });
    },
    setReady() {
      this.send({
        type: ConnectionEvents.SetReady,
        data: true,
      });
    },
    startGame() {
      this.send({
        type: ConnectionEvents.Start,
      });
    },
  },
});
</script>

<style lang="scss"></style>
