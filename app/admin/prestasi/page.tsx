import { prisma } from "@/lib/prisma";
import { AdminEmptyState, AdminPage } from "@/components/admin-page";
import { Flash, RowButton } from "@/components/admin-form";
import { PrestasiForm } from "./prestasi-form";
import { deletePrestasi, movePrestasi } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminPrestasi({
  searchParams,
}: {
  searchParams: Promise<{ [k: string]: string | undefined }>;
}) {
  const params = await searchParams;
  const prestasi = await prisma.prestasi.findMany({ orderBy: { urutan: "asc" } });

  return (
    <AdminPage
      title="Prestasi"
      description={`${prestasi.length} prestasi · urutan mengikuti kolom urutan`}
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
        <h2 className="mb-4 text-sm font-semibold text-white">Tambah prestasi</h2>
        <PrestasiForm />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-white">Daftar prestasi</h2>

        {prestasi.length === 0 ? (
          <AdminEmptyState
            title="Belum ada prestasi"
            hint="Catat judul prestasi kelas beserta deskripsinya lewat formulir di atas. Foto bersifat opsional."
            action={
              <p className="text-xs text-ink-500">
                Urutan dapat Dinaik-turunkan dengan tombol panah pada tiap baris.
              </p>
            }
          />
        ) : (
          <ul className="space-y-3">
            {prestasi.map((p) => (
              <li
                key={p.id}
                className="ds-panel p-4"
              >
                <div className="flex items-start gap-3">
                  {p.foto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.foto}
                      alt={p.judul}
                      className="h-14 w-14 shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-ink-800 text-xs text-ink-400">
                      {p.urutan}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-white">{p.judul}</p>
                    {p.deskripsi ? (
                      <p className="text-xs text-ink-400">{p.deskripsi}</p>
                    ) : null}
                    <p className="mt-0.5 text-xs text-ink-500">
                      urutan {p.urutan}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-1.5">
                    <form action={movePrestasi}>
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="arah" value="up" />
                      <RowButton title="Naikkan urutan">
                        ↑
                      </RowButton>
                    </form>
                    <form action={movePrestasi}>
                      <input type="hidden" name="id" value={p.id} />
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
                    <PrestasiForm prestasi={p} />
                    <form action={deletePrestasi} className="mt-3">
                      <input type="hidden" name="id" value={p.id} />
                      <RowButton
                        title="Hapus prestasi"
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
