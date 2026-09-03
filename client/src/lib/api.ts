// Blue Decor API client — connects CMS admin and public landing page
// DIRECTLY to Firebase Firestore via client SDK (zero Vercel backend server dependencies).

import { useCallback, useEffect, useRef, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase";
import {
  getPublicContent,
  submitInquiry,
  getSettings,
  updateSettings,
  listCollection,
  createCollectionItem,
  updateCollectionItem,
  deleteCollectionItem,
  getDashboardSummary,
  defaultPrograms,
  defaultServices,
  defaultEvents,
  defaultJournal,
} from "./firebaseContent";

// ── Auth token management ──────────────────────────────────────────────

let currentUserEmail: string | null = null;
let authReady = false;
let authReadyResolve: (() => void) | null = null;
const authReadyPromise = new Promise<void>((resolve) => {
  authReadyResolve = resolve;
});

onAuthStateChanged(firebaseAuth, (user) => {
  currentUserEmail = user?.email ?? null;
  if (!authReady) {
    authReady = true;
    authReadyResolve?.();
  }
});

// ── Firestore Dispatch Helper ──────────────────────────────────────────

async function request(path: string, method: "GET" | "POST", input?: any): Promise<any> {
  if (!authReady) await authReadyPromise;

  // Clean trailing slashes
  const cleanPath = path.replace(/\/+$/, "");

  // 1. Auth routes
  if (cleanPath === "auth/me") {
    const user = firebaseAuth.currentUser;
    if (!user) return null;
    return {
      id: 1,
      openId: `firebase_${user.uid}`,
      email: user.email ?? "tadi@gmail.com",
      name: user.displayName ?? user.email ?? "Admin",
      role: "admin",
    };
  }
  if (cleanPath === "auth/logout") {
    await firebaseAuth.signOut();
    return { success: true };
  }

  // 2. Public routes
  if (cleanPath === "public/homepage") {
    return getPublicContent();
  }
  if (cleanPath === "public/submitInquiry") {
    return submitInquiry(input);
  }

  // 3. Admin Dashboard & Settings
  if (cleanPath === "admin/dashboard") {
    return getDashboardSummary();
  }
  if (cleanPath === "admin/settings/get") {
    return getSettings();
  }
  if (cleanPath === "admin/settings/update") {
    return updateSettings(input);
  }

  // 4. Admin Generic Collection Routing (programs, services, events, journal, inquiries, media)
  const parts = cleanPath.split("/");
  if (parts.length >= 3 && parts[0] === "admin") {
    const feature = parts[1]; // e.g. "programs", "services", "events", "journal", "inquiries", "media"
    const action = parts[2];  // e.g. "list", "create", "update", "remove", "setPublished", "setOrder", "connectDrive", "uploadDirect"

    const collMap: Record<string, { name: string; defaults: any[] }> = {
      programs: { name: "programs", defaults: defaultPrograms },
      services: { name: "services", defaults: defaultServices },
      events: { name: "events", defaults: defaultEvents },
      journal: { name: "journalEntries", defaults: defaultJournal },
      inquiries: { name: "inquiries", defaults: [] },
      media: { name: "mediaAssets", defaults: [] },
    };

    const target = collMap[feature];
    if (target) {
      if (action === "list") {
        return listCollection(target.name, target.defaults);
      }
      if (action === "create" || action === "connectDrive" || action === "uploadDirect") {
        const payload = input ?? {};
        let finalValues = { ...payload };
        if (action === "connectDrive" && payload.driveLink) {
          finalValues.url = payload.driveLink;
          finalValues.storageKey = `drive:${Date.now()}`;
        }
        if (action === "uploadDirect" && payload.fileData) {
          finalValues.url = payload.fileData;
          finalValues.storageKey = `direct:${Date.now()}`;
        }
        return createCollectionItem(target.name, finalValues);
      }
      if (action === "update") {
        const { id, ...updates } = input ?? {};
        return updateCollectionItem(target.name, id, updates);
      }
      if (action === "setPublished") {
        return updateCollectionItem(target.name, input.id, { isPublished: input.isPublished });
      }
      if (action === "setOrder") {
        return updateCollectionItem(target.name, input.id, { sortOrder: input.sortOrder });
      }
      if (action === "remove") {
        return deleteCollectionItem(target.name, input.id);
      }
      if (action === "updateStatus") {
        return updateCollectionItem(target.name, input.id, { status: input.status });
      }
    }
  }

  console.warn(`[Firestore Dispatch] Unhandled route path: ${cleanPath}`);
  return { success: true };
}

// ── Query cache & invalidation ─────────────────────────────────────────

type QuerySubscriber = () => void;
const subscribers = new Map<string, Set<QuerySubscriber>>();

function subscribe(path: string, callback: QuerySubscriber) {
  if (!subscribers.has(path)) subscribers.set(path, new Set());
  subscribers.get(path)!.add(callback);
  return () => {
    subscribers.get(path)?.delete(callback);
  };
}

function invalidatePath(path: string) {
  subscribers.get(path)?.forEach((callback) => callback());
}

// ── Hook types ─────────────────────────────────────────────────────────

type Options = {
  retry?: number;
  refetchOnWindowFocus?: boolean;
  onSuccess?: (value: any) => void;
  onError?: (error: any) => void;
};

type QueryResult<T> = {
  data: T | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
};

// ── useQuery hook ──────────────────────────────────────────────────────

function queryHook<T>(path: string, _input: unknown, options?: Options): QueryResult<T> {
  const [state, setState] = useState<{
    data?: T;
    error: Error | null;
    loading: boolean;
  }>({ data: undefined, error: null, loading: true });

  const pathRef = useRef(path);
  pathRef.current = path;

  const run = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await request(pathRef.current, "GET");
      setState({ data, error: null, loading: false });
    } catch (error) {
      setState((s) => ({
        ...s,
        error: error instanceof Error ? error : new Error("Request failed"),
        loading: false,
      }));
    }
  }, []);

  useEffect(() => {
    void run();
  }, [run]);

  useEffect(() => {
    return subscribe(path, run);
  }, [path, run]);

  return {
    data: state.data,
    isLoading: state.loading,
    isError: Boolean(state.error),
    error: state.error,
    refetch: run,
  };
}

