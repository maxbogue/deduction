<template>
  <div>TESTING 123 IS THIS THING ON {{ test }}</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  data: () => ({ test: 'bar' })
});
</script>
