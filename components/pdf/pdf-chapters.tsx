import React from "react";
import { Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

import {
  A4,
  PDF_COLORS as C,
  PDF_FONTS as F,
  PAGE_PADDING,
  PDF_PROFIL_PER_PAGE,
} from "@/lib/pdf/theme";

/**
 * Gaya hasil StyleSheet.create. Paket @react-pdf tidak mengekspor tipe
 * `Style` dari entry point-nya, jadi tipenya diambil dari nilai balik
 * StyleSheet.create agar tetap type-safe tanpa `any`.
 */
type PdfStyle = ReturnType<typeof StyleSheet.create>[keyof ReturnType<
  typeof StyleSheet.create
>];
import type { BookData } from "@/components/book/book-data";

/**
 * ==========================================================================
 *  Bab-bab PDF (A4 portrait)
 * ==========================================================================
 *  Komponen ini HANYA untuk @react-pdf/renderer — bukan komponen web.
 *  Primitifnya (`Page`, `Text`, `View`, `Image`) punya gaya berbasis StyleSheet
 *  dan sama sekali tidak seperti Tailwind, jadi tata letaknya ditulis ulang.
 *
 *  Semua isi berasal dari `BookData`, sama seperti halaman web. Tidak ada
 *  teks kelas, nama, atau URL yang ditulis manual di sini.
 *
 *  Urutan bagian sesuai permintaan:
 *    1. Cover            5. Kenangan Seru
 *    2. Sambutan         6. Wali Kelas
 *    3. Foto Kelas       7. Prestasi Kelas
 *    4. Profil Siswa     8. Penutup
 */

type Img = { uri: string } | null;

/* Galeri kegiatan: 3 kolom, tinggi foto tetap proporsional terhadap lebar. */
const GALLERY_COLS = 3;
const GALLERY_GAP = 6;
const CONTENT_W = A4.width - PAGE_PADDING * 2;
/**
 * Floor dipakai supaya total lebar 3 kolom + gap tidak pernah menyentuh
 * (atau melewati) lebar area konten. Tanpa itu, perhitungan pecahan
 * menghasilkan 0.01pt kelebihan dan kolom ketiga jatuh ke halaman berikut.
 */
const GALLERY_COL_W = Math.floor(
  (CONTENT_W - GALLERY_GAP * (GALLERY_COLS - 1)) / GALLERY_COLS,
);

const s = StyleSheet.create({
  page: {
    padding: PAGE_PADDING,
    fontFamily: F.sans,
    fontSize: 10,
    color: C.ink900,
    backgroundColor: C.paper,
  },

  /* ----------(header bab ---------- */
  kicker: {
    fontFamily: F.sansBold,
    fontSize: 7.5,
    letterSpacing: 2,
    color: C.emerald600,
    textTransform: "uppercase",
  },
  chapterTitle: {
    fontFamily: F.serif,
    fontSize: 19,
    marginTop: 3,
    color: C.emerald900,
  },
  chapterDesc: {
    fontSize: 8.5,
    marginTop: 2,
    color: C.ink500,
  },
  headerRule: {
    height: 1,
    marginTop: 8,
    marginBottom: 12,
    backgroundColor: C.emerald200,
  },

  /* ---------- cubierta ---------- */
  cover: {
    padding: PAGE_PADDING,
    backgroundColor: C.emerald800,
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
  },
  coverKicker: {
    fontFamily: F.sansBold,
    fontSize: 8,
    letterSpacing: 4,
    color: C.gold400,
    textTransform: "uppercase",
  },
  coverTitle: {
    fontFamily: F.serif,
    fontSize: 30,
    lineHeight: 1.2,
    marginTop: 10,
    color: C.paper,
  },
  coverDivider: {
    width: 70,
    height: 1,
    marginVertical: 14,
    backgroundColor: C.gold400,
  },
  coverSubtitle: {
    fontFamily: F.sans,
    fontSize: 11,
    color: C.emerald100,
  },
  coverFrame: {
    marginTop: 22,
    width: 260,
    padding: 6,
    borderWidth: 1,
    borderColor: C.gold400,
    backgroundColor: C.emerald900,
  },
  coverPhoto: { width: 248, height: 186, objectFit: "cover" },
  coverPhotoEmpty: {
    width: 248,
    height: 186,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.emerald950,
    borderWidth: 1,
    borderColor: C.emerald700,
    borderStyle: "dashed",
  },
  coverPhotoEmptyText: { fontSize: 8, color: C.emerald200 },
  coverCaption: { fontSize: 7.5, marginTop: 5, color: C.emerald200 },
  coverQuote: {
    fontFamily: F.serifItalic,
    fontSize: 9,
    marginTop: 18,
    maxWidth: 340,
    lineHeight: 1.5,
    color: C.emerald100,
  },

  /* ---------- foto kelas ---------- */
  photoBox: {
    height: 300,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.emerald50,
    borderWidth: 1,
    borderColor: C.emerald200,
  },
  photoBoxImg: { width: 480, height: 300, objectFit: "cover" },
  photoBoxEmpty: { fontSize: 9, color: C.emerald600 },

  /* ---------- kartu profil ---------- */
  cardRow: { flexDirection: "row", gap: 10 },
  card: {
    flex: 1,
    borderWidth: 1,
    borderColor: C.emerald200,
    backgroundColor: C.paperSoft,
  },
  cardPhoto: { width: "100%", height: 168, objectFit: "cover" },
  cardPhotoEmpty: {
    width: "100%",
    height: 168,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.emerald50,
  },
  cardInitials: { fontFamily: F.serif, fontSize: 34, color: C.emerald600 },
  /**
   * PENTING: jangan pakai `flex: 1` di sini.
   * Dengan `flex: 1` dan `wrap={false}` pada kartunya, @react-pdf/renderer
   * membuang seluruh isi yang melebihi tinggi halaman — bukan memotong visual,
   * tapi benar-benar TIDAK ditulis ke PDF (cita-cita, motto, dan surat
   * lenyap). Isi kartu sekarang diukur agar muat, bukan dipaksa mengisi.
   */
  cardBody: { padding: 10 },
  cardName: { fontFamily: F.serif, fontSize: 13, color: C.emerald900 },
  cardJob: {
    fontSize: 9.5,
    marginTop: 3,
    color: C.sky600,
  },
  cardMotto: {
    fontFamily: F.serifItalic,
    fontSize: 9.5,
    marginTop: 7,
    lineHeight: 1.45,
    color: C.ink700,
  },
  cardLetterBox: {
    marginTop: 9,
    padding: 9,
    backgroundColor: C.paperWarm,
    borderLeftWidth: 2,
    borderLeftColor: C.gold400,
  },
  cardLetterLabel: {
    fontFamily: F.sansBold,
    fontSize: 7,
    letterSpacing: 1,
    color: C.gold600,
    textTransform: "uppercase",
  },
  cardLetter: { fontSize: 8.8, marginTop: 4, lineHeight: 1.5, color: C.ink700 },

  /* ---------- galeri ---------- */
  /**
   * Galeri memakai margin, BUKAN `gap`.
   * `@react-pdf/renderer` mengombinasikan `flexWrap` + `gap` secara tidak
   * konsisten: dengan gap, kolom ketiga yang muat pas batas lebar malah
   * terlempar ke baris berikutnya sehingga 9 foto pecah 8 + 1.
   * Margin eksplisit membuat penempatan kolom sepenuhnya ditentukan.
   */
  gallery: { flexDirection: "row", flexWrap: "wrap" },
  // Lebar kolom galeri dihitung dari lebar A4, bukan persen: dengan persen +
  // gap,totalnya pernah melewati lebar area dan kolom ketiga melebar ke
  // halaman berikutnya.
  shot: { width: GALLERY_COL_W, borderWidth: 1, borderColor: C.emerald200, marginBottom: 8 },
  shotSpacer: { width: GALLERY_GAP },
  shotImg: { width: "100%", height: 122, objectFit: "cover" },
  shotImgEmpty: {
    width: "100%",
    height: 122,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.emerald50,
  },
  shotCaption: { padding: 7, fontFamily: F.serif, fontSize: 9, color: C.emerald900 },
  shotCaptionEmpty: { padding: 7, fontSize: 9, color: C.ink500 },

  /* ---------- wali kelas ---------- */
  waliRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: C.emerald200,
    backgroundColor: C.paperSoft,
    marginBottom: 12,
  },
  waliPhoto: { width: 104, height: 104, borderRadius: 52 },
  waliPhotoEmpty: {
    width: 104,
    height: 104,
    borderRadius: 52,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.emerald600,
  },
  waliInitials: { fontFamily: F.serif, fontSize: 24, color: C.paper },
  waliLabel: {
    fontFamily: F.sansBold,
    fontSize: 6.5,
    letterSpacing: 1.4,
    color: C.gold600,
    textTransform: "uppercase",
  },
  waliName: { fontFamily: F.serif, fontSize: 19, marginTop: 3, color: C.emerald900 },
  waliMsg: { fontSize: 11, marginTop: 6, lineHeight: 1.55, color: C.ink700 },

  /* ---------- prestasi ---------- */
  medal: {
    flexDirection: "row",
    gap: 9,
    padding: 12,
    borderWidth: 1,
    borderColor: C.emerald200,
    backgroundColor: C.paperSoft,
    marginBottom: 9,
  },
  medalBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.gold400,
  },
  medalNum: { fontFamily: F.serifBold, fontSize: 8.5, color: C.ink950 },
  medalTitle: { fontFamily: F.sansBold, fontSize: 11.5, color: C.emerald900 },
  medalDesc: { fontSize: 9.5, marginTop: 3, lineHeight: 1.45, color: C.ink700 },

  /* ---------- penutup ---------- */
  closing: {
    padding: PAGE_PADDING,
    backgroundColor: C.emerald800,
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
  },
  closingText: {
    fontFamily: F.serif,
    fontSize: 14,
    lineHeight: 1.6,
    maxWidth: 380,
    color: C.paper,
  },
  closingDivider: {
    width: 80,
    height: 1,
    marginVertical: 18,
    backgroundColor: C.gold400,
  },
  closingName: { fontFamily: F.serif, fontSize: 14, color: C.paper },
  closingMeta: { fontSize: 9, marginTop: 3, color: C.emerald100 },

  /* ---------- utility ---------- */
  empty: {
    padding: 22,
    alignItems: "center",
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: C.emerald200,
    backgroundColor: C.emerald50,
  },
  emptyText: { fontSize: 9.5, color: C.emerald800 },
  footer: {
    position: "absolute",
    bottom: 18,
    left: PAGE_PADDING,
    right: PAGE_PADDING,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7,
    color: C.ink300,
  },
  footerBrand: { fontFamily: F.serif, color: C.emerald600 },
});

