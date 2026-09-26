import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { api, ApiError } from './api';
import type { Snapshot, User } from './types';

export interface Toast {
  id: number;
  kind: 'success' | 'error' | 'info' | 'warn';
  title: string;
  detail?: string;
  blockers?: string[];
}

interface AppState {
  snap: Snapshot | null;
  user: User;
  loading: boolean;
  busy: boolean;
  toasts: Toast[];
  setUser: (u: User) => void;
  refresh: () => Promise<void>;
  run: <T>(label: string, fn: () => Promise<T>, opts?: { success?: string }) => Promise<T | null>;
  notify: (t: Omit<Toast, 'id'>) => void;
  dismiss: (id: number) => void;
}

const Ctx = createContext<AppState | null>(null);

const FALLBACK_USER: User = {
  name: 'Rahul Sharma',
  role: 'Inventory Manager',
  initials: 'RS',
  auditorId: '8821',
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [user, setUser] = useState<User>(FALLBACK_USER);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const seq = useRef(0);

  const refresh = useCallback(async () => {
    try {
      setSnap(await api.snapshot());
    } catch (err) {
      setToasts((t) => [
        ...t,
        {
          id: ++seq.current,
          kind: 'error',
          title: 'Cannot reach the StockSense API',
          detail: err instanceof Error ? err.message : 'Is the server running on :4000?',
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const dismiss = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const notify = useCallback((t: Omit<Toast, 'id'>) => {
    const id = ++seq.current;
    setToasts((prev) => [...prev, { ...t, id }]);
    if (t.kind !== 'error') {
      setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 4500);
    }
  }, []);

  /**
   * Every mutation goes through here so the server stays the single source of
   * truth: on success we toast then re-snapshot; on a guardrail rejection we
   * surface the exact blocker the engine returned.
   */
  const run = useCallback(
    async <T,>(label: string, fn: () => Promise<T>, opts?: { success?: string }) => {
      setBusy(true);
      try {
        const out = await fn();
        await refresh();
        notify({ kind: 'success', title: opts?.success ?? `${label} posted`, detail: label });
        return out;
      } catch (err) {
        const apiErr = err instanceof ApiError ? err : null;
        notify({
          kind: apiErr && apiErr.status === 422 ? 'warn' : 'error',
          title: apiErr ? `${label} blocked` : `${label} failed`,
          detail: err instanceof Error ? err.message : String(err),
          blockers: apiErr?.blockers,
        });
        return null;
      } finally {
        setBusy(false);
      }
    },
    [refresh, notify],
  );

  const value = useMemo<AppState>(
    () => ({ snap, user, loading, busy, toasts, setUser, refresh, run, notify, dismiss }),
    [snap, user, loading, busy, toasts, refresh, run, notify, dismiss],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
}

/** Snapshot accessor that narrows away the null case for pages behind the loader. */
export function useSnap(): Snapshot {
  const { snap } = useApp();
  if (!snap) throw new Error('Snapshot not loaded');
  return snap;
}
