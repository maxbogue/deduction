<template>
  <div class="game-in-progress" :style="turnCssProps">
    <Players
      :players="state.players"
      :yourPlayer="yourPlayer"
      :turnPlayer="turnPlayer"
      :onReconnect="reconnectAsPlayer"
    />
    <div ref="placeholderRef" class="game-in-progress__placeholder" />
    <TurnSuggest
      v-if="turn.status === TurnStatus.Suggest"
      ref="turnRef"
      :class="turnClass"
      :yourPlayer="yourPlayer"
      :turnPlayer="turnPlayer"
      :onSuggest="suggest"
    />
    <TurnShare
      v-else-if="turn.status === TurnStatus.Share"
      ref="turnRef"
      :class="turnClass"
      :turn="turn"
      :players="state.players"
      :hand="hand"
      :yourPlayer="yourPlayer"
      :turnPlayer="turnPlayer"
      :onShareCard="shareCard"
    />
    <TurnRecord
      v-else-if="turn.status === TurnStatus.Record"
      ref="turnRef"
      :class="turnClass"
      :turn="turn"
      :players="state.players"
      :hand="hand"
      :yourPlayer="yourPlayer"
      :turnPlayer="turnPlayer"
      :setIsReady="setIsReady"
      :onAccuse="accuse"
    />
    <template v-if="state.playerSecrets">
      <Notepad
        :skin="state.skin"
        :players="state.players"
        :turnPlayer="turnPlayer"
        :suggestion="suggestion"
        :sharePlayer="sharePlayer"
        :notes="state.playerSecrets.notes"
        :setNote="setNote"
      />
      <h2>Hand</h2>
      <div class="game-in-progress__hand">
        <Card
          v-for="card in state.playerSecrets.hand"
          :key="card.name"
          :card="card"
        />
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import {
  ComponentPublicInstance,
  computed,
  ComputedRef,
  defineComponent,
  nextTick,
  PropType,
  provide,
  Ref,
  ref,
  toRefs,
  watch,
} from 'vue';

import CardComponent from '@/components/Card.vue';
import Notepad from '@/components/Notepad.vue';
import Players from '@/components/Players.vue';
import TurnRecord from '@/components/TurnRecord.vue';
import TurnShare from '@/components/TurnShare.vue';
import TurnSuggest from '@/components/TurnSuggest.vue';
import { SkinKey, useEventListener } from '@/composables';
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

interface InProgressData {
  TurnStatus: typeof TurnStatus;
  notes: Dict<Dict<string>>;
}

export default defineComponent({
  name: 'GameInProgress',
  components: {
    Card: CardComponent,
    Notepad,
    Players,
    TurnRecord,
    TurnShare,
    TurnSuggest,
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
  setup(props) {
    const { state } = toRefs(props);
    provide(SkinKey, state.value.skin);

    const turnRef: Ref<Maybe<ComponentPublicInstance>> = ref(null);
    const placeholderRef: Ref<Maybe<HTMLElement>> = ref(null);

    const isTurnSticky = ref(false);
    const turnTop = ref(0);
    const turnWidth = ref(0);
    const placeholderHeight = ref(0);

    const getPlaceholderTop = () => placeholderRef.value?.offsetTop ?? 0;
    const getPlaceholderWidth = () => placeholderRef.value?.offsetWidth ?? 0;
    const getTurnHeight = () => turnRef.value?.$el?.offsetHeight ?? 0;

    const syncPlaceholder = () => {
      turnTop.value = getPlaceholderTop();
      turnWidth.value = getPlaceholderWidth();
      placeholderHeight.value = getTurnHeight();
    };

    useEventListener(window, 'scroll', () => {
      isTurnSticky.value = window.scrollY > getPlaceholderTop();
    });

    watch(
      state,
      () => {
        nextTick(syncPlaceholder);
      },
      { immediate: true }
    );
    setInterval(syncPlaceholder, 100);

    const turnCssProps: ComputedRef<Dict<string>> = computed(() => ({
      '--turn-top': `${turnTop.value}px`,
      '--turn-width': `${turnWidth.value}px`,
      '--placeholder-height': `${placeholderHeight.value}px`,
    }));

    return {
      placeholderRef,
      turnRef,
      isTurnSticky,
      turnCssProps,
    };
  },
  data: (): InProgressData => ({
    TurnStatus,
    notes: {},
  }),
  computed: {
    turn(): TurnState {
      return this.state.turnState;
    },
    yourPlayer(): Maybe<Player> {
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
    hand(): Card[] {
      return this.state.playerSecrets?.hand ?? [];
    },
    suggestion(): Maybe<Crime> {
      return this.turn.status === TurnStatus.Suggest
        ? null
        : this.turn.suggestion;
    },
    turnClass(): Dict<boolean> {
      return {
        'game-in-progress__turn': true,
        'game-in-progress__turn--sticky': this.isTurnSticky,
      };
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
    setIsReady(isReady: boolean) {
      this.send({
        type: ConnectionEvents.SetReady,
        data: isReady,
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
  },
});
</script>

<style lang="scss" scoped>
@import '@/style/constants';

.game-in-progress {
  @include flex-column;

  > :not(:first-child) {
    margin-top: $pad-lg;
  }

  &__placeholder {
    width: 100%;
    height: var(--placeholder-height);

    &::before {
      content: ' ';
    }
  }

  &__turn {
    margin-top: 0 !important;
    position: absolute;
    top: var(--turn-top);
    width: var(--turn-width);
    background-color: #fff;
    z-index: 5;

    &--sticky {
      position: fixed;
      top: 0;
    }
  }

  &__hand {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-wrap: wrap;
  }
}
</style>
