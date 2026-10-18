import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { ActionIdentity, command, errorMessage, get } from '~/services/api';
import type { Document, Work } from './types';
export function useDraft(work: Work) {
  const [changeSerial, setChangeSerial] = useState(0);
  const [document, setDocument] = useState(work.document),
    [revision, setRevision] = useState(work.revision),
    [saved, setSaved] = useState(JSON.stringify(work.document)),
    [saving, setSaving] = useState(false),
    [error, setError] = useState(''),
    [conflict, setConflict] = useState<Work>();
  const recoveryKey = `mango:work-draft:${work.id}`;
  const [recovery, setRecovery] = useState<{ revision: number; document: Document } | undefined>(() => {
    try {
      const value = JSON.parse(sessionStorage.getItem(recoveryKey) ?? 'null');
      return value?.document && JSON.stringify(value.document) !== JSON.stringify(work.document) ? value : undefined;
    } catch {
      return undefined;
    }
  });
  const [past, setPast] = useState<Document[]>([]),
    [future, setFuture] = useState<Document[]>([]);
  const current = useRef(document),
    version = useRef(revision),
    lastSaved = useRef(saved),
    inflight = useRef<Promise<boolean> | undefined>(undefined),
    blocked = useRef(false),
    identity = useRef(new ActionIdentity());
  current.current = document;
  const dirty = JSON.stringify(document) !== saved;
  useEffect(() => {
    if (recovery) return;
    try {
      if (dirty) sessionStorage.setItem(recoveryKey, JSON.stringify({ revision, document }));
      else sessionStorage.removeItem(recoveryKey);
    } catch {
      /* The in-memory draft and download remain available. */
    }
  }, [document, revision, dirty, recovery, recoveryKey]);
  function restoreRecovery() {
    if (!recovery) return;
    setChangeSerial(value => value + 1);
    setDocument(recovery.document);
    version.current = recovery.revision;
    setRevision(recovery.revision);
    if (recovery.revision !== revision) {
      blocked.current = true;
      setConflict(work);
    }
    setRecovery(undefined);
  }
  function discardRecovery() {
    setRecovery(undefined);
    try {
      sessionStorage.removeItem(recoveryKey);
    } catch {
      /* unavailable */
    }
  }
  function edit(next: Document) {
    const previous = current.current;
    if (JSON.stringify(previous) === JSON.stringify(next)) return;
    setChangeSerial(value => value + 1);
    setPast((p) => [...p.slice(-49), previous]);
    setFuture([]);
    current.current = next;
    setDocument(next);
  }
  function patch(update: (document: Document) => Document) {
    edit(update(current.current));
  }
  function undo() {
    if (!past.length) return;
    setChangeSerial(value => value + 1);
    setFuture((f) => [current.current, ...f]);
    setDocument(past[past.length - 1]);
    setPast((p) => p.slice(0, -1));
  }
  function redo() {
    if (!future.length) return;
    setChangeSerial(value => value + 1);
    setPast((p) => [...p, current.current]);
    setDocument(future[0]);
    setFuture((f) => f.slice(1));
  }
  const save = useCallback(async (): Promise<boolean> => {
    if (inflight.current) {
      await inflight.current;
      if (blocked.current) return false;
    }
    if (blocked.current) return false;
    const body = JSON.stringify(current.current);
    if (body === lastSaved.current) return true;
    setSaving(true);
    setError('');
    const operation = (async () => {
      try {
        const payload = { revision: version.current, document: JSON.parse(body) };
        const result = await command<{ revision: number }>('PUT', `/author/works/${work.id}`, payload, identity.current.forAction('PUT', `/author/works/${work.id}`, payload));
        identity.current.complete();
        version.current = result.revision;
        lastSaved.current = body;
        setRevision(result.revision);
        setSaved(body);
        return true;
      } catch (e) {
        if (axios.isAxiosError(e) && e.response?.status === 409) {
          blocked.current = true;
          try {
            setConflict(await get<Work>(`/author/works/${work.id}`));
          } catch {
            setError('저장 충돌이 발생했습니다. 로컬 사본을 내려받고 다시 열어 주세요.');
          }
        }
        setError(errorMessage(e));
        return false;
      } finally {
        setSaving(false);
        inflight.current = undefined;
      }
    })();
    inflight.current = operation;
    return operation;
  }, [work.id]);
  useEffect(() => {
    if (!dirty || saving || conflict || recovery || blocked.current) return;
    const timer = setTimeout(() => void save(), 2000);
    return () => clearTimeout(timer);
  }, [document, dirty, saving, conflict, recovery, save]);
  useEffect(() => {
    const before = (e: BeforeUnloadEvent) => {
      if (JSON.stringify(current.current) !== lastSaved.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', before);
    return () => window.removeEventListener('beforeunload', before);
  }, []);
  async function saveAll() {
    do {
      if (!(await save())) return false;
    } while (JSON.stringify(current.current) !== lastSaved.current);
    return true;
  }
  function loadServer() {
    if (!conflict) return;
    setChangeSerial(value => value + 1);
    setPast([]);
    setFuture([]);
    setDocument(conflict.document);
    version.current = conflict.revision;
    setRevision(conflict.revision);
    lastSaved.current = JSON.stringify(conflict.document);
    setSaved(lastSaved.current);
    setConflict(undefined);
    blocked.current = false;
    setError('');
  }
  function download() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(current.current, null, 2)], { type: 'application/json' }));
    const a = window.document.createElement('a');
    a.href = url;
    a.download = `${current.current.slug || '작품'}-복구사본.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
  return {
    changeSerial,
    recovery,
    restoreRecovery,
    discardRecovery,
    document,
    edit,
    patch,
    undo,
    redo,
    canUndo: !!past.length,
    canRedo: !!future.length,
    revision,
    saving,
    dirty,
    error,
    conflict,
    save: saveAll,
    savedRevision: () => version.current,
    loadServer,
    download
  };
}
