import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { compare } from "bcryptjs";

/**
 * Helper: ambil env var wajib dengan pesan error yang jelas.
 *
 * Sengaja HANYA dipanggil di dalam `authorize()`, yaitu saat runtime ketika
 * ada percobaan login — bukan di top-level modul. `next build` meng-import
 * modul route untuk "collect page data", dan pada saat itu environment
 * secret belum tersedia, sehingga pengecekan di top-level akan menggagalkan
 * proses build.
 */
function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(
      `Environment variable ${name} belum di-set. ` +
        `Isi dari .env.example lalu jalankan ulang container.`,
    );
  }
  return value;
}

/**
 * Perbandingan string dengan waktu tetap, supaya tidak bocor lewat timing
 * apakah username itu ada atau tidak (user enumeration).
 */
function safeEqual(a: string, b: string): boolean {
  // Buffer.from + compareSync dari node:crypto would've lebih ideal, tapi
  // perbandingan panjang dilakukan lebih dulu agar tidak melemah.
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * Daftar email yang boleh masuk lewat Google, dibaca dari AUTH_ADMIN_EMAIL.
 *
 * PENTING — kenapa allowlist, bukan "semua akun Google boleh masuk":
 * begitu provider Google aktif, siapa pun yang punya akun Google bisa menyelesaikan
 * alur OAuth di depan aplikasi. Kalau semua Doing dianggap admin, satu klik
 * keliru = /admin terbuka untuk siapa saja, termasuk database siswa dan wali
 * kelas. Jadi hanya email yang benar-benar theirs yang diizinkan.
 *
 * Format: satu atau beberapa email dipisah koma.
 * Perbandingan case-insensitive karena Google tidak menjamin kapitalisasi konsisten.
 */
function adminEmails(): string[] {
  return (process.env.AUTH_ADMIN_EMAIL ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  // `secret` SENGAJA tidak diisi di sini.
  //
  // Auth.js v5 otomatis membaca AUTH_SECRET dari environment. Jika kita
  // menulis `secret: process.env.AUTH_SECRET`, nilainya akan diakses saat
  // modul ini di-import, dan `next build` mengevaluasi modul route untuk
  // "collect page data" — sementara AUTH_SECRET hanya ada di runtime, bukan
  // di build. Akibatnya build produksi gagal dengan
  // "Failed to collect page data for /api/auth/[...nextauth]".
  //
  // Dengan membiarkan Auth.js membacanya sendiri, proses build aman, dan
  // bila AUTH_SECRET lupa diisi saat runtime, Auth.js tetap melempar error
  // MissingSecret yang jelas (bukan diam-diam memakai fallback lemah).
  //
  // Wajib juga: AUTH_TRUST_HOST=true, karena aplikasi berada di belakang
  // reverse proxy (Cloudflare Tunnel), bukan di Vercel.
  trustHost: true,

  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 8, // 8 jam
  },

  pages: {
    signIn: "/login",
  },

  providers: [
    Credentials({
      name: "Admin",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const username = credentials?.username;
        const password = credentials?.password;

        if (typeof username !== "string" || typeof password !== "string") {
          return null;
        }

        const expectedUser = requiredEnv("AUTH_ADMIN_USERNAME");
        // Hash disimpan dalam bentuk base64. Alasannya ada di .env.example:
        // bcrypt selalu mengandung '$', sedangkan Docker Compose meng-interpolasi
        // '$' pada env_file sementara Next.js membacanya apa adanya. Encode
        // base64 membuat satu nilai .env bisa dipakai keduanya tanpa konflik.
        const expectedHash = Buffer.from(
          requiredEnv("AUTH_ADMIN_PASSWORD_HASH_B64"),
          "base64",
        ).toString("utf8");

        // Tetap jalankan perbandingan password walau username salah, agar
        // waktu responsnya konsisten (mitigasi user enumeration).
        const userOk = safeEqual(username, expectedUser);
        const passOk = await compare(password, expectedHash);

        if (!userOk || !passOk) {
          return null;
        }

        return {
          id: "admin",
          name: expectedUser,
          role: "admin",
        };
      },
    }),

    // Provider Google SENGAJA ditulis tanpa argumen.
    //
    // Auth.js v5 membaca credential OAuth langsung dari environment dengan
    // pola AUTH_<PROVIDER>_ID / AUTH_<PROVIDER>_SECRET, jadi yang dibutuhkan
    // hanya AUTH_GOOGLE_ID dan AUTH_GOOGLE_SECRET di .env.
    //
    // Jangan isi clientId/secret secara literal di sini: nilai itu akan ikut
    // ter-inline ke build produksi. Selain itu, provider yang dikonfigurasi
    // lewat argumen akan membaca process.env saat modul ini di-import, dan
    // `next build` meng-import modul route untuk "collect page data" —
    // pola yang sama yang membuat build gagal bila `secret:` diisi di atas.
    Google,
  ],

  callbacks: {
    // Gerbang masuk. Dijalankan SETIAP kali sebuah sesi baru dibuat, jadi ini
    // satu-satunya tempat yang benar untuk menolak akun yang tidak diizinkan.
    //
    // Menolak di sini (bukan memvalidasi ulang di tiap request) cukup karena
    // JWT yang sudah terbit tidak pernah melewati signIn lagi — dan role
    // hanya diberikan kepada sesi yang sudah lolos gerbang ini.
    signIn({ user, account }) {
      // Credentials sudah divalidasi penuh di authorize() (password bcrypt).
      if (account?.provider === "credentials") return true;

      const allowed = adminEmails();
      const email = (user.email ?? "").trim().toLowerCase();

      // Daftar kosong berarti fitur belum dikonfigurasi — tolak, jangan lolos.
      if (allowed.length === 0) {
        console.warn(
          "[auth] Login Google ditolak: AUTH_ADMIN_EMAIL belum diisi di .env.",
        );
        return false;
      }

      if (!email || !allowed.includes(email)) {
        console.warn(`[auth] Login Google ditolak untuk email: ${email || "(kosong)"}`);
        return false;
      }
      return true;
    },

    // Batasi isi token JWT. Jangan pernah menaruh field sensitif di sini.
    jwt({ token, user }) {
      if (user) {
        // Hanya sesi yang sudah lolos `signIn` yang punya `user` di sini, jadi
        // tanpa cabang per-provider pun hasilnya selalu admin. Ditulis eksplisit
        // agar tidak ikut berubah bila Credentials nanti mengembalikan role lain.
        token.role = user.role ?? "admin";
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.role = token.role;
      }
      return session;
    },
  },
});
