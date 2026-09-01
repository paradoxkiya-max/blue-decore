// Broadcast Atelier direction: this server-side check verifies the guarded admin signal end to end without ever exposing the password to the browser UI source.
import { describe, expect, it } from "vitest";

describe("Firebase administrator login", () => {
  it.skipIf(!process.env.FIREBASE_ADMIN_EMAIL || !process.env.FIREBASE_ADMIN_PASSWORD || !process.env.VITE_FIREBASE_API_KEY)("authenticates the configured administrator through Firebase Identity Toolkit", async () => {
    const email = process.env.FIREBASE_ADMIN_EMAIL;
    const password = process.env.FIREBASE_ADMIN_PASSWORD;
    const apiKey = process.env.VITE_FIREBASE_API_KEY;
    expect(email).toBeTruthy();
    expect(password).toBeTruthy();
    expect(apiKey).toBeTruthy();

    const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    });
    const result = await response.json() as { idToken?: string; error?: { message?: string } };
    expect(response.ok, result.error?.message ?? "Firebase administrator sign-in failed").toBe(true);
    expect(result.idToken).toEqual(expect.any(String));
  }, 15_000);
});
