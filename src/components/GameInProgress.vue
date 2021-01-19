<template>
  <div class="game-in-progress">
    <div class="game-in-progress__players">
      <div
        v-for="(player, i) in state.players"
        :key="player.role.name"
        @click="reconnectAsPlayer(player)"
      >
        <span v-if="i > 0">&nbsp;|&nbsp;</span>
        <span
          class="game-in-progress__player"
          :class="classesForPlayer(player)"
          >{{ playerToString(player) }}</span
        >
        <span v-if="player.failedAccusation">&#x1F47B;</span>
      </div>
    </div>
    <h2>Turn: {{ playerToString(turnPlayer) }}</h2>
    <template v-if="turn.status === TurnStatus.Suggest">
      <template v-if="currentPlayer === turnPlayer">
        <h2>Suggest</h2>
        <SelectCrime :skin="state.skin" :onSelect="suggest" />
      </template>
      <div v-else>
        Waiting for {{ playerToString(turnPlayer) }} to make a suggestion.
      </div>
    </template>
    <template v-else-if="turn.status === TurnStatus.Share">
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
        {{ playerToString(turnPlayer) }} suggests
        {{ crimeToString(turn.suggestion) }}. Waiting for
        {{ playerToString(sharePlayer) }} to share a card.
      </div>
    </template>
    <template v-else-if="turn.status === TurnStatus.Record">
      <div v-if="currentPlayer === turnPlayer">
        <div>
          You suggested
          {{ crimeToString(turn.suggestion) }}.
        </div>
        <div v-if="sharedCard && sharePlayer">
          <span>{{ playerToString(sharePlayer) }} shared</span>
          <Card :card="sharedCard" />
        </div>
        <div v-else>No player had a matching card to share.</div>
        <button class="game-in-progress__accuse-button" @click="endTurn">
          End Turn
        </button>
        <h2>Accusation</h2>
        <SelectCrime
          :skin="state.skin"
          :excludeCards="hand"
          :onSelect="accuse"
        />
      </div>
      <div v-else>
        <div>
          {{ playerToString(turnPlayer) }} suggested
          {{ crimeToString(turn.suggestion) }}.
        </div>
        <div v-if="sharedCard">
          <span>You shared</span> <Card :card="sharedCard" />
        </div>
        <div v-else-if="sharePlayer && sharePlayer !== turnPlayer">
          {{ playerToString(sharePlayer) }} shared a card.
        </div>
        <div v-else>No player had a matching card to share.</div>
        <div>
          Waiting for {{ playerToString(turnPlayer) }} to end their turn.
        </div>
      </div>
    </template>
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
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import CardComponent from '@/components/Card.vue';
import Notepad from '@/components/Notepad.vue';
import SelectCrime from '@/components/SelectCrime.vue';
import { ConnectionEvent, ConnectionEvents } from '@/events';
import {
  Card,
  Crime,
  InProgressState,
  Player,
  TurnState,
  TurnStatus,
} from '@/state';
import { Dict, Maybe } from '@/types';

interface InProgressData {
  TurnStatus: typeof TurnStatus;
  notes: Dict<Dict<string>>;
}

export default defineComponent({
  name: 'GameInProgress',
  components: {
    Card: CardComponent,
    Notepad,
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
  },
  methods: {
    classesForPlayer(player: Player) {
      return {
        'game-in-progress__player--you': player === this.currentPlayer,
        'game-in-progress__player--disconnected': !player.isConnected,
        'game-in-progress__player--reconnectable': this.canReconnectAsPlayer(
          player
        ),
      };
    },
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
    endTurn() {
      this.send({ type: ConnectionEvents.EndTurn });
    },
    accuse(crime: Crime) {
      this.send({
        type: ConnectionEvents.Accuse,
        data: crime,
      });
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

  &__players {
    display: flex;
    justify-content: center;
    font-size: 1.8rem;
  }

  &__player {
    color: green;

    &--you {
      text-decoration: underline;
    }

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
