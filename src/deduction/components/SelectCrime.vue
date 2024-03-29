<template>
  <div class="select-crime">
    <div class="select-crime__cards">
      <div class="select-crime__column">
        <Card
          v-for="role in roles"
          :key="role.name"
          :card="role"
          :selected="!!selectedRole && role.name === selectedRole.name"
          :onClick="() => selectRole(role)"
        />
      </div>
      <div class="select-crime__text">in the</div>
      <div class="select-crime__column">
        <Card
          v-for="place in places"
          :key="place.name"
          :card="place"
          :selected="!!selectedPlace && place.name === selectedPlace.name"
          :onClick="() => selectPlace(place)"
        />
      </div>
      <div class="select-crime__text">with the</div>
      <div class="select-crime__column">
        <Card
          v-for="tool in tools"
          :key="tool.name"
          :card="tool"
          :selected="!!selectedTool && tool.name === selectedTool.name"
          :onClick="() => selectTool(tool)"
        />
      </div>
    </div>
    <div class="select-crime__select">
      <button
        v-if="crime && !buttonDisabled"
        class="select-crime__button"
        @click="crime && onSelect(crime)"
      >
        {{ buttonText }}
      </button>
      <button v-else class="select-crime__button" disabled>
        {{ buttonText }}
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import isEqual from 'lodash/fp/isEqual';
import { defineComponent, PropType } from 'vue';

import { safeInject, SkinKey } from '@/composables';
import CardComponent from '@/deduction/components/Card.vue';
import { Card, Crime, PlaceCard, RoleCard, ToolCard } from '@/deduction/state';
import { Maybe } from '@/types';

interface InProgressData {
  selectedRole: Maybe<RoleCard>;
  selectedTool: Maybe<ToolCard>;
  selectedPlace: Maybe<PlaceCard>;
}

export default defineComponent({
  name: 'SelectCrime',
  components: {
    Card: CardComponent,
  },
  props: {
    excludeCards: {
      type: Array as PropType<Card[]>,
      default: () => [],
    },
    buttonDisabled: {
      type: Boolean as PropType<boolean>,
      default: false,
    },
    buttonText: {
      type: String as PropType<string>,
      default: 'Select',
    },
    onSelect: {
      type: Function as PropType<(crime: Crime) => void>,
      required: true,
    },
  },
  setup() {
    const skin = safeInject(SkinKey);
    return { skin };
  },
  data: (): InProgressData => ({
    selectedRole: null,
    selectedTool: null,
    selectedPlace: null,
  }),
  computed: {
    roles(): RoleCard[] {
      return this.skin.roles.filter(x => !this.excludeCards.find(isEqual(x)));
    },
    tools(): ToolCard[] {
      return this.skin.tools.filter(x => !this.excludeCards.find(isEqual(x)));
    },
    places(): PlaceCard[] {
      return this.skin.places.filter(x => !this.excludeCards.find(isEqual(x)));
    },
    crime(): Maybe<Crime> {
      if (this.selectedRole && this.selectedTool && this.selectedPlace) {
        return {
          role: this.selectedRole,
          tool: this.selectedTool,
          place: this.selectedPlace,
        };
      }
      return null;
    },
  },
  methods: {
    selectRole(role: RoleCard) {
      this.selectedRole = isEqual(role, this.selectedRole) ? null : role;
    },
    selectTool(tool: ToolCard) {
      this.selectedTool = isEqual(tool, this.selectedTool) ? null : tool;
    },
    selectPlace(place: PlaceCard) {
      this.selectedPlace = isEqual(place, this.selectedPlace) ? null : place;
    },
  },
});
</script>

<style lang="scss" scoped>
@import '@/style/constants';

.select-crime {
  padding-bottom: $pad-xs;

  &__cards {
    display: flex;
    flex-direction: column;
    justify-content: space-between;

    @media (min-width: $screen-sm-min) {
      flex-direction: row;
      justify-content: space-around;
      width: $container-sm;
    }
  }

  &__text {
    @media (min-width: $screen-sm-min) {
      display: none;
    }
  }

  &__column {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    width: 100%;
    margin: $pad-sm 0;

    @media (min-width: $screen-sm-min) {
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      width: 33%;
    }

    > * {
      min-width: 100px;
    }
  }

  &__select {
    display: flex;
    justify-content: center;
  }
}
</style>
