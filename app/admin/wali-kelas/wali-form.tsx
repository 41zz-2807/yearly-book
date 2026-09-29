"use client";

import { useActionState } from "react";
import {
  Field,
  Textarea,
  FileField,
  SubmitButton,
  FormError,
} from "@/components/admin-form";
import { saveWaliKelas, type WaliState } from "@/app/admin/wali-kelas/actions";

type WaliKelas = {
  id: number;
  nama: string;
  pesan: string | null;
  foto: string | null;
};

const EMPTY: WaliState = {};

/**
 * Wali kelas tanpa kolom `urutan` di skema, jadi form ini hanya punya mode
 * ubah (tambah bila tabel masih kosong — ditangani action).
 */
export function WaliKelasForm({ wali }: { wali?: WaliKelas } = {}) {
  const [state, action] = useActionState(saveWaliKelas, EMPTY);
  const fe = state.fieldErrors;

  return (
    <form action={action} className="space-y-4">
      {wali ? <input type="hidden" name="id" value={wali.id} /> : null}

      <FormError error={state.error} fieldErrors={fe} />

      <Field
        label="Nama"
        name="nama"
        required
        maxLength={120}
        defaultValue={wali?.nama}
        error={fe?.nama}
      />

      <FileField
        label="Foto"
        name="foto"
        currentUrl={wali?.foto}
        error={fe?.foto}
        hint="JPG/PNG/WEBP. Biarkan kosong bila tidak ingin mengganti foto."
      />

      <Textarea
        label="Pesan"
        name="pesan"
        rows={4}
        maxLength={1000}
        defaultValue={wali?.pesan}
        error={fe?.pesan}
      />

      <SubmitButton>
        {wali ? "Simpan Perubahan" : "Tambah Wali Kelas"}
      </SubmitButton>
    </form>
  );
}
