#!/bin/sh
# =============================================================================
#  dev-start.sh — preflight + migrate + seed, lalu jalankan Next.js dev server
# =============================================================================
#
#  Dipakai sebagai CMD stage `development` di Dockerfile, sehingga
#  `docker compose up --build` cukup SENDIRI untuk membuat aplikasi yang
#  benar-benar jalan: tidak perlu langkah migrate atau seed terpisah.
#
#  Urutan yang dijaga di sini:
#    1. Preflight env   — pastikan AUTH_SECRET & kredensial admin ada.
#    2. Migrate         —WAJIB. Tanpa ini aplikasi balas 500 (Prisma P2021
#                         "table does not exist") karena volume SQLite masih
#                         kosong pada instalasi baru.
#    3. Generate Client — Prisma Client harus sinkron dengan schema.
#    4. Seed (opsional) — hanya bila database benar-benar belum pernah diisi.
#    5. Dev server.
#
#  Yang SENGAJA tidak dilakukan:
#  - Seed TIDAK pernah ditulis di atas data yang sudah ada. Syaratnya adalah
#    tabel `Setting` masih kosong, dan tabel `Setting` tidak punya tombol hapus
#    di /admin, jadi "kosong" berarti "instalasi baru", bukan "user sengaja
#    mengosongkan".
#  - Tidak ada kredensial yang ditulis di source code. Username & password
#    yang dibuat di sini di-generate acak saat itu juga, dicetak satu kali ke
#    log, dan hanya hash-nya yang disimpan.
#
#  POSIX sh (bukan bash) supaya tidak bergantung pada bash di image Alpine.
# =============================================================================

set -eu

ENV_FILE="${ENV_FILE:-/app/.env}"
APP_DIR="${APP_DIR:-/app}"

log() { printf '[dev-start] %s\n' "$*"; }
die() {
  printf '[dev-start] ERROR: %s\n' "$*" >&2
  exit 1
}

cd "$APP_DIR"

# -----------------------------------------------------------------------------
#  1. PREFLIGHT — pastikan file .env siap dibaca Compose pada run BERIKUTNYA.
# -----------------------------------------------------------------------------
# Kenapa ini menulis ke .env dan bukan hanya menampaikan variabel: Docker
# Compose membaca `env_file` satu kali, saat container dibuat. Nilai yang kita
# generate di sini tidak akan tersedia bagi container yang sedang berjalan
# pada boot berikutnya, dan Auth.js akan gagal dengan MissingSecret. Jadi
# nilainya perlu persisted agar stabil.
#
# Fungsi ini TIDAK pernah menimpa nilai yang sudah terisi. Yang kosong baru
# diisi. `set_env` membuat file bila belum ada, dan mengganti baris key yang
# ada tapi nilainya kosong.
set_env() {
  _key="$1"
  _val="$2"
  _tmp="${TMPDIR:-/tmp}/env-devstart.$$"

  if [ ! -f "$ENV_FILE" ]; then
    {
      printf '# Dibuat otomatis oleh scripts/dev-start.sh pada %s\n' \
        "$(date -u '+%Y-%m-%d %H:%M:%S UTC')"
      printf '# Edit file ini untuk mengubah username/password admin, lalu jalankan:\n'
      printf '#   docker compose up -d --force-recreate app\n'
      printf '\n'
    } >"$ENV_FILE"
  fi

  if grep -q "^${_key}=\"\?[^\"]" "$ENV_FILE" 2>/dev/null; then
    # Key ada dan SUDAH terisi -> jangan sentuh.
    return 0
  fi

  awk -v key="$_key" -v val="$_val" '
    $0 ~ "^" key "=" { print key "=\"" val "\""; next }
    { print }
  ' "$ENV_FILE" >"$_tmp"

  # Key tidak ada sama sekali -> tambahkan di akhir.
  if ! grep -q "^${_key}=" "$_tmp" 2>/dev/null; then
    printf '%s="%s"\n' "$_key" "$_val" >>"$_tmp"
  fi

  cat "$_tmp" >"$ENV_FILE"
  rm -f "$_tmp"
  chmod 600 "$ENV_FILE" 2>/dev/null || true
  log "${_key} diisi otomatis (belum ada di ${ENV_FILE})."
}

# Baca satu nilai dari .env, tanpa tanda kutip. Dipakai setelah set_env supaya
# nilai yang baru ditulis benar-benar diekspor ke proses di bawahnya.
read_env() {
  grep "^$1=" "$ENV_FILE" 2>/dev/null | head -1 | cut -d= -f2- | tr -d '"'
}

