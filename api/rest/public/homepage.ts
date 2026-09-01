import { appRouter } from "../../../server/routers";
import { createContext } from "../../../server/_core/context";

type Request = import("node:http").IncomingMessage;
type Response = import("node:http").ServerResponse & { statusCode: number; setHeader(name: string, value: string): void; end(body?: string): void };

function json(res: Response, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

export default async function handler(req: Request, res: Response) {
  if (req.method !== "GET") return json(res, 405, { error: "Method not allowed" });
  try {
    const context = await createContext({ req: req as any, res: res as any, info: { req, res } as any });
    const result = await appRouter.createCaller(context).public.homepage();
    return json(res, 200, result);
  } catch (error: any) {
    console.error("[REST API] Homepage failed", error);
    return json(res, 500, { error: "The homepage content could not be loaded." });
  }
}
