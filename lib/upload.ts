import { randomBytes } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

/**
 * =========================================================================
 *  Penyimpanan foto hasil upload
 * =========================================================================
 *  Folder penyimpanan dan awalan URL diatur lewat environment variable:
 *    UPLOAD_DIR         folder di disk tempat file ditulis (Docker volume)
 *    UPLOAD_URL_PREFIX  awalan URL publik untuk menyajikan file tersebut
 *    UPLOAD_MAX_BYTES   batas ukuran file
 *
 *  Yang disimpan di database adalah URL PUBLIK (mis. "/media/8f3a.jpg"),
 *  bukan path absolut di disk. Dengan begitu data tetap valid walau dipindah
 *  ke host atau environment lain.
 *
 *  Keamanan:
 *   - Nama file dibuat sendiri dengan randomBytes, TIDAK PERNAH mem pakai
 *     nama file dari user (mencegah path traversal dan penimpaan file).
 *   - Extension dan MIME type dibatasi hanya ke format gambar.
 *   - Ukuran dibatasi.
 *   - File hanya boleh ditulis di dalam UPLOAD_DIR.
 */

function envInt(name: string, fallback: number) {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/** Folder di disk tempat file ditulis. Default: /app/public/uploads */
export const UPLOAD_DIR =
  process.env.UPLOAD_DIR?.trim() || "/app/public/uploads";

/** Awalan URL publik. Default: /media */
export const UPLOAD_URL_PREFIX = (
  process.env.UPLOAD_URL_PREFIX?.trim() || "/media"
).replace(/\/+$/, "");

/** Batas ukuran file. Default 5 MB. */
export const UPLOAD_MAX_BYTES = envInt("UPLOAD_MAX_BYTES", 5 * 1024 * 1024);

/** Format gambar yang diizinkan, ditentukan dari MIME type. */
const ALLOWED: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/avif": ".avif",
};

export type UploadResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

/**
 * Simpan berkas HANYA bila benar-benar ada berkas yang dipilih.
 *
 * Membedakan dua kondisi yang sering tertukar:
 *  - tidak ada berkas dipilih  -> OKE, url = null (foto bersifat opsional)
 *  - berkas dipilih tapi salah -> GAGAL, kembalikan pesan untuk ditampilkan
 *
 * Memakai saveUpload() langsung untuk form yang foto-nya opsional akan salah,
 * karena file() null akan dianggap "tidak ada berkas" yang berupa error.
 */
export async function uploadIfPresent(
  file: File | null | undefined,
): Promise<UploadResult | { ok: true; url: null }> {
  if (!file || file.size === 0) {
    return { ok: true, url: null };
  }
  return saveUpload(file);
}

/**
 * Simpan satu file gambar.
 * Mengembalikan URL publiknya, atau pesan error yang aman ditampilkan ke user.
 */
export async function saveUpload(
  file: File | null | undefined,
): Promise<UploadResult> {
  if (!file || file.size === 0) {
    return { ok: false, error: "Tidak ada berkas yang dipilih." };
  }

  if (file.size > UPLOAD_MAX_BYTES) {
    const mb = (UPLOAD_MAX_BYTES / (1024 * 1024)).toFixed(1);
    return { ok: false, error: `Ukuran berkas melebihi ${mb} MB.` };
  }

  const ext = ALLOWED[file.type];
  if (!ext) {
    return {
      ok: false,
      error: "Format berkas tidak didukung. Gunakan JPG, PNG, WEBP, GIF, atau AVIF.",
    };
  }

  // Nama file acak: tidak memuat input user sama sekali.
  const name = `${Date.now().toString(36)}-${randomBytes(8).toString("hex")}${ext}`;

  const baseDir = resolve(UPLOAD_DIR);
  const target = resolve(join(baseDir, name));
  if (target !== join(baseDir, name)) {
    return { ok: false, error: "Lokasi penyimpanan tidak valid." };
  }

  const bytes = Buffer.from(await file.arrayBuffer());

  try {
    await mkdir(baseDir, { recursive: true });
    await writeFile(target, bytes, { mode: 0o644 });
  } catch {
    return { ok: false, error: "Gagal menyimpan berkas di server." };
  }

  return { ok: true, url: `${UPLOAD_URL_PREFIX}/${name}` };
}

/**
 * Hapus file lama ketika diganti. Sengaja diam-diam mengabaikan kegagalan:
 * Berkas yang gagal dihapus tidak boleh membatalkan proses update database.
 */
export async function deleteUpload(url: string | null | undefined) {
  if (!url) return;

  const name = fileNameFromUrl(url);
  if (!name) return;

  const baseDir = resolve(UPLOAD_DIR);
  const target = resolve(join(baseDir, name));
  if (target !== join(baseDir, name)) return;

  try {
    await unlink(target);
  } catch {
    // Berkas memang tidak ada — tidak masalah.
  }
}

/**
 * Ambil nama file dari URL publik. Mengembalikan null bila URL itu bukan
 * milik folder upload kita, sehingga Delete tidak pernah menyentuh file lain.
 */
export function fileNameFromUrl(url: string): string | null {
  if (!url.startsWith(`${UPLOAD_URL_PREFIX}/`)) return null;

  const name = url.slice(UPLOAD_URL_PREFIX.length + 1);
  if (!name || name.includes("/") || name.includes("..")) return null;
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(name)) return null;

  const ext = name.slice(name.lastIndexOf("."));
  if (!Object.values(ALLOWED).includes(ext.toLowerCase())) return null;

  return name;
}
