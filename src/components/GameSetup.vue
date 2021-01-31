<template>
  <div class="game-setup">
    <h2>Role</h2>
    <div class="game-setup__roles">
      <div
        v-for="role in state.skin.roles"
        :key="role.name"
        class="game-setup__role"
        :class="classesForRole(role)"
        @click="selectRole(role)"
      >
        <RoleColor :role="role" />
        <div>
          <span>{{ role.name }}</span>
          <span v-if="!isRoleAvailable(role)">
            [{{ roleToConnection[role.name].name }}]</span
          >
        </div>
      </div>
    </div>
    <h2>Name</h2>
    <form @submit.prevent="saveName">
      <input v-model="name" type="text" :disabled="!connection.role" />
      <button type="submit" class="game-setup__save-name">Save</button>
    </form>
    <div class="game-setup__buttons">
      <button :disabled="!canReady" @click="toggleReady">
        {{ connection.isReady ? 'Unready' : 'Ready' }}
      </button>
      <button :disabled="!canStart" @click="startGame">Start</button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import RoleColor from '@/components/RoleColor.vue';
import { ConnectionEvent, ConnectionEvents } from '@/events';
import { ConnectionDescription, RoleCard, SetupState } from '@/state';
import { Dict } from '@/types';
import { dictFromList } from '@/utils';

export default defineComponent({
  name: 'GameSetup',
  components: {
    RoleColor,
  },
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
  data: () => ({
    name: '',
  }),
  computed: {
    connection(): ConnectionDescription {
      return this.state.connections[this.state.connectionIndex];
    },
    roleToConnection(): Dict<ConnectionDescription> {
      return dictFromList(this.state.connections, (acc, connection) => {
        if (connection.role) {
          acc[connection.role.name] = connection;
        }
      });
    },
    playerConnections(): ConnectionDescription[] {
      return this.state.connections.filter(c => c.role);
    },
    canReady(): boolean {
      return Boolean(this.connection.role && this.connection.name);
    },
    canStart(): boolean {
      return (
        this.playerConnections.length > 1 &&
        this.playerConnections.every(c => c.isReady)
      );
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
    saveName() {
      this.send({
        type: ConnectionEvents.SetName,
        data: this.name,
      });
    },
    toggleReady() {
      this.send({
        type: ConnectionEvents.SetReady,
        data: !this.connection.isReady,
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
@import '@/style/constants';

.game-setup {
  @include flex-column;
  padding: $pad-md $pad-lg;

  &__save-name {
    margin-left: $pad-xs;
  }

  &__roles {
    text-align: left;
  }

  &__role {
    display: flex;
    align-items: center;

    &--ready {
      color: green;
    }

    &--available {
      color: blue;
      cursor: pointer;
    }

    .role-color {
      margin: 0.8rem;
    }
  }

  &__buttons {
    margin-top: $pad-xs;
  }
}
</style>
