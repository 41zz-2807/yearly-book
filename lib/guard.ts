import { auth } from "@/auth";

/**
 * Penjaga autentikasi untuk Server Action.
 *
 * PENTING: `app/admin/layout.tsx` hanya melindungi saat MERENDER HALAMAN.
 * Server Action adalah endpoint POST tersendiri dan TIDAK ikut terlindungi
 * layout. Tanpa penjaga ini, siapa pun yang knowing endpoint-nya bisa
 * Menjalankan create/update/delete tanpa login.
 *
 * Karena itu SETIAP action wajib memanggil requireAdmin() di baris pertama.
 */
export async function requireAdmin() {
  const session = await auth();
  // Cek role, bukan hanya keberadaan sesi. Auth.js sudah menyaring akun yang
  // tidak diizinkan lewat callback `signIn`, jadi secara praktis semua sesi
  // yang lahir adalah admin — tapi "practically" bukan jaminan, dan satu
  // session.user yang lolos tanpa role berarti akses penuh ke data kelas.
  if (!session?.user || session.user.role !== "admin") {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

/** Pesan error yang aman ditampilkan ke user. */
export function publicError(error: unknown): string {
  if (error instanceof Error && error.message === "UNAUTHORIZED") {
    return "Sesi tidak valid. Silakan masuk kembali.";
  }
  if (error instanceof Error) {
    // Hindari membocorkan detail internal ke user.
    console.error("[admin-action]", error);
    return "Terjadi kesalahan. Silakan coba lagi.";
  }
  console.error("[admin-action] unknown error", error);
  return "Terjadi kesalahan. Silakan coba lagi.";
}
