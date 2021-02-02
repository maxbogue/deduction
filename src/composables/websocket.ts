import { Ref, ref } from 'vue';

import { Maybe } from '@/types';

interface UseWebSocket<S, E> {
  connected: Ref<boolean>;
  state: Ref<Maybe<S>>;
  send: (event: E) => void;
}

export function useWebSocket<S, E>(url: Ref<string>): UseWebSocket<S, E> {
  const state: Ref<Maybe<S>> = ref(null);
  const connected = ref(false);

  const ws = new WebSocket(url.value);

  ws.addEventListener('open', () => {
    connected.value = true;
  });

  ws.addEventListener('message', event => {
    state.value = JSON.parse(event.data);
  });

  ws.addEventListener('close', () => {
    connected.value = false;
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
