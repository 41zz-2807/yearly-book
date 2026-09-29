"use client";

import { useActionState } from "react";
import {
  googleSignInAction,
  loginAction,
  type LoginState,
} from "@/app/login/actions";

const initialState: LoginState = {};

export function LoginForm({
  callbackUrl,
  googleEnabled,
}: {
  callbackUrl: string;
  googleEnabled: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    loginAction,
    initialState,
  );

  return (
    <>
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="callbackUrl" value={callbackUrl} />

        <div className="space-y-1.5">
          <label htmlFor="username" className="block text-sm text-ink-300">
            Username
          </label>
          <input
            id="username"
            name="username"
            type="text"
            required
            autoComplete="username"
            autoFocus={!googleEnabled}
            className="ds-input"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className="block text-sm text-ink-300">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="ds-input"
          />
        </div>

        {state.error ? (
          <p role="alert" className="ds-alert ds-alert-error">
            {state.error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="ds-btn-brand w-full"
        >
          {pending ? "Memproses..." : "Masuk"}
        </button>
      </form>

      {googleEnabled ? (
        <>
          <div className="my-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-ink-700" />
            <span className="text-xs text-ink-400">atau</span>
            <span className="h-px flex-1 bg-ink-700" />
          </div>

          {/* Form terpisah, bukan nested: HTML tidak mengizinkan form di dalam
              form, dan server action Google tidak butuh state form password. */}
          <form action={googleSignInAction}>
            <input type="hidden" name="callbackUrl" value={callbackUrl} />
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-3 rounded-[var(--radius-card)] border border-ink-700 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-ink-800"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-5 w-5"
              >
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.7v3h3.9c2.3-2.1 3.5-5.2 3.5-8.9Z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.4 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24Z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.3a12 12 0 0 0 0 10.8l4-3.1Z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.8c1.8 0 3.4.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.9 3.6-5 6.7-5Z"
                />
              </svg>
              Masuk dengan Google
            </button>
          </form>
        </>
      ) : null}
    </>
  );
}
