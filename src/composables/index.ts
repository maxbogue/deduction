import { inject, InjectionKey, onMounted, onUnmounted } from 'vue';

import { Skin } from '@/state';

export const SkinKey: InjectionKey<Skin> = Symbol('Skin');

export function safeInject<T>(key: InjectionKey<T>): T {
  const value = inject(key);
  if (value == null) {
    throw new Error(`Missing provided value for key ${key}`);
  }
  return value;
}

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
