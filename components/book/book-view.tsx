"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";

import { BookSheet, SheetHeader } from "@/components/book-frame";
import { BookNav } from "@/components/book-nav";
import { CHAPTERS, chapterHref, type Chapter } from "./chapters";
import {
  CoverContent,
  SambutanContent,
  ProfilContent,
  SiswaContent,
  KegiatanContent,
  WaliKelasContent,
  PrestasiContent,
  PenutupContent,
} from "./chapter-contents";
import type { BookData } from "./book-data";

/**
 * ==========================================================================
 *  BookView — buku satu halaman, dibalik seperti buku sungguhan
 * ==========================================================================
 *
 *  SATU cara berpindah halaman untuk SEMUA ukuran layar.
 *
 *  Kenapa `react-pageflip` dibuang (2026-09-28): diuji langsung di browser,
 *  mode portrait-nya menghasilkan `transform: matrix(1,0,0,1,0,0)` — identitas,
 *  tanpa rotasi — di 21 dari 21 sampel selama 900 ms setelah tombol ditekan.
 * Yang terlihat hanya pergantian mendadak plus bayangan. Ditambah 7 keanehan
 * library 2.0.3 yang harus diakali (lihat catatan di AGENTS.md), termasuk
 * `updateFromHtml()` yang mengembalikan buku ke posisi awal saat children
 * berubah. Librarynya jadi lebih banyak kode tanpa menghasilkan animasi.
 *
 *  Pembalikan sekarang digambar sendiri dengan CSS 3D (lihat `.ds-book-*` di
 *  app/globals.css):
 *   - Semua bab ter-mount sepanjang waktu, ditumpuk dengan `absolute inset-0`.
 *     Yang tidak aktif memakai `visibility: hidden`, BUKAN di-unmount, supaya
 *     state di dalam bab (halaman Profil) tetap bertahan saat pindah bab.
 *   - Pindah bab = state `turn` berisi arah + bab asal. Lembar asal diberi
 *     kelas `.ds-book-turning` (z-index di atas) dan animasi rotateY; lembar
 *     tujuan sudah tampil di bawahnya sejak awal, jadi terlihat "terungkap".
 *   - `onAnimationEnd` membersihkan `turn`. Ada juga pengaman berbasis
 *     setTimeout, karena `animationend` tidak pernah datang kalau animasi
 *     dimatikan (prefers-reduced-motion) atau tab sedang tidak terlihat.
 *
 *  Maju & mundur memakai animasi yang sama, hanya diputar terbalik — persis
 *  seperti mengembalikan lembar ke tempatnya, bukan gerakan yang berbeda.
 *
 *  Tautan tetap `<a href>` sungguhan (bookmark, tab baru, hard refresh tetap
 *  jalan), tapi klik biasa dicegat `preventDefault` supaya perpindahan
 *  ditangani di dalam buku dan tidak memicu router Next yang akan menukar
 *  DOM di tengah animasi.
 */

/** Lama satu pembalikan halaman (ms). Harus sinkron dengan --book-turn-ms. */
const TURN_MS = 720;

type Turn = { dir: 1 | -1; from: number };

