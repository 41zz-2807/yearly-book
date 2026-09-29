import { prisma } from "@/lib/prisma";
import { AdminPage } from "@/components/admin-page";
import { Flash } from "@/components/admin-form";
import { WaliKelasForm } from "./wali-form";

export const dynamic = "force-dynamic";

/**
 * Wali kelas: tabel ini tidak punya kolom `urutan`, jadi tidak ada tombol
 * naik/turun maupun hapus. Task hanya meminta edit data.
 */
export default async function AdminWaliKelas({
  searchParams,
}: {
  searchParams: Promise<{ [k: string]: string | undefined }>;
}) {
  const params = await searchParams;
  const wali = await prisma.waliKelas.findFirst({ orderBy: { id: "asc" } });

  return (
    <AdminPage
      title="Wali Kelas"
      description="Data pembimbing kelas. Tampil juga sebagai penanda tangan di halaman Sambutan."
    >
      <Flash code={params.updated} />
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
          {wali ? "Ubah data wali kelas" : "Tambah wali kelas"}
        </h2>
        <WaliKelasForm {...(wali ? { wali } : {})} />
      </section>
    </AdminPage>
  );
}
