"use client";

import { useState } from "react";
import { BookPagination } from "@/components/book-pagination";
import { StudentCard } from "@/components/student-card";
import { EmptyState } from "@/components/book-frame";
import { PROFIL_PER_PAGE } from "./chapters";
import type {
  BookData,
  KegiatanData,
  PrestasiData,
  WaliData,
} from "./book-data";

/**
 * Isi tiap bab buku.
 *
 * Semua komponen di file ini bersifat presentational: data datang sebagai
 * props dari server (lihat book-data.ts), bukan diambil sendiri. Tidak ada
 * `fetch` ke database, tidak ada Prisma Client yang ikut terkirim ke browser.
 */

type SettingsDataAlias = BookData["setting"];

/* ==========================================================================
   Bab 1 — Cover
   ========================================================================== */
export function CoverContent({ setting }: { setting: SettingsDataAlias }) {
  if (!setting) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-8 text-center">
        <Ornament className="h-16 w-16 text-gold-300" />
        <div className="space-y-2">
          <h1 className="font-serif text-3xl font-semibold text-white sm:text-4xl">
            Buku Annual
          </h1>
          <p className="text-sm text-white/70">
            Sampul belum siap. Isi data kelas terlebih dahulu.
          </p>
        </div>
      </div>
    );
  }

  const tahunMasuk = setting.angkatan;
  const tahunLulus = tahunMasuk + 6;

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-8 py-12 text-center sm:px-12">
      <Ornament className="h-12 w-12 text-gold-300" />

      <div className="space-y-3">
        <p className="text-xs font-semibold tracking-[0.3em] text-gold-300 uppercase">
          Buku Annual
        </p>
        <h1 className="font-serif text-3xl leading-tight font-semibold text-balance text-white sm:text-4xl">
          {setting.namaKelas}
        </h1>
        <GoldRule />
        <p className="text-sm text-white/85 sm:text-base">
          <span className="font-medium">{setting.sekolah}</span>
          <span className="mx-2 text-gold-300">|</span>
          <span>Angkatan {tahunMasuk}</span>
          <span className="mx-2 text-gold-300">
            ({tahunMasuk}/{tahunLulus})
          </span>
        </p>
      </div>

      <figure className="w-full max-w-[15rem]">
        <div className="ds-ornament-frame overflow-hidden rounded-xl bg-ink-950/25 p-1.5">
          {setting.fotoKelas ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={setting.fotoKelas}
              alt={`Foto kelas ${setting.namaKelas}`}
              className="aspect-[4/3] w-full rounded-lg object-cover"
            />
          ) : (
            <div className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-white/25 text-white/45">
              <PhotoGlyph className="h-7 w-7" />
              <span className="text-xs">Foto kelas belum diisi</span>
            </div>
          )}
        </div>
        <figcaption className="mt-2 text-xs text-white/50">
          {setting.namaKelas} · {setting.sekolah}
        </figcaption>
      </figure>

      {setting.sambutan ? (
        <p className="max-w-md text-xs leading-relaxed text-white/65">
          {truncate(setting.sambutan, 150)}
        </p>
      ) : null}
    </div>
  );
}

/* ==========================================================================
   Bab 2 — Sambutan
   ========================================================================== */
export function SambutanContent({
  setting,
  wali,
}: {
  setting: SettingsDataAlias;
  wali: WaliData | undefined;
}) {
  if (!setting?.sambutan) {
    return (
      <div className="flex-1 px-6 py-8 sm:px-10">
        <EmptyState
          title="Sambutan belum diisi"
          hint="Tambahkan teks sambutan pada halaman Pengaturan di area admin."
        />
      </div>
    );
  }

  const tahunLulus = setting.angkatan + 6;

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8 sm:px-10">
      <article className="mx-auto max-w-2xl">
        <Ornament className="mx-auto h-8 w-8 text-gold-500" />

        <div className="mt-4 space-y-3.5 font-serif text-base leading-relaxed text-pretty text-ink-800">
          {paragraphs(setting.sambutan).map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        <GoldRule className="mt-6" />

        <div className="mt-4 text-center">
          <p className="text-[0.65rem] font-semibold tracking-[0.2em] text-emerald-600 uppercase">
            Wali Kelas
          </p>
          {wali ? (
            <>
              <p className="mt-1.5 font-serif text-lg font-semibold text-emerald-900">
                {wali.nama}
              </p>
              <p className="mt-0.5 text-xs text-ink-500">
                {setting.sekolah} · {setting.angkatan}/{tahunLulus}
              </p>
            </>
          ) : (
            <p className="mt-1.5 text-sm text-ink-400 italic">
              Data wali kelas belum diisi.
            </p>
          )}
        </div>
      </article>
    </div>
  );
}