export function BookView({
  data,
  initialIndex,
}: {
  data: BookData;
  initialIndex: number;
}) {
  const [index, setIndex] = useState(initialIndex);
  const [turn, setTurn] = useState<Turn | null>(null);

  /** Mencegah klik bertumpuk menumpuk animasi di atas animasi. */
  const animatingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const chapter = CHAPTERS[index] ?? CHAPTERS[0];

  const clearTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  /** Selesaikan pembalikan: lepas kelas animasi, buka kunci klik. */
  const finishTurn = useCallback(() => {
    clearTimer();
    animatingRef.current = false;
    setTurn(null);
  }, [clearTimer]);

  const goTo = useCallback(
    (next: number) => {
      const target = Math.min(Math.max(0, next), CHAPTERS.length - 1);
      if (target === index || animatingRef.current) return;

      animatingRef.current = true;
      setTurn({ dir: target > index ? 1 : -1, from: index });
      // Lembar tujuan langsung tampil di bawah lembar yang berputar.
      setIndex(target);

      // Jaring pengaman: `animationend` adalah sumber utama, ini hanya
      // cadangan. Tanpa ini, satu `prefers-reduced-motion: reduce` akan
      // membuat buku terkunci selamanya.
      clearTimer();
      timerRef.current = setTimeout(finishTurn, TURN_MS + 120);
    },
    [clearTimer, finishTurn, index],
  );

  useEffect(() => clearTimer, [clearTimer]);

  /** Gandar: Sheet yang sedang dibalik, atau null bila tidak ada. */
  const turning = turn ? turn.from : null;

  /* ---------------------------------------------------------------------
   * Sinkronkan posisi bab ke URL dengan replaceState (bukan pushState):
   * membuka 8 entri history kalau tiap klik menambah satu, dan tombol
   * "back" browser jadi tidak bisa keluar dari buku.
   * ------------------------------------------------------------------- */
  useEffect(() => {
    const target = chapterHref(chapter.slug);
    if (window.location.pathname === target) return;

    const url = new URL(window.location.href);
    url.pathname = target;
    // ?page= hanya berlaku untuk bab profil, buang saat pindah ke bab lain.
    if (chapter.slug !== "profil") url.searchParams.delete("page");
    window.history.replaceState(null, "", url);
  }, [chapter.slug]);

  return (
    <div data-book-root="" className="flex h-dvh flex-col overflow-hidden">
      <main
        data-book-page=""
        className="ds-book-stage flex min-h-0 flex-1 items-center justify-center px-4 py-5 sm:px-6"
        style={{ "--book-turn-ms": `${TURN_MS}ms` } as React.CSSProperties}
      >
        <div className="ds-book-frame">
          {CHAPTERS.map((c, i) => {
            const isCurrent = i === index;
            const isTurning = i === turning;

            return (
              <BookSheet
                key={c.slug || "cover"}
                index={i}
                tone={c.tone}
                className={[
                  "ds-book-leaf rounded-[var(--radius-sheet)] shadow-[var(--shadow-sheet)]",
                  // Lembar yang tidak aktif disembunyikan, TIDAK di-unmount:
                  // state paginasi Profil harus bertahan lintas perpindahan.
                  isCurrent || isTurning ? "visible" : "invisible",
                  isTurning
                    ? turn!.dir === 1
                      ? "ds-book-turning ds-book-turn-next"
                      : "ds-book-turning ds-book-turn-prev"
                    : "",
                ].join(" ")}
                onAnimationEnd={isTurning ? finishTurn : undefined}
              >
                <ChapterBody chapter={c} data={data} />
              </BookSheet>
            );
          })}

          {/* Bayangan yang terpampang di lembar tujuan selama pembalikan. */}
          <div
            aria-hidden="true"
            className={[
              "ds-book-cast absolute inset-0 rounded-[var(--radius-sheet)]",
              turn ? (turn.dir === 1 ? "ds-book-cast-next" : "ds-book-cast-prev") : "",
            ].join(" ")}
          />
        </div>
      </main>

      <BookNav
        chapters={CHAPTERS}
        current={index}
        onSelect={goTo}
        onHref={(i) => chapterHref(CHAPTERS[i].slug)}
      />
    </div>
  );
}

/* ==========================================================================
 * Isi bab
 * ========================================================================== */
const ChapterBody = memo(function ChapterBody({
  chapter,
  data,
}: {
  chapter: Chapter;
  data: BookData;
}) {
  const slug = chapter.slug;
  const wali = data.waliKelas[0];

  if (slug === "") return <CoverContent setting={data.setting} />;

  const header = (description?: string) => (
    <SheetHeader
      kicker={chapter.kicker}
      title={chapter.title}
      description={description}
    />
  );

  switch (slug) {
    case "sambutan":
      return (
        <>
          {header(
            data.setting
              ? `${data.setting.sekolah} · ${data.setting.namaKelas}`
              : undefined,
          )}
          <SambutanContent setting={data.setting} wali={wali} />
        </>
      );

    case "profil":
      return (
        <>
          {header(
            data.siswa.length > 0
              ? `${data.siswa.length} siswa`
              : "Belum ada siswa",
          )}
          <ProfilContent
            siswa={data.siswa}
            initialPage={data.profilAwal}
            totalPages={data.profilTotalHalaman}
          />
        </>
      );

    case "siswa":
      return (
        <>
          {header(
            data.setting
              ? `${data.setting.namaKelas} · ${data.siswa.length} siswa`
              : `${data.siswa.length} siswa`,
          )}
          <SiswaContent siswa={data.siswa} />
        </>
      );

    case "kegiatan":
      return (
        <>
          {header(
            data.kegiatan.length > 0
              ? `${data.kegiatan.length} kenangan dari sepanjang tahun`
              : "Belum ada kenangan",
          )}
          <KegiatanContent kegiatan={data.kegiatan} />
        </>
      );

    case "wali-kelas":
      return (
        <>
          {header("Pembimbing yang menemani sepanjang tahun")}
          <WaliKelasContent waliKelas={data.waliKelas} />
        </>
      );

    case "prestasi":
      return (
        <>
          {header(
            data.prestasi.length > 0
              ? `${data.prestasi.length} prestasi kelas`
              : "Belum ada prestasi",
          )}
          <PrestasiContent prestasi={data.prestasi} />
        </>
      );

    case "penutup":
      return <PenutupContent setting={data.setting} />;

    default:
      return null;
  }
});
