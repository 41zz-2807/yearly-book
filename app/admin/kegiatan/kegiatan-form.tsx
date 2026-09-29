"use client";

import { useActionState } from "react";
import {
  Textarea,
  FileField,
  SubmitButton,
  FormError,
} from "@/components/admin-form";
import {
  createKegiatan,
  updateKegiatan,
} from "@/app/admin/kegiatan/actions";
import type { FormState } from "@/app/admin/siswa/actions";

type Kegiatan = {
  id: number;
  url: string | null;
  caption: string | null;
};

const EMPTY: FormState = {};

export function KegiatanForm({ kegiatan }: { kegiatan?: Kegiatan }) {
  const [state, action] = useActionState(
    kegiatan ? updateKegiatan : createKegiatan,
    EMPTY,
  );
  const fe = state.fieldErrors;

  return (
    <form action={action} className="space-y-4">
      {kegiatan ? <input type="hidden" name="id" value={kegiatan.id} /> : null}

      <FormError error={state.error} fieldErrors={fe} />

      <FileField
        label="Foto"
        name="foto"
        currentUrl={kegiatan?.url}
        error={fe?.foto}
        hint="JPG/PNG/WEBP. Boleh dikosongkan dan diisi nanti."
      />

      <Textarea
        label="Caption"
        name="caption"
        rows={2}
        maxLength={300}
        defaultValue={kegiatan?.caption}
        error={fe?.caption}
        placeholder="Contoh: Outing bersama ke museum"
      />

      <SubmitButton>
        {kegiatan ? "Simpan Perubahan" : "Tambah Foto"}
      </SubmitButton>
    </form>
  );
}