# DATABASE_URL. Default-nya menunjuk ke dalam Docker volume, bukan ke host,
# supaya file .db tidak pernah bocor ke mesin lewat bind mount. User boleh
# mengubahnya sendiri, jadi hanya diisi bila kosong.
if [ -z "${DATABASE_URL:-}" ]; then
  set_env DATABASE_URL "file:/data/dev.db"
  DATABASE_URL="file:/data/dev.db"
  export DATABASE_URL
fi

if [ -z "${AUTH_SECRET:-}" ]; then
  set_env AUTH_SECRET "$(node -e "process.stdout.write(require('crypto').randomBytes(32).toString('base64url'))")"
  # Ekspor juga supaya container yang SEKARANG jalan ikut memakainya.
  AUTH_SECRET="$(read_env AUTH_SECRET)"
  export AUTH_SECRET
fi

# AUTH_TRUST_HOST wajib true: aplikasi ada di belakang reverse proxy.
if [ "${AUTH_TRUST_HOST:-}" != "true" ]; then
  set_env AUTH_TRUST_HOST "true"
  AUTH_TRUST_HOST="true"
  export AUTH_TRUST_HOST
fi

# AUTH_URL. Wajib diisi hanya bila aplikasi diakses lewat domain publik; untuk
# dev lokal, Auth.js akan memakai URL dari Host request. Tapi "Host request"
# berarti header `Host` yang dikirim browser, yaitu port yang DIPUBLISH di host
# (8003), bukan port internal container (3000). Kalau dikosongkan, Auth.js
# jatuh ke http://localhost:3000 dan mengarahkan user ke alamat yang tidak
# terjangkau dari host.
#
# Port dipublish dibaca dari docker-compose.yml supaya angka ini tidak
# diduplikasi di dua tempat dan tetap benar kalau portnya diubah.
if [ -z "${AUTH_URL:-}" ]; then
  PUBLISHED_PORT="$(awk '
    /^  [a-zA-Z0-9_-]+:[[:space:]]*$/ { svc=$1; sub(/:$/, "", svc) }
    svc=="app" && /^    ports:[[:space:]]*$/ { inports=1; next }
    inports && /^      - / { line=$0; sub(/^[^0-9]*/, "", line); split(line, a, ":"); print a[1]; exit }
    inports && /^    [a-zA-Z]/ { inports=0 }
  ' "$APP_DIR/docker-compose.yml" 2>/dev/null || true)"
  [ -n "$PUBLISHED_PORT" ] || PUBLISHED_PORT="8003"

  set_env AUTH_URL "http://localhost:${PUBLISHED_PORT}"
  AUTH_URL="http://localhost:${PUBLISHED_PORT}"
  export AUTH_URL
  log "AUTH_URL diisi otomatis untuk dev lokal: ${AUTH_URL}"
  log "Ganti dengan domain publik bila aplikasi diakses lewat reverse proxy."
fi

# URL untuk ditampilkan di notice. Hanya untuk pesan log, bukan request.
if [ -n "${AUTH_URL:-}" ]; then
  LOGIN_URL="${AUTH_URL%/}/login"
else
  LOGIN_URL="http://localhost:8003/login"
fi

