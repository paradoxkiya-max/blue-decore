type CookieRequest = {
  protocol?: unknown;
  headers?: Record<string, unknown>;
};

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

function isIpAddress(host: string) {
  // Basic IPv4 check and IPv6 presence detection.
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return true;
  return host.includes(":");
}

function isSecureRequest(req: CookieRequest) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers?.["x-forwarded-proto"];
  if (typeof forwardedProto !== "string") return false;
  return forwardedProto.split(",").some((proto) => proto.trim().toLowerCase() === "https");
}

export type SessionCookieOptions = {
  domain?: string;
  httpOnly?: boolean;
  path?: string;
  sameSite?: boolean | "lax" | "strict" | "none";
  secure?: boolean;
};

export function getSessionCookieOptions(req: unknown): SessionCookieOptions {
  const request = (typeof req === "object" && req !== null ? req : {}) as CookieRequest;
  // const hostname = req.hostname;
  // const shouldSetDomain =
  //   hostname &&
  //   !LOCAL_HOSTS.has(hostname) &&
  //   !isIpAddress(hostname) &&
  //   hostname !== "127.0.0.1" &&
  //   hostname !== "::1";

  // const domain =
  //   shouldSetDomain && !hostname.startsWith(".")
  //     ? `.${hostname}`
  //     : shouldSetDomain
  //       ? hostname
  //       : undefined;

  return {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: isSecureRequest(request),
  };
}
