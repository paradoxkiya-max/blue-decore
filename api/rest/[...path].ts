import type { IncomingMessage, ServerResponse } from "node:http";
import { appRouter } from "../../server/routers";
import { createContext } from "../../server/_core/context";

type Request = IncomingMessage & { body?: unknown };
type Response = ServerResponse & { statusCode: number; setHeader(name: string, value: string): void; end(body?: string): void };

function json(res: Response, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

async function readBody(req: Request) {
  if (req.body !== undefined) return req.body;
  let raw = "";
  for await (const chunk of req) raw += chunk;
  if (!raw) return undefined;
  try { return JSON.parse(raw); } catch { return null; }
}

export default async function handler(req: Request, res: Response) {
  try {
    const path = (req.url ?? "").split("?")[0].replace(/^\/api\/rest\/?/, "").split("/").filter(Boolean);
    if (!path.length) return json(res, 404, { error: "API route not found" });
    if (req.method !== "GET" && req.method !== "POST") return json(res, 405, { error: "Method not allowed" });
    const input = req.method === "POST" ? await readBody(req) : undefined;
    if (req.method === "POST" && input === null) return json(res, 400, { error: "Request body must be valid JSON" });

    const context = await createContext({ req: req as any, res: res as any, info: { req, res } as any });
    let procedure: any = appRouter.createCaller(context);
    for (const segment of path) procedure = procedure[segment];
    if (typeof procedure !== "function") return json(res, 404, { error: "API operation not found" });
    const result = await procedure(input);
    return json(res, 200, result);
  } catch (error: any) {
    console.error("[REST API] Request failed", error);
    const code = error?.code === "UNAUTHORIZED" ? 401 : error?.code === "FORBIDDEN" ? 403 : error?.code === "BAD_REQUEST" ? 400 : 500;
    return json(res, code, { error: error?.message ?? "The request could not be completed." });
  }
}
