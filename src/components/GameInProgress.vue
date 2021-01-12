<template>
  <div class="game-in-progress">
    <div class="game-in-progress__connection-player">
      You {{ isDed ? 'were' : 'are' }} {{ connectionPlayer }}
      <span v-if="isDed">&#x1F47B;</span>
    </div>
    <div class="game-in-progress__players">
      <div
        v-for="player in state.players"
        :key="player.role.name"
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
      <div>My Hand:</div>
      <div class="game-in-progress__hand">
        <Card v-for="card in state.playerState.hand" :key="card" :card="card" />
      </div>
      <div class="game-in-progress__cards">
        <div class="game-in-progress__card-column">
          <Card
            v-for="role in suspectRoles"
            :key="role"
            :card="role"
            :selected="selectedRole && role.name === selectedRole.name"
            :on-click="selectRole"
          />
        </div>
        <div class="game-in-progress__card-column">
          <Card
            v-for="tool in suspectTools"
            :key="tool"
            :card="tool"
            :selected="selectedTool && tool.name === selectedTool.name"
            :on-click="selectTool"
          />
        </div>
        <div class="game-in-progress__card-column">
          <Card
            v-for="place in suspectPlaces"
            :key="place"
            :card="place"
            :selected="selectedPlace && place === selectedPlace"
            :on-click="selectPlace"
          />
        </div>
      </div>
      <div v-if="readyToAccuse" class="game-in-progress__accuse">
        <button class="game-in-progress__accuse__button" @click="accuse">
          Accuse
        </button>
      </div>
    </div>
    <table border="1px">
      <tr>
        <td />
        <td v-for="player in state.players" :key="player.role">
          <span
            style="writing-mode: vertical-lr; text-orientation: sideways-right"
          >
            {{ player.role.name }}
          </span>
        </td>
      </tr>
      <tr>
        Roles
      </tr>
      <tr v-for="role in state.skin.roles" :key="role">
        <td>{{ role.name }}</td>
        <td v-for="player in state.players" :key="player.role" />
      </tr>
      <tr>
        Tools
      </tr>
      <tr v-for="tool in state.skin.tools" :key="tool">
        <td>{{ tool.name }}</td>
        <td v-for="player in state.players" :key="player.role" />
      </tr>
      <tr>
        Places
      </tr>
      <tr v-for="place in state.skin.places" :key="place">
        <td>{{ place.name }}</td>
        <td v-for="player in state.players" :key="player.role" />
      </tr>
    </table>
  </div>
</template>

<script lang="ts">
import isEqual from 'lodash/fp/isEqual';
import { defineComponent, PropType } from 'vue';

import CardComponent from '@/components/Card.vue';
import { ConnectionEvent, ConnectionEvents } from '@/events';
import {
  Card,
  Crime,
  InProgressState,
  PlaceCard,
  PlayerPublicState,
  RoleCard,
  ToolCard,
} from '@/state';
import { Maybe } from '@/types';

interface InProgressData {
  selectedRole: Maybe<RoleCard>;
  selectedTool: Maybe<ToolCard>;
  selectedPlace: Maybe<PlaceCard>;
  showPersonalState: boolean;
}

export default defineComponent({
  name: 'GameInProgress',
  components: {
    Card: CardComponent,
  },
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
  data: (): InProgressData => ({
    selectedRole: null,
    selectedTool: null,
    selectedPlace: null,
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
      return Boolean(
        this.selectedRole && this.selectedTool && this.selectedPlace
      );
    },
    hand(): Card[] {
      return this.state.playerState?.hand ?? [];
    },
    suspectRoles(): RoleCard[] {
      return this.state.skin.roles.filter(x => !this.hand.find(isEqual(x)));
    },
    suspectTools(): ToolCard[] {
      return this.state.skin.tools.filter(x => !this.hand.find(isEqual(x)));
    },
    suspectPlaces(): PlaceCard[] {
      return this.state.skin.places.filter(x => !this.hand.find(isEqual(x)));
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
    selectRole(role: RoleCard) {
      this.selectedRole = isEqual(role, this.selectedRole) ? null : role;
    },
    selectTool(tool: ToolCard) {
      this.selectedTool = isEqual(tool, this.selectedTool) ? null : tool;
    },
    selectPlace(place: PlaceCard) {
      this.selectedPlace = isEqual(place, this.selectedPlace) ? null : place;
    },
    accuse() {
      if (!this.selectedRole || !this.selectedTool || !this.selectedPlace) {
        return;
      }
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
      return `${role.name} [${name}]`;
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
