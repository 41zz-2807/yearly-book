-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_FotoKegiatan" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "url" TEXT,
    "caption" TEXT,
    "urutan" INTEGER NOT NULL DEFAULT 0
);
INSERT INTO "new_FotoKegiatan" ("caption", "id", "url", "urutan") SELECT "caption", "id", "url", "urutan" FROM "FotoKegiatan";
DROP TABLE "FotoKegiatan";
ALTER TABLE "new_FotoKegiatan" RENAME TO "FotoKegiatan";
CREATE INDEX "FotoKegiatan_urutan_idx" ON "FotoKegiatan"("urutan");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
