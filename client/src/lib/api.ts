import { useCallback, useEffect, useState } from "react";
import { firebaseAuth } from "@/lib/firebase";

type Options = { retry?: number; refetchOnWindowFocus?: boolean; onSuccess?: (value: any) => void; onError?: (error: any) => void };
type QueryResult<T> = { data: T | undefined; isLoading: boolean; isError: boolean; error: Error | null; refetch: () => Promise<void> };

async function request(path: string, method: "GET" | "POST", input?: unknown) {
  const token = await firebaseAuth.currentUser?.getIdToken();
  const response = await fetch(`/api/rest/${path}`, {
    method,
    headers: { accept: "application/json", ...(method === "POST" ? { "content-type": "application/json" } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    credentials: "include",
    body: method === "POST" ? JSON.stringify(input ?? null) : undefined,
  });
  const text = await response.text();
  let payload: any = null;
  try { payload = text ? JSON.parse(text) : null; } catch { throw new Error("The server returned an invalid JSON response."); }
  if (!response.ok) throw new Error(payload?.error ?? "The request could not be completed.");
  return payload;
}

function queryHook<T>(path: string, input: unknown, options?: Options): QueryResult<T> {
  const [state, setState] = useState<{ data?: T; error: Error | null; loading: boolean }>({ data: undefined, error: null, loading: true });
  const run = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: null }));
    try { const data = await request(path, "GET", input); setState({ data, error: null, loading: false }); }
    catch (error) { setState((current) => ({ ...current, error: error instanceof Error ? error : new Error("Request failed"), loading: false })); }
  }, [path, input]);
  useEffect(() => { void run(); }, [run]);
  return { data: state.data, isLoading: state.loading, isError: Boolean(state.error), error: state.error, refetch: run };
}

function mutationHook(path: string, options?: Options) {
  const [state, setState] = useState<{ error: Error | null; pending: boolean }>({ error: null, pending: false });
  const mutateAsync = useCallback(async (input?: unknown) => {
    setState({ error: null, pending: true });
    try { const value = await request(path, "POST", input); setState({ error: null, pending: false }); options?.onSuccess?.(value); return value; }
    catch (error) { const normalized = error instanceof Error ? error : new Error("Request failed"); setState({ error: normalized, pending: false }); options?.onError?.(normalized); throw normalized; }
  }, [path, options]);
  return { mutateAsync, mutate: (input?: unknown, callbacks?: Options) => { void mutateAsync(input).then(callbacks?.onSuccess).catch(callbacks?.onError); }, isPending: state.pending, error: state.error };
}

function utilsProxy() {
  return new Proxy({}, { get: () => new Proxy({}, { get: () => ({ invalidate: async () => undefined, setData: () => undefined }) }) });
}

function endpoint(parts: string[]): any {
  return new Proxy({}, { get: (_target, property: string) => {
    if (property === "useQuery") return (input?: unknown, options?: Options) => queryHook(parts.join("/"), input, options);
    if (property === "useMutation") return (options?: Options) => mutationHook(parts.join("/"), options);
    if (property === "useUtils") return () => utilsProxy();
    return endpoint([...parts, property]);
  } });
}

export const api: any = endpoint([]);
