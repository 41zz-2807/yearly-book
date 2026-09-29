"use client";

import { useFormStatus } from "react-dom";

/* ==========================================================================
   Komponen form admin yang dipakai bersama oleh semua halaman CRUD.
   Sengaja tanpa dependensi form library.

   Gaya isian, tombol, dan pemberitahuan memakai kelas design system
   (`.ds-input`, `.ds-alert-*`) yang didefinisikan di app/globals.css, supaya
   halaman admin, halaman login, dan buku publik tidak drifting.
   ========================================================================== */

/** Isian formulir. Ganti kelas ini, semua isian ikut berubah. */
const FIELD = "ds-input";
const LABEL = "mb-1 block text-xs font-medium text-ink-300";
const ERROR = "mt-1 text-xs text-red-400";

/** Penanda kolom wajib pada label. */
const REQUIRED_MARK = (
  <>
    <span aria-hidden="true" className="text-gold-400">
      {" "}
      *
    </span>
    <span className="sr-only"> (wajib diisi)</span>
  </>
);

export function Field({
  label,
  name,
  defaultValue,
  required,
  type = "text",
  error,
  placeholder,
  maxLength,
  inputMode,
}: {
  label: string;
  name: string;
  defaultValue?: string | number | null;
  required?: boolean;
  type?: string;
  error?: string;
  placeholder?: string;
  maxLength?: number;
  inputMode?: "numeric" | "text";
}) {
  return (
    <div>
      <label className={LABEL} htmlFor={name}>
        {label}
        {required ? REQUIRED_MARK : null}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        maxLength={maxLength}
        inputMode={inputMode}
        aria-invalid={error ? true : undefined}
        className={FIELD}
      />
      {error ? <p className={ERROR}>{error}</p> : null}
    </div>
  );
}

export function Textarea({
  label,
  name,
  defaultValue,
  required,
  rows = 4,
  error,
  maxLength,
  placeholder,
  hint,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  required?: boolean;
  rows?: number;
  error?: string;
  maxLength?: number;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <div>
      <label className={LABEL} htmlFor={name}>
        {label}
        {required ? REQUIRED_MARK : null}
      </label>
      <textarea
        id={name}
        name={name}
        rows={rows}
        required={required}
        defaultValue={defaultValue ?? ""}
        maxLength={maxLength}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        className={`${FIELD} resize-y`}
      />
      {hint ? <p className="mt-1 text-xs text-ink-500">{hint}</p> : null}
      {error ? <p className={ERROR}>{error}</p> : null}
    </div>
  );
}

/**
 * Input berkas. Menampilkan pratinjau gambar bila sudah ada. Berkas lama hanya diganti
 * bila ada berkas baru yang dipilih; menghapus berkas dilakukan lewat
 * tombol terpisah di luar input ini.
 */
export function FileField({
  label,
  name,
  currentUrl,
  error,
  hint,
}: {
  label: string;
  name: string;
  currentUrl?: string | null;
  error?: string;
  hint?: string;
}) {
  return (
    <div>
      <span className={LABEL}>{label}</span>

      {currentUrl ? (
        // URL dari database, bukan input pengguna.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={currentUrl}
          alt="Pratinjau berkas saat ini"
          className="mb-2 h-24 w-24 rounded-lg border border-ink-700 object-cover"
        />
      ) : null}

      <input
        id={name}
        name={name}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
        className="block w-full text-xs text-ink-400 file:mr-3 file:rounded-[var(--radius-card)] file:border-0 file:bg-ink-800 file:px-3 file:py-2 file:text-xs file:font-medium file:text-ink-100 hover:file:bg-ink-700"
      />

      {hint ? <p className="mt-1 text-xs text-ink-500">{hint}</p> : null}
      {error ? <p className={ERROR}>{error}</p> : null}
    </div>
  );
}

export function SubmitButton({
  children,
  variant = "primary",
  className = "",
}: {
  children: React.ReactNode;
  variant?: "primary" | "danger" | "ghost";
  className?: string;
}) {
  const { pending } = useFormStatus();

  const styles = {
    primary: "bg-emerald-600 text-white hover:bg-emerald-500",
    danger: "bg-red-900/70 text-red-200 hover:bg-red-800",
    ghost: "border border-ink-700 text-ink-300 hover:bg-ink-800 hover:text-white",
  }[variant];

  return (
    <button
      type="submit"
      disabled={pending}
      className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${styles} ${className}`}
    >
      {pending ? "Memproses…" : children}
    </button>
  );
}

/** Panel error validasi / error umum. */
export function FormError({ error, fieldErrors }: { error?: string; fieldErrors?: Record<string, string> }) {
  if (!error && !fieldErrors) return null;
  return (
    <p role="alert" className="ds-alert ds-alert-error">
      {error ?? "Periksa kembali isian yang ditandai."}
    </p>
  );
}

/** Panel sukses (dipakai untuk hasil redirect lewat query param). */
export function Flash({ code }: { code?: string }) {
  if (!code) return null;

  const message: Record<string, string> = {
    saved: "Data berhasil ditambahkan.",
    updated: "Perubahan berhasil disimpan.",
    deleted: "Data berhasil dihapus.",
    moved: "Urutan berhasil diperbarui.",
  };
  const text = message[code];
  if (!text) return null;

  return (
    <p role="status" className="ds-alert ds-alert-success">
      {text}
    </p>
  );
}

/** Tombol kecil untuk baris tabel (naik/turun/hapus). */
export function RowButton({
  children,
  title,
  variant = "ghost",
}: {
  children: React.ReactNode;
  title: string;
  variant?: "ghost" | "danger";
}) {
  const { pending } = useFormStatus();
  const styles =
    variant === "danger"
      ? "border-red-900 text-red-300 hover:bg-red-950 hover:text-red-200"
      : "border-ink-700 text-ink-300 hover:bg-ink-800 hover:text-white";

  return (
    <button
      type="submit"
      title={title}
      aria-label={title}
      disabled={pending}
      className={`rounded-md border px-2 py-1 text-xs transition-colors disabled:opacity-50 ${styles}`}
    >
      {children}
    </button>
  );
}
