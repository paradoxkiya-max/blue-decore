import type { IncomingMessage, ServerResponse } from "node:http";
import { appRouter } from "../server/routers";
import { createContext } from "../server/_core/context";

type Request = IncomingMessage & { body?: unknown; url?: string };
type Response = ServerResponse & { statusCode: number; setHeader(name: string, value: string): void; end(body?: string): void };

function json(res: Response, status: number, body: unknown) { res.statusCode = status; res.setHeader("Content-Type", "application/json; charset=utf-8"); res.end(JSON.stringify(body)); }
async function readBody(req: Request) {
  if (req.body !== undefined) return req.body;
  let raw = "";
  for await (const chunk of req) raw += chunk;
  if (!raw) return undefined;
  try { return JSON.parse(raw); } catch { return null; }
}
export default async function handler(req: Request, res: Response) {
  try {
    const url = new URL(req.url ?? "/", "https://vercel.local");
    const path = (url.searchParams.get("path") ?? url.pathname.replace(/^\/api\/rest\/?/, "")).split("/").filter(Boolean);
    if (!path.length) return json(res, 404, { error: "API route not found" });
    if (req.method !== "GET" && req.method !== "POST") return json(res, 405, { error: "Method not allowed" });
    const input = req.method === "POST" ? await readBody(req) : undefined;
    if (req.method === "POST" && input === null) return json(res, 400, { error: "Request body must be valid JSON" });
    const context = await createContext({ req: req as any, res: res as any, info: { req, res } as any });
    let procedure: any = appRouter.createCaller(context);
    for (const segment of path) procedure = procedure[segment];
    if (typeof procedure !== "function") return json(res, 404, { error: "API operation not found" });
    return json(res, 200, await procedure(input));
  } catch (error: any) {
    console.error("[REST API] Request failed", error);
    const rawCode = error?.statusCode ?? error?.status ?? error?.code;
    const code = rawCode === 401 || rawCode === "UNAUTHORIZED" ? 401 : rawCode === 403 || rawCode === "FORBIDDEN" ? 403 : rawCode === 400 || rawCode === "BAD_REQUEST" ? 400 : 500;
    return json(res, code, { error: error?.message ?? "The request could not be completed." });
  }
}
