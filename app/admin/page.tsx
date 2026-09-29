import { prisma } from "@/lib/prisma";
import { AdminEmptyState, AdminPage } from "@/components/admin-page";

/** Path route export, relatif terhadap origin aplikasi. */
const EXPORT_PATH = "/api/export";

export const dynamic = "force-dynamic";

/**
 * Tombol unduh PDF untuk sisi admin.
 *
 * Path diambil dari route export milik aplikasi sendiri. `download` bersama
 * `content-disposition: attachment` dari server membuat browser menyimpan
 * berkas dengan nama yang ditentukan dari nama kelas di database.
 */
function ExportPdfButton() {
  return (
    <a
      href={EXPORT_PATH}
      download
      className="ds-btn-brand flex items-center gap-2 font-medium text-white"
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 3v12" />
        <path d="M7 11l5 5 5-5" />
        <path d="M4 20h16" />
      </svg>
      Unduh PDF
    </a>
  );
}

export default async function AdminDashboard() {
  const [siswa, kegiatan, prestasi, waliKelas, setting] = await Promise.all([
    prisma.siswa.count(),
    prisma.fotoKegiatan.count(),
    prisma.prestasi.count(),
    prisma.waliKelas.count(),
    prisma.setting.findFirst({
      select: { namaKelas: true, sekolah: true, angkatan: true, tahun: true },
    }),
  ]);

  const kosong = !setting && siswa + kegiatan + prestasi + waliKelas === 0;

  const stats = [
    { label: "Siswa", value: siswa },
    { label: "Foto Kegiatan", value: kegiatan },
    { label: "Prestasi", value: prestasi },
    { label: "Wali Kelas", value: waliKelas },
  ];

  return (
    <AdminPage
      title="Dashboard"
      description={
        setting
          ? `${setting.namaKelas} · ${setting.sekolah} · Angkatan ${setting.angkatan}`
          : "Konfigurasi kelas belum diisi. Mulai dari halaman Pengaturan."
      }
      actions={<ExportPdfButton />}
    >
      {kosong ? (
        <AdminEmptyState
          title="Buku annual masih kosong"
          hint="Isi data kelas lewat halaman Pengaturan, atau muat data contoh sekaligus dengan perintah seed di dalam Docker."
          action={
            <div className="ds-panel mt-1 w-full max-w-md px-4 py-3 text-left">
              <p className="text-[0.65rem] font-semibold tracking-[0.18em] text-emerald-400 uppercase">
                Data contoh
              </p>
              <code className="mt-1.5 block font-mono text-xs leading-relaxed break-words text-ink-200">
                docker compose run --rm app npm run db:seed
              </code>
              <p className="mt-2 text-xs text-ink-500">
                Seed tidak menghapus data yang sudah ada dan tidak mengosongkan
                foto yang sudah diunggah, jadi aman dijalankan berulang kali.
              </p>
            </div>
          }
        />
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="ds-panel p-4">
            <p className="text-sm text-ink-400">{s.label}</p>
            <p className="mt-1 text-3xl font-bold text-white tabular-nums">
              {s.value}
            </p>
          </div>
        ))}
      </section>

      {setting ? null : (
        <p className="ds-alert ds-alert-warn">
          Data kelas masih kosong. Isi di halaman Pengaturan.
        </p>
      )}
    </AdminPage>
  );
}
