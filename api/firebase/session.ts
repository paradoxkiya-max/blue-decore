import type { IncomingMessage, ServerResponse } from "node:http";
import { serialize } from "cookie";
import { COOKIE_NAME, ONE_YEAR_MS } from "../../shared/const";
import { getSessionCookieOptions } from "../../server/_core/cookies";
import { sdk } from "../../server/_core/sdk";
import * as db from "../../server/db";
import { getHardcodedAdminEmail, isValidAdminCredentials } from "../../server/adminCredentials";

type VercelRequest = IncomingMessage & {
  body?: unknown;
  protocol?: string;
};

type VercelResponse = ServerResponse & {
  status: (code: number) => VercelResponse;
  json: (body: unknown) => VercelResponse;
};

function readCredentials(body: unknown) {
  if (typeof body === "string") {
    try {
      return JSON.parse(body || "{}") as unknown;
    } catch {
      return null;
    }
  }
  return body;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const payload = readCredentials(req.body);
  const email =
    typeof payload === "object" && payload !== null && "email" in payload && typeof payload.email === "string"
      ? payload.email.trim().toLowerCase()
      : "";
  const password =
    typeof payload === "object" && payload !== null && "password" in payload && typeof payload.password === "string"
      ? payload.password
      : "";

  if (!isValidAdminCredentials(email, password)) {
    return res.status(401).json({ error: "Invalid administrator email or password" });
  }

  try {
    const adminEmail = getHardcodedAdminEmail();
    const openId = `hardcoded_admin_${adminEmail}`;
    await db.upsertUser({
      openId,
      name: "Blue Decore Admin",
      email: adminEmail,
      loginMethod: "hardcoded",
      role: "admin",
      lastSignedIn: new Date(),
    });

    const sessionToken = await sdk.createSessionToken(openId, {
      name: "Blue Decore Admin",
    });

    res.setHeader(
      "Set-Cookie",
      serialize(COOKIE_NAME, sessionToken, {
        ...getSessionCookieOptions(req as never),
        maxAge: ONE_YEAR_MS / 1000,
      }),
    );
    return res.status(200).json({ success: true, role: "admin" });
  } catch (error) {
    console.error("[Admin Auth] Session exchange failed", error);
    return res.status(500).json({ error: "Admin session could not be created" });
  }
}
