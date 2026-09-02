import { useCallback, useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { firebaseAuth, FIREBASE_ADMIN_EMAIL } from "@/lib/firebase";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

type ClientUser = {
  uid: string;
  email: string | null;
  name: string;
  role: "admin" | "user";
};

const SESSION_STORAGE_KEY = "blue_decor_auth_user";

function getCachedUser(): ClientUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath } = options ?? {};
  const [user, setUser] = useState<ClientUser | null>(getCachedUser);
  const [loading, setLoading] = useState(!getCachedUser());

  useEffect(() => onAuthStateChanged(firebaseAuth, (firebaseUser) => {
    if (!firebaseUser) {
      setUser(null);
      try { localStorage.removeItem(SESSION_STORAGE_KEY); } catch {}
    } else {
      const email = firebaseUser.email?.trim().toLowerCase() ?? null;
      const clientUser: ClientUser = { uid: firebaseUser.uid, email: firebaseUser.email, name: firebaseUser.displayName ?? email ?? "Firebase user", role: email === FIREBASE_ADMIN_EMAIL ? "admin" : "user" };
      setUser(clientUser);
      try { localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(clientUser)); } catch {}
    }
    setLoading(false);
  }), []);

  const logout = useCallback(async () => {
    await signOut(firebaseAuth);
    setUser(null);
    try { localStorage.removeItem(SESSION_STORAGE_KEY); } catch {}
  }, []);

  useEffect(() => {
    if (!redirectOnUnauthenticated || loading || user) return;
    if (typeof window === "undefined") return;
    if (redirectPath && window.location.pathname === redirectPath) return;
    window.location.href = redirectPath ?? "/admin";
  }, [loading, redirectOnUnauthenticated, redirectPath, user]);

  return { user, loading, error: null, isAuthenticated: Boolean(user), refresh: async () => undefined, logout };
}