// ── useMutation hook ───────────────────────────────────────────────────

function mutationHook(path: string, options?: Options) {
  const [state, setState] = useState<{ error: Error | null; pending: boolean }>({
    error: null,
    pending: false,
  });

  const mutateAsync = useCallback(
    async (input?: unknown) => {
      setState({ error: null, pending: true });
      try {
        const value = await request(path, "POST", input);
        setState({ error: null, pending: false });
        options?.onSuccess?.(value);
        return value;
      } catch (error) {
        const normalized = error instanceof Error ? error : new Error("Request failed");
        setState({ error: normalized, pending: false });
        options?.onError?.(normalized);
        throw normalized;
      }
    },
    [path, options],
  );

  return {
    mutateAsync,
    mutate: (input?: unknown, callbacks?: Options) => {
      void mutateAsync(input).then(callbacks?.onSuccess).catch(callbacks?.onError);
    },
    isPending: state.pending,
    error: state.error,
  };
}

// ── useUtils hook (invalidation proxy) ─────────────────────────────────

function createUtilsProxy(parts: string[] = []): any {
  return new Proxy(
    {},
    {
      get: (_target, property: string) => {
        if (property === "invalidate") {
          return () => {
            const path = parts.join("/");
            invalidatePath(path);
          };
        }
        if (property === "setData") {
          return () => undefined;
        }
        return createUtilsProxy([...parts, property]);
      },
    },
  );
}

// ── Endpoint proxy ─────────────────────────────────────────────────────

function endpoint(parts: string[]): any {
  return new Proxy(
    {},
    {
      get: (_target, property: string) => {
        if (property === "useQuery") {
          return (input?: unknown, options?: Options) => queryHook(parts.join("/"), input, options);
        }
        if (property === "useMutation") {
          return (options?: Options) => mutationHook(parts.join("/"), options);
        }
        if (property === "useUtils") {
          return () => createUtilsProxy();
        }
        return endpoint([...parts, property]);
      },
    },
  );
}

export const api: any = endpoint([]);
