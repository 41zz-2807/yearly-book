import { NextResponse } from "next/server";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";
import { join, resolve } from "node:path";

import { UPLOAD_DIR, UPLOAD_MAX_BYTES } from "@/lib/upload";

/**
 * Route penyaji foto hasil upload.
 *
 * Kenapa tidak mengandalkan file statis di `public/`?
 * Next.js menyusun daftar file `public/` saat server start, sehingga file yang
 * baru diunggah SESUDAH container berjalan dibalas 404 di mode produksi.
 * Route ini membaca disk pada setiap request, jadi upload langsung tersedia di
 * dev maupun produksi, dan tidak hilang saat container di-recreate karena
 * foldernya berada di Docker volume.
 *
 * Foto bersifat publik (dipakai halaman buku yang publik), jadi route ini
 * sengaja TIDAK memerlukan login. Yang dilindungi adalah foldernya: nama file
 * divalidasi dengan allowlist ketat dan hasil resolve dipastikan tetap di dalam
 * UPLOAD_DIR, sehingga mustahil keluar folder lewat path traversal.
 */

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".avif": "image/avif",
};

/** Nama file hanya boleh huruf, angka, titik, dan strip. */
const SAFE_NAME = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await params;

  // Hanya nama file satu tingkat. Tidak menerima subdirektori.
  const name = segments.length === 1 ? segments[0] : "";
  if (!SAFE_NAME.test(name)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const ext = name.slice(name.lastIndexOf(".")).toLowerCase();
  const contentType = CONTENT_TYPES[ext];
  if (!contentType) {
    return new NextResponse("Not found", { status: 404 });
  }

  const baseDir = resolve(UPLOAD_DIR);
  const filePath = resolve(join(baseDir, name));
  if (filePath !== join(baseDir, name)) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const info = await stat(filePath);
    if (!info.isFile() || info.size === 0) {
      return new NextResponse("Not found", { status: 404 });
    }
    if (info.size > UPLOAD_MAX_BYTES) {
      return new NextResponse("File terlalu besar", { status: 413 });
    }

    return new NextResponse(Readable.toWeb(createReadStream(filePath)) as ReadableStream, {
      headers: {
        "content-type": contentType,
        "content-length": String(info.size),
        // Nama file mengandung hash random, jadi aman di-cache lama.
        "cache-control": "public, max-age=31536000, immutable",
        "x-content-type-options": "nosniff",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
