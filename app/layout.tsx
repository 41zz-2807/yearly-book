import type { Metadata } from "next";
import "./globals.css";

/**
 * Metadata root.
 *
 * `template` dipakai supaya judul tiap halaman menjadi
 * "<Judul Bab> · <Nama Aplikasi>". Tanpa template, setiap route yang punya
 * `metadata` sendiri akan menimpa `title` di sini sepenuhnya, sehingga nama
 * aplikasi tidak pernah muncul di tab browser.
 *
 * `NEXT_PUBLIC_APP_NAME` di-inline saat build, jadi mengubahnya memerlukan
 * container di-restart (dev) atau di-rebuild (produksi). Env kosong aman —
 * ada default di bawah, aplikasi tetap jalan tanpa .env sama sekali.
 */
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME?.trim() || "Yearly Book";

export const metadata: Metadata = {
  title: {
    default: APP_NAME,
    template: `%s · ${APP_NAME}`,
  },
  description: "Rencana tahunanmu, satu bab per bulan.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
