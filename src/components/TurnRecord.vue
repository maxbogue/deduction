<template>
  <div class="turn-record">
    <div>
      {{ getPlayerName(turnPlayer) }} suggested
      {{ crimeToString(turn.suggestion) }}.
    </div>
    <div v-if="sharedCard">
      <span>{{ getPlayerName(sharePlayer) }} shared</span>
      <Card :card="sharedCard" />
    </div>
    <div v-else-if="sharePlayer !== turnPlayer">
      {{ getPlayerName(sharePlayer) }} has shared a card.
    </div>
    <div v-else>No player had a matching card to share.</div>
    <div v-if="yourPlayer" class="turn-record__buttons">
      <button @click="setIsReady(!isReady)">
        {{ isReady ? 'Unready' : 'Ready' }}
      </button>
      <button v-if="yourPlayer === turnPlayer" @click="showAccuse = true">
        Accuse
      </button>
    </div>
    <div class="turn-record__unready-players">
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
        class="turn-record__accuse"
        :excludeCards="hand"
        buttonText="Final Accusation"
        :onSelect="onAccuse"
      />
    </template>
    <div
      v-if="yourPlayer"
      class="turn-record__toast"
      :style="{ backgroundColor: yourPlayer.role.color }"
      @click="setIsReady(!isReady)"
    >
      {{ isReady ? 'no wait' : 'im ready bro' }}
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import CardComponent from '@/components/Card.vue';
import RoleColor from '@/components/RoleColor.vue';
import SelectCrime from '@/components/SelectCrime.vue';
import { Card, Crime, Player, TurnRecordState } from '@/state';
import { Dict, Maybe } from '@/types';
import { dictFromList } from '@/utils';

interface TurnRecordData {
  showAccuse: boolean;
}

export default defineComponent({
  name: 'TurnRecord',
  components: {
    Card: CardComponent,
    RoleColor,
    SelectCrime,
  },
  props: {
    turn: {
      type: Object as PropType<TurnRecordState>,
      required: true,
    },
    players: {
      type: Array as PropType<Player[]>,
      required: true,
    },
    hand: {
      type: Array as PropType<Card[]>,
      required: true,
    },
    yourPlayer: {
      type: Object as PropType<Maybe<Player>>,
      default: null,
    },
    turnPlayer: {
      type: Object as PropType<Player>,
      required: true,
    },
    setIsReady: {
      type: Function as PropType<(isReady: boolean) => void>,
      required: true,
    },
    onAccuse: {
      type: Function as PropType<(accusation: Crime) => void>,
      required: true,
    },
  },
  data: (): TurnRecordData => ({
    showAccuse: false,
  }),
  computed: {
    sharePlayer(): Player {
      return this.players[this.turn.sharePlayerIndex];
    },
    sharedCard(): Maybe<Card> {
      return this.turn.sharedCard;
    },
    isReady(): boolean {
      return Boolean(
        this.yourPlayer && this.turn.playerIsReady[this.yourPlayer.role.name]
      );
    },
    roleToPlayer(): Dict<Player> {
      return dictFromList(this.players, (acc, p) => {
        acc[p.role.name] = p;
      });
    },
    unreadyPlayers(): Player[] {
      return Object.entries(this.turn.playerIsReady)
        .filter(e => !e[1])
        .map(e => this.roleToPlayer[e[0]]);
    },
  },
  methods: {
    getPlayerName(player: Player): string {
      return player === this.yourPlayer ? 'You' : player.name;
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

.turn-record {
  @include flex-column;

  &__unready-players {
    display: flex;
    align-items: center;

    > :not(:first-child) {
      margin-left: $pad-xs;
    }
  }

  &__buttons {
    margin-top: $pad-sm;
  }

  &__accuse :deep(.select-crime__button) {
    background-color: rgba(255, 24, 12, 0.5);

    &[disabled] {
      background-color: transparent;
    }
  }

  &__toast {
    position: fixed;
    bottom: calc(1em + #{$pad-sm});
    z-index: 10;
    opacity: 90%;
    padding: $pad-sm;
    left: 0;
    width: 100%;
    box-shadow: $box-shadow;
    cursor: pointer;

    @media (min-width: $screen-sm-min) {
      width: $container-sm;
      left: calc(50% - #{$container-sm / 2});
      bottom: $pad-sm;
    }

    @media (min-width: $screen-md-min) {
      width: $container-md;
      left: calc(50% - #{$container-md / 2});
    }

    @media (min-width: $screen-lg-min) {
      width: $container-lg;
      left: calc(50% - #{$container-lg / 2});
    }
  }
}
</style>
