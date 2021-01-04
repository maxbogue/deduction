<template>
  <div>{{ state }}</div>
</template>

<script lang="ts">
import { defineComponent, computed, ref, Ref } from 'vue';
import { useRoute } from 'vue-router';

export default defineComponent({
  setup() {
    const route = useRoute();
    const id = computed(() => route.params.id);
    const state: Ref<string> = ref('');

    const ws = new WebSocket(`ws://${window.location.host}/api/${id.value}/`);
    ws.addEventListener('message', event => state.value = event.data);

    return {
      id,
      state,
    }
  },
});
</script>
