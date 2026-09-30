import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ActionIdentity, command, errorMessage } from '~/services/api';

export function useCommand() {
  const cache = useQueryClient();
  const identity = useRef(new ActionIdentity());
  const busy = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  async function run<T = Record<string, unknown>>(method: 'POST' | 'PUT' | 'DELETE', path: string, body?: unknown): Promise<T | undefined> {
    if (busy.current) return undefined;
    busy.current = true;
    setPending(true);
    setError('');
    try {
      const result = await command<T>(method, path, body, identity.current.forAction(method, path, body));
      identity.current.complete();
      await cache.invalidateQueries();
      return result;
    } catch (failure) {
      setError(errorMessage(failure));
      return undefined;
    } finally {
      busy.current = false;
      setPending(false);
    }
  }
  return { run, pending, error, clearError: () => setError('') };
}