/* ==========================================================================
 *  Helper
 * ========================================================================== */
function years(angkatan: number) {
  return { masuk: angkatan, lulus: angkatan + 6 };
}

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

/** Bingkai foto + placeholder bila foto belum diunggah. */
function Frame({
  image,
  style,
  emptyStyle,
  emptyText,
  initialsText,
  initStyle,
}: {
  image: Img;
  /** Boleh array gaya: react-pdf menerima kombinasi, mis. untuk overriding height. */
  style: PdfStyle | PdfStyle[];
  emptyStyle: PdfStyle | PdfStyle[];
  emptyText?: string;
  initialsText?: string;
  initStyle?: PdfStyle | PdfStyle[];
}) {
  if (image) return React.createElement(Image, { src: image, style });
  return React.createElement(
    View,
    { style: emptyStyle },
    initialsText
      ? React.createElement(Text, { style: initStyle }, initialsText)
      : React.createElement(Text, { style: initStyle }, emptyText ?? "-"),
  );
}

/** Kepala bab + aturan pemisah. */
function Head({
  kicker,
  title,
  description,
}: {
  kicker: string;
  title: string;
  description?: string;
}) {
  return (
    <>
      <Text style={s.kicker}>{kicker}</Text>
      <Text style={s.chapterTitle}>{title}</Text>
      {description ? <Text style={s.chapterDesc}>{description}</Text> : null}
      <View style={s.headerRule} />
    </>
  );
}

