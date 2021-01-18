import { onMounted, onUnmounted } from 'vue';

export function useEventListener(
  el: EventTarget,
  event: string,
  listener: EventListener
): void {
  onMounted(() => {
    el.addEventListener(event, listener);
  });
  onUnmounted(() => {
    el.removeEventListener(event, listener);
  });
}
