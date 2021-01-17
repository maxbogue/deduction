<template>
  <form @submit="onSubmit">
    <input v-model="gameId" type="text" />
    <button type="submit">Submit</button>
  </form>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'Home',
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