/** Nomor halaman di kaki. */
function Foot({ text }: { text?: string }) {
  return (
    <View style={s.footer} fixed>
      <Text style={s.footerBrand}>{text ?? "Buku Annual"}</Text>
      <Text
        render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
      />
    </View>
  );
}

/* ==========================================================================
 *  1 — Cover
 * ========================================================================== */
export function PdfCover({
  setting,
  img,
}: {
  setting: BookData["setting"];
  img: Img;
}) {
  return (
    <Page size="A4" orientation="portrait" style={s.cover}>
      {setting ? (
        <>
          <Text style={s.coverKicker}>Buku Annual</Text>
          <Text style={s.coverTitle}>{setting.namaKelas}</Text>
          <View style={s.coverDivider} />
          <Text style={s.coverSubtitle}>
            {setting.sekolah} · Angkatan {years(setting.angkatan).masuk} (
            {years(setting.angkatan).masuk}/{years(setting.angkatan).lulus})
          </Text>

          <View style={s.coverFrame}>
            {img ? (
              // eslint-disable-next-line jsx-a11y/alt-text
              <Image src={img} style={s.coverPhoto} />
            ) : (
              <View style={s.coverPhotoEmpty}>
                <Text style={s.coverPhotoEmptyText}>
                  Foto kelas belum diisi
                </Text>
              </View>
            )}
          </View>
          <Text style={s.coverCaption}>
            {setting.namaKelas} · {setting.sekolah}
          </Text>

          {setting.sambutan ? (
            <Text style={s.coverQuote}>“{trim(setting.sambutan, 220)}”</Text>
          ) : null}
        </>
      ) : (
        <>
          <Text style={s.coverKicker}>Buku Annual</Text>
          <Text style={s.coverTitle}>Data kelas belum diisi</Text>
          <Text style={s.coverSubtitle}>
            Isi data kelas melalui halaman admin.
          </Text>
        </>
      )}
    </Page>
  );
}

