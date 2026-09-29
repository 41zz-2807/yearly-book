import { defineConfig } from "prisma/config";

/**
 * Konfigurasi Prisma CLI.
 *
 * Semula seed command ditulis di `package.json#prisma`. Properti itu
 * DEPRECATED di Prisma 6 dan DIHAPUS di Prisma 7 (menghasilkan warning
 * di setiap `prisma` command), jadi dipindah ke file ini.
 *
 * Kenapa TIDAK ada `import "dotenv/config"` di sini:
 *   1. `dotenv` hanya ada sebagai dependensi transitif Prisma. Memakainya
 *      tanpa mendaftarkannya di package.json rapuh — begitu Prisma menaikkan
 *      atau membuang dependensi itu, migrate/seed langsung rusak.
 *   2. Tidak dibutuhkan. Nilai .env sudah masuk ke environment container
 *      oleh `env_file` di docker-compose.yml, dan itu satu-satunya cara
 *      project ini menjalankan perintah Prisma (Docker-only, lihat AGENTS.md).
 *   3. Memuat .env di sini justru menambah masalah saat build: `next build`
 *      menjalankan `prisma generate` di dalam image tanpa environment
 *      produksi, sehingga pemuatan .env hanya menambah sumber kegagalan
 *      tanpa mengubah apa pun.
 *
 * Yang membaca `DATABASE_URL` adalah `env("DATABASE_URL")` di
 * prisma/schema.prisma, tetap seperti sebelumnya.
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    // Dipakai oleh `npm run db:seed` (= `prisma db seed`).
    seed: "tsx prisma/seed.ts",
  },
});
