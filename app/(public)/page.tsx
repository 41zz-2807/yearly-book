import type { Metadata } from "next";

import { getBookData } from "@/components/book/book-data";
import { BookView } from "@/components/book/book-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  // "Buku Annual" di sini adalah jenis buku, bukan nama aplikasi — nama
  // aplikasi disisipkan oleh `title.template` di app/layout.tsx.
  title: "Buku Annual",
  description: "Rencana tahunanmu, satu bab per bulan.",
};

/**
 * Cover sekaligus pintu masuk buku. Bab lainnya punya URL sendiri
 * (/sambutan, /profil, dst) yang dilayani route [page] — keduanya membuka
 * buku yang sama, jadi mengetik URL bab secara langsung tetap benar.
 */
export default async function CoverRoute() {
  const data = await getBookData(1);
  return <BookView data={data} initialIndex={0} />;
}
