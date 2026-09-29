"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireAdmin, publicError } from "@/lib/guard";
import { uploadIfPresent, deleteUpload } from "@/lib/upload";
import {
  ValidationError,
  requiredText,
  optionalText,
  id,
  file,
  type FieldErrors,
} from "@/lib/validate";

export type FormState = { error?: string; fieldErrors?: FieldErrors };

const BASE = "/admin/siswa";

/* --------------------------------------------------------------------------
 * Tambah
 * ----------------------------------------------------------------------- */
export async function createSiswa(
  _prev: FormState,
  form: FormData,
): Promise<FormState> {
  await requireAdmin();

  let fotoUrl: string | null = null;
  try {
    const nama = requiredText(form, "nama", "Nama", 120);
    const citaCita = optionalText(form, "citaCita", "Cita-cita", 120);
    const pesan = optionalText(form, "pesan", "Pesan", 500);
    const suratMasaDepan = optionalText(form, "suratMasaDepan", "Surat", 5000);

    const upload = await uploadIfPresent(file(form));
    if (!upload.ok) return { error: upload.error };
    fotoUrl = upload.url;

    // Urutan otomatis: ContinUE dari yang terakhir.
    const last = await prisma.siswa.findFirst({
      orderBy: { urutan: "desc" },
      select: { urutan: true },
    });

    await prisma.siswa.create({
      data: {
        nama,
        citaCita,
        pesan,
        suratMasaDepan,
        foto: fotoUrl,
        urutan: (last?.urutan ?? 0) + 1,
      },
    });
  } catch (error) {
    // Berkas sudah tersimpan tapi DB gagal — rapikan biar tidak yatim.
    await deleteUpload(fotoUrl);
    if (error instanceof ValidationError) {
      return { fieldErrors: error.fieldErrors };
    }
    return { error: publicError(error) };
  }

  revalidatePath(BASE);
  revalidatePath("/profil");
  redirect(`${BASE}?saved=1`);
}

/* --------------------------------------------------------------------------
 * Ubah
 * ----------------------------------------------------------------------- */
export async function updateSiswa(
  _prev: FormState,
  form: FormData,
): Promise<FormState> {
  await requireAdmin();

  let newFoto: string | null = null;
  let replaced: string | null = null;

  try {
    const siswaId = id(form);
    const nama = requiredText(form, "nama", "Nama", 120);
    const citaCita = optionalText(form, "citaCita", "Cita-cita", 120);
    const pesan = optionalText(form, "pesan", "Pesan", 500);
    const suratMasaDepan = optionalText(form, "suratMasaDepan", "Surat", 5000);

    const lama = await prisma.siswa.findUnique({
      where: { id: siswaId },
      select: { foto: true },
    });
    if (!lama) return { error: "Data siswa tidak ditemukan." };

    const upload = await uploadIfPresent(file(form));
    if (!upload.ok) return { error: upload.error };
    newFoto = upload.url;
    // Bila ada berkas baru, foto lama obsolete dan boleh dihapus.
    replaced = newFoto ? lama.foto : null;

    await prisma.siswa.update({
      where: { id: siswaId },
      data: { nama, citaCita, pesan, suratMasaDepan, foto: newFoto ?? lama.foto },
    });
  } catch (error) {
    await deleteUpload(newFoto);
    if (error instanceof ValidationError) {
      return { fieldErrors: error.fieldErrors };
    }
    return { error: publicError(error) };
  }

  await deleteUpload(replaced);
  revalidatePath(BASE);
  revalidatePath("/profil");
  redirect(`${BASE}?updated=1`);
}

/* --------------------------------------------------------------------------
 * Hapus
 * ----------------------------------------------------------------------- */
export async function deleteSiswa(form: FormData) {
  await requireAdmin();

  try {
    const siswaId = id(form);
    const target = await prisma.siswa.findUnique({
      where: { id: siswaId },
      select: { foto: true },
    });

    await prisma.siswa.delete({ where: { id: siswaId } });
    await deleteUpload(target?.foto);
  } catch {
    redirect(`${BASE}?error=1`);
  }

  revalidatePath(BASE);
  revalidatePath("/profil");
  redirect(`${BASE}?deleted=1`);
}

/* --------------------------------------------------------------------------
 * Ubah urutan (naik / turun) — menukar urutan dengan tetangga terdekat.
 * ----------------------------------------------------------------------- */
export async function moveSiswa(form: FormData) {
  await requireAdmin();

  try {
    const siswaId = id(form);
    const arah = form.get("arah") === "up" ? -1 : 1;
    const current = await prisma.siswa.findUnique({
      where: { id: siswaId },
      select: { id: true, urutan: true },
    });
    if (!current) redirect(`${BASE}?error=1`);

    const neighbor = await prisma.siswa.findFirst({
      where: arah < 0 ? { urutan: { lt: current.urutan } } : { urutan: { gt: current.urutan } },
      orderBy: { urutan: arah < 0 ? "desc" : "asc" },
      select: { id: true, urutan: true },
    });
    if (!neighbor) redirect(`${BASE}?moved=1`);

    // Tukar kedua nilai agar tidak bentrok dengan constraint unik.
    await prisma.$transaction([
      prisma.siswa.update({ where: { id: current.id }, data: { urutan: neighbor.urutan } }),
      prisma.siswa.update({ where: { id: neighbor.id }, data: { urutan: current.urutan } }),
    ]);
  } catch {
    redirect(`${BASE}?error=1`);
  }

  revalidatePath(BASE);
  revalidatePath("/profil");
  redirect(`${BASE}?moved=1`);
}
