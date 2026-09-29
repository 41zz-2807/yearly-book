import React from "react";
import { Document } from "@react-pdf/renderer";

import {
  PdfCover,
  PdfSambutan,
  PdfFotoKelas,
  PdfProfil,
  PdfKenangan,
  PdfWaliKelas,
  PdfPrestasi,
  PdfPenutup,
} from "./pdf-chapters";
import type { BookData } from "@/components/book/book-data";

/**
 * Dokumen PDF buku annual.
 *
 * A4 portrait. Urutan bagian mengikuti urutan halaman buku:
 *   Cover · Sambutan · Foto Kelas · Profil Siswa (3/halaman)
 *   Kenangan Seru · Wali Kelas · Prestasi Kelas · Penutup
 *
 * Data masuk lewat props (hasil fetch di route handler), komponen ini tidak
 * menyentuh database maupun request.
 */
export function YearbookPdf({
  data,
  fotoKelas,
  siswaImgs,
  kegiatanImgs,
  waliImgs,
}: {
  data: BookData;
  /** Foto kelas, sudah diubah jadi data URI oleh route handler. */
  fotoKelas: { uri: string } | null;
  /** Peta id -> data URI, untuk siswa / kegiatan / wali kelas. */
  siswaImgs: Map<number, { uri: string } | null>;
  kegiatanImgs: Map<number, { uri: string } | null>;
  waliImgs: Map<number, { uri: string } | null>;
}) {
  return (
    <Document
      title={data.setting?.namaKelas ?? "Buku Annual"}
      author={data.setting?.sekolah ?? "Buku Annual"}
      subject="Buku Annual"
      creator="yearly-book"
      producer="yearly-book"
    >
      <PdfCover setting={data.setting} img={fotoKelas} />
      <PdfSambutan setting={data.setting} wali={data.waliKelas[0]} />
      <PdfFotoKelas setting={data.setting} img={fotoKelas} />
      <PdfProfil
        siswa={data.siswa}
        imgs={siswaImgs}
        namaKelas={data.setting?.namaKelas}
      />
      <PdfKenangan kegiatan={data.kegiatan} imgs={kegiatanImgs} />
      <PdfWaliKelas waliKelas={data.waliKelas} imgs={waliImgs} />
      <PdfPrestasi prestasi={data.prestasi} />
      <PdfPenutup setting={data.setting} />
    </Document>
  );
}
