import { prisma } from "@/lib/prisma";
import { AdminEmptyState, AdminPage } from "@/components/admin-page";
import { Flash, RowButton } from "@/components/admin-form";
import { KegiatanForm } from "./kegiatan-form";
import { deleteKegiatan, moveKegiatan } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminKegiatan({
  searchParams,
}: {
  searchParams: Promise<{ [k: string]: string | undefined }>;
}) {
  const params = await searchParams;
  const kegiatan = await prisma.fotoKegiatan.findMany({
    orderBy: { urutan: "asc" },
  });

  return (
    <AdminPage
      title="Kegiatan"
      description={`${kegiatan.length} foto kegiatan · urutan mengikuti kolom urutan`}
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
        <h2 className="mb-4 text-sm font-semibold text-white">Tambah foto kegiatan</h2>
        <KegiatanForm />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-white">Daftar kegiatan</h2>

        {kegiatan.length === 0 ? (
          <AdminEmptyState
            title="Belum ada foto kegiatan"
            hint="Tambah foto beserta caption-nya lewat formulir di atas. Caption boleh diisi lebih dulu; gambarnya bisa diunggah belakangan."
            action={
              <p className="text-xs text-ink-500">
                Galeri Kenang Seru otomatis menampilkan placeholder berlabel
                selama foto belum diisi.
              </p>
            }
          />
        ) : (
          <ul className="space-y-3">
            {kegiatan.map((f) => (
              <li
                key={f.id}
                className="ds-panel p-4"
              >
                <div className="flex items-start gap-3">
                  {f.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={f.url}
                      alt={f.caption ?? "Foto kegiatan"}
                      className="h-14 w-14 shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-ink-800 text-[0.6rem] text-ink-400">
                      tanpa foto
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-white">
                      {f.caption ?? "Tanpa keterangan"}
                    </p>
                    <p className="text-xs text-ink-400">urutan {f.urutan}</p>
                  </div>

                  <div className="flex shrink-0 items-center gap-1.5">
                    <form action={moveKegiatan}>
                      <input type="hidden" name="id" value={f.id} />
                      <input type="hidden" name="arah" value="up" />
                      <RowButton title="Naikkan urutan">
                        ↑
                      </RowButton>
                    </form>
                    <form action={moveKegiatan}>
                      <input type="hidden" name="id" value={f.id} />
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
                    <KegiatanForm kegiatan={f} />
                    <form action={deleteKegiatan} className="mt-3">
                      <input type="hidden" name="id" value={f.id} />
                      <RowButton
                        title="Hapus kegiatan"
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
