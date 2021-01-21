<template>
  <div class="note">
    <div v-if="showDropdown" class="note__dropdown">
      <div
        v-for="mark in ALL_MARKS"
        :key="mark"
        class="note__mark"
        :class="{ 'note__mark--selected': marks.includes(mark) }"
        @click.stop="toggleMark(mark)"
      >
        {{ mark }}
      </div>
    </div>
    <div class="note__content" @click.stop="toggleDropdown">
      {{ marks.join('') }}
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

const ALL_MARKS = ['✖️', '•', '?', '1', '2', '3', '4', '5', '6'];
const MUTEX_MARKS = ['✖️', '•', '?'];

export default defineComponent({
  name: 'Note',
  props: {
    marks: {
      type: Array as PropType<string[]>,
      default: () => [],
    },
    showDropdown: {
      type: Boolean,
      default: false,
    },
    onUpdate: {
      type: Function as PropType<(marks: string[]) => void>,
      required: true,
    },
    toggleDropdown: {
      type: Function as PropType<() => void>,
      required: true,
    },
  },
  data: () => ({
    ALL_MARKS,
  }),
  methods: {
    toggleMark(mark: string) {
      if (this.marks.includes(mark)) {
        this.onUpdate(this.marks.filter(m => m !== mark));
      } else if (MUTEX_MARKS.includes(mark)) {
        this.onUpdate([
          ...this.marks.filter(m => !MUTEX_MARKS.includes(m)),
          mark,
        ]);
      } else {
        this.onUpdate([...this.marks, mark]);
      }
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
    left: 0;
    top: 0;
    width: 150px;
    height: 150px;
    z-index: 1;
    padding: 0;
    overflow: hidden;
    background-color: #fff;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.33);
    display: flex;
    flex-wrap: wrap;
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

    &--selected {
      background-color: #666;
      color: #fff;
    }
  }
}
</style>
