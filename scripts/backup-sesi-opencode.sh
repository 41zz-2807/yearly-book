#!/usr/bin/env bash
#
# Backup sesi opencode untuk project ini, dan siapkan cara melanjutkannya
# lagi nanti.
#
# Yang dikerjakan:
#   1. Cari sesi opencode TERAKHIR untuk direktori project ini.
#   2. Export ke <project>/sesi-opencode.json  (backup, tidak ikut commit)
#   3. Tulis <project>/SESI-INI.txt            (berisi perintah copy-paste)
#   4. Pastikan .gitignore mengabaikan kedua file itu
#   5. Verifikasi file export bisa dibaca sebagai JSON yang valid
#
# SCRIPT INI PORTABEL. Untuk project lain, cukup salin ke scripts/ dan jalankan
# dari root project itu:
#     cp yearly-book/scripts/backup-sesi-opencode.sh /path/project/scripts/
#     cd /path/project && ./scripts/backup-sesi-opencode.sh
#
# Perintah untuk melanjutkan sesi:
#     opencode -s <SESSION_ID>
#
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."
PROJECT_DIR="$(pwd)"

readonly EXPORT_FILE="sesi-opencode.json"
readonly NOTE_FILE="SESI-INI.txt"
readonly GITIGNORE=".gitignore"

die() { printf 'Error: %s\n' "$1" >&2; exit 1; }
info() { printf '  %s\n' "$1"; }

command -v opencode >/dev/null 2>&1 || die "opencode tidak ditemukan di PATH."

# Lokasi database sesi. Boleh di-override lewat env.
OC_DATA="${OPENCODE_DATA_DIR:-$HOME/.local/share/opencode}"
DB_PATH="$OC_DATA/opencode.db"
[ -f "$DB_PATH" ] || die "Database sesi tidak ditemukan: $DB_PATH"
[ -d "$OC_DATA" ] || die "Direktori data opencode tidak ditemukan: $OC_DATA"

# ---------------------------------------------------------------------------
# 1. Cari sesi terakhir untuk direktori ini
# ---------------------------------------------------------------------------
# opencode menulis ke SQLite dalam mode WAL, jadi file .db BELUM tentu berisi
# data terbaru. Kita salin .db beserta -wal dan -shm, lalu buka salinan itu.
# SQLite akan mereplay WAL sendiri, sehingga ID sesi yang baru saja diperbarui
# ikut terbaca.
TMP_DIR=$(mktemp -d "${TMPDIR:-/tmp}/oc-sesi.XXXXXX")
trap 'rm -rf "$TMP_DIR"' EXIT

cp "$DB_PATH" "$TMP_DIR/oc.db"
for suffix in -wal -shm; do
  [ -f "${DB_PATH}${suffix}" ] && cp "${DB_PATH}${suffix}" "$TMP_DIR/oc.db${suffix}"
done
# -wal boleh tidak ada / kosong;BIarkan sqlite yang memutuskan.
true

# IFS WAJIB tab saja. Dengan IFS default (spasi+tab+newline), judul sesi
# yang mengandung spasi akan memecah baris jadi beberapa kolom.
# Judul sudah dinormalisasi jadi satu baris oleh python di atas.
IFS=$'\t' read -r SESSION_ID SESSION_TITLE SESSION_WHEN SESSION_COUNT < <(
  python3 - "$TMP_DIR/oc.db" "$PROJECT_DIR" <<'PY'
import sqlite3, sys, datetime, json

db_path, project_dir = sys.argv[1], sys.argv[2]
con = sqlite3.connect(db_path)
con.row_factory = sqlite3.Row

# Cocokkan path dengan longkap / tanpa slash di akhir.
rows = con.execute(
    """
    SELECT id, title, directory, time_updated FROM session
    WHERE directory = ? OR directory = ?
    ORDER BY time_updated DESC
    """,
    (project_dir, project_dir.rstrip("/")),
).fetchall()

if not rows:
    sys.exit(3)

row = rows[0]
count = con.execute(
    "SELECT COUNT(*) FROM message WHERE session_id = ?", (row["id"],)
).fetchone()[0]

# Opencode menyimpan waktu dalam milidetik epoch, dalam UTC.
when = datetime.datetime.fromtimestamp(
    row["time_updated"] / 1000, datetime.timezone.utc
).astimezone().strftime("%Y-%m-%d %H:%M %Z")

# Judul bisa mengandung spasi/newline, jadi normalkan jadi satu baris.
title = " ".join((row["title"] or "(tanpa judul)").split())

print(f'{row["id"]}\t{title}\t{when}\t{count}')
PY
) || {
  if [ "$?" = "3" ]; then
    die "Tidak ada sesi opencode untuk direktori ini:
       $PROJECT_DIR
       Sesi mungkin dijalankan dari direktori lain."
  fi
  die "Gagal membaca database sesi."
}

