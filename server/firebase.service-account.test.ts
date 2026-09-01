// Broadcast Atelier direction: this security check validates the server-only Firebase credential without moving private material into the public interface.
import { createSign } from "node:crypto";
import { describe, expect, it } from "vitest";

type FirebaseServiceAccount = {
  client_email: string;
  private_key: string;
  project_id: string;
  token_uri: string;
};

function base64Url(value: string) {
  return Buffer.from(value).toString("base64url");
}

function createAssertion(serviceAccount: FirebaseServiceAccount) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64Url(JSON.stringify({
    iss: serviceAccount.client_email,
    sub: serviceAccount.client_email,
    aud: serviceAccount.token_uri,
    scope: "https://www.googleapis.com/auth/firebase",
    iat: now,
    exp: now + 300,
  }));
  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${payload}`);
  signer.end();
  const signature = signer.sign(serviceAccount.private_key).toString("base64url");
  return `${header}.${payload}.${signature}`;
}

describe("Firebase service account", () => {
  it.skipIf(!process.env.FIREBASE_ADMIN_EMAIL)("has a valid configured administrator email", () => {
    expect(process.env.FIREBASE_ADMIN_EMAIL).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  });

  it.skipIf(!process.env.FIREBASE_SERVICE_ACCOUNT_JSON)("exchanges the stored service account for a Google OAuth token", async () => {
    const rawCredential = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    expect(rawCredential, "FIREBASE_SERVICE_ACCOUNT_JSON must be configured").toBeTruthy();
    const credential = JSON.parse(rawCredential!) as FirebaseServiceAccount;
    const response = await fetch(credential.token_uri, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: createAssertion(credential),
      }),
    });
    const result = await response.json() as { access_token?: string; error?: string };
    expect(response.ok, result.error ?? "Firebase OAuth token exchange failed").toBe(true);
    expect(result.access_token).toEqual(expect.any(String));
  }, 15_000);
});