# Username + password admin.
#
# Tidak ada credential yang tersimpan di source code: username dan password
# di-generate acak saat ini juga kalau .env belum mengisinya. Password hanya
# dicetak ke log container (selalu ada di `docker compose logs`), ke file
# tidak pernah — .env hanya menerima hash-nya.
if [ -z "${AUTH_ADMIN_USERNAME:-}" ] || [ -z "${AUTH_ADMIN_PASSWORD_HASH_B64:-}" ]; then
  # Alphabet tanpa karakter yang mudah tertukar saat diketik ulang
  # (tanpa O/0, I/l, 1). 18 karakter hex = 72 bit, cukup untuk satu admin.
  rand_str() {
    node -e "
const a='abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
let s='';for(let i=0;i<18;i++)s+=a[Math.floor(Math.random()*a.length)];
process.stdout.write(s);
"
  }

  if [ -z "${AUTH_ADMIN_USERNAME:-}" ]; then
    NEW_USER="admin$(rand_str | cut -c1-6)"
    set_env AUTH_ADMIN_USERNAME "$NEW_USER"
    AUTH_ADMIN_USERNAME="$NEW_USER"
    export AUTH_ADMIN_USERNAME
    unset NEW_USER
  fi

  NEW_PASSWORD=""
  if [ -z "${AUTH_ADMIN_PASSWORD_HASH_B64:-}" ]; then
    NEW_PASSWORD="$(rand_str)"
    set_env AUTH_ADMIN_PASSWORD_HASH_B64 \
      "$(AUTH_ADMIN_PASSWORD="$NEW_PASSWORD" node scripts/hash-password.mjs \
         | grep '^AUTH_ADMIN_PASSWORD_HASH_B64=' | cut -d= -f2- | tr -d '"')"
    # WAJIB baca balik dari file lalu export. `export NAMA` tanpa assign hanya
    # mengekspor nilai LAMA (yang kosong) — proses dev server tidak akan
    # pernah melihat hash baru, dan login gagal dengan
    # "AUTH_ADMIN_PASSWORD_HASH_B64 belum di-set".
    AUTH_ADMIN_PASSWORD_HASH_B64="$(read_env AUTH_ADMIN_PASSWORD_HASH_B64)"
    export AUTH_ADMIN_PASSWORD_HASH_B64
  fi

  # Box ASCII, bukan garis ┌─┐, supaya panjang kolomnya tidak pernah meleset
  # akibat nilai yang dicetak varying. printf dipakai agar rata-kiri selalu.
  cat <<'NOTICE'

  -------------------------------------------------------------------
   KREDENSIAL ADMIN -- SIMPAN SEKARANG, DITAMPILKAN SEKALI
  -------------------------------------------------------------------
NOTICE
  printf '   URL       : %s\n' "$LOGIN_URL"
  printf '   Username  : %s\n' "$AUTH_ADMIN_USERNAME"
  if [ -n "$NEW_PASSWORD" ]; then
    printf '   Password  : %s\n' "$NEW_PASSWORD"
  else
    printf '   Password  : (password yang sudah ada, tidak dicetak ulang)\n'
  fi
  cat <<'NOTICE'

   Username & hash password sudah disimpan di .env (tidak di-commit).
   Ubah password kapan saja:
       ./scripts/reset-admin-password.sh
NOTICE

  # Jangan biarkan password menggantung di environment child.
  NEW_PASSWORD=""
fi

# -----------------------------------------------------------------------------
#  2. MIGRATE — wajib, dan harus SEBELUM server membaca database.
# -----------------------------------------------------------------------------
# `migrate deploy` (bukan `migrate dev`): yang dev bisa membuat migration
# baru secara interaktif, sedangkan yang di sini hanya menerapkan yang sudah
# ada. Aman diulang — migration yang sudah terlanjur applied dilewati.
log "Menerapkan migrasi database..."
npm run --silent db:deploy || die "Migrasi gagal. Lihat pesan di atas."

# -----------------------------------------------------------------------------
#  3. GENERATE Prisma Client
# -----------------------------------------------------------------------------
log "Menyiapkan Prisma Client..."
npm run --silent db:generate || die "prisma generate gagal."

# -----------------------------------------------------------------------------
# 4. SEED — hanya untuk database yang belum pernah diisi.
# -----------------------------------------------------------------------------
# Yang diperiksa adalah tabel `Setting`, bukan "semua tabel kosong". Tabel itu
# tidak punya tombol hapus di /admin, jadi `Setting` kosong berarti instalasi
# baru — bukan user yang sengaja mengosongkan data. Dengan begitu menghapus
# siswa atau prestasi lewat /admin tidak akan memicu seed ulang.
PERLU_SEED="$(node -e "
const {PrismaClient}=require('@prisma/client');
const p=new PrismaClient();
p.setting.count()
  .then(n=>{process.stdout.write(n===0?'1':'0');})
  .catch(()=>{process.stdout.write('0');})
  .finally(()=>p.\$disconnect());
")"

if [ "$PERLU_SEED" = "1" ]; then
  log "Database kosong — memuat data contoh..."
  npm run --silent db:seed || die "Seed gagal. Lihat pesan di atas."
  log "Data contoh dimuat. Hapus lewat /admin bila tidak diperlukan."
fi

# -----------------------------------------------------------------------------
#  5. DEV SERVER
# -----------------------------------------------------------------------------
log "Menjalankan Next.js dev server di port ${PORT:-3000}..."
exec npm run dev
