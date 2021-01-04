<template>
  <form @submit="onSubmit">
    <input type="text" v-model="gameId">
    <button type="submit">Submit</button>
  </form>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  data: () => ({
    gameId: 'foo',
  }),
  methods: {
    onSubmit() {
      this.$router.push({
        name: 'game',
        params: { id: this.gameId },
      });
    },
  },
});
</script>
