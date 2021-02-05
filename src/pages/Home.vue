<template>
  <form class="home" @submit="onSubmit">
    <h1>Room Name</h1>
    <input v-model="gameId" class="home__room-input" type="text" />
    <button type="submit">Submit</button>
  </form>
</template>

<script lang="ts">
import randomWords from 'random-words';
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'Home',
  data: () => ({
    gameId: randomWords(2).join('-'),
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

<style lang="scss" scoped>
@import '@/style/constants';

.home {
  @include flex-column;
  justify-content: center;
  min-height: 100vh;

  &__room-input {
    text-align: center;
  }
}
</style>