/* ==========================================================================
 *  2 — Sambutan
 * ========================================================================== */
export function PdfSambutan({
  setting,
  wali,
}: {
  setting: BookData["setting"];
  wali: BookData["waliKelas"][number] | undefined;
}) {
  const y = setting ? years(setting.angkatan) : null;
  return (
    <Page size="A4" orientation="portrait" style={s.page}>
      <Head
        kicker="Bab Dua"
        title="Sambutan"
        description={
          setting ? `${setting.sekolah} · ${setting.namaKelas}` : undefined
        }
      />
      {setting?.sambutan ? (
        <>
          {paragraphs(setting.sambutan).map((p, i) => (
            <Text key={i} style={{ fontFamily: F.serif, fontSize: 10.5, lineHeight: 1.7, marginBottom: 8, color: C.ink900 }}>
              {p}
            </Text>
          ))}
          <View style={s.coverDivider} />
          <Text style={{ textAlign: "center", fontFamily: F.sansBold, fontSize: 7, letterSpacing: 1.6, color: C.emerald600, textTransform: "uppercase" }}>
            Wali Kelas
          </Text>
          {wali ? (
            <>
              <Text style={{ textAlign: "center", fontFamily: F.serif, fontSize: 13, marginTop: 3, color: C.emerald900 }}>
                {wali.nama}
              </Text>
              <Text style={{ textAlign: "center", fontSize: 8, marginTop: 2, color: C.ink500 }}>
                {setting?.sekolah} · {y ? `${y.masuk}/${y.lulus}` : ""}
              </Text>
            </>
          ) : null}
        </>
      ) : (
        <View style={s.empty}>
          <Text style={s.emptyText}>Sambutan belum diisi.</Text>
        </View>
      )}
      <Foot />
    </Page>
  );
}

