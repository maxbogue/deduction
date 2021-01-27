<template>
  <span class="role-color" :style="{ backgroundColor: role.color }" />
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import { RoleCard } from '@/state';

export default defineComponent({
  name: 'RoleColor',
  props: {
    role: {
      type: Object as PropType<RoleCard>,
      required: true,
    },
  },
});
</script>

<style lang="scss">
@import '@/style/constants';

.role-color {
  display: inline-block;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.33);
  width: 1em;
  height: 1em;
}
</style>
