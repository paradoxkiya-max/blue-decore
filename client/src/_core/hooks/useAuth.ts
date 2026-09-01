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

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath } = options ?? {};
  const [user, setUser] = useState<ClientUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => onAuthStateChanged(firebaseAuth, (firebaseUser) => {
    if (!firebaseUser) {
      setUser(null);
    } else {
      const email = firebaseUser.email?.trim().toLowerCase() ?? null;
      setUser({ uid: firebaseUser.uid, email: firebaseUser.email, name: firebaseUser.displayName ?? email ?? "Firebase user", role: email === FIREBASE_ADMIN_EMAIL ? "admin" : "user" });
    }
    setLoading(false);
  }), []);

  const logout = useCallback(async () => {
    await signOut(firebaseAuth);
    setUser(null);
  }, []);

  useEffect(() => {
    if (!redirectOnUnauthenticated || loading || user) return;
    if (typeof window === "undefined") return;
    if (redirectPath && window.location.pathname === redirectPath) return;
    window.location.href = redirectPath ?? "/admin";
  }, [loading, redirectOnUnauthenticated, redirectPath, user]);

  return { user, loading, error: null, isAuthenticated: Boolean(user), refresh: async () => undefined, logout };
}
