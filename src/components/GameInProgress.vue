<template>
  <div class="game-in-progress">
    <Players
      :players="state.players"
      :currentPlayer="currentPlayer"
      :onReconnect="reconnectAsPlayer"
    />
    <h2>Turn: {{ playerToString(turnPlayer) }}</h2>
    <template v-if="turn.status === TurnStatus.Suggest">
      <template v-if="isYourTurn">
        <h2>Suggest</h2>
        <SelectCrime :skin="state.skin" :onSelect="suggest" />
      </template>
      <div v-else>Waiting for {{ turnPlayer.name }} to make a suggestion.</div>
    </template>
    <template v-else-if="turn.status === TurnStatus.Share">
      <div>
        {{ getPlayerName(turnPlayer) }} suggested
        {{ crimeToString(turn.suggestion) }}.
      </div>
      <template v-if="currentPlayer === sharePlayer">
        <div>Choose a card to share:</div>
        <div class="game-in-progress__hand">
          <Card
            v-for="card in shareableCards"
            :key="card.name"
            :card="card"
            :onClick="() => shareCard(card)"
          />
        </div>
      </template>
      <div v-else-if="sharePlayer">
        Waiting for {{ sharePlayer ? sharePlayer.name : '' }} to share a card.
      </div>
    </template>
    <template v-else-if="turn.status === TurnStatus.Record">
      <div>
        {{ getPlayerName(turnPlayer) }} suggested
        {{ crimeToString(turn.suggestion) }}.
      </div>
      <div v-if="sharedCard">
        <span>{{ sharePlayer ? getPlayerName(sharePlayer) : '' }} shared</span>
        <Card v-if="sharedCard" :card="sharedCard" />
      </div>
      <div v-else>No player had a matching card to share.</div>
      <div v-if="currentPlayer" class="game-in-progress__turn-buttons">
        <button @click="toggleReady">
          {{ isReady ? 'Unready' : 'Ready' }}
        </button>
        <button v-if="isYourTurn" @click="showAccuse = true">Accuse</button>
      </div>
      <div class="game-in-progress__unready-players">
        <span>Waiting for: </span>
        <RoleColor
          v-for="player in unreadyPlayers"
          :key="player.role.name"
          :role="player.role"
        />
      </div>
      <template v-if="showAccuse">
        <h2>Accusation</h2>
        <SelectCrime
          class="game-in-progress__accuse"
          :skin="state.skin"
          :excludeCards="hand"
          buttonText="Final Accusation"
          :onSelect="accuse"
        />
      </template>
    </template>
    <template v-if="state.playerSecrets">
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
    </template>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import CardComponent from '@/components/Card.vue';
import Notepad from '@/components/Notepad.vue';
import Players from '@/components/Players.vue';
import RoleColor from '@/components/RoleColor.vue';
import SelectCrime from '@/components/SelectCrime.vue';
import { ConnectionEvent, ConnectionEvents } from '@/events';
import {
  Card,
  Crime,
  InProgressState,
  Mark,
  Player,
  TurnState,
  TurnStatus,
} from '@/state';
import { Dict, Maybe } from '@/types';
import { dictFromList } from '@/utils';

interface InProgressData {
  TurnStatus: typeof TurnStatus;
  notes: Dict<Dict<string>>;
  showAccuse: boolean;
}

export default defineComponent({
  name: 'GameInProgress',
  components: {
    Card: CardComponent,
    Notepad,
    Players,
    RoleColor,
    SelectCrime,
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
    TurnStatus,
    notes: {},
    showAccuse: false,
  }),
  computed: {
    turn(): TurnState {
      return this.state.turnState;
    },
    currentPlayer(): Maybe<Player> {
      if (!this.state.playerSecrets) {
        return null;
      }
      return this.state.players[this.state.playerSecrets.index];
    },
    turnPlayer(): Player {
      return this.state.players[this.state.turnIndex];
    },
    isYourTurn(): boolean {
      return this.currentPlayer === this.turnPlayer;
    },
    sharePlayer(): Maybe<Player> {
      if (this.turn.status === TurnStatus.Suggest) {
        return null;
      }
      return this.state.players[this.turn.sharePlayerIndex];
    },
    sharedCard(): Maybe<Card> {
      return this.turn.status === TurnStatus.Record
        ? this.turn.sharedCard
        : null;
    },
    connectionPlayer(): string {
      return this.currentPlayer
        ? this.playerToString(this.currentPlayer)
        : 'observing';
    },
    hand(): Card[] {
      return this.state.playerSecrets?.hand ?? [];
    },
    suggestedCards(): Card[] {
      if (this.turn.status !== TurnStatus.Share) {
        return [];
      }
      return Object.values(this.turn.suggestion);
    },
    shareableCards(): Card[] {
      return this.hand.filter(h =>
        this.suggestedCards.find(c => c.name === h.name)
      );
    },
    isReady(): boolean {
      return Boolean(
        this.currentPlayer &&
          this.turn.status === TurnStatus.Record &&
          this.turn.playerIsReady[this.currentPlayer.role.name]
      );
    },
    roleToPlayer(): Dict<Player> {
      return dictFromList(this.state.players, (acc, p) => {
        acc[p.role.name] = p;
      });
    },
    unreadyPlayers(): Player[] {
      if (this.turn.status !== TurnStatus.Record) {
        return [];
      }
      return Object.entries(this.turn.playerIsReady)
        .filter(e => !e[1])
        .map(e => this.roleToPlayer[e[0]]);
    },
  },
  methods: {
    suggest(suggestion: Crime) {
      this.send({
        type: ConnectionEvents.Suggest,
        suggestion,
      });
    },
    shareCard(card: Card) {
      this.send({
        type: ConnectionEvents.ShareCard,
        sharedCard: card,
      });
    },
    toggleReady() {
      this.showAccuse = false;
      this.send({
        type: ConnectionEvents.SetReady,
        data: !this.isReady,
      });
    },
    accuse(crime: Crime) {
      this.send({
        type: ConnectionEvents.Accuse,
        data: crime,
      });
    },
    reconnectAsPlayer(player: Player) {
      this.send({
        type: ConnectionEvents.SetRole,
        data: player.role,
      });
    },
    setNote(player: Player, card: Card, marks: Mark[]) {
      this.send({
        type: ConnectionEvents.SetNote,
        player,
        card,
        marks,
      });
    },
    getPlayerName(player: Player): string {
      return player === this.currentPlayer ? 'You' : player.name;
    },
    playerToString(player: Player): string {
      const { role, name } = player;
      return `${role.name} [${name}]`;
    },
    crimeToString(crime: Crime): string {
      const { role, tool, place } = crime;
      return `${role.name} in the ${place.name} with the ${tool.name}`;
    },
  },
});
</script>

<style lang="scss" scoped>
@import '@/style/constants';

.game-in-progress {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  padding: $pad-md $pad-lg;

  &__hand {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-wrap: wrap;
  }

  &__unready-players {
    display: flex;
    align-items: center;

    > :not(:first-child) {
      margin-left: $pad-xs;
    }
  }

  &__turn-buttons {
    margin-top: $pad-sm;
  }

  &__accuse :deep(.select-crime__button) {
    background-color: rgba(255, 24, 12, 0.5);

    &[disabled] {
      background-color: transparent;
    }
  }
}
</style>
