import { createHmac, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";

import { prisma } from "@/lib/db";
import type { Role } from "@/generated/prisma/enums";

/**
 * Simulated authentication, real authorisation.
 *
 * The brief rules out a real identity provider, so the cookie is set by a demo
 * switcher rather than a login. What is NOT simulated is the authorisation
 * seam: the cookie carries a user id and nothing else, and role and clientId
 * are looked up from the database on every read.
 *
 * That distinction is the whole point. If the cookie carried the role, anyone
 * could edit it and become an ADMIN; if it carried clientId, anyone could read
 * another advertiser's contracts and proof photos. Because both are looked up
 * server-side, swapping a real IdP in later is a login route, not a refactor —
 * every call site already asks the database who this person is.
 *
 * Identity is NEVER read from React state or a prop. Server actions and server
 * components call getSession() themselves.
 */

const COOKIE_NAME = "im_identity";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export type Session = {
  user: { id: string; name: string; email: string };
  role: Role;
  /** Set for CLIENT users only. The tenancy boundary for the portal. */
  clientId: string | null;
  clientName: string | null;
};

/** Where each role lands after switching identity. */
export const HOME_FOR_ROLE: Record<Role, string> = {
  ADMIN: "/management",
  FITTER: "/field",
  CLIENT: "/portal",
};

function secret(): string {
  const value = process.env.SESSION_SECRET;
  if (!value) {
    throw new Error(
      "SESSION_SECRET is not set. Generate one with `node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"` and add it to .env.local.",
    );
  }
  return value;
}

function signature(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

/**
 * `<payload>.<hmac>`. Signing stops the cookie being edited to another user id;
 * it is not encryption, and does not need to be — a user id is not a secret,
 * and everything that matters is re-read from the database anyway.
 */
export function serialiseIdentity(userId: string): string {
  const payload = Buffer.from(userId, "utf8").toString("base64url");
  return `${payload}.${signature(payload)}`;
}

export function parseIdentity(cookieValue: string): string | null {
  const separator = cookieValue.lastIndexOf(".");
  if (separator <= 0) return null;

  const payload = cookieValue.slice(0, separator);
  const provided = cookieValue.slice(separator + 1);
  const expected = signature(payload);

  // Constant-time compare: a length check first, because timingSafeEqual
  // throws on mismatched lengths rather than returning false.
  const providedBytes = Buffer.from(provided, "utf8");
  const expectedBytes = Buffer.from(expected, "utf8");
  if (providedBytes.length !== expectedBytes.length) return null;
  if (!timingSafeEqual(providedBytes, expectedBytes)) return null;

  return Buffer.from(payload, "base64url").toString("utf8");
}

export const IDENTITY_COOKIE = {
  name: COOKIE_NAME,
  maxAge: COOKIE_MAX_AGE_SECONDS,
} as const;

/**
 * The signed-in identity, or null. Server-only: it reads the cookie jar and
 * hits the database, so it can never run in a client component.
 */
export async function getSession(): Promise<Session | null> {
  const jar = await cookies();
  const raw = jar.get(COOKIE_NAME)?.value;
  if (!raw) return null;

  const userId = parseIdentity(raw);
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      clientId: true,
      client: { select: { name: true } },
    },
  });

  // A deleted or deactivated user with a still-valid cookie is not a session.
  if (!user || !user.isActive) return null;

  return {
    user: { id: user.id, name: user.name, email: user.email },
    role: user.role,
    clientId: user.clientId,
    clientName: user.client?.name ?? null,
  };
}

export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) {
    throw new Error("No identity selected. Pick a user in the demo switcher.");
  }
  return session;
}

/**
 * Guard for server actions. Every mutation calls this before it touches
 * anything — the check lives with the write, not with the button that
 * triggered it.
 */
export async function requireRole(role: Role): Promise<Session> {
  const session = await requireSession();
  if (session.role !== role) {
    throw new Error(
      `This action requires the ${role} role; the current identity is ${session.role}.`,
    );
  }
  return session;
}

/**
 * A CLIENT session together with its tenancy boundary. Every client-scoped
 * query carries the returned clientId in its `where`.
 */
export async function requireClient(): Promise<Session & { clientId: string }> {
  const session = await requireRole("CLIENT");
  if (!session.clientId) {
    throw new Error(`Client user ${session.user.id} has no clientId.`);
  }
  return { ...session, clientId: session.clientId };
}