/* ==========================================================================
 *  3 — Foto Kelas
 * ========================================================================== */
export function PdfFotoKelas({
  setting,
  img,
}: {
  setting: BookData["setting"];
  img: Img;
}) {
  return (
    <Page size="A4" orientation="portrait" style={s.page}>
      <Head
        kicker="Bab Tiga"
        title="Foto Kelas"
        description={setting ? setting.namaKelas : undefined}
      />
      <View style={s.photoBox}>
        {img ? (
          // eslint-disable-next-line jsx-a11y/alt-text
          <Image src={img} style={s.photoBoxImg} />
        ) : (
          <Text style={s.photoBoxEmpty}>Foto kelas belum diisi</Text>
        )}
      </View>
      <Foot />
    </Page>
  );
}

/* ==========================================================================
 *  4 — Profil Siswa (3 per halaman)
 * ========================================================================== */
export function PdfProfil({
  siswa,
  imgs,
  namaKelas,
}: {
  siswa: BookData["siswa"];
  imgs: Map<number, Img>;
  namaKelas: string | undefined;
}) {
  if (siswa.length === 0) {
    return (
      <Page size="A4" orientation="portrait" style={s.page}>
        <Head kicker="Bab Empat" title="Profil Siswa" />
        <View style={s.empty}>
          <Text style={s.emptyText}>Belum ada data siswa.</Text>
        </View>
        <Foot />
      </Page>
    );
  }

  const chunks: (typeof siswa)[] = [];
  for (let i = 0; i < siswa.length; i += PDF_PROFIL_PER_PAGE) {
    chunks.push(siswa.slice(i, i + PDF_PROFIL_PER_PAGE));
  }

  return (
    <>
      {chunks.map((chunk, ci) => (
        <Page size="A4" orientation="portrait" style={s.page} key={ci}>
          <Head
            kicker="Bab Empat"
            title="Profil Siswa"
            description={`${namaKelas ? `${namaKelas} · ` : ""}${(ci + 1) * PDF_PROFIL_PER_PAGE > siswa.length ? siswa.length : (ci + 1) * PDF_PROFIL_PER_PAGE} dari ${siswa.length}`}
          />
          <View style={s.cardRow}>
            {chunk.map((m) => (
              <View style={s.card} key={m.id}>
                <Frame
                  image={imgs.get(m.id) ?? null}
                  style={s.cardPhoto}
                  emptyStyle={s.cardPhotoEmpty}
                  initialsText={initials(m.nama)}
                  initStyle={s.cardInitials}
                />
                <View style={s.cardBody}>
                  <Text style={s.cardName}>{m.nama}</Text>
                  {m.citaCita ? (
                    <Text style={s.cardJob}>{m.citaCita}</Text>
                  ) : null}
                  {m.pesan ? (
                    <Text style={s.cardMotto}>“{m.pesan}”</Text>
                  ) : null}
                  <View style={s.cardLetterBox}>
                    <Text style={s.cardLetterLabel}>
                      Surat untuk Masa Depan
                    </Text>
                    <Text style={s.cardLetter}>
                      {m.suratMasaDepan ?? "Belum menulis surat."}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
          <Foot />
        </Page>
      ))}
    </>
  );
}

/* ==========================================================================
 *  5 — Kenangan Seru
 * ========================================================================== */
export function PdfKenangan({
  kegiatan,
  imgs,
}: {
  kegiatan: BookData["kegiatan"];
  imgs: Map<number, Img>;
}) {
  return (
    <Page size="A4" orientation="portrait" style={s.page}>
      <Head
        kicker="Bab Lima"
        title="Kenang Seru"
        description={`${kegiatan.length} kenangan dari sepanjang tahun`}
      />
      {kegiatan.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyText}>Belum ada foto kegiatan.</Text>
        </View>
      ) : (
        <View style={s.gallery}>
          {kegiatan.map((f, i) => {
            const img = imgs.get(f.id) ?? null;
            return (
              <View
                key={f.id}
                wrap={false}
                style={[
                  s.shot,
                  // Kolom ke-3 tiap baris tidak diberi margin kanan.
                  // `false` (bukan null) karena react-pdf menolak null di array gaya.
                  ...((i + 1) % GALLERY_COLS === 0
                    ? []
                    : [{ marginRight: GALLERY_GAP }]),
                ]}
              >
                <Frame
                  image={img}
                  style={[s.shotImg, { height: GALLERY_COL_W * 0.72 }]}
                  emptyStyle={[s.shotImgEmpty, { height: GALLERY_COL_W * 0.72 }]}
                  emptyText="Foto belum diisi"
                  initStyle={{ fontSize: 7, color: C.emerald600 }}
                />
                <Text style={f.caption ? s.shotCaption : s.shotCaptionEmpty}>
                  {f.caption ?? "Tanpa keterangan"}
                </Text>
              </View>
            );
          })}
        </View>
      )}
      <Foot />
    </Page>
  );
}

/* ==========================================================================
 *  6 — Wali Kelas
 * ========================================================================== */
export function PdfWaliKelas({
  waliKelas,
  imgs,
}: {
  waliKelas: BookData["waliKelas"];
  imgs: Map<number, Img>;
}) {
  return (
    <Page size="A4" orientation="portrait" style={s.page}>
      <Head
        kicker="Bab Enam"
        title="Wali Kelas"
        description="Pembimbing yang menemani sepanjang tahun"
      />
      {waliKelas.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyText}>Belum ada data wali kelas.</Text>
        </View>
      ) : (
        waliKelas.map((w) => {
          const img = imgs.get(w.id) ?? null;
          return (
            <View style={s.waliRow} key={w.id} wrap={false}>
              <Frame
                image={img}
                style={s.waliPhoto}
                emptyStyle={s.waliPhotoEmpty}
                initialsText={initials(w.nama)}
                initStyle={s.waliInitials}
              />
              <View style={{ flex: 1 }}>
                <Text style={s.waliLabel}>Wali Kelas</Text>
                <Text style={s.waliName}>{w.nama}</Text>
                {w.pesan ? (
                  <Text style={s.waliMsg}>“{w.pesan}”</Text>
                ) : null}
              </View>
            </View>
          );
        })
      )}
      <Foot />
    </Page>
  );
}

