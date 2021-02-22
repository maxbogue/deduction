<template>
  <div class="modal">
    <div class="modal__card">
      <slot />
    </div>
  </div>
</template>

<style lang="scss" scoped>
@import '@/style/constants';

.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 !important;
  background-color: rgba(0, 0, 0, 0.25);

  &__card {
    box-shadow: $box-shadow;
    padding: $pad-lg;
    background-color: #fff;
  }
}
</style>