[ -n "$SESSION_ID" ] || die "Session ID kosong."
info "Sesi ditemukan : $SESSION_ID"
info "Judul          : $SESSION_TITLE"
info "Terakhir diubah: $SESSION_WHEN"
info "Jumlah pesan   : $SESSION_COUNT"

# ---------------------------------------------------------------------------
# 2. Export
# ---------------------------------------------------------------------------
info "Mengekspor ke $EXPORT_FILE ..."
if ! opencode export "$SESSION_ID" >"$EXPORT_FILE.tmp" 2>/dev/null; then
  rm -f "$EXPORT_FILE.tmp"
  die "opencode export gagal."
fi
mv "$EXPORT_FILE.tmp" "$EXPORT_FILE"

SIZE_HUMAN=$(du -h "$EXPORT_FILE" | cut -f1)
info "Ukuran         : $SIZE_HUMAN"

# Validasi JSON. Guard: file kosong / terpotong = backup tidak berguna.
if ! python3 -c "import json,sys; json.load(open(sys.argv[1]))" "$EXPORT_FILE" 2>/dev/null; then
  rm -f "$EXPORT_FILE"
  die "File export bukan JSON yang valid - backup dibatalkan."
fi

# ---------------------------------------------------------------------------
# 3. Tulis catatan sesi
# ---------------------------------------------------------------------------
# Cocokkan blok bertanda agar aman di-update berkali-kali.
{
  cat <<EOF
=========================================================================
  LANJUT SESI OPENCODE - $(basename "$PROJECT_DIR")
=========================================================================

  SID SESI INI : $SESSION_ID
  PROJECT     : $PROJECT_DIR
  JUDUL       : $SESSION_TITLE
  PESAN       : $SESSION_COUNT   (terakhir diubah $SESSION_WHEN)

  Backup penuh (JSON, $SIZE_HUMAN): $EXPORT_FILE

-------------------------------------------------------------------------
  CARA LANJUT - salin baris ini, tempel di terminal:

      opencode -s $SESSION_ID

  Sesi kembali dengan seluruh riwayat chat.
-------------------------------------------------------------------------

  VARIASI
  -------------------------------------------------------------------------

  Jadi salinan, sesi asli tidak ikut berubah:
      opencode --fork -s $SESSION_ID

  Lanjut sesi terakhir yang aktif:
      opencode -c

  Buka lebih cepat, konteks lebih pendek (lewati riwayat mini):
      opencode --no-replay -s $SESSION_ID

  Di dalam TUI: Ctrl+_ lalu pilih sesi
  (koma = sesi terakhir, Shift+Tab = daftar sesi).


-------------------------------------------------------------------------
  JANGAN LUPA: perbarui file ini tiap selesai sesi
-------------------------------------------------------------------------

  Session ID di atas hanya berlaku untuk obrolan yang sudah tercatat
  sekarang. Kalau sesi dipecah atau dilanjutkan dengan 'opencode -c',
  ID-nya bisa berubah.

  Perbarui dengan:
      ./scripts/backup-sesi-opencode.sh

  Melihat sesi yang tersedia:
      opencode session list

  Cadangan dari script ini: $EXPORT_FILE
  Jangan dihapus unless. Restore bila session hilang:
      opencode import $EXPORT_FILE


-------------------------------------------------------------------------
  KALAU SESI TIDAK DITEMUKAN
-------------------------------------------------------------------------

  1. Cari ID yang benar:
         opencode session list

  2. Kalau memang tidak ada, jangan menebak. Mulai sesi baru di root
     project lalu suruh agent membaca dokumentasi yang tersedia di
     project ini (mis. AGENTS.md).
EOF
} >"$NOTE_FILE"

# ---------------------------------------------------------------------------
# 4. Pastikan .gitignore menutupi kedua file
# ---------------------------------------------------------------------------
IGNORE_HAVE=0
if [ -f "$GITIGNORE" ]; then
  for pattern in "/$EXPORT_FILE" "/$NOTE_FILE"; do
    grep -qxF "$pattern" "$GITIGNORE" && IGNORE_HAVE=1
  done
fi

if [ "$IGNORE_HAVE" -eq 0 ]; then
  {
    printf '\n# opencode session backup (jangan ikut commit)\n'
    printf '/%s\n' "$EXPORT_FILE"
    printf '/%s\n' "$NOTE_FILE"
  } >>"$GITIGNORE"
  info ".gitignore diperbarui"
else
  info ".gitignore sudah benar"
fi

printf '\n'
printf '  Sesi sudah di-backup.\n\n'
printf '    Backup : %s (%s)\n' "$EXPORT_FILE" "$SIZE_HUMAN"
printf '    Catatan: %s\n' "$NOTE_FILE"
printf '    Lanjut : opencode -s %s\n\n' "$SESSION_ID"
