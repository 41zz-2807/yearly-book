"use client";

import type { Chapter } from "@/components/book/chapters";

/** Path route export, relatif terhadap origin aplikasi. */
const EXPORT_PATH = "/api/export";

/**
 * Navigasi antar bab buku.
 *
 * Tautannya adalah <a href> sungguhan, sehingga:
 *   - bisa di-klik kanan / dibuka di tab baru
 *   - bisa di-bookmark dan dibagikan
 *   - tetap berfungsi walaupun JS gagal dimuat
 *
 * SETIAP tautan dicegat dengan preventDefault lalu ditangani sebagai
 * perpindahan di dalam buku. Alasannya navigasi lewat client-side routing akan
 * menukar DOM di tengah animasi pembalikan, sehingga React dan animasi
 * berebut atas simpul yang sama.(cmd/ctrl/click tengah tetap diteruskan ke
 * browser, jadi "buka di tab baru" tidak ikut dicegat.)
 *
 * Tautannya tetap <a href> sungguhan, sehingga bookmark, tombol kanan, dan
 * "buka di tab baru" tetap bekerja, dan memuat ulang penuh selalu aman karena
 * DOM-nya dibangun dari nol.
 *
 * Terima `onSelect` dan `onHref` dari BookView supaya tidak mengimpor state
 * buku di modul ini.
 */
export function BookNav({
  chapters,
  current,
  onSelect,
  onHref,
}: {
  chapters: readonly Chapter[];
  current: number;
  onSelect: (index: number) => void;
  onHref: (index: number) => string;
}) {
  return (
    <nav
      aria-label="Navigasi buku"
      className="sticky bottom-0 z-20 shrink-0 border-t border-ink-900/20 bg-ink-950/92 backdrop-blur"
    >
      <div className="mx-auto flex max-w-4xl items-center gap-1.5 overflow-x-auto px-3 py-2.5 sm:px-5">
        <FlipButton
          disabled={current === 0}
          onClick={() => onSelect(current - 1)}
          label="Bab sebelumnya"
        >
          <span aria-hidden="true">←</span>
        </FlipButton>

        {/* Daftar bab harus bisa menyusut, bukan menimpa tombol prev/next.
            Ditemukan lewat pengujian: dengan 8 bab pada lebar 1440px, <ol>
            meluber ke kiri dan menutupi tombol "Bab sebelumnya" sehingga
            kliknya tertangkap <span> angka bab, bukan tombolnya.
            `min-w-0` + `overflow-x-auto` membuat daftar menyusut lalu
            menggulir; `w-max` + `mx-auto` tetap memusatkannya saat muat. */}
        <div className="min-w-0 flex-1 overflow-x-auto">
          <ol className="mx-auto flex w-max items-center justify-center gap-1">
          {chapters.map((chapter, i) => {
            const active = i === current;
            return (
              <li key={chapter.slug || "cover"} className="shrink-0">
                <a
                  href={onHref(i)}
                  onClick={(e) => {
                    // Selalu ditangani di dalam buku; biarkan
                    // cmd/ctrl/click tengah agar tetap membuka tab baru.
                    if (
                      e.metaKey ||
                      e.ctrlKey ||
                      e.shiftKey ||
                      e.altKey ||
                      e.button !== 0
                    ) {
                      return;
                    }
                    e.preventDefault();
                    onSelect(i);
                  }}
                  aria-current={active ? "page" : undefined}
                  className={[
                    "flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium transition-colors sm:text-sm",
                    active
                      ? "bg-emerald-600 text-white shadow-[var(--shadow-lift)]"
                      : "text-ink-300 hover:bg-ink-900 hover:text-white",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full text-[0.6rem] font-bold tabular-nums",
                      active
                        ? "bg-gold-400 text-ink-950"
                        : "bg-ink-800 text-ink-300",
                    ].join(" ")}
                  >
                    {i + 1}
                  </span>
                  <span className="hidden sm:inline">{chapter.label}</span>
                  <span className="sm:hidden">{chapter.short}</span>
                </a>
              </li>
            );
          })}
          </ol>
        </div>

        <FlipButton
          disabled={current === chapters.length - 1}
          onClick={() => onSelect(current + 1)}
          label="Bab berikutnya"
        >
          <span aria-hidden="true">→</span>
        </FlipButton>
      </div>

      <div className="border-t border-ink-900/15 px-3 py-2 sm:px-5">
        <ExportButton />
      </div>
    </nav>
  );
}

/**
 * Unduh buku annual sebagai PDF.
 *
 * `href` menunjuk route export milik aplikasi sendiri, jadi tidak ada URL
 * yang ditulis manual di sini. `download` membuat browser menyimpan berkas
 * alih-alih menampilkannya. Route tersebut mengembalikan
 * `content-disposition: attachment`, jadi nama berkas tetap ditentukan server
 * dari nama kelas di database.
 */
function ExportButton() {
  return (
    <a
      href={EXPORT_PATH}
      download
      className="mx-auto flex w-fit items-center gap-2 rounded-full border border-ink-700 px-3.5 py-1.5 text-xs font-medium text-ink-200 transition-colors hover:border-gold-400 hover:text-white"
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-3.5 w-3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 3v12" />
        <path d="M7 11l5 5 5-5" />
        <path d="M4 20h16" />
      </svg>
      Unduh PDF (A4)
    </a>
  );
}

function FlipButton({
  disabled,
  onClick,
  label,
  children,
}: {
  disabled: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={[
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm transition-colors",
        disabled
          ? "cursor-not-allowed text-ink-700"
          : "text-ink-300 hover:bg-ink-900 hover:text-white",
      ].join(" ")}
    >
      {children}
    </button>
  );
}
