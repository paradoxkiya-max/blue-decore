import express from "express";
import type { IncomingMessage, ServerResponse } from "node:http";

type VercelResponse = ServerResponse & {
  statusCode: number;
  setHeader(name: string, value: string): void;
  end(body?: string): void;
};

export default async function handler(req: IncomingMessage, res: VercelResponse) {
  try {
    const [{ appRouter }, { createContext }] = await Promise.all([
      import("../../server/routers"),
      import("../../server/_core/context"),
    ]);
    const app = express();
    app.use(express.json({ limit: "50mb" }));
    app.use(express.urlencoded({ limit: "50mb", extended: true }));
    const { createExpressMiddleware } = await import("@trpc/server/adapters/express");
    app.use(createExpressMiddleware({ router: appRouter, createContext }));
    app(req, res as never);
  } catch (error) {
    console.error("[tRPC] Function initialization failed", error);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(JSON.stringify({ error: "The server is temporarily unavailable. Please try again shortly." }));
    }
  }
}
