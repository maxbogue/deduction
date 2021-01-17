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
    <div v-if="state.playerSecrets">
      <h2>Hand</h2>
      <div class="game-in-progress__hand">
        <Card
          v-for="card in state.playerSecrets.hand"
          :key="card.name"
          :card="card"
        />
      </div>
      <h2>Notepad</h2>
      <Notepad
        :skin="state.skin"
        :players="state.players"
        :notes="state.playerSecrets.notes"
        :setNote="setNote"
      />
      <h2>Accusation</h2>
      <div class="game-in-progress__cards">
        <div class="game-in-progress__card-column">
          <Card
            v-for="role in suspectRoles"
            :key="role.name"
            :card="role"
            :selected="!!selectedRole && role.name === selectedRole.name"
            :onClick="() => selectRole(role)"
          />
        </div>
        <div class="game-in-progress__card-column">
          <Card
            v-for="tool in suspectTools"
            :key="tool.name"
            :card="tool"
            :selected="!!selectedTool && tool.name === selectedTool.name"
            :onClick="() => selectTool(tool)"
          />
        </div>
        <div class="game-in-progress__card-column">
          <Card
            v-for="place in suspectPlaces"
            :key="place.name"
            :card="place"
            :selected="!!selectedPlace && place.name === selectedPlace.name"
            :onClick="() => selectPlace(place)"
          />
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
import isEqual from 'lodash/fp/isEqual';
import { defineComponent, PropType } from 'vue';

import CardComponent from '@/components/Card.vue';
import Notepad from '@/components/Notepad.vue';
import { ConnectionEvent, ConnectionEvents } from '@/events';
import {
  Card,
  Crime,
  InProgressState,
  PlaceCard,
  Player,
  RoleCard,
  ToolCard,
} from '@/state';
import { Dict, Maybe } from '@/types';

interface InProgressData {
  selectedRole: Maybe<RoleCard>;
  selectedTool: Maybe<ToolCard>;
  selectedPlace: Maybe<PlaceCard>;
  notes: Dict<Dict<string>>;
}

export default defineComponent({
  name: 'GameInProgress',
  components: {
    Card: CardComponent,
    Notepad,
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
    notes: {},
  }),
  computed: {
    currentPlayer(): Maybe<Player> {
      if (!this.state.playerSecrets) {
        return null;
      }
      return this.state.players[this.state.playerSecrets.index];
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
      return this.state.playerSecrets?.hand ?? [];
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
    classesForPlayer(player: Player) {
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
    playerToString(player: Player): string {
      const { role, name } = player;
      return `${role.name} [${name}]`;
    },
    canReconnectAsPlayer(player: Player): boolean {
      return !this.currentPlayer && !player.isConnected;
    },
    reconnectAsPlayer(player: Player) {
      this.send({
        type: ConnectionEvents.SetRole,
        data: player.role,
      });
    },
    setNote(player: Player, card: Card, marks: string[]) {
      this.send({
        type: ConnectionEvents.SetNote,
        player,
        card,
        marks,
      });
    },
  },
});
</script>

<style lang="scss">
@import '@/style/constants';

.game-in-progress {
  h2 {
    text-align: center;
    font-size: 1.4em;
    margin: $pad-lg 0 $pad-xs;
  }

  &__hand {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-wrap: wrap;
  }

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
