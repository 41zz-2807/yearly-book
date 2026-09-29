/**
 * Palet & ukuran untuk PDF.
 *
 * Nilainya MIRROR dari `app/globals.css` (blok @theme). File CSS tidak bisa
 * di-import ke TypeScript, jadi warna ditulis ulang di sini.
 *
 * Untuk menjaga keduanya tetap sinkron, ubah SELALU di globals.css dulu,
 * lalu samakan di sini. Warna brand yang dirujuk:
 *   Emerald #0F766E · Sky #60B5D6 · White #FFFFFF · Golden Yellow #F4C430
 */
export const PDF_COLORS = {
  emerald50: "#ECFDF9",
  emerald100: "#D2F5EF",
  emerald200: "#A8EADF",
  emerald400: "#37BCAB",
  /** BRAND */
  emerald500: "#149E90",
  /** BRAND */
  emerald600: "#0F766E",
  emerald700: "#0C5D57",
  emerald800: "#09443F",
  emerald900: "#06302D",
  emerald950: "#03201E",

  sky50: "#F1F9FD",
  sky100: "#DDF0F8",
  /** BRAND */
  sky400: "#60B5D6",
  sky600: "#3580A6",
  sky800: "#275671",

  /** BRAND */
  gold400: "#F4C430",
  gold100: "#FDF3C9",
  gold200: "#FBE694",
  gold600: "#B78C16",

  paper: "#FFFFFF",
  paperSoft: "#F4FAF9",
  paperWarm: "#FDFAF0",

  ink300: "#A4BDBE",
  ink500: "#527E80",
  ink700: "#345153",
  ink900: "#16302F",
  ink950: "#0A1F1E",
} as const;

/**
 * Font.
 *
 * Hanya memakai font bawaan PDF (Times-Roman, Helvetica) supaya tidak ada
 * berkas font yang perlu di-host dan tidak ada permintaan jaringan saat
 * merender. Times dipakai untuk judul agar bernuansa elegan ala buku annual,
 * Helvetica untuk teks isi.
 */
export const PDF_FONTS = {
  serif: "Times-Roman",
  serifBold: "Times-Bold",
  serifItalic: "Times-Italic",
  serifBoldItalic: "Times-BoldItalic",
  sans: "Helvetica",
  sansBold: "Helvetica-Bold",
  sansOblique: "Helvetica-Oblique",
} as const;

/** Ukuran A4 portrait dalam poin. */
export const A4 = { width: 595.28, height: 841.89 } as const;

/** Margin halaman A4 dalam poin. */
export const PAGE_PADDING = 40;

/** Jumlah siswa per halaman pada bagian Profil. */
export const PDF_PROFIL_PER_PAGE = 3;
