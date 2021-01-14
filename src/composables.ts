import { onMounted, onUnmounted } from 'vue';

export function useEventListener(
  el: EventTarget,
  listener: EventListener
): void {
  onMounted(() => {
    el.addEventListener('click', listener);
  });
  onUnmounted(() => {
    el.removeEventListener('click', listener);
  });
}
