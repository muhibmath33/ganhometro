"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/app/admin/actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, null);
  return (
    <form action={action} className="mx-auto flex w-full max-w-sm flex-col gap-3 rounded-2xl border border-line bg-white p-6">
      <h1 className="m-0 text-[22px] font-extrabold">Admin sign-in</h1>
      <label htmlFor="admin-password" className="text-[14px] font-bold">
        Password
      </label>
      <input
        id="admin-password"
        name="password"
        type="password"
        required
        autoComplete="current-password"
        className="min-h-12 rounded-[10px] border border-field bg-white px-3.5 text-[16px]"
      />
      <button
        type="submit"
        disabled={pending}
        className="min-h-12 cursor-pointer rounded-[10px] border-0 bg-brand font-sans text-[16px] font-bold text-white disabled:opacity-70"
      >
        {pending ? "Checking…" : "Sign in"}
      </button>
      {state?.error && (
        <p role="alert" className="m-0 text-[14px] font-semibold text-amber-ink">
          {state.error}
        </p>
      )}
    </form>
  );
}
