import { type ReactNode } from "react";

/**
 * ==========================================================================
 *  book-frame — primitif tampilan lembar buku
 * ==========================================================================
 *  Lembar adalah lapisan yang ditumpuk: pemanggil yang menentukan
 *  posisinya (`.ds-book-leaf` = `absolute inset-0` atau `relative` untuk
 *  pratinjau). Karena itu `position` SENGAJA tidak dipaksa di sini — kalau
 *  dipaksa `relative`, utility `absolute` dari pemanggil kalah dan lembar
 *  tidak akan pernah bisa bertumpuk.
 *
 *  Atribut yang dipertahankan: `data-book-sheet` / `data-book-index` dan
 *  custom property `--book-page-index`, dipakai untuk pengujian browser.
 *
 *  Border emas tipis dipakai pada lembar bertone brand (cover & penutup)
 *  agar tetap terbaca sebagai "halaman buku" meski tanpa bayangan halaman.
 *
 *  CATATAN: `BookSheet` dulu memakai `forwardRef` karena react-pageflip
 *  melakukan `cloneElement(child, { ref })` pada setiap anak. Library itu
 *  sudah dibuang (tidak pernah menghasilkan rotasi yang nyata), jadi
 *  `forwardRef` tidak lagi perlu dan tidak boleh ditambahkan kembali.
 */

export function BookSheet({
  index,
  tone = "paper",
  children,
  className = "",
  onAnimationEnd,
}: {
  index: number;
  tone?: "paper" | "brand";
  children: ReactNode;
  className?: string;
  /** Dipakai lembar yang sedang dibalik untuk mendeteksi akhir animasi. */
  onAnimationEnd?: () => void;
}) {
  const isBrand = tone === "brand";

  return (
    <article
      data-book-sheet=""
      data-book-index={index}
      onAnimationEnd={onAnimationEnd}
      style={{ "--book-page-index": index } as React.CSSProperties}
      className={[
        "flex h-full w-full flex-col overflow-hidden",
        isBrand ? "ds-gradient-brand text-white" : "bg-paper text-ink-800",
        className,
      ].join(" ")}
    >
      {/* Motif geometris Islam, sangat tipis. */}
      <div
        aria-hidden="true"
        className={[
          "pointer-events-none absolute inset-0 ds-pattern",
          isBrand ? "opacity-[0.07]" : "ds-pattern-ink opacity-[0.05]",
        ].join(" ")}
      />

      {isBrand ? (
        <div
          aria-hidden="true"
          className="ds-ornament-frame pointer-events-none absolute inset-3 rounded-[calc(var(--radius-sheet)-0.5rem)]"
        />
      ) : null}

      <div className="relative flex min-h-0 flex-1 flex-col">{children}</div>
    </article>
  );
}

/** Kepala bab: kicker + judul + deskripsi. */
export function SheetHeader({
  kicker,
  title,
  description,
}: {
  kicker: string;
  title: string;
  description?: string;
}) {
  return (
    <header className="shrink-0 border-b border-ink-900/8 px-5 pt-5 pb-3.5 sm:px-8">
      {kicker ? (
        <p className="text-[0.65rem] font-semibold tracking-[0.2em] text-emerald-600 uppercase">
          {kicker}
        </p>
      ) : null}
      <h1 className="mt-1 font-serif text-xl leading-tight font-semibold tracking-tight text-emerald-900 sm:text-2xl">
        {title}
      </h1>
      {description ? (
        <p className="mt-1 text-xs text-ink-500">{description}</p>
      ) : null}
    </header>
  );
}

/** Placeholder saat data kosong. Sengaja tidak menampilkan teks hardcode. */
export function EmptyState({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="ds-gradient-mist flex h-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-emerald-600/25 px-6 py-10 text-center">
      <svg
        viewBox="0 0 40 40"
        aria-hidden="true"
        className="h-9 w-9 text-emerald-600/30"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
      >
        <path d="M10 10H30V30H10Z" />
        <path d="M30 20L20 30L10 20L20 10Z" />
      </svg>
      <p className="font-serif text-base font-semibold text-emerald-900">
        {title}
      </p>
      {hint ? <p className="max-w-sm text-sm text-ink-500">{hint}</p> : null}
      {action}
    </div>
  );
}
