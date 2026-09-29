"use client";

/**
 * Pagination halaman Profil Siswa.
 *
 * Di dalam sistem buku ini pagination menjadi state di sisi klien, bukan
 * query param: buku sudah menampilkan seluruh bab sekaligus, sehingga
 * berpindah sub-halaman cukup mengubah state tanpa render server ulang.
 *
 * `onChange` membuat komponen ini bisa dikendalikan dari luar; dipakai oleh
 * bab Profil untuk menyinkronkan ke URL saat berganti.
 */
export function BookPagination({
  currentPage,
  totalPages,
  onChange,
}: {
  currentPage: number;
  totalPages: number;
  onChange?: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const pages = buildPageWindow(currentPage, totalPages);

  const go = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    onChange?.(page);
  };

  return (
    <nav
      aria-label="Navigasi halaman profil"
      className="flex flex-wrap items-center justify-center gap-1.5"
    >
      <PageButton
        onClick={() => go(currentPage - 1)}
        disabled={currentPage === 1}
        label="Halaman sebelumnya"
      >
        <span aria-hidden="true">←</span> Sebelumnya
      </PageButton>

      {pages.map((p, i) =>
        p === null ? (
          <span
            key={`gap-${i}`}
            aria-hidden="true"
            className="px-1 text-ink-400"
          >
            …
          </span>
        ) : (
          <PageButton
            key={p}
            onClick={() => go(p)}
            current={p === currentPage}
            label={`Halaman ${p}`}
          >
            {p}
          </PageButton>
        ),
      )}

      <PageButton
        onClick={() => go(currentPage + 1)}
        disabled={currentPage === totalPages}
        label="Halaman berikutnya"
      >
        Berikutnya <span aria-hidden="true">→</span>
      </PageButton>
    </nav>
  );
}

function PageButton({
  children,
  onClick,
  current = false,
  disabled = false,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  current?: boolean;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-current={current ? "page" : undefined}
      className={[
        "flex h-9 items-center gap-1 rounded-lg px-3 text-sm font-medium transition-colors",
        current
          ? "bg-emerald-600 text-white shadow-[var(--shadow-lift)]"
          : disabled
            ? "cursor-not-allowed text-ink-300"
            : "text-ink-600 hover:bg-emerald-50 hover:text-emerald-800",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

/**
 * Mengembalikan nomor halaman yang perlu ditampilkan, dengan `null` sebagai
 * penanda elipsis. Contoh (total 12, aktif 6): [1, null, 5, 6, 7, null, 12]
 */
function buildPageWindow(current: number, total: number): (number | null)[] {
  const out: (number | null)[] = [];
  const push = (n: number | null) => {
    if (n !== null && !out.includes(n)) out.push(n);
  };

  // 8 halaman profil masih muat nyaman dalam satu baris, jadi semua nomor
  // ditampilkan. Di atas itu baru dipadatkan dengan elipsis.
  if (total <= 9) {
    for (let i = 1; i <= total; i++) push(i);
    return out;
  }

  push(1);
  const from = Math.max(2, current - 1);
  const to = Math.min(total - 1, current + 1);

  if (from > 2) push(null);
  for (let i = from; i <= to; i++) push(i);
  if (to < total - 1) push(null);

  push(total);
  return out;
}
