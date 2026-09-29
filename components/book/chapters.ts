/**
 * Definisi bab buku. Ini adalah SATU-SATUNYA sumber kebenaran untuk:
 *   - urutan bab di dalam buku
 *   - pemetaan URL <-> bab
 *   - label navigasi
 *
 * Modul ini murni data (tanpa import server maupun "use client") sehingga
 * aman dipakai dari server component, client component, maupun helper.
 */

export type Chapter = {
  /** Slug untuk URL. String kosong berarti "/" (cover). */
  slug: string;
  label: string;
  /** Label pendek untuk navigasi sempit. */
  short: string;
  /** Judul untuk <title> halaman. */
  title: string;
  /** Kicker "Bab ..." yang tampil di dalam lembar. */
  kicker: string;
  /** Cover memakai gradasi emerald,bab lain memakai kertas putih. */
  tone: "brand" | "paper";
  /** true bila isinya panjang sehingga tidak dikunci rasio 3:4. */
  flow?: boolean;
};

export const CHAPTERS: Chapter[] = [
  {
    slug: "",
    label: "Cover",
    short: "Cover",
    title: "Buku Annual",
    kicker: "",
    tone: "brand",
  },
  {
    slug: "sambutan",
    label: "Sambutan",
    short: "Sambutan",
    title: "Sambutan",
    kicker: "Bab Dua",
    tone: "paper",
  },
  {
    slug: "profil",
    label: "Profil Siswa",
    short: "Profil",
    title: "Profil Siswa",
    kicker: "Bab Tiga",
    tone: "paper",
    flow: true,
  },
  {
    slug: "siswa",
    label: "Daftar Siswa",
    short: "Daftar",
    title: "Daftar Siswa",
    kicker: "Bab Empat",
    tone: "paper",
    flow: true,
  },
  {
    slug: "kegiatan",
    label: "Kenang Seru",
    short: "Kenang",
    title: "Kenang Seru",
    kicker: "Bab Lima",
    tone: "paper",
    flow: true,
  },
  {
    slug: "wali-kelas",
    label: "Wali Kelas",
    short: "Wali",
    title: "Wali Kelas",
    kicker: "Bab Enam",
    tone: "paper",
    flow: true,
  },
  {
    slug: "prestasi",
    label: "Prestasi",
    short: "Prestasi",
    title: "Prestasi Kelas",
    kicker: "Bab Tujuh",
    tone: "paper",
    flow: true,
  },
  {
    slug: "penutup",
    label: "Penutup",
    short: "Penutup",
    title: "Penutup",
    kicker: "",
    tone: "brand",
  },
];

/** Jumlah siswa per halaman pada bab Profil. */
export const PROFIL_PER_PAGE = 3;

export function chapterIndexBySlug(slug: string): number {
  return CHAPTERS.findIndex((c) => c.slug === slug);
}

export function chapterBySlug(slug: string): Chapter | undefined {
  return CHAPTERS.find((c) => c.slug === slug);
}

/** URL kanonis untuk sebuah bab. Cover -> "/", selain itu -> "/<slug>". */
export function chapterHref(slug: string): string {
  return slug === "" ? "/" : `/${slug}`;
}
