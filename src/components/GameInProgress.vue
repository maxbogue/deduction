<template>
  <div class="game-in-progress">
    <div class="game-in-progress__connection-player">
      You are {{ connectionPlayer }}
    </div>
    <div class="game-in-progress__players">
      <div
        v-for="player in state.players"
        :key="player.role"
        class="game-in-progress__player"
        :class="classesForPlayer(player)"
        @click="reconnectAsPlayer(player)"
      >
        {{ playerToString(player) }}
      </div>
    </div>
    <div class="game-in-progress__cards">
      <div class="game-in-progress__card-column">
        <div
          v-for="role in state.skin.roles"
          :key="role"
          class="game-in-progress__card"
          :class="{ 'game-in-progress__card--selected': role === selectedRole }"
          @click="selectRole(role)"
        >
          {{ role }}
        </div>
      </div>
      <div class="game-in-progress__card-column">
        <div
          v-for="tool in state.skin.tools"
          :key="tool"
          class="game-in-progress__card"
          :class="{ 'game-in-progress__card--selected': tool === selectedTool }"
          @click="selectTool(tool)"
        >
          {{ tool }}
        </div>
      </div>
      <div class="game-in-progress__card-column">
        <div
          v-for="place in state.skin.places"
          :key="place"
          class="game-in-progress__card"
          :class="{
            'game-in-progress__card--selected': place === selectedPlace,
          }"
          @click="selectPlace(place)"
        >
          {{ place }}
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import { ConnectionEvent, ConnectionEvents } from '@/events';
import { InProgressState, PlayerPublicState } from '@/state';
import { Maybe } from '@/types';

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
  data: () => ({
    selectedRole: '',
    selectedTool: '',
    selectedPlace: '',
  }),
  computed: {
    currentPlayer(): Maybe<PlayerPublicState> {
      if (!this.state.playerState) {
        return null;
      }
      return this.state.players[this.state.playerState.index];
    },
    connectionPlayer(): string {
      return this.currentPlayer
        ? this.playerToString(this.currentPlayer)
        : 'observing';
    },
  },
  methods: {
    classesForPlayer(player: PlayerPublicState) {
      return {
        'game-in-progress__player--disconnected': !player.connected,
        'game-in-progress__player--reconnectable': this.canReconnectAsPlayer(
          player
        ),
      };
    },
    selectRole(role: string) {
      this.selectedRole = role === this.selectedRole ? '' : role;
    },
    selectTool(tool: string) {
      this.selectedTool = tool === this.selectedTool ? '' : tool;
    },
    selectPlace(place: string) {
      this.selectedPlace = place === this.selectedPlace ? '' : place;
    },
    playerToString(player: PlayerPublicState): string {
      const { role, name } = player;
      return `${role} [${name}]`;
    },
    canReconnectAsPlayer(player: PlayerPublicState): boolean {
      return !this.currentPlayer && !player.connected;
    },
    reconnectAsPlayer(player: PlayerPublicState) {
      this.send({
        type: ConnectionEvents.SetRole,
        data: player.role,
      });
    },
  },
});
</script>

<style lang="scss">
@import '@/style/constants';

.game-in-progress {
  &__cards {
    display: flex;
    justify-content: space-around;
  }

  &__card-column {
    display: flex;
    flex-direction: column;
  }

  &__card {
    padding: $pad-xs;
    color: blue;
    cursor: pointer;
    border: 1px solid transparent;

    &:hover {
      border: 1px solid black;
    }

    &--selected {
      color: green;
    }
  }

  &__player {
    color: green;

    &--disconnected {
      color: red;
    }

    &--reconnectable {
      color: blue;
      cursor: pointer;
    }
  }
}
</style>
