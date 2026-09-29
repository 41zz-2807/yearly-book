/**
 * Validasi input sederhana, tanpa dependensi tambahan.
 *
 * Semua nilai diambil dari FormData (yang selalu berupa string), jadi setiap
 * field perlu dikonversi dan diperiksa sebelum menyentuh database.
 */

export type FieldErrors = Record<string, string>;

export class ValidationError extends Error {
  constructor(public fieldErrors: FieldErrors) {
    super("VALIDATION");
    this.name = "ValidationError";
  }
}

/** Ambil string dari FormData, sudah di-trim. */
export function str(form: FormData, key: string): string {
  const v = form.get(key);
  return typeof v === "string" ? v.trim() : "";
}

/** Ambil string opsional; string kosong menjadi null. */
export function strOrNull(form: FormData, key: string): string | null {
  const v = str(form, key);
  return v === "" ? null : v;
}

/**
 * Ambil integer. Melempar ValidationError bila bukan angka bulat.
 * `required` menentukan apakah boleh kosong.
 */
export function int(
  form: FormData,
  key: string,
  { required = true, min, max }: { required?: boolean; min?: number; max?: number } = {},
): number {
  const raw = str(form, key);

  if (raw === "") {
    if (required) throw new ValidationError({ [key]: "Wajib diisi." });
    return 0;
  }

  const n = Number(raw);
  if (!Number.isInteger(n)) {
    throw new ValidationError({ [key]: "Harus berupa bilangan bulat." });
  }
  if (min !== undefined && n < min) {
    throw new ValidationError({ [key]: `Minimal ${min}.` });
  }
  if (max !== undefined && n > max) {
    throw new ValidationError({ [key]: `Maksimal ${max}.` });
  }
  return n;
}

/** ID dari FormData, wajib bilangan bulat positif. */
export function id(form: FormData, key = "id"): number {
  return int(form, key, { min: 1 });
}

/** Nama wajib, dengan batas panjang. */
export function requiredText(
  form: FormData,
  key: string,
  label: string,
  max = 500,
): string {
  const v = str(form, key);
  if (v === "") {
    throw new ValidationError({ [key]: `${label} wajib diisi.` });
  }
  if (v.length > max) {
    throw new ValidationError({ [key]: `${label} maksimal ${max} karakter.` });
  }
  return v;
}

/** Teks opsional dengan batas panjang; kosong menjadi null. */
export function optionalText(
  form: FormData,
  key: string,
  label: string,
  max = 5000,
): string | null {
  const v = str(form, key);
  if (v === "") return null;
  if (v.length > max) {
    throw new ValidationError({ [key]: `${label} maksimal ${max} karakter.` });
  }
  return v;
}

/** Ambil satu File dari FormData (null bila tidak ada berkas dipilih). */
export function file(form: FormData, key = "foto"): File | null {
  const v = form.get(key);
  return v instanceof File && v.size > 0 ? v : null;
}
