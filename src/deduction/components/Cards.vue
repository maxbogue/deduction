<template>
  <div class="cards">
    <Card v-for="card in cards" :key="card.name" :card="card" />
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import CardComponent from '@/deduction/components/Card.vue';
import { Card } from '@/deduction/state';

export default defineComponent({
  name: 'Cards',
  components: {
    Card: CardComponent,
  },
  props: {
    cards: {
      type: Array as PropType<Card[]>,
      required: true,
    },
  },
});
</script>

<style lang="scss" scoped>
@import '@/style/constants';

.cards {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
}
</style>
