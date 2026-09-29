"use client";

import { useActionState } from "react";
import {
  Field,
  Textarea,
  FileField,
  SubmitButton,
  FormError,
} from "@/components/admin-form";
import {
  createPrestasi,
  updatePrestasi,
} from "@/app/admin/prestasi/actions";
import type { FormState } from "@/app/admin/siswa/actions";

type Prestasi = {
  id: number;
  judul: string;
  deskripsi: string | null;
  foto: string | null;
};

const EMPTY: FormState = {};

export function PrestasiForm({ prestasi }: { prestasi?: Prestasi }) {
  const [state, action] = useActionState(
    prestasi ? updatePrestasi : createPrestasi,
    EMPTY,
  );
  const fe = state.fieldErrors;

  return (
    <form action={action} className="space-y-4">
      {prestasi ? <input type="hidden" name="id" value={prestasi.id} /> : null}

      <FormError error={state.error} fieldErrors={fe} />

      <Field
        label="Judul"
        name="judul"
        required
        maxLength={160}
        defaultValue={prestasi?.judul}
        error={fe?.judul}
        placeholder="Contoh: Juara 1 Lomba Essay"
      />

      <Textarea
        label="Deskripsi"
        name="deskripsi"
        rows={3}
        maxLength={2000}
        defaultValue={prestasi?.deskripsi}
        error={fe?.deskripsi}
      />

      <FileField
        label="Foto"
        name="foto"
        currentUrl={prestasi?.foto}
        error={fe?.foto}
        hint="JPG/PNG/WEBP. Biarkan kosong bila tidak ingin mengganti foto."
      />

      <SubmitButton>
        {prestasi ? "Simpan Perubahan" : "Tambah Prestasi"}
      </SubmitButton>
    </form>
  );
}