/* ==========================================================================
 *  7 — Prestasi Kelas
 * ========================================================================== */
export function PdfPrestasi({ prestasi }: { prestasi: BookData["prestasi"] }) {
  return (
    <Page size="A4" orientation="portrait" style={s.page}>
      <Head
        kicker="Bab Tujuh"
        title="Prestasi Kelas"
        description={`${prestasi.length} prestasi`}
      />
      {prestasi.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyText}>Belum ada data prestasi.</Text>
        </View>
      ) : (
        prestasi.map((p) => (
          <View style={s.medal} key={p.id} wrap={false}>
            <View style={s.medalBadge}>
              <Text style={s.medalNum}>{p.urutan}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.medalTitle}>{p.judul}</Text>
              {p.deskripsi ? (
                <Text style={s.medalDesc}>{p.deskripsi}</Text>
              ) : null}
            </View>
          </View>
        ))
      )}
      <Foot />
    </Page>
  );
}

/* ==========================================================================
 *  8 — Penutup
 * ========================================================================== */
export function PdfPenutup({ setting }: { setting: BookData["setting"] }) {
  const y = setting ? years(setting.angkatan) : null;
  return (
    <Page size="A4" orientation="portrait" style={s.closing}>
      {setting?.penutup ? (
        <>
          <Text style={s.closingText}>“{setting.penutup}”</Text>
          <View style={s.closingDivider} />
          <Text style={s.closingName}>{setting.namaKelas}</Text>
          <Text style={s.closingMeta}>
            {setting.sekolah}
            {y ? ` · ${y.masuk}/${y.lulus}` : ""}
          </Text>
        </>
      ) : (
        <Text style={s.closingText}>Kalimat penutup belum diisi.</Text>
      )}
    </Page>
  );
}

function paragraphs(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}

function trim(text: string, max: number) {
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
}
