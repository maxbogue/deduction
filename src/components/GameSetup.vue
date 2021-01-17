<template>
  <div>
    <input v-model="name" type="text" />
    <div
      v-for="role in state.skin.roles"
      :key="role.name"
      class="game-setup__role"
      :class="classesForRole(role)"
      @click="selectRole(role)"
    >
      <span>{{ role.name }}</span>
      <span v-if="!isRoleAvailable(role)">
        [{{ roleToConnection[role.name].name }}]</span
      >
    </div>
    <button @click="setReady">Ready!</button>
    <button @click="startGame">Start!</button>
  </div>
</template>

<script lang="ts">
import debounce from 'lodash/debounce';
import { defineComponent, PropType } from 'vue';

import { ConnectionEvent, ConnectionEvents } from '@/events';
import { ConnectionDescription, RoleCard, SetupState } from '@/state';
import { Dict } from '@/types';
import { dictFromList } from '@/utils';

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
  computed: {
    connection(): ConnectionDescription {
      return this.state.connections[this.state.connectionIndex];
    },
    name: {
      get(): string {
        return this.connection.name;
      },
      set: debounce(function (name: string) {
        // @ts-expect-error `this` type not defined correctly in Lodash.
        this.setName(name);
      }, 200),
    },
    roleToConnection(): Dict<ConnectionDescription> {
      return dictFromList(this.state.connections, (acc, connection) => {
        if (connection.role) {
          acc[connection.role.name] = connection;
        }
      });
    },
  },
  methods: {
    isRoleAvailable(role: RoleCard): boolean {
      return !this.roleToConnection[role.name];
    },
    classesForRole(role: RoleCard) {
      const connection = this.roleToConnection[role.name];
      return {
        'game-setup__role--available': !connection,
        'game-setup__role--ready': connection?.isReady,
      };
    },
    selectRole(role: RoleCard) {
      if (!this.isRoleAvailable(role)) {
        return;
      }
      this.send({
        type: ConnectionEvents.SetRole,
        data: role,
      });
    },
    setName(name: string) {
      this.send({
        type: ConnectionEvents.SetName,
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

<style lang="scss">
.game-setup {
  &__role {
    &--ready {
      color: green;
    }

    &--available {
      color: blue;
      cursor: pointer;
    }
  }
}
</style>
