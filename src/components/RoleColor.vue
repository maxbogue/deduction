<template>
  <span class="role-color" :style="{ backgroundColor: role.color }"
    ><slot
  /></span>
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
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.33);
  width: 2.4rem;
  height: 2.4rem;
  color: white;
  font-size: 0.6em;
  text-align: center;
}
</style>
