import type { IncomingMessage, ServerResponse } from "node:http";
import { COOKIE_NAME, ONE_YEAR_MS } from "../../shared/const";

type VercelRequest = IncomingMessage & { body?: unknown; protocol?: string };
type VercelResponse = ServerResponse & {
  status: (code: number) => VercelResponse;
  json: (body: unknown) => VercelResponse;
};

type SessionPayload = { idToken?: unknown };

function readPayload(body: unknown): SessionPayload | null {
  if (typeof body === "object" && body !== null) return body as SessionPayload;
  if (typeof body !== "string") return null;
  try {
    const parsed: unknown = JSON.parse(body || "{}");
    return typeof parsed === "object" && parsed !== null ? parsed as SessionPayload : null;
  } catch {
    return null;
  }
}

function serializeSessionCookie(value: string, maxAge: number, secure: boolean) {
  return `${COOKIE_NAME}=${encodeURIComponent(value)}; Max-Age=${maxAge}; Path=/; HttpOnly; SameSite=None${secure ? "; Secure" : ""}`;
}

function isSecureRequest(req: VercelRequest) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  return typeof forwardedProto === "string" && forwardedProto.split(",").some((value) => value.trim().toLowerCase() === "https");
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const payload = readPayload(req.body);
  const idToken = typeof payload?.idToken === "string" ? payload.idToken.trim() : "";
  if (!idToken) return res.status(400).json({ error: "Firebase ID token is required" });

  try {
    const [{ isFirebaseAdminEmail, verifyFirebaseIdToken }, { sdk }, db] = await Promise.all([
      import("../../server/firebaseAdmin"),
      import("../../server/_core/sdk"),
      import("../../server/db"),
    ]);
    const token = await verifyFirebaseIdToken(idToken);
    const email = token.email ?? null;
    if (!isFirebaseAdminEmail(email)) return res.status(403).json({ error: "This Firebase account is not an administrator" });

    const openId = `firebase_${token.uid}`;
    const displayName = token.name ?? email ?? "Firebase administrator";
    await db.upsertUser({ openId, name: displayName, email, loginMethod: "firebase", role: "admin", lastSignedIn: new Date() });
    const sessionToken = await sdk.createSessionToken(openId, { name: displayName });
    res.setHeader("Set-Cookie", serializeSessionCookie(sessionToken, ONE_YEAR_MS / 1000, isSecureRequest(req)));
    return res.status(200).json({ success: true, role: "admin" });
  } catch (error) {
    console.error("[Firebase Auth] Session exchange failed", error);
    const message = error instanceof Error ? error.message : "";
    if (message.includes("FIREBASE_SERVICE_ACCOUNT_JSON")) return res.status(500).json({ error: "Firebase server authentication is not configured" });
    if (message.includes("DATABASE_URL")) return res.status(500).json({ error: "The admin database is not configured" });
    if (message.includes("JWT_SECRET")) return res.status(500).json({ error: "The admin session secret is not configured" });
    return res.status(401).json({ error: "Firebase sign-in could not be verified" });
  }
}
