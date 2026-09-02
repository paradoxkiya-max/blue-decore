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

function readServiceAccount(): FirebaseServiceAccount {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is not configured");
  return JSON.parse(raw) as FirebaseServiceAccount;
}

export function getFirebaseAdminApp() {
  if (!getApps().length) {
    const account = readServiceAccount();
    initializeApp({
      credential: cert({
        projectId: account.project_id,
        clientEmail: account.client_email,
        privateKey: account.private_key.replace(/\\n/g, "\n"),
      }),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${account.project_id}.firebasestorage.app`,
    });
  }
  return getApps()[0]!;
}

export function getFirebaseAdminAuth() {
  return getAuth(getFirebaseAdminApp());
}

export function getFirebaseFirestore() {
  return getFirestore(getFirebaseAdminApp());
}

export function getFirebaseStorageBucket() {
  return getStorage(getFirebaseAdminApp()).bucket();
}

export async function verifyFirebaseIdToken(idToken: string): Promise<DecodedIdToken> {
  return getFirebaseAdminAuth().verifyIdToken(idToken, true);
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
