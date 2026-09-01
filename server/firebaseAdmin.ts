// Broadcast Atelier direction: Firebase Admin remains a server-side control-room utility, never part of the public surface or browser bundle.
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth, type DecodedIdToken, type UserRecord } from "firebase-admin/auth";

const DEFAULT_FIREBASE_ADMIN_EMAIL = "tadi@gmail.com";

type FirebaseServiceAccount = {
  project_id: string;
  client_email: string;
  private_key: string;
};

function readServiceAccount(): FirebaseServiceAccount {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is not configured");
  return JSON.parse(raw) as FirebaseServiceAccount;
}

export function getFirebaseAdminAuth() {
  if (!getApps().length) {
    const account = readServiceAccount();
    initializeApp({
      credential: cert({
        projectId: account.project_id,
        clientEmail: account.client_email,
        privateKey: account.private_key,
      }),
    });
  }
  return getAuth();
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