/* ==========================================================================
   Bab 3 — Profil Siswa (3 per halaman, paginasi di sisi klien)
   ========================================================================== */
export function ProfilContent({
  siswa,
  initialPage,
  totalPages,
}: {
  siswa: BookData["siswa"];
  initialPage: number;
  totalPages: number;
}) {
  const [page, setPage] = useState(initialPage);
  const current = Math.min(Math.max(1, page), totalPages);

  const visible = siswa.slice(
    (current - 1) * PROFIL_PER_PAGE,
    current * PROFIL_PER_PAGE,
  );
  const first = (current - 1) * PROFIL_PER_PAGE + 1;
  const last = Math.min(current * PROFIL_PER_PAGE, siswa.length);

  if (siswa.length === 0) {
    return (
      <div className="flex-1 px-6 py-8 sm:px-10">
        <EmptyState
          title="Belum ada data siswa"
          hint="Tambahkan siswa beserta foto, cita-cita, pesan, dan surat untuk masa depan lewat halaman admin."
        />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="grid items-stretch gap-4 md:grid-cols-3">
          {visible.map((s) => (
            <div key={s.id} className="flex">
              <StudentCard siswa={s} compact />
            </div>
          ))}
        </div>

        <p className="mt-4 text-center text-xs text-ink-400">
          Menampilkan {first}–{last} dari {siswa.length} siswa
        </p>

        <div className="mt-2">
          <BookPagination
            currentPage={current}
            totalPages={totalPages}
            onChange={setPage}
          />
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   Bab 4 — Daftar Siswa
   ========================================================================== */
export function SiswaContent({ siswa }: { siswa: BookData["siswa"] }) {
  return (
    <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-10">
      {siswa.length === 0 ? (
        <EmptyState
          title="Belum ada data siswa"
          hint="Tambahkan siswa beserta cita-cita dan pesannya lewat halaman admin."
        />
      ) : (
        <ul className="grid gap-2.5 sm:grid-cols-2">
          {siswa.map((s) => (
            <li
              key={s.id}
              className="flex items-start gap-3 rounded-xl border border-ink-900/8 bg-paper-soft p-3"
            >
              {s.foto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={s.foto}
                  alt={s.nama}
                  className="h-11 w-11 shrink-0 rounded-lg object-cover"
                />
              ) : (
                <div
                  aria-hidden="true"
                  className="ds-pattern-ink flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-xs font-bold text-emerald-700"
                >
                  {initials(s.nama)}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="truncate text-sm font-semibold text-emerald-900">
                    {s.nama}
                  </p>
                  <span className="shrink-0 text-xs text-ink-400 tabular-nums">
                    #{s.urutan}
                  </span>
                </div>
                {s.citaCita ? (
                  <p className="truncate text-xs text-emerald-600">
                    {s.citaCita}
                  </p>
                ) : null}
                {s.pesan ? (
                  <p className="mt-0.5 line-clamp-1 text-xs text-ink-500">
                    “{s.pesan}”
                  </p>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ==========================================================================
   Bab 5 — Kenang Seru
   ========================================================================== */
export function KegiatanContent({ kegiatan }: { kegiatan: KegiatanData[] }) {
  return (
    <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-8">
      {kegiatan.length === 0 ? (
        <EmptyState
          title="Belum ada foto kegiatan"
          hint="Tambahkan foto beserta caption-nya lewat halaman admin."
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {kegiatan.map((f) => (
            <li
              key={f.id}
              className="overflow-hidden rounded-2xl border border-ink-900/10 bg-paper shadow-[var(--shadow-lift)]"
            >
              <div className="ds-pattern-ink relative aspect-[4/3] w-full bg-emerald-50">
                {f.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={f.url}
                    alt={f.caption ?? "Foto kegiatan"}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-2 text-emerald-700/60">
                    <PhotoGlyph className="h-7 w-7" />
                    <span className="text-xs">Foto belum diisi</span>
                  </div>
                )}
                <span className="absolute top-2.5 left-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-gold-400 font-serif text-sm font-bold text-ink-950 tabular-nums">
                  {f.urutan}
                </span>
              </div>

              <div className="flex flex-1 flex-col gap-2 border-t border-ink-900/8 px-4 py-3">
                {f.caption ? (
                  <p className="font-serif text-sm leading-snug text-emerald-900">
                    {f.caption}
                  </p>
                ) : (
                  <p className="text-sm text-ink-400 italic">
                    Tanpa keterangan
                  </p>
                )}
                <span
                  aria-hidden="true"
                  className="mt-auto block h-0.5 w-10 rounded-full bg-gold-400"
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ==========================================================================
   Bab 6 — Wali Kelas
   ========================================================================== */
export function WaliKelasContent({ waliKelas }: { waliKelas: WaliData[] }) {
  return (
    <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-10">
      {waliKelas.length === 0 ? (
        <EmptyState
          title="Belum ada data wali kelas"
          hint="Tambahkan nama dan pesan wali kelas lewat halaman admin."
        />
      ) : (
        <ul className="space-y-4">
          {waliKelas.map((w) => (
            <li
              key={w.id}
              className="flex flex-col items-center gap-4 rounded-2xl border border-ink-900/8 bg-paper-soft p-5 text-center sm:flex-row sm:text-left"
            >
              {w.foto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={w.foto}
                  alt={w.nama}
                  className="h-24 w-24 shrink-0 rounded-full object-cover ring-2 ring-gold-400/40"
                />
              ) : (
                <div
                  aria-hidden="true"
                  className="ds-pattern flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xl font-bold text-white"
                >
                  {initials(w.nama)}
                </div>
              )}

              <div className="min-w-0">
                <p className="text-[0.65rem] font-semibold tracking-[0.2em] text-gold-600 uppercase">
                  Wali Kelas
                </p>
                <p className="mt-1 font-serif text-lg font-semibold text-emerald-900">
                  {w.nama}
                </p>
                {w.pesan ? (
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-600">
                    “{w.pesan}”
                  </p>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ==========================================================================
   Bab 7 — Prestasi Kelas
   ========================================================================== */
export function PrestasiContent({ prestasi }: { prestasi: PrestasiData[] }) {
  return (
    <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-10">
      {prestasi.length === 0 ? (
        <EmptyState
          title="Belum ada data prestasi"
          hint="Tambahkan judul prestasi beserta deskripsinya lewat halaman admin."
        />
      ) : (
        <ol className="space-y-3">
          {prestasi.map((p) => (
            <li
              key={p.id}
              className="relative overflow-hidden rounded-xl border border-ink-900/8 bg-paper-soft p-4 pl-14"
            >
              <span className="absolute top-4 left-4 flex h-8 w-8 items-center justify-center rounded-full bg-gold-400 font-serif text-sm font-bold text-ink-950 tabular-nums">
                {p.urutan}
              </span>

              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-semibold text-emerald-900">{p.judul}</p>
                  {p.deskripsi ? (
                    <p className="mt-1 text-sm leading-relaxed text-ink-600">
                      {p.deskripsi}
                    </p>
                  ) : null}
                </div>
                {p.foto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.foto}
                    alt={p.judul}
                    className="h-14 w-14 shrink-0 rounded-lg object-cover"
                  />
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

/* ==========================================================================
   Bab 8 — Penutup
   ========================================================================== */
export function PenutupContent({ setting }: { setting: SettingsDataAlias }) {
  if (!setting) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
        <p className="font-serif text-2xl text-white">Buku Annual</p>
        <p className="mt-2 text-sm text-white/60">
          Data kelas belum diisi, sehingga penutup belum ditampilkan.
        </p>
      </div>
    );
  }

  const tahunLulus = setting.angkatan + 6;

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-7 px-8 py-12 text-center">
      <Ornament className="h-11 w-11 text-gold-300" />

      {setting.penutup ? (
        <blockquote className="max-w-xl">
          <p className="font-serif text-lg leading-relaxed text-pretty text-white">
            {setting.penutup}
          </p>
        </blockquote>
      ) : (
        <p className="max-w-sm text-sm text-white/60 italic">
          Kalimat penutup belum diisi.
        </p>
      )}

      <div className="flex flex-col items-center gap-2">
        <GoldRule />
        <p className="font-serif text-base font-semibold text-white">
          {setting.namaKelas}
        </p>
        <p className="text-xs text-white/70">
          {setting.sekolah} · {setting.angkatan}/{tahunLulus}
        </p>
      </div>
    </div>
  );
}

/* ==========================================================================
   Elemen dekoratif bersama
   ========================================================================== */

export function Ornament({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
    >
      <path d="M8 8H32V32H8Z" />
      <path d="M32 20L20 32L8 20L20 8Z" />
      <circle cx="20" cy="20" r="3.2" />
    </svg>
  );
}

function PhotoGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 15l4.5-4.5L12 15" />
      <circle cx="9" cy="9.5" r="1.2" />
    </svg>
  );
}

function GoldRule({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={
        className ??
        "mx-auto h-px w-20 bg-gradient-to-r from-transparent via-gold-400 to-transparent"
      }
    />
  );
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function truncate(text: string, max: number) {
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
}

function paragraphs(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}
