<template>
  <div class="game-in-progress">
    <div class="game-in-progress__connection-player">
      You {{ isDed ? 'were' : 'are' }} {{ connectionPlayer }}
      <span v-if="isDed">&#x1F47B;</span>
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
    <div>
      <button
        v-if="currentPlayer"
        @click="showPersonalState = !showPersonalState"
      >
        Hide/Reveal Personal Info
      </button>
    </div>
    <div v-if="showPersonalState">
      <div class="game-in-progress__cards">
        <div class="game-in-progress__card-column">
          <div>My Hand:</div>
          <div v-for="card in state.playerState?.hand" :key="card">
            {{ card }}
          </div>
        </div>
        <div class="game-in-progress__card-column">
          <div
            v-for="role in suspectRoles"
            :key="role"
            class="game-in-progress__card"
            :class="{
              'game-in-progress__card--selected': role === selectedRole,
            }"
            @click="selectRole(role)"
          >
            {{ role }}
          </div>
        </div>
        <div class="game-in-progress__card-column">
          <div
            v-for="tool in suspectTools"
            :key="tool"
            class="game-in-progress__card"
            :class="{
              'game-in-progress__card--selected': tool === selectedTool,
            }"
            @click="selectTool(tool)"
          >
            {{ tool }}
          </div>
        </div>
        <div class="game-in-progress__card-column">
          <div
            v-for="place in suspectPlaces"
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
      <div v-if="readyToAccuse" class="game-in-progress__accuse">
        <button class="game-in-progress__accuse__button" @click="accuse">
          Accuse
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import { ConnectionEvent, ConnectionEvents } from '@/events';
import { Crime, InProgressState, PlayerPublicState } from '@/state';
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
    showPersonalState: false,
  }),
  computed: {
    currentPlayer(): Maybe<PlayerPublicState> {
      if (!this.state.playerState) {
        return null;
      }
      return this.state.players[this.state.playerState.index];
    },
    isDed(): boolean {
      return Boolean(this.currentPlayer?.failedAccusation);
    },
    connectionPlayer(): string {
      return this.currentPlayer
        ? this.playerToString(this.currentPlayer)
        : 'observing';
    },
    readyToAccuse(): boolean {
      if (!this.currentPlayer || this.isDed) {
        return false;
      }
      return (
        this.selectedRole !== '' &&
        this.selectedTool !== '' &&
        this.selectedPlace !== ''
      );
    },
    suspectRoles(): string[] {
      if (!this.currentPlayer) {
        return this.state.skin.roles;
      }
      return this.state.skin.roles.filter(
        n => !this.state.playerState?.hand.includes(n)
      );
    },
    suspectTools(): string[] {
      if (!this.currentPlayer) {
        return this.state.skin.tools;
      }
      return this.state.skin.tools.filter(
        n => !this.state.playerState?.hand.includes(n)
      );
    },
    suspectPlaces(): string[] {
      if (!this.currentPlayer) {
        return this.state.skin.places;
      }
      return this.state.skin.places.filter(
        n => !this.state.playerState?.hand.includes(n)
      );
    },
  },
  methods: {
    classesForPlayer(player: PlayerPublicState) {
      return {
        'game-in-progress__player--disconnected': !player.isConnected,
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
    accuse() {
      const crime: Crime = {
        role: this.selectedRole,
        tool: this.selectedTool,
        place: this.selectedPlace,
      };
      this.send({
        type: ConnectionEvents.Accuse,
        data: crime,
      });
    },
    playerToString(player: PlayerPublicState): string {
      const { role, name } = player;
      return `${role} [${name}]`;
    },
    canReconnectAsPlayer(player: PlayerPublicState): boolean {
      return !this.currentPlayer && !player.isConnected;
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

  &__accuse {
    display: flex;
    justify-content: center;

    &__button {
      color: cornflowerblue;
    }
  }
}
</style>
