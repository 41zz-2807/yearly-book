import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  poweredByHeader: false,

  // Prisma Client + query engine tidak ikut ter-trace otomatis oleh Next.js,
  // sehingga WAJIB ditambahkan eksplisit agar image standalone tidak gagal
  // saat runtime dengan "Cannot find module @prisma/client" atau
  // "Query engine was not found".
  // Di Next.js 15.5 opsi ini sudah top-level (bukan lagi di `experimental`).
  outputFileTracingIncludes: {
    "/**": [
      "./node_modules/@prisma/client/**",
      "./node_modules/.prisma/client/**",
      "./node_modules/prisma/**",
      "./prisma/schema.prisma",
      // Export PDF memakai @react-pdf/renderer yang di dalamnya bergantung
      // pada pdfkit + fontkit. Keduanya memuat data yang HANYA bisa ditemukan
      // saat runtime (bukan via import statis), jadi tidak ter-trace otomatis:
      //   - pdfkit/js/standard-fonts/*.cjs  -> data font Times/Helvetica/Courier
      //   - pdfkit/js/data/*.afm            -> metrik font
      //   - fontkit                         -> parser font TrueType/OpenType
      // Tanpa include di bawah, build sukses tetapi route /api/export gagal
      // saat runtime dengan:
      //   "Cannot find module '/app/node_modules/pdfkit/js/standard-fonts/Helvetica.cjs'"
      "./node_modules/pdfkit/**",
      "./node_modules/fontkit/**",
    ],
  },
};

export default nextConfig;
