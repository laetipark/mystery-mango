import { createContext, useCallback, useContext, useLayoutEffect, useRef, useSyncExternalStore, type ReactNode, type SetStateAction } from 'react';

const WorkContext = createContext('preview');
type UIValue = string | number | boolean;
const cache = new Map<string, UIValue>();
const listeners = new Map<string, Set<() => void>>();

export function EditorMemory({ workId, children }: { workId: string; children: ReactNode }) {
  return <WorkContext.Provider value={workId}>{children}</WorkContext.Provider>;
}

/** Only navigation preferences belong here. Drafts, revisions and history stay in useDraft. */
export function useEditorState(name: string, initial: string): [string, (next: SetStateAction<string>) => void];
export function useEditorState(name: string, initial: number): [number, (next: SetStateAction<number>) => void];
export function useEditorState(name: string, initial: boolean): [boolean, (next: SetStateAction<boolean>) => void];
export function useEditorState<T extends UIValue>(name: string, initial: T): [T, (next: SetStateAction<T>) => void] {
  const workId = useContext(WorkContext);
  const key = `mango-editor-ui:${workId}:${name}`;
  const read = useCallback((): T => {
    if (cache.has(key)) return cache.get(key) as T;
    let value: T = initial;
    try {
      const saved: unknown = JSON.parse(sessionStorage.getItem(key) ?? 'null');
      if (typeof saved === typeof initial && (typeof saved !== 'number' || Number.isFinite(saved)) && (typeof saved !== 'string' || saved.length < 2000)) value = saved as T;
    } catch { /* A disabled browser store must not prevent editing. */ }
    cache.set(key, value);
    return value;
  }, [key, initial]);
  const subscribe = useCallback((listener: () => void) => {
    const current = listeners.get(key) ?? new Set();
    current.add(listener);
    listeners.set(key, current);
    return () => { current.delete(listener); if (!current.size) listeners.delete(key); };
  }, [key]);
  const value = useSyncExternalStore(subscribe, read, () => initial);
  const set = useCallback((next: SetStateAction<T>) => {
    const value = typeof next === 'function' ? next(read()) : next;
    cache.set(key, value);
    try { sessionStorage.setItem(key, JSON.stringify(value)); } catch { /* Keep in-memory navigation. */ }
    listeners.get(key)?.forEach((listener) => listener());
  }, [key, read]);
  return [value, set];
}

export function navigateEditor(path: string) {
  window.dispatchEvent(new CustomEvent('studio-open-reference', { detail: path }));
}

export function useEditorScroll<T extends HTMLElement = HTMLDivElement>(name: string) {
  const workId = useContext(WorkContext);
  const ref = useRef<T>(null);
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const key = `mango-editor-scroll:${workId}:${name}`;
    let saved = {x:0,y:0};
    try {
      const value = JSON.parse(sessionStorage.getItem(key) ?? 'null');
      if (value && Number.isFinite(value.x) && Number.isFinite(value.y)) saved = value;
    } catch { /* Scrolling remains available. */ }
    let restored = false;
    const restore = () => {
      if (restored || !element.clientHeight || !element.clientWidth) return;
      restored = true;
      element.scrollTo(saved.x, saved.y);
    };
    const observer = new ResizeObserver(restore);
    observer.observe(element);
    const frame = requestAnimationFrame(restore);
    const persist = () => {
      if (!restored) return;
      try { sessionStorage.setItem(key, JSON.stringify(saved)); } catch { /* Optional UI preference. */ }
    };
    const save = () => {
      if (!restored || !element.clientHeight || !element.clientWidth) return;
      saved = {x:element.scrollLeft,y:element.scrollTop};
      persist();
    };
    element.addEventListener('scroll', save, {passive:true});
    // A new panel may already have shorter content. Keep the previous panel's last scroll event.
    return () => { persist(); cancelAnimationFrame(frame); observer.disconnect(); element.removeEventListener('scroll', save); };
  }, [name, workId]);
  return ref;
}
