"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/db";
import { HOME_FOR_ROLE, IDENTITY_COOKIE, serialiseIdentity } from "@/lib/session";

/**
 * Switch the demo identity.
 *
 * The role is read from the database, not from the form — the submitted value
 * is only ever a user id, and what that user is allowed to do is never client
 * input.
 */
export async function setIdentity(formData: FormData): Promise<void> {
  const userId = formData.get("userId");
  if (typeof userId !== "string" || userId.length === 0) {
    throw new Error("No user selected.");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, isActive: true },
  });

  if (!user || !user.isActive) {
    throw new Error("That user no longer exists.");
  }

  const jar = await cookies();
  jar.set(IDENTITY_COOKIE.name, serialiseIdentity(user.id), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: IDENTITY_COOKIE.maxAge,
  });

  redirect(HOME_FOR_ROLE[user.role]);
}

/** Clear the identity — useful for demonstrating the signed-out state. */
export async function clearIdentity(): Promise<void> {
  const jar = await cookies();
  jar.delete(IDENTITY_COOKIE.name);
  redirect("/");
}
