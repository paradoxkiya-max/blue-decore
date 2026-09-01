// Broadcast Atelier direction: this server-side check keeps the private admin control room closed when a Firebase-derived Kasha session has expired.
import { describe, expect, it } from "vitest";
import { sdk } from "./_core/sdk";

describe("Firebase-derived Kasha session", () => {
  it.skipIf(!process.env.JWT_SECRET)("rejects an expired server session token", async () => {
    const token = await sdk.createSessionToken("firebase_expired_admin", {
      name: "Expired Firebase admin",
      expiresInMs: -1,
    });
    await expect(sdk.verifySession(token)).resolves.toBeNull();
  });
});
