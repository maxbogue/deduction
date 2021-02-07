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
  box-shadow: $box-shadow;
  width: 2.4rem;
  height: 2.4rem;
  color: white;
  font-size: 0.6em;
  text-align: center;
}
</style>
