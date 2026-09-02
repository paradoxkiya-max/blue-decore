// Blue Decor API client — connects the CMS admin and public landing page to the
// Express REST proxy which forwards to tRPC procedures backed by Firestore.
import { useCallback, useEffect, useRef, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase";

// ── Auth token management ──────────────────────────────────────────────
// We subscribe to Firebase auth state changes and cache the ID token so
// every REST request includes the latest valid token without race conditions.

let cachedToken: string | null = null;
let authReady = false;
let authReadyResolve: (() => void) | null = null;
const authReadyPromise = new Promise<void>((resolve) => {
  authReadyResolve = resolve;
});

onAuthStateChanged(firebaseAuth, async (user) => {
  if (user) {
    try {
      cachedToken = await user.getIdToken();
    } catch {
      cachedToken = null;
    }
  } else {
    cachedToken = null;
  }
  if (!authReady) {
    authReady = true;
    authReadyResolve?.();
  }
});

async function getToken(): Promise<string | null> {
  if (!authReady) await authReadyPromise;
  // Refresh the token if user is still logged in
  const user = firebaseAuth.currentUser;
  if (user) {
    try {
      cachedToken = await user.getIdToken();
    } catch {
      // keep the last cached token
    }
  }
  return cachedToken;
}

// ── REST request helper ────────────────────────────────────────────────

async function request(path: string, method: "GET" | "POST", input?: unknown) {
  const token = await getToken();
  const response = await fetch(`/api/rest/${path}`, {
    method,
    headers: {
      accept: "application/json",
      ...(method === "POST" ? { "content-type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
    body: method === "POST" ? JSON.stringify(input ?? null) : undefined,
  });
  const text = await response.text();
  let payload: any = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    throw new Error("The server returned an invalid response.");
  }
  if (!response.ok) {
    throw new Error(payload?.error ?? "The request could not be completed.");
  }
  return payload;
}

// ── Query cache & invalidation ─────────────────────────────────────────
// A simple global cache of query subscribers. When invalidate() is called
// on a path, every mounted hook using that path will refetch.

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

  // Fetch on mount
  useEffect(() => {
    void run();
  }, [run]);

  // Subscribe to invalidation
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

// ── useUtils hook (real invalidation) ──────────────────────────────────
// Returns a deeply nested proxy where any path ending in `.invalidate()`
// will trigger a refetch on all mounted query hooks for that path.

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
// `api.admin.settings.get.useQuery()` → `queryHook("admin/settings/get")`
// `api.admin.settings.update.useMutation()` → `mutationHook("admin/settings/update")`
// `api.useUtils()` → returns the invalidation proxy

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
