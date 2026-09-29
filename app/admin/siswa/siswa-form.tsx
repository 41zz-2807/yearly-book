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
  createSiswa,
  updateSiswa,
  type FormState,
} from "@/app/admin/siswa/actions";

type Siswa = {
  id: number;
  nama: string;
  citaCita: string | null;
  pesan: string | null;
  suratMasaDepan: string | null;
  foto: string | null;
};

const EMPTY: FormState = {};

/** Form untuk tambah ATA ubah — bedanya hanya `siswa` yang diberikan. */
export function SiswaForm({ siswa }: { siswa?: Siswa }) {
  const [state, action] = useActionState(
    siswa ? updateSiswa : createSiswa,
    EMPTY,
  );
  const fe = state.fieldErrors;

  return (
    <form action={action} className="space-y-4">
      {siswa ? <input type="hidden" name="id" value={siswa.id} /> : null}

      <FormError error={state.error} fieldErrors={fe} />

      <Field
        label="Nama"
        name="nama"
        required
        maxLength={120}
        defaultValue={siswa?.nama}
        error={fe?.nama}
      />

      <Field
        label="Cita-cita"
        name="citaCita"
        maxLength={120}
        defaultValue={siswa?.citaCita}
        error={fe?.citaCita}
        placeholder="Contoh: Dokter"
      />

      <Textarea
        label="Pesan / Motto"
        name="pesan"
        rows={2}
        maxLength={500}
        defaultValue={siswa?.pesan}
        error={fe?.pesan}
      />

      <Textarea
        label="Surat untuk Masa Depan"
        name="suratMasaDepan"
        rows={5}
        maxLength={5000}
        defaultValue={siswa?.suratMasaDepan}
        error={fe?.suratMasaDepan}
      />

      <FileField
        label="Foto"
        name="foto"
        currentUrl={siswa?.foto}
        error={fe?.foto}
        hint="JPG/PNG/WEBP. Biarkan kosong bila tidak ingin mengganti foto."
      />

      <div className="flex gap-2">
        <SubmitButton>{siswa ? "Simpan Perubahan" : "Tambah Siswa"}</SubmitButton>
      </div>
    </form>
  );
}
