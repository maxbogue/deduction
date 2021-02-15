<template>
  <div class="game-setup">
    <div>
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
              [{{ playersByRole[role.name].name }}]</span
            >
          </div>
        </div>
      </div>
    </div>
    <div>
      <h2>Name</h2>
      <form @submit.prevent="saveName">
        <input v-model="name" type="text" :disabled="!player" />
        <button type="submit" class="game-setup__save-name">Save</button>
      </form>
    </div>
    <div class="game-setup__buttons">
      <button :disabled="!canReady" @click="toggleReady">
        {{ player && player.isReady ? 'Unready' : 'Ready' }}
      </button>
      <button :disabled="!canStart" @click="startGame">Start</button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import RoleColor from '@/deduction/components/RoleColor.vue';
import { ConnectionEvent, ConnectionEvents } from '@/deduction/events';
import { ProtoPlayer, RoleCard, SetupState } from '@/deduction/state';
import { Dict, Maybe } from '@/types';
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
    player(): Maybe<ProtoPlayer> {
      return this.state.playersByConnection[this.state.connectionId];
    },
    protoPlayers(): ProtoPlayer[] {
      return Object.values(this.state.playersByConnection);
    },
    playersByRole(): Dict<ProtoPlayer> {
      return dictFromList(this.protoPlayers, (acc, player) => {
        acc[player.role.name] = player;
      });
    },
    canReady(): boolean {
      return Boolean(this.player?.name);
    },
    canStart(): boolean {
      return (
        this.protoPlayers.length > 1 && this.protoPlayers.every(c => c.isReady)
      );
    },
  },
  methods: {
    isRoleAvailable(role: RoleCard): boolean {
      return !this.playersByRole[role.name];
    },
    classesForRole(role: RoleCard) {
      const player = this.playersByRole[role.name];
      return {
        'game-setup__role--available': !player,
        'game-setup__role--ready': player?.isReady,
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
      if (!this.player) {
        return;
      }
      this.send({
        type: ConnectionEvents.SetName,
        data: this.name,
      });
    },
    toggleReady() {
      if (!this.player) {
        return;
      }
      this.send({
        type: ConnectionEvents.SetReady,
        data: !this.player.isReady,
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

  > :not(:first-child) {
    margin-top: $pad-lg;
  }

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
