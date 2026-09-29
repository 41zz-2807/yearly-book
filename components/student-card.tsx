/**
 * Kartu profil satu siswa.
 *
 * Semua isi berasal dari model Siswa. Tidak ada data siswa, nama file, atau URL
 * yang ditulis di sini — termasuk foto. Kalau kolom `foto` kosong, kartu
 * menampilkan placeholder berornamen (motif geometris + inisial) yang digambar
 * dengan CSS, bukan gambar placeholder dari internet.
 */

type SiswaProfil = {
  id: number;
  nama: string;
  citaCita: string | null;
  pesan: string | null;
  suratMasaDepan: string | null;
  foto: string | null;
  urutan: number;
};

export function StudentCard({
  siswa,
  compact = false,
}: {
  siswa: SiswaProfil;
  /**
   * `compact` dipakai di dalam lembar buku yang rasio 3:4, di mana tiga kartu
   * harus muat satu halaman. Versi ini persistently lebih rapat: foto lebih
   * pendek dan ukuran huruf lebih kecil.
   */
  compact?: boolean;
}) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-ink-900/10 bg-paper shadow-[var(--shadow-lift)] transition-shadow hover:shadow-[0_18px_36px_-12px_rgb(6_48_45/0.28)]">
      {/* ---------- Foto ---------- */}
      <div
        className={[
          "relative w-full overflow-hidden bg-emerald-50",
          compact ? "aspect-[5/4]" : "aspect-[5/4] sm:aspect-[4/3]",
        ].join(" ")}
      >
        {siswa.foto ? (
          // URL foto berasal dari kolom database, bukan input pengguna.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={siswa.foto}
            alt={`Foto ${siswa.nama}`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="ds-pattern-ink flex h-full w-full flex-col items-center justify-center gap-1.5 text-emerald-700/70">
            <span className="font-serif text-3xl font-semibold tracking-wide">
              {initials(siswa.nama)}
            </span>
            <span className="text-[0.65rem] tracking-widest uppercase opacity-70">
              {siswa.nama.length > 0 ? "Foto belum diisi" : ""}
            </span>
          </div>
        )}

        {/* Angka urut, badge emas di pojok foto. */}
        <span className="absolute top-2.5 left-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-gold-400 font-serif text-sm font-bold text-ink-950 shadow-sm tabular-nums">
          {siswa.urutan}
        </span>

        {/* Gradasi tipis di bawah foto agar menyatu ke kartu. */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-paper to-transparent"
        />
      </div>

      {/* ---------- Identitas ---------- */}
      <div
        className={[
          "flex flex-1 flex-col px-4 pt-1 pb-4 sm:px-5 sm:pb-5",
          compact ? "gap-2" : "gap-3",
        ].join(" ")}
      >
        <div>
          <h2
            className={[
              "font-serif leading-tight font-semibold text-balance text-emerald-900",
              compact ? "text-base" : "text-lg sm:text-xl",
            ].join(" ")}
          >
            {siswa.nama}
          </h2>

          {siswa.citaCita ? (
            <p className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-800 ring-1 ring-sky-200">
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 rounded-full bg-sky-400"
              />
              {siswa.citaCita}
            </p>
          ) : null}
        </div>

        {/* ---------- Pesan / Motto ---------- */}
        {siswa.pesan ? (
          <figure className="relative pl-3">
            <span
              aria-hidden="true"
              className="absolute inset-y-0 left-0 w-0.5 rounded-full bg-gold-400"
            />
            <blockquote
              className={[
                "leading-relaxed text-ink-600 italic",
                compact ? "line-clamp-2 text-xs" : "text-sm",
              ].join(" ")}
            >
              “{siswa.pesan}”
            </blockquote>
          </figure>
        ) : null}

        {/* ---------- Surat untuk Masa Depan ----------
            Ditaruh paling bawah dengan mt-auto supaya tepi bawah kartu
            tetap rata antar kartu, berapa pun panjang isinya. */}
        <div className="mt-auto">
          <div className="rounded-xl border border-gold-400/35 bg-paper-warm p-3 sm:p-3.5">
            <p className="flex items-center gap-1.5 text-[0.65rem] font-semibold tracking-[0.15em] text-gold-700 uppercase">
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="h-3.5 w-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path d="M4 5h16v14H4z" strokeLinejoin="round" />
                <path d="M4 6l8 6 8-6" strokeLinecap="round" />
              </svg>
              Surat untuk Masa Depan
            </p>

            {siswa.suratMasaDepan ? (
              <p
                className={[
                  "leading-relaxed break-words text-ink-700",
                  compact ? "mt-1 line-clamp-6 text-xs" : "mt-1.5 text-sm",
                ].join(" ")}
              >
                {siswa.suratMasaDepan}
              </p>
            ) : (
              <p className="mt-1.5 text-sm text-ink-400 italic">
                Belum menulis surat.
              </p>
            )}
          </div>
        </div>
      </div>
    </article>
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
