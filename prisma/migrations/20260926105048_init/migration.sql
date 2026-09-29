-- CreateTable
CREATE TABLE "Setting" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "namaKelas" TEXT NOT NULL,
    "sekolah" TEXT NOT NULL,
    "angkatan" INTEGER NOT NULL,
    "tahun" INTEGER NOT NULL,
    "sambutan" TEXT NOT NULL,
    "penutup" TEXT NOT NULL,
    "fotoKelas" TEXT
);

-- CreateTable
CREATE TABLE "Siswa" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nama" TEXT NOT NULL,
    "citaCita" TEXT,
    "pesan" TEXT,
    "suratMasaDepan" TEXT,
    "foto" TEXT,
    "urutan" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "FotoKegiatan" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "urutan" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "WaliKelas" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nama" TEXT NOT NULL,
    "foto" TEXT,
    "pesan" TEXT
);

-- CreateTable
CREATE TABLE "Prestasi" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "judul" TEXT NOT NULL,
    "deskripsi" TEXT,
    "foto" TEXT,
    "urutan" INTEGER NOT NULL DEFAULT 0
);

-- CreateIndex
CREATE INDEX "Setting_tahun_idx" ON "Setting"("tahun");

-- CreateIndex
CREATE INDEX "Siswa_urutan_idx" ON "Siswa"("urutan");

-- CreateIndex
CREATE INDEX "FotoKegiatan_urutan_idx" ON "FotoKegiatan"("urutan");

-- CreateIndex
CREATE INDEX "Prestasi_urutan_idx" ON "Prestasi"("urutan");
