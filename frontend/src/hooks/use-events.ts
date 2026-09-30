import { useEffect, useState } from 'react';
import { Client } from '@stomp/stompjs';
import { useQueryClient } from '@tanstack/react-query';
import { getCsrf, resetCsrf } from '~/services/api';
import type { ServerEvent } from '~/common/types';

export function useEvents(userId?: string) {
  const cache = useQueryClient();
  const [status, setStatus] = useState<'connecting' | 'connected' | 'reconnecting'>('connecting');
  useEffect(() => {
    if (!userId) return;
    let disposed = false;
    let retry: ReturnType<typeof setTimeout> | undefined;
    const seen = new Set<string>();
    const client = new Client({
      brokerURL: `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}/ws`,
      reconnectDelay: 3000,
      connectionTimeout: 10000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      beforeConnect: async () => {
        try {
          const csrf = await getCsrf();
          client.connectHeaders = { [csrf.headerName]: csrf.token };
        } catch {
          if (disposed) return;
          setStatus('reconnecting');
          await client.deactivate({ force: true });
          if (!disposed) retry = setTimeout(activate, 3000);
        }
      },
      onConnect: () => {
        if (disposed) return;
        setStatus('connected');
        void cache.invalidateQueries();
        client.subscribe('/user/queue/events', (frame) => {
          try {
            const event: ServerEvent = JSON.parse(frame.body);
            if (event.eventId && seen.has(event.eventId)) return;
            if (event.eventId) seen.add(event.eventId);
            if (seen.size > 1000) seen.delete(seen.values().next().value!);
            void cache.invalidateQueries();
          } catch {
            void cache.invalidateQueries();
          }
        });
      },
      onWebSocketClose: () => {
        if (!disposed) setStatus('reconnecting');
      },
      onStompError: () => {
        if (!disposed) {
          resetCsrf();
          setStatus('reconnecting');
          client.forceDisconnect();
        }
      }
    });
    function activate() {
      if (!disposed && navigator.onLine) client.activate();
    }
    const online = () => {
      clearTimeout(retry);
      activate();
      void cache.invalidateQueries();
    };
    const offline = () => {
      clearTimeout(retry);
      setStatus('reconnecting');
      void client.deactivate({ force: true });
    };
    if (navigator.onLine) activate();
    else setStatus('reconnecting');
    const refresh = () => {
      if (document.visibilityState === 'visible') void cache.invalidateQueries();
    };
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('online', online);
    window.addEventListener('offline', offline);
    return () => {
      disposed = true;
      clearTimeout(retry);
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('online', online);
      window.removeEventListener('offline', offline);
      void client.deactivate({ force: true });
    };
  }, [cache, userId]);
  return status;
}
