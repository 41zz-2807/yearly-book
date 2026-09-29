/**
 * Layout untuk SELURUH halaman publik buku (route group `(public)`).
 *
 * Navigasi TIDAK dirender di sini. BookView sudah memuat BookNav sebagai
 * bagian dari buku, karena posisinya harus menempel di bawah layar pada mode
 * scroll dan menyatu dengan lembar pada mode flip.
 */
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-dvh">{children}</div>;
}
