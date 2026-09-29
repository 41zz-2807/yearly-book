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
  file,
  type FieldErrors,
} from "@/lib/validate";

export type WaliState = { error?: string; fieldErrors?: FieldErrors };

const BASE = "/admin/wali-kelas";

/**
 * Wali kelas tanpa orderBy: tabel ini tanpa kolom `urutan` di skema, jadi
 * urutannya mengikuti waktu dibuat (id). Tambah memakai id pertama bila tabel
 * masih kosong.
 */
export async function saveWaliKelas(
  _prev: WaliState,
  form: FormData,
): Promise<WaliState> {
  await requireAdmin();

  let newFoto: string | null = null;
  let replaced: string | null = null;
  let waliId: number | null = null;

  try {
    const nama = requiredText(form, "nama", "Nama", 120);
    const pesan = optionalText(form, "pesan", "Pesan", 1000);

    // id opsional: kosong berarti "buat baru".
    const rawId = form.get("id");
    if (typeof rawId === "string" && rawId.trim() !== "") {
      waliId = Number(rawId);
      if (!Number.isInteger(waliId) || waliId < 1) {
        throw new ValidationError({ id: "ID tidak valid." });
      }
    }

    const existing = waliId
      ? await prisma.waliKelas.findUnique({
          where: { id: waliId },
          select: { id: true, foto: true },
        })
      : null;

    const upload = await uploadIfPresent(file(form, "foto"));
    if (!upload.ok) return { error: upload.error };
    newFoto = upload.url;

    if (existing) {
      replaced = newFoto ? existing.foto : null;
      await prisma.waliKelas.update({
        where: { id: existing.id },
        data: { nama, pesan, foto: newFoto ?? existing.foto },
      });
    } else {
      await prisma.waliKelas.create({ data: { nama, pesan, foto: newFoto } });
    }
  } catch (error) {
    await deleteUpload(newFoto);
    if (error instanceof ValidationError) return { fieldErrors: error.fieldErrors };
    return { error: publicError(error) };
  }

  await deleteUpload(replaced);
  revalidatePath(BASE);
  revalidatePath("/wali-kelas");
  revalidatePath("/sambutan");
  redirect(`${BASE}?updated=1`);
}
