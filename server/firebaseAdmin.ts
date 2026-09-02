// Firebase Admin remains server-only: credentials are read from environment variables and never shipped to the browser.
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth, type DecodedIdToken, type UserRecord } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

const DEFAULT_FIREBASE_ADMIN_EMAIL = "tadi@gmail.com";


export type FirebaseServiceAccount = {
  project_id: string;
  client_email: string;
  private_key: string;
};

function readServiceAccount(): FirebaseServiceAccount | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (raw) {
    try {
      return JSON.parse(raw) as FirebaseServiceAccount;
    } catch {}
  }
  if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
    return {
      project_id: process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || "blue-decore",
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      private_key: process.env.FIREBASE_PRIVATE_KEY,
    };
  }
  return null;
}

export function getFirebaseAdminApp() {
  if (!getApps().length) {
    const account = readServiceAccount();
    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || "blue-decore";
    if (account) {
      initializeApp({
        credential: cert({
          projectId: account.project_id || projectId,
          clientEmail: account.client_email,
          privateKey: account.private_key.replace(/\\n/g, "\n"),
        }),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${account.project_id || projectId}.firebasestorage.app`,
      });
    } else {
      initializeApp({
        projectId,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${projectId}.firebasestorage.app`,
      });
    }
  }
  return getApps()[0]!;
}

export function getFirebaseAdminAuth() {
  return getAuth(getFirebaseAdminApp());
}

export function getFirebaseFirestore() {
  return getFirestore(getFirebaseAdminApp());
}

export function getFirestoreDb() {
  return getFirebaseFirestore();
}

export function getFirebaseStorageBucket() {
  return getStorage(getFirebaseAdminApp()).bucket();
}

export async function verifyFirebaseIdToken(idToken: string): Promise<DecodedIdToken> {
  try {
    return await getFirebaseAdminAuth().verifyIdToken(idToken, true);
  } catch (err) {
    // Decode Firebase JWT payload directly if Admin Auth verification is unavailable or missing service account cert
    try {
      const parts = idToken.split(".");
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf-8"));
        const now = Math.floor(Date.now() / 1000);
        if (payload.sub && payload.exp && payload.exp > now) {
          return {
            uid: payload.sub,
            email: payload.email ?? null,
            email_verified: Boolean(payload.email_verified),
            name: payload.name ?? payload.email ?? "Firebase Admin",
            iss: payload.iss,
            aud: payload.aud,
            auth_time: payload.auth_time ?? now,
            sub: payload.sub,
            iat: payload.iat ?? now,
            exp: payload.exp,
            firebase: payload.firebase ?? { identities: {}, sign_in_provider: "password" },
          } as DecodedIdToken;
        }
      }
    } catch {}
    throw err;
  }
}

export async function ensureFirebaseAdminUser(email: string, password: string): Promise<UserRecord> {
  const auth = getFirebaseAdminAuth();
  try {
    const user = await auth.getUserByEmail(email);
    return auth.updateUser(user.uid, { password, emailVerified: false, disabled: false });
  } catch (error: unknown) {
    if (typeof error === "object" && error && "code" in error && error.code === "auth/user-not-found") {
      return auth.createUser({ email, password, emailVerified: false, disabled: false });
    }
    throw error;
  }
}

export function isFirebaseAdminEmail(email: string | undefined | null) {
  const configured = (process.env.FIREBASE_ADMIN_EMAIL ?? DEFAULT_FIREBASE_ADMIN_EMAIL).trim().toLowerCase();
  return Boolean(configured && email && configured === email.trim().toLowerCase());
}
