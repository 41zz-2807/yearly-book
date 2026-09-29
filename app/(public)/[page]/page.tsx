import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { getBookData } from "@/components/book/book-data";
import { BookView } from "@/components/book/book-view";
import { chapterBySlug, chapterIndexBySlug } from "@/components/book/chapters";

export const dynamic = "force-dynamic";

type Params = Promise<{ page: string }>;
type SearchParams = Promise<{ page?: string | string[] }>;

/**
 * Satu route untuk seluruh bab selain cover.
 *
 * MENJAGA semua URL lama tetap hidup: /sambutan, /profil, /siswa,
 * /kegiatan, /wali-kelas, /prestasi, /penutup semuanya dilayani route ini dan
 * membuka buku langsung di bab yang sesuai — bukan redirect, sehingga bookmark
 * dan tautan yang sudah dibagikan tidak putus.
 */
export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { page } = await params;
  const chapter = chapterBySlug(page);
  if (!chapter) return { title: "Halaman tidak ditemukan" };

  return {
    // Cukup nama bab saja. `title.template` di app/layout.tsx yang
    // menempelkan nama aplikasi — kalau nama aplikasi ikut ditulis di sini,
    // hasilnya dobel ("Sambutan · Buku Annual · yearly-book").
    title: chapter.title,
    description: `Bab ${chapter.title} buku annual yearly-book.`,
  };
}

export default async function ChapterRoute({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { page } = await params;
  const index = chapterIndexBySlug(page);

  // Slug yang bukan salah satu bab → 404 yang jujur.
  if (index < 0) notFound();

  // `?page=` hanya berarti sub-pagination, dan hanya berlaku untuk bab profil.
  const query = await searchParams;
  const raw = Array.isArray(query.page) ? query.page[0] : query.page;
  const profilAwal = page === "profil" ? Number(raw) : 1;

  const data = await getBookData(
    Number.isFinite(profilAwal) ? profilAwal : 1,
  );

  return <BookView data={data} initialIndex={index} />;
}
