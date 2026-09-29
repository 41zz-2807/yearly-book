import { prisma } from "@/lib/prisma";
import { AdminPage } from "@/components/admin-page";
import { Flash } from "@/components/admin-form";
import { PengaturanForm } from "./pengaturan-form";

export const dynamic = "force-dynamic";

/**
 * Pengaturan: tabel baris-tunggal. Isinya dipakai hampir semua halaman
 * publik, jadi setiap penyimpanan me-revalidatePath halaman-halaman itu.
 */
export default async function AdminPengaturan({
  searchParams,
}: {
  searchParams: Promise<{ [k: string]: string | undefined }>;
}) {
  const params = await searchParams;
  const setting = await prisma.setting.findFirst();

  return (
    <AdminPage
      title="Pengaturan"
      description="Identitas utama buku annual. Hanya ada satu baris data."
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
        <PengaturanForm
          setting={
            setting
              ? {
                  namaKelas: setting.namaKelas,
                  sekolah: setting.sekolah,
                  angkatan: setting.angkatan,
                  tahun: setting.tahun,
                  sambutan: setting.sambutan,
                  penutup: setting.penutup,
                  fotoKelas: setting.fotoKelas,
                }
              : null
          }
        />
      </section>
    </AdminPage>
  );
}
