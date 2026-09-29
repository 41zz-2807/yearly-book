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
} from "@/lib/validate";
import type { FormState } from "@/app/admin/siswa/actions";

const BASE = "/admin/prestasi";

/* Tambah */
export async function createPrestasi(
  _prev: FormState,
  form: FormData,
): Promise<FormState> {
  await requireAdmin();

  let newFoto: string | null = null;
  try {
    const judul = requiredText(form, "judul", "Judul", 160);
    const deskripsi = optionalText(form, "deskripsi", "Deskripsi", 2000);

    const upload = await uploadIfPresent(file(form, "foto"));
    if (!upload.ok) return { error: upload.error };
    newFoto = upload.url;

    const last = await prisma.prestasi.findFirst({
      orderBy: { urutan: "desc" },
      select: { urutan: true },
    });

    await prisma.prestasi.create({
      data: {
        judul,
        deskripsi,
        foto: newFoto,
        urutan: (last?.urutan ?? 0) + 1,
      },
    });
  } catch (error) {
    await deleteUpload(newFoto);
    if (error instanceof ValidationError) return { fieldErrors: error.fieldErrors };
    return { error: publicError(error) };
  }

  revalidatePath(BASE);
  revalidatePath("/prestasi");
  redirect(`${BASE}?saved=1`);
}

/* Ubah */
export async function updatePrestasi(
  _prev: FormState,
  form: FormData,
): Promise<FormState> {
  await requireAdmin();

  let newFoto: string | null = null;
  let replaced: string | null = null;

  try {
    const prestasiId = id(form);
    const judul = requiredText(form, "judul", "Judul", 160);
    const deskripsi = optionalText(form, "deskripsi", "Deskripsi", 2000);

    const lama = await prisma.prestasi.findUnique({
      where: { id: prestasiId },
      select: { foto: true },
    });
    if (!lama) return { error: "Data prestasi tidak ditemukan." };

    const upload = await uploadIfPresent(file(form, "foto"));
    if (!upload.ok) return { error: upload.error };
    newFoto = upload.url;
    replaced = newFoto ? lama.foto : null;

    await prisma.prestasi.update({
      where: { id: prestasiId },
      data: { judul, deskripsi, foto: newFoto ?? lama.foto },
    });
  } catch (error) {
    await deleteUpload(newFoto);
    if (error instanceof ValidationError) return { fieldErrors: error.fieldErrors };
    return { error: publicError(error) };
  }

  await deleteUpload(replaced);
  revalidatePath(BASE);
  revalidatePath("/prestasi");
  redirect(`${BASE}?updated=1`);
}

/* Hapus */
export async function deletePrestasi(form: FormData) {
  await requireAdmin();

  try {
    const prestasiId = id(form);
    const target = await prisma.prestasi.findUnique({
      where: { id: prestasiId },
      select: { foto: true },
    });

    await prisma.prestasi.delete({ where: { id: prestasiId } });
    await deleteUpload(target?.foto);
  } catch {
    redirect(`${BASE}?error=1`);
  }

  revalidatePath(BASE);
  revalidatePath("/prestasi");
  redirect(`${BASE}?deleted=1`);
}

/* Ubah urutan */
export async function movePrestasi(form: FormData) {
  await requireAdmin();

  try {
    const prestasiId = id(form);
    const arah = form.get("arah") === "up" ? -1 : 1;
    const current = await prisma.prestasi.findUnique({
      where: { id: prestasiId },
      select: { id: true, urutan: true },
    });
    if (!current) redirect(`${BASE}?error=1`);

    const neighbor = await prisma.prestasi.findFirst({
      where: arah < 0 ? { urutan: { lt: current.urutan } } : { urutan: { gt: current.urutan } },
      orderBy: { urutan: arah < 0 ? "desc" : "asc" },
      select: { id: true, urutan: true },
    });
    if (!neighbor) redirect(`${BASE}?moved=1`);

    await prisma.$transaction([
      prisma.prestasi.update({ where: { id: current.id }, data: { urutan: neighbor.urutan } }),
      prisma.prestasi.update({ where: { id: neighbor.id }, data: { urutan: current.urutan } }),
    ]);
  } catch {
    redirect(`${BASE}?error=1`);
  }

  revalidatePath(BASE);
  revalidatePath("/prestasi");
  redirect(`${BASE}?moved=1`);
}
