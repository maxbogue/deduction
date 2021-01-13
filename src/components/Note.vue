<template>
  <div class="note" @click="setNote('test')">
    {{ note }}
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

export default defineComponent({
  name: 'Note',
  props: {
    note: {
      type: String as PropType<string>,
      default: '',
    },
  },
  computed: {},
  methods: {
    setNote(note: string) {
      this.$emit('change', note);
    },
  },
});
</script>

<style lang="scss">
@import '@/style/constants';

.note {
}
</style>
