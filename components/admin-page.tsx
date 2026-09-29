/**
 * Kerangka halaman admin yang dipakai bersama oleh seluruh route /admin/*.
 * Menyediakan judul, deskripsi, dan slot aksi di kanan.
 */
export function AdminPage({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-white">{title}</h1>
          {description ? (
            <p className="text-sm text-ink-400">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex gap-2">{actions}</div> : null}
      </header>

      {children}
    </div>
  );
}

/**
 * Empty state untuk area admin.
 *
 * Pasangan gelap dari `EmptyState` di `components/book-frame.tsx` yang dipakai
 * buku publik — bentuk, ikon, dan tipografi sama, hanya paletnya mengikuti
 * latar aplikasi (ink) alih-alih kertas (paper).
 *
 * `action` dipakai untuk memberi jalan keluar yang konkret (mis. form tambah
 * yang berada tepat di atasnya), bukan sekadar kalimat "belum ada data".
 */
export function AdminEmptyState({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="ds-panel flex flex-col items-center justify-center gap-2.5 border-dashed px-5 py-9 text-center">
      <svg
        viewBox="0 0 40 40"
        aria-hidden="true"
        className="h-8 w-8 text-emerald-400/35"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
      >
        <path d="M10 10H30V30H10Z" />
        <path d="M30 20L20 30L10 20L20 10Z" />
        <path d="M20 18.4a1.6 1.6 0 100 3.2 1.6 1.6 0 000-3.2Z" />
      </svg>

      <p className="text-sm font-semibold text-white">{title}</p>
      {hint ? <p className="max-w-sm text-xs text-ink-400">{hint}</p> : null}
      {action}
    </div>
  );
}
