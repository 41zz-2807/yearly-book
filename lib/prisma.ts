import { PrismaClient } from "@prisma/client";

/**
 * Prisma Client singleton.
 *
 * Di Next.js dev server modul di-reload setiap kali file berubah. Tanpa
 * singleton, setiap reload membuat instance PrismaClient baru dan koneksi
 * ke SQLite akan menumpuk sampai kehabisan handle.
 *
 * Disimpan di globalThis agar hanya satu instance per proses.
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["warn", "error"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
