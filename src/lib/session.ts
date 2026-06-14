// ─── Session helpers ────────────────────────────────────────────────────────
// Sessions are stored as signed JWTs in an httpOnly cookie. The server
// signs { userId } with SESSION_SECRET; the cookie itself carries the data,
// no server-side session storage needed.

import jwt from "jsonwebtoken";
import { serialize, parse } from "cookie";
import type { IncomingMessage } from "node:http";

const SESSION_SECRET = process.env.SESSION_SECRET!;
const COOKIE_NAME = "uvcat_session";
const ONE_WEEK = 60 * 60 * 24 * 7; // seconds

const isProd = process.env.NODE_ENV === "production";

interface SessionPayload {
  userId: string;
}

// ── Create a signed session cookie header value ──────────────────────────────
// In production (cross-domain Render <-> Vercel) cookies need SameSite=None
// + Secure to be sent on cross-site fetch requests. Locally, Lax works fine
// since localhost:4000 and localhost:5173 are same-site, and Secure would
// block the cookie on plain http://localhost.
export function createSessionCookie(userId: string): string {
  const token = jwt.sign({ userId } satisfies SessionPayload, SESSION_SECRET, {
    expiresIn: ONE_WEEK,
  });

  return serialize(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/",
    maxAge: ONE_WEEK,
  });
}

// ── Verify a session token and return the userId, or undefined ──────────────
function verifySessionToken(token: string | undefined): string | undefined {
  if (!token) return undefined;
  try {
    const payload = jwt.verify(token, SESSION_SECRET) as SessionPayload;
    return payload.userId;
  } catch {
    return undefined;
  }
}

// ── Read and verify the session from a raw Cookie header string ─────────────
// Used in the GraphQL context, where Yoga gives us a Fetch API Headers object.
export function getUserIdFromCookieHeader(
  cookieHeader: string,
): string | undefined {
  if (!cookieHeader) return undefined;
  const cookies = parse(cookieHeader);
  return verifySessionToken(cookies[COOKIE_NAME]);
}

// ── Read and verify the session cookie from a Node IncomingMessage ───────────
// Used in plain HTTP routes (e.g. /auth/github/callback) outside GraphQL.
export function getUserIdFromRequest(req: IncomingMessage): string | undefined {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return undefined;
  const cookies = parse(cookieHeader);
  return verifySessionToken(cookies[COOKIE_NAME]);
}

// ── Build a cookie header that clears the session (for logout) ───────────────
export function clearSessionCookie(): string {
  return serialize(COOKIE_NAME, "", {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/",
    maxAge: 0,
  });
}
