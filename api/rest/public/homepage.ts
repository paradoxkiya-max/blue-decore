type Request = import("node:http").IncomingMessage;
type Response = import("node:http").ServerResponse & { statusCode: number; setHeader(name: string, value: string): void; end(body?: string): void };

export default function handler(req: Request, res: Response) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  if (req.method !== "GET") {
    res.statusCode = 405;
    return res.end(JSON.stringify({ error: "Method not allowed" }));
  }
  res.statusCode = 200;
  return res.end(JSON.stringify({ settings: {}, journalEntries: [] }));
}
