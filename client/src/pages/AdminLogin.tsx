import { useState, type FormEvent } from "react";
import { ArrowLeft, ArrowUpRight, LockKeyhole, Moon, Sun } from "lucide-react";
import { useLocation } from "wouter";
import { useTheme } from "@/contexts/ThemeContext";
import { firebaseAuth, FIREBASE_ADMIN_EMAIL } from "@/lib/firebase";
import { signInWithEmailAndPassword, signOut as signOutFirebase } from "firebase/auth";
export { AdminDashboard } from "./AdminControlRoom";

function firebaseErrorMessage(error: unknown) {
  const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
  const messages: Record<string, string> = {
    "auth/invalid-credential": "The email or password is incorrect.",
    "auth/invalid-login-credentials": "The email or password is incorrect.",
    "auth/user-not-found": "The email or password is incorrect.",
    "auth/wrong-password": "The email or password is incorrect.",
    "auth/too-many-requests": "Too many attempts. Please wait and try again later.",
    "auth/user-disabled": "This account is disabled.",
    "auth/network-request-failed": "Unable to reach Firebase. Check your connection and try again.",
    "auth/operation-not-allowed": "Email/password sign-in is not enabled in Firebase.",
  };
  if (messages[code]) return messages[code];
  if (error instanceof Error && error.message) return error.message;
  return "Sign-in could not be completed. Please try again.";
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
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      setMessage("Enter both fields to continue.");
      return;
    }

    setMessage("");
    setIsSubmitting(true);
    try {
      const credential = await signInWithEmailAndPassword(firebaseAuth, normalizedEmail, password);
      const signedInEmail = credential.user.email?.trim().toLowerCase();
      if (signedInEmail !== FIREBASE_ADMIN_EMAIL) {
        await signOutFirebase(firebaseAuth);
        throw new Error("This Firebase account is not authorized for the admin area.");
      }
      setLocation("/admin/dashboard");
    } catch (error: unknown) {
      await signOutFirebase(firebaseAuth).catch(() => undefined);
      setMessage(firebaseErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return <main className="admin-shell"><div className="admin-topbar"><a className="admin-back" href="/"><ArrowLeft size={15} /> Back to Kasha</a><button className="header-tool" type="button" onClick={toggleTheme} aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}>{theme === "light" ? <Moon size={16} /> : <Sun size={16} />}</button></div><section className="admin-card" aria-labelledby="admin-heading"><div className="admin-card-mark"><LockKeyhole size={20} /></div><p className="eyebrow">Kasha desk / private access</p><h1 id="admin-heading">Sign in to<br /><em>the desk.</em></h1><p className="admin-intro">Use your Firebase administrator email and password.</p><form className="admin-form" onSubmit={handleSubmit}><label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Administrator email" autoComplete="email" /></label><label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" autoComplete="current-password" /></label>{message && <p className="admin-error" role="alert">{message}</p>}<button className="button button-signal" type="submit" disabled={isSubmitting}>{isSubmitting ? "Signing in…" : "Enter the desk"} <ArrowUpRight size={16} /></button></form><p className="admin-note">Authentication is handled directly by Firebase Email/Password.</p></section></main>;
}
