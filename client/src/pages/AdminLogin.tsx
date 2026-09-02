import { FormEvent, useState } from "react";
import { ArrowLeft, ArrowUpRight, LockKeyhole, Moon, Sun } from "lucide-react";
import { useLocation } from "wouter";
import { useTheme } from "@/contexts/ThemeContext";
import { firebaseAuth } from "@/lib/firebase";
import { signInWithEmailAndPassword, signOut as signOutFirebase } from "firebase/auth";
export { AdminDashboard } from "./AdminControlRoom";

type SessionResponse = { role?: unknown; error?: unknown };

function readableError(value: unknown, fallback: string) {
  if (typeof value === "string" && value.trim()) return value;
  if (value instanceof Error && value.message) return value.message;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    for (const key of ["message", "error", "detail", "description"]) {
      if (typeof record[key] === "string" && record[key].trim()) return record[key] as string;
    }
  }
  return fallback;
}

function firebaseErrorMessage(error: unknown) {
  const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
  const messages: Record<string, string> = {
    "auth/invalid-credential": "The email or password is incorrect.",
    "auth/invalid-login-credentials": "The email or password is incorrect.",
    "auth/user-not-found": "The email or password is incorrect.",
    "auth/wrong-password": "The email or password is incorrect.",
    "auth/too-many-requests": "Too many attempts. Please wait and try again later.",
    "auth/user-disabled": "This administrator account is disabled.",
    "auth/network-request-failed": "Unable to reach Firebase. Check your connection and try again.",
    "auth/operation-not-allowed": "Email/password sign-in is not enabled in Firebase.",
  };
  return messages[code] ?? (error instanceof Error ? error.message : "Firebase sign-in could not be completed.");
}

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedEmail = email.trim();
    if (!normalizedEmail || !password) {
      setMessage("Enter both fields to continue.");
      return;
    }

    setMessage("");
    setIsSubmitting(true);
    try {
      const credential = await signInWithEmailAndPassword(firebaseAuth, normalizedEmail, password);
      const idToken = await credential.user.getIdToken(true);
      const response = await fetch("/api/firebase/session", {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        credentials: "include",
        body: JSON.stringify({ idToken }),
      });
      const contentType = response.headers.get("content-type") ?? "";
      const rawBody = await response.text();
      let result: SessionResponse = {};
      if (rawBody.trim() && contentType.includes("application/json")) {
        try {
          result = JSON.parse(rawBody) as SessionResponse;
        } catch {
          throw new Error("The server returned an invalid session response. Please try again.");
        }
      }
      if (!response.ok) {
        throw new Error(readableError(result.error, response.status >= 500
          ? "The admin session service is temporarily unavailable."
          : "Administrator access was not granted."));
      }
      if (result.role !== "admin") throw new Error("Administrator access was not granted.");
      setLocation("/admin/dashboard");
    } catch (error: unknown) {
      await signOutFirebase(firebaseAuth).catch(() => undefined);
      if (error instanceof DOMException && error.name === "AbortError") {
        setMessage("The login request timed out. Check your connection and try again.");
      } else if (error instanceof TypeError) {
        setMessage("Unable to reach the login service. Check your connection and try again.");
      } else if (error && typeof error === "object" && "code" in error) {
        setMessage(firebaseErrorMessage(error));
      } else {
        setMessage(error instanceof Error ? error.message : "Sign-in could not be completed.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return <main className="admin-shell"><div className="admin-topbar"><a className="admin-back" href="/"><ArrowLeft size={15} /> Back to Kasha</a><button className="header-tool" type="button" onClick={toggleTheme} aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}>{theme === "light" ? <Moon size={16} /> : <Sun size={16} />}</button></div><section className="admin-card" aria-labelledby="admin-heading"><div className="admin-card-mark"><LockKeyhole size={20} /></div><p className="eyebrow">Kasha desk / private access</p><h1 id="admin-heading">Sign in to<br /><em>the desk.</em></h1><p className="admin-intro">Manage every public signal, field note, and future gathering from one quiet room.</p><form className="admin-form" onSubmit={handleSubmit}><label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@kashamultimedia.et" autoComplete="email" /></label><label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" autoComplete="current-password" /></label>{message && <p className="admin-error" role="alert">{message}</p>}<button className="button button-signal" type="submit" disabled={isSubmitting}>{isSubmitting ? "Verifying…" : "Enter the desk"} <ArrowUpRight size={16} /></button></form><p className="admin-note">Firebase verifies your email and password before the Kasha server issues the secure admin session.</p></section></main>;
}
