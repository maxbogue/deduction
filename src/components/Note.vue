<template>
  <div class="note">
    <div
      class="note__dropdown"
      :class="{ ['note__dropdown--open']: showDropdown }"
    >
      <div
        v-for="mark in marks"
        :key="mark"
        class="note__mark"
        :class="{ 'note__mark--selected': note.includes(mark) }"
        @click.stop="toggleMark(mark)"
      >
        {{ mark }}
      </div>
    </div>
    <div class="note__content" @click.stop="showDropdown = !showDropdown">
      {{ note }}
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, ref } from 'vue';

import { useEventListener } from '@/composables';

export default defineComponent({
  name: 'Note',
  props: {
    note: {
      type: String as PropType<string>,
      default: '',
    },
  },
  setup() {
    const showDropdown = ref(false);

    useEventListener(document, () => {
      showDropdown.value = false;
    });

    return {
      showDropdown,
    };
  },
  data: () => ({
    marks: 'x•?123456',
  }),
  methods: {
    toggleMark(mark: string) {
      this.$emit('update', mark);
    },
  },
});
</script>

<style lang="scss">
@import '@/style/constants';

.note {
  display: flex;
  position: relative;

  &__content {
    min-height: 5rem;
    min-width: 5rem;
  }

  &__dropdown {
    position: absolute;
    left: 5rem;
    top: 0;
    visibility: hidden;
    z-index: 1;
    max-width: 0;
    max-height: 0;
    padding: 0;
    overflow: hidden;
    transition: visibility 0s 0.5s, max-width 0.5s, max-height 0.5s;
    background-color: #fff;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.33);
    display: flex;
    flex-wrap: wrap;

    &--open {
      visibility: visible;
      width: 150px;
      height: 150px;
      max-width: 150px;
      max-height: 150px;
      transition: visibility 0s, max-width 0.5s, max-height 0.5s;
    }
  }

  &__mark {
    font-size: 2.4rem;
    list-style: none;
    cursor: pointer;
    min-height: 5rem;
    min-width: 5rem;
    text-align: center;
    display: flex;
    justify-content: center;
    align-items: center;

    &:hover {
      background-color: #ccf;
    }

    &--selected {
      background-color: #eee;

      &:hover {
        background-color: #aaf;
      }
    }
  }
}
</style>
