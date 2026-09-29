"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireAdmin, publicError } from "@/lib/guard";
import { uploadIfPresent, deleteUpload } from "@/lib/upload";
import {
  ValidationError,
  optionalText,
  id,
  file,
} from "@/lib/validate";
import type { FormState } from "@/app/admin/siswa/actions";

const BASE = "/admin/kegiatan";

/* Tambah */
export async function createKegiatan(
  _prev: FormState,
  form: FormData,
): Promise<FormState> {
  await requireAdmin();

  let newUrl: string | null = null;
  try {
    const caption = optionalText(form, "caption", "Caption", 300);

    // url boleh kosong: entri bisa dibuat dulu, gambarnya menyusul.
    const upload = await uploadIfPresent(file(form, "foto"));
    if (!upload.ok) return { error: upload.error };
    newUrl = upload.url;

    const last = await prisma.fotoKegiatan.findFirst({
      orderBy: { urutan: "desc" },
      select: { urutan: true },
    });

    await prisma.fotoKegiatan.create({
      data: { url: newUrl, caption, urutan: (last?.urutan ?? 0) + 1 },
    });
  } catch (error) {
    await deleteUpload(newUrl);
    if (error instanceof ValidationError) return { fieldErrors: error.fieldErrors };
    return { error: publicError(error) };
  }

  revalidatePath(BASE);
  revalidatePath("/kegiatan");
  redirect(`${BASE}?saved=1`);
}

/* Ubah */
export async function updateKegiatan(
  _prev: FormState,
  form: FormData,
): Promise<FormState> {
  await requireAdmin();

  let newUrl: string | null = null;
  let replaced: string | null = null;

  try {
    const kegiatanId = id(form);
    const caption = optionalText(form, "caption", "Caption", 300);

    const lama = await prisma.fotoKegiatan.findUnique({
      where: { id: kegiatanId },
      select: { url: true },
    });
    if (!lama) return { error: "Data kegiatan tidak ditemukan." };

    const upload = await uploadIfPresent(file(form, "foto"));
    if (!upload.ok) return { error: upload.error };
    newUrl = upload.url;
    replaced = newUrl ? lama.url : null;

    await prisma.fotoKegiatan.update({
      where: { id: kegiatanId },
      data: { url: newUrl ?? lama.url, caption },
    });
  } catch (error) {
    await deleteUpload(newUrl);
    if (error instanceof ValidationError) return { fieldErrors: error.fieldErrors };
    return { error: publicError(error) };
  }

  await deleteUpload(replaced);
  revalidatePath(BASE);
  revalidatePath("/kegiatan");
  redirect(`${BASE}?updated=1`);
}

/* Hapus */
export async function deleteKegiatan(form: FormData) {
  await requireAdmin();

  try {
    const kegiatanId = id(form);
    const target = await prisma.fotoKegiatan.findUnique({
      where: { id: kegiatanId },
      select: { url: true },
    });

    await prisma.fotoKegiatan.delete({ where: { id: kegiatanId } });
    await deleteUpload(target?.url);
  } catch {
    redirect(`${BASE}?error=1`);
  }

  revalidatePath(BASE);
  revalidatePath("/kegiatan");
  redirect(`${BASE}?deleted=1`);
}

/* Ubah urutan */
export async function moveKegiatan(form: FormData) {
  await requireAdmin();

  try {
    const kegiatanId = id(form);
    const arah = form.get("arah") === "up" ? -1 : 1;
    const current = await prisma.fotoKegiatan.findUnique({
      where: { id: kegiatanId },
      select: { id: true, urutan: true },
    });
    if (!current) redirect(`${BASE}?error=1`);

    const neighbor = await prisma.fotoKegiatan.findFirst({
      where: arah < 0 ? { urutan: { lt: current.urutan } } : { urutan: { gt: current.urutan } },
      orderBy: { urutan: arah < 0 ? "desc" : "asc" },
      select: { id: true, urutan: true },
    });
    if (!neighbor) redirect(`${BASE}?moved=1`);

    await prisma.$transaction([
      prisma.fotoKegiatan.update({ where: { id: current.id }, data: { urutan: neighbor.urutan } }),
      prisma.fotoKegiatan.update({ where: { id: neighbor.id }, data: { urutan: current.urutan } }),
    ]);
  } catch {
    redirect(`${BASE}?error=1`);
  }

  revalidatePath(BASE);
  revalidatePath("/kegiatan");
  redirect(`${BASE}?moved=1`);
}
