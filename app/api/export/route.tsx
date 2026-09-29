import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";

import { getBookData } from "@/components/book/book-data";
import { YearbookPdf } from "@/components/pdf/yearbook-pdf";

export const dynamic = "force-dynamic";

/**
 * GET /api/export — unduh buku annual sebagai PDF A4 portrait.
 *
 * Mengembalikan berkas langsung (bukan halaman HTML), jadi tombol unduh di
 * navigasi buku bisa memakai `download` atribut `<a>` biasa.
 *
 * Catatan Teknis:
 *  - Gambar diambil dari route `/media` milik aplikasi sendiri lalu diubah jadi
 *    data URI lebih dulu. Alasannya: @react-pdf/renderer hanya menerima data
 *    URI atau path filesystem, bukan URL relatif. Dengan begitu PDF tidak
 *    bergantung pada URL eksternal maupun host yang sedang diakses.
 *  - Kegagalan memuat satu gambar tidak menggagalkan seluruh PDF; kolomnya
 *    akan menampilkan placeholder.
 *  - Batas ukuran per gambar menjaga agar PDF tidak meledak ukurannya.
 */

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

export async function GET(request: Request) {
  const started = Date.now();

  const data = await getBookData(1);

  const origin = new URL(request.url).origin;

  const [fotoKelas, siswaImgs, kegiatanImgs, waliImgs] = await Promise.all([
    toImage(data.setting?.fotoKelas ?? null, origin),
    mapImages(data.siswa, origin),
    mapImages(data.kegiatan, origin),
    mapImages(data.waliKelas, origin),
  ]);

  const buffer = await renderToBuffer(
    <YearbookPdf
      data={data}
      fotoKelas={fotoKelas}
      siswaImgs={siswaImgs}
      kegiatanImgs={kegiatanImgs}
      waliImgs={waliImgs}
    />,
  );

  const filename = `${slug(data.setting?.namaKelas ?? "buku-annual")}.pdf`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="${filename}"`,
      "content-length": String(buffer.byteLength),
      "cache-control": "no-store",
      "x-render-ms": String(Date.now() - started),
    },
  });
}

/**
 * Ambil satu gambar dan ubah jadi data URI.
 * URL diberikan relatif terhadap `origin` aplikasi — tidak ada host yang
 * ditulis manual di sini.
 */
async function toImage(
  url: string | null,
  origin: string,
): Promise<{ uri: string } | null> {
  if (!url) return null;

  try {
    const absolute = url.startsWith("http") ? url : new URL(url, origin).toString();
    const res = await fetch(absolute, { cache: "no-store" });
    if (!res.ok) return null;

    const type = res.headers.get("content-type") ?? "";
    if (!type.startsWith("image/")) return null;

    const bytes = new Uint8Array(await res.arrayBuffer());
    if (bytes.byteLength === 0 || bytes.byteLength > MAX_IMAGE_BYTES) return null;

    return { uri: `data:${type};base64,${Buffer.from(bytes).toString("base64")}` };
  } catch {
    return null;
  }
}

/** Bangun peta id -> data URI untuk sekumpulan baris yang punya kolom foto. */
async function mapImages(
  rows: { id: number; foto?: string | null; url?: string | null }[],
  origin: string,
): Promise<Map<number, { uri: string } | null>> {
  const out = new Map<number, { uri: string } | null>();
  await Promise.all(
    rows.map(async (row) => {
      const src = row.foto ?? row.url ?? null;
      out.set(row.id, await toImage(src, origin));
    }),
  );
  return out;
}

/** Nama berkas aman: huruf, angka, dan strip saja. */
function slug(text: string) {
  const cleaned = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return cleaned || "buku-annual";
}
