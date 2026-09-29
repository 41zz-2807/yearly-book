import { prisma } from "@/lib/prisma";
import { AdminEmptyState, AdminPage } from "@/components/admin-page";
import { Flash, RowButton } from "@/components/admin-form";
import { SiswaForm } from "./siswa-form";
import { deleteSiswa, moveSiswa } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminSiswa({
  searchParams,
}: {
  searchParams: Promise<{ [k: string]: string | undefined }>;
}) {
  const params = await searchParams;
  const siswa = await prisma.siswa.findMany({ orderBy: { urutan: "asc" } });

  return (
    <AdminPage
      title="Siswa"
      description={`${siswa.length} siswa · urutan mengikuti kolom urutan`}
    >
      <Flash code={params.saved ?? params.updated ?? params.deleted ?? params.moved} />
      {params.error ? (
        <p
          role="alert"
          className="ds-alert ds-alert-error"
        >
          Aksi gagal. Silakan coba lagi.
        </p>
      ) : null}

      <section className="ds-panel p-5">
        <h2 className="mb-4 text-sm font-semibold text-white">
          {siswa.length === 0 ? "Tambah siswa pertama" : "Tambah siswa"}
        </h2>
        <SiswaForm />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-white">Daftar siswa</h2>

        {siswa.length === 0 ? (
          <AdminEmptyState
            title="Belum ada siswa"
            hint="Isi formulir di atas untuk menambah siswa pertama, atau jalankan seed data contoh lewat docker compose run --rm app npm run db:seed."
            action={
              <p className="text-xs text-ink-500">
                Setelah ditambah, data langsung tampil di Profil Siswa dan Daftar
                Siswa pada buku publik.
              </p>
            }
          />
        ) : (
          <ul className="space-y-3">
            {siswa.map((s) => (
              <li
                key={s.id}
                className="ds-panel p-4"
              >
                <div className="flex items-start gap-3">
                  {s.foto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={s.foto}
                      alt={s.nama}
                      className="h-14 w-14 shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-ink-800 text-xs text-ink-400">
                      {s.nama.slice(0, 2).toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-white">{s.nama}</p>
                    <p className="text-xs text-ink-400">
                      {s.citaCita ?? "—"} · urutan {s.urutan}
                    </p>
                  </div>

                  {/* Tombol urutan: tidak butuh JavaScript. */}
                  <div className="flex shrink-0 items-center gap-1.5">
                    <form action={moveSiswa}>
                      <input type="hidden" name="id" value={s.id} />
                      <input type="hidden" name="arah" value="up" />
                      <RowButton title="Naikkan urutan">
                        ↑
                      </RowButton>
                    </form>
                    <form action={moveSiswa}>
                      <input type="hidden" name="id" value={s.id} />
                      <input type="hidden" name="arah" value="down" />
                      <RowButton title="Turunkan urutan">
                        ↓
                      </RowButton>
                    </form>
                  </div>
                </div>

                <details className="mt-3">
                  <summary className="cursor-pointer text-xs text-emerald-400 hover:text-emerald-500">
                    Ubah data
                  </summary>
                  <div className="mt-3 border-t border-ink-800 pt-3">
                    <SiswaForm siswa={s} />
                    <form action={deleteSiswa} className="mt-3">
                      <input type="hidden" name="id" value={s.id} />
                      <RowButton
                        title="Hapus siswa"
                        variant="danger"
                      >
                        Hapus
                      </RowButton>
                    </form>
                  </div>
                </details>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AdminPage>
  );
}
