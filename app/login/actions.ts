"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";

export type LoginState = {
  error?: string;
};

/**
 * Cegah open redirect: hanya izinkan path internal yang relatif.
 * Menolak "//evil.com" (protocol-relative) dan URL absolut.
 */
function safeCallback(value: FormDataEntryValue | null): string {
  if (typeof value !== "string" || value === "") return "/admin";
  if (!value.startsWith("/")) return "/admin";
  if (value.startsWith("//")) return "/admin";
  return value;
}

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  try {
    await signIn("credentials", {
      username: formData.get("username"),
      password: formData.get("password"),
      redirectTo: safeCallback(formData.get("callbackUrl")),
    });
  } catch (error) {
    // AuthError = kredensial salah / provider menolak.
    // Pesan sengaja dibuat generik agar tidak memberi informasi
    // apakah username itu ada atau tidak.
    if (error instanceof AuthError) {
      return { error: "Username atau password salah." };
    }
    // error lain (mis. redirect dari Auth.js) harus diteruskan.
    throw error;
  }

  // Tidak akan tercapai: signIn selalu redirect atau melempar error.
  return { error: "Gagal masuk." };
}

/**
 * Masuk lewat Google.
 *
 * ACTIONNYA SENGAJA KOSONG. Auth.js yang mengarahkan user ke consent screen
 * Google, lalu callback provider menentukan lolos atau tidaknya allowlist
 * (lihat callback `signIn` di auth.ts). Jadi di sini tidak ada yang perlu
 * diperiksa — tidak ada password, tidak ada email yang dipercaya dari input.
 */
export async function googleSignInAction(formData: FormData) {
  await signIn("google", {
    redirectTo: safeCallback(formData.get("callbackUrl")),
  });
}
