import { onUnmounted, Ref, ref, watch } from 'vue';

import { useEventListener } from '@/composables';
import { Maybe } from '@/types';

const RECONNECT_DELAY_MS = 64;

interface UseWebSocket<S, E> {
  connected: Ref<boolean>;
  state: Ref<Maybe<S>>;
  send: (event: E) => void;
}

export function useWebSocket<S, E>(url: Ref<string>): UseWebSocket<S, E> {
  const state: Ref<Maybe<S>> = ref(null);
  const connected = ref(false);

  let delayMs = RECONNECT_DELAY_MS;
  let timeoutId = 0;
  let ws: WebSocket;

  function connect() {
    clearTimeout(timeoutId);
    ws = new WebSocket(url.value);

    ws.addEventListener('open', () => {
      connected.value = true;
      delayMs = RECONNECT_DELAY_MS;
    });

    ws.addEventListener('message', event => {
      state.value = JSON.parse(event.data);
    });

    ws.addEventListener('close', () => {
      connected.value = false;
      timeoutId = window.setTimeout(connect, delayMs);
      delayMs *= 2;
    });
  }

  watch(url, connect, { immediate: true });
  useEventListener(window, 'online', connect);

  onUnmounted(() => {
    ws.close();
    clearTimeout(timeoutId);
  });

  const send = (event: E) => {
    ws.send(JSON.stringify(event));
  };

  return {
    connected,
    state,
    send,
  };
}
