import { prisma } from "@/lib/prisma";
import { PROFIL_PER_PAGE } from "@/components/book/chapters";

/**
 * Ambil seluruh data yang dibutuhkan buku dalam satu kali render.
 *
 * Semua query dijalankan paralel (Promise.all) supaya halaman buku hanya
 * butuh satu round-trip ke database, bukan satu per bab.
 *
 * Hanya kolom yang benar-benar dipakai bab terkait yang diambil, supaya
 * payload yang dikirim ke browser tidak membengkak.
 */

export type SettingData = {
  namaKelas: string;
  sekolah: string;
  angkatan: number;
  tahun: number;
  sambutan: string;
  penutup: string;
  fotoKelas: string | null;
};

export type SiswaData = {
  id: number;
  nama: string;
  citaCita: string | null;
  pesan: string | null;
  suratMasaDepan: string | null;
  foto: string | null;
  urutan: number;
};

export type KegiatanData = {
  id: number;
  url: string | null;
  caption: string | null;
  urutan: number;
};

export type WaliData = {
  id: number;
  nama: string;
  foto: string | null;
  pesan: string | null;
};

export type PrestasiData = {
  id: number;
  judul: string;
  deskripsi: string | null;
  foto: string | null;
  urutan: number;
};

export type BookData = {
  setting: SettingData | null;
  /** Untuk daftar siswa: seluruh siswa, urutan menaik. */
  siswa: SiswaData[];
  /** Untuk bab profil: halaman awal. */
  profilAwal: number;
  profilTotalHalaman: number;
  kegiatan: KegiatanData[];
  waliKelas: WaliData[];
  prestasi: PrestasiData[];
};

export async function getBookData(profilAwal = 1): Promise<BookData> {
  const settingSelect = {
    namaKelas: true,
    sekolah: true,
    angkatan: true,
    tahun: true,
    sambutan: true,
    penutup: true,
    fotoKelas: true,
  } as const;

  const siswaSelect = {
    id: true,
    nama: true,
    citaCita: true,
    pesan: true,
    suratMasaDepan: true,
    foto: true,
    urutan: true,
  } as const;

  const [setting, totalSiswa, siswa, kegiatan, waliKelas, prestasi] =
    await Promise.all([
      prisma.setting.findFirst({ select: settingSelect }),
      prisma.siswa.count(),
      prisma.siswa.findMany({ orderBy: { urutan: "asc" }, select: siswaSelect }),
      prisma.fotoKegiatan.findMany({
        orderBy: { urutan: "asc" },
        select: { id: true, url: true, caption: true, urutan: true },
      }),
      prisma.waliKelas.findMany({
        orderBy: { id: "asc" },
        select: { id: true, nama: true, foto: true, pesan: true },
      }),
      prisma.prestasi.findMany({
        orderBy: { urutan: "asc" },
        select: { id: true, judul: true, deskripsi: true, foto: true, urutan: true },
      }),
    ]);

  return {
    setting,
    siswa,
    profilAwal: clamp(profilAwal, 1, Math.max(1, Math.ceil(totalSiswa / PROFIL_PER_PAGE))),
    profilTotalHalaman: Math.max(1, Math.ceil(totalSiswa / PROFIL_PER_PAGE)),
    kegiatan,
    waliKelas,
    prestasi,
  };
}

function clamp(n: number, min: number, max: number) {
  if (!Number.isFinite(n)) return min;
  return Math.min(Math.max(min, Math.trunc(n)), max);
}
