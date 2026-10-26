"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, createSessionToken, passwordMatches, SESSION_MAX_AGE } from "@/lib/admin/session";

export type LoginState = { error: string } | null;

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  if (!passwordMatches(String(formData.get("password") ?? ""))) {
    await new Promise((resolve) => setTimeout(resolve, 800)); // slows down password guessing
    return { error: "Wrong password." };
  }
  (await cookies()).set(ADMIN_COOKIE, createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/admin",
    maxAge: SESSION_MAX_AGE,
  });
  redirect("/admin");
}

export async function logout() {
  (await cookies()).delete({ name: ADMIN_COOKIE, path: "/admin" });
  redirect("/admin");
}
