import {
  inject,
  InjectionKey,
  onMounted,
  onUnmounted,
  readonly,
  Ref,
  ref,
  watch,
} from 'vue';

import { Skin } from '@/deduction/state';

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

// Delay the switch to false state.
export function useOffDelayed(
  real: Ref<boolean>,
  delayMs: number
): Ref<boolean> {
  const delayed = ref(real.value);
  let timeoutId = 0;

  watch(real, () => {
    clearTimeout(timeoutId);
    if (real.value) {
      delayed.value = true;
    } else {
      timeoutId = window.setTimeout(() => {
        delayed.value = false;
      }, delayMs);
    }
  });

  return readonly(delayed);
}
