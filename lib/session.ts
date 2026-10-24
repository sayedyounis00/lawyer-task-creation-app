import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { Session } from "./types";

const COOKIE = "office_session";

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value) throw new Error("Missing SESSION_SECRET");
  return value;
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

function encode(session: Session) {
  const payload = Buffer.from(JSON.stringify(session), "utf8").toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function decode(token: string): Session | null {
  const dot = token.lastIndexOf(".");
  if (dot < 1) return null;
  const payload = token.slice(0, dot);
  const given = token.slice(dot + 1);
  const expected = sign(payload);
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Session;
    if (!parsed.deviceId || !parsed.officeName) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  return decode(token);
}

export async function setSession(session: Session) {
  (await cookies()).set(COOKIE, encode(session), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
}

export async function clearSession() {
  (await cookies()).delete(COOKIE);
}

export function passwordsMatch(stored: string, given: string) {
  const a = Buffer.from(stored);
  const b = Buffer.from(given);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
