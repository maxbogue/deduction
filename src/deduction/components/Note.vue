<!-- eslint-disable vue/no-v-html -->

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
      <div class="note__mutex">{{ bigMarks.join('') }}</div>
      <div class="note__numbers">{{ numberMarks.join('') }}</div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import { Mark as M } from '@/deduction/state';

const ALL_MARKS = [
  M.D,
  M.W,
  M.X,
  M.E,
  M.Q,
  M.N1,
  M.N2,
  M.N3,
  M.N4,
  M.N5,
  M.N6,
  M.N7,
];
const MUTEX_MARKS = [M.D, M.W, M.X];
const BIG_MARKS = [...MUTEX_MARKS, M.E, M.Q];

export default defineComponent({
  name: 'Note',
  props: {
    marks: {
      type: Array as PropType<M[]>,
      default: () => [],
    },
    showDropdown: {
      type: Boolean,
      default: false,
    },
    onUpdate: {
      type: Function as PropType<(marks: M[]) => void>,
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
  computed: {
    bigMarks(): M[] {
      return this.marks
        .filter(m => BIG_MARKS.includes(m))
        .sort()
        .reverse();
    },
    numberMarks(): M[] {
      return this.marks.filter(m => !BIG_MARKS.includes(m)).sort();
    },
  },
  methods: {
    toggleMark(mark: M) {
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
    display: flex;
    flex-direction: column;
  }

  &__mutex {
    font-weight: 600;
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__numbers {
    font-size: 1.4rem;
    line-height: 1;
  }

  &__dropdown {
    position: absolute;
    right: 0;
    top: 0;
    width: 150px;
    height: 200px;
    z-index: 1;
    padding: 0;
    overflow: hidden;
    background-color: #fff;
    box-shadow: $box-shadow;
    display: flex;
    flex-wrap: wrap;
  }

  &__mark {
    color: #000;
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
