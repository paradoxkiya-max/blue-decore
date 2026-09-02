// Blue Decor Firebase client setup for authentication and analytics.
import { getApp, getApps, initializeApp } from "firebase/app";
import { browserLocalPersistence, getAuth, setPersistence } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";

const env = import.meta.env;
export const FIREBASE_ADMIN_EMAIL = String(env.VITE_FIREBASE_ADMIN_EMAIL || "tadi@gmail.com").trim().toLowerCase();

const firebaseConfig = {
  apiKey: String(env.VITE_FIREBASE_API_KEY || "").trim(),
  authDomain: String(env.VITE_FIREBASE_AUTH_DOMAIN || "").trim(),
  projectId: String(env.VITE_FIREBASE_PROJECT_ID || "").trim(),
  storageBucket: String(env.VITE_FIREBASE_STORAGE_BUCKET || "").trim(),
  messagingSenderId: String(env.VITE_FIREBASE_MESSAGING_SENDER_ID || "").trim(),
  appId: String(env.VITE_FIREBASE_APP_ID || "").trim(),
  measurementId: String(env.VITE_FIREBASE_MEASUREMENT_ID || "").trim(),
};

if (!firebaseConfig.apiKey || !firebaseConfig.projectId || !firebaseConfig.appId) {
  console.warn("[Firebase] Missing VITE_FIREBASE_* configuration; Firebase features may be unavailable.");
}

const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

if (typeof window !== "undefined" && firebaseConfig.measurementId) {
  void isSupported().then((supported) => {
    if (supported) getAnalytics(firebaseApp);
  }).catch(() => undefined);
}

export const firebaseAuth = getAuth(firebaseApp);
if (typeof window !== "undefined") {
  void setPersistence(firebaseAuth, browserLocalPersistence).catch(() => undefined);
}
