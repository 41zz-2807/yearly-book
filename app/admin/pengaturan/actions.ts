"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireAdmin, publicError } from "@/lib/guard";
import { uploadIfPresent, deleteUpload } from "@/lib/upload";
import {
  ValidationError,
  requiredText,
  int,
  file,
  type FieldErrors,
} from "@/lib/validate";

export type SettingState = { error?: string; fieldErrors?: FieldErrors };

const BASE = "/admin/pengaturan";

/**
 * Simpan Setting.
 *
 * Setting adalah tabel baris-tunggal. Bila baris belum ada, action ini
 * membuatnya dengan id=1 (bukan autoincrement) supaya upsert berikutnya
 * selalu menyasar baris yang sama.
 */
export async function saveSetting(
  _prev: SettingState,
  form: FormData,
): Promise<SettingState> {
  await requireAdmin();

  let newFoto: string | null = null;
  let replaced: string | null = null;

  try {
    const namaKelas = requiredText(form, "namaKelas", "Nama kelas", 160);
    const sekolah = requiredText(form, "sekolah", "Sekolah", 160);
    const angkatan = int(form, "angkatan", { min: 1900, max: 2200 });
    const tahun = int(form, "tahun", { min: 1900, max: 2200 });
    const sambutan = requiredText(form, "sambutan", "Sambutan", 5000);
    const penutup = requiredText(form, "penutup", "Penutup", 5000);

    const lama = await prisma.setting.findFirst({ select: { fotoKelas: true } });

    const upload = await uploadIfPresent(file(form, "fotoKelas"));
    if (!upload.ok) return { error: upload.error };
    newFoto = upload.url;
    replaced = newFoto ? lama?.fotoKelas ?? null : null;

    const data = {
      namaKelas,
      sekolah,
      angkatan,
      tahun,
      sambutan,
      penutup,
      fotoKelas: newFoto ?? lama?.fotoKelas ?? null,
    };

    await prisma.setting.upsert({ where: { id: 1 }, create: { id: 1, ...data }, update: data });
  } catch (error) {
    await deleteUpload(newFoto);
    if (error instanceof ValidationError) return { fieldErrors: error.fieldErrors };
    return { error: publicError(error) };
  }

  await deleteUpload(replaced);

  // Halaman publik ikut berubah karena isinya dari Setting.
  for (const path of [BASE, "/", "/sambutan", "/penutup"]) {
    revalidatePath(path);
  }
  redirect(`${BASE}?updated=1`);
}
