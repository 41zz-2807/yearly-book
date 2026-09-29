"use client";

import { useActionState } from "react";
import {
  Field,
  Textarea,
  FileField,
  SubmitButton,
  FormError,
} from "@/components/admin-form";
import { saveSetting, type SettingState } from "@/app/admin/pengaturan/actions";

type Setting = {
  namaKelas: string;
  sekolah: string;
  angkatan: number;
  tahun: number;
  sambutan: string;
  penutup: string;
  fotoKelas: string | null;
};

const EMPTY: SettingState = {};

/** Setting adalah baris tunggal: tidak ada tombol tambah/hapus. */
export function PengaturanForm({ setting }: { setting: Setting | null }) {
  const [state, action] = useActionState(saveSetting, EMPTY);
  const fe = state.fieldErrors;

  return (
    <form action={action} className="space-y-4">
      <FormError error={state.error} fieldErrors={fe} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Nama kelas"
          name="namaKelas"
          required
          maxLength={160}
          defaultValue={setting?.namaKelas}
          error={fe?.namaKelas}
          placeholder="Contoh: Grade 6 - Jannatul Firdaus"
        />
        <Field
          label="Sekolah"
          name="sekolah"
          required
          maxLength={160}
          defaultValue={setting?.sekolah}
          error={fe?.sekolah}
        />
        <Field
          label="Angkatan (tahun masuk)"
          name="angkatan"
          required
          type="number"
          inputMode="numeric"
          defaultValue={setting?.angkatan}
          error={fe?.angkatan}
        />
        <Field
          label="Tahun"
          name="tahun"
          required
          type="number"
          inputMode="numeric"
          defaultValue={setting?.tahun}
          error={fe?.tahun}
        />
      </div>

      <FileField
        label="Foto kelas"
        name="fotoKelas"
        currentUrl={setting?.fotoKelas}
        error={fe?.fotoKelas}
        hint="JPG/PNG/WEBP. Tampil di sampul buku."
      />

      <Textarea
        label="Sambutan"
        name="sambutan"
        required
        rows={6}
        maxLength={5000}
        defaultValue={setting?.sambutan}
        error={fe?.sambutan}
        hint="Pisahkan antar paragraf dengan baris kosong."
      />

      <Textarea
        label="Penutup"
        name="penutup"
        required
        rows={5}
        maxLength={5000}
        defaultValue={setting?.penutup}
        error={fe?.penutup}
      />

      <SubmitButton>Simpan Pengaturan</SubmitButton>
    </form>
  );
}
