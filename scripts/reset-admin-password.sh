#!/usr/bin/env bash
#
# Reset password admin (AUTH_ADMIN_USERNAME) tanpa menginstall apa pun di host.
#
# Yang dikerjakan script ini:
#   1. Membaca password baru secara tersembunyi (tidak tampil di layar,
#      tidak masuk shell history).
#   2. Menghasilkan hash bcrypt di dalam container lewat scripts/hash-password.mjs.
#   3. Mencadangkan .env, lalu mengganti baris AUTH_ADMIN_PASSWORD_HASH_B64.
#   4. Me-recreate container supaya environment barunya terbaca.
#   5. Memverifikasi password baru benar-benar cocok dengan hash yang terpasang.
#
# Password asli TIDAK PERNAH ditulis ke file mana pun. Yang tersimpan di .env
# hanya hash bcrypt-nya (base64), sama seperti saat setup awal.
#
# Cara pakai:
#   ./scripts/reset-admin-password.sh
#   ./scripts/reset-admin-password.sh --password 'password-baru'
#
set -euo pipefail

# Selalu jalankan dari root project, apa pun direktori pemanggil.
cd "$(dirname "${BASH_SOURCE[0]}")/.."

ENV_FILE=".env"
readonly ENV_KEY="AUTH_ADMIN_PASSWORD_HASH_B64"
readonly ENV_PATTERN="^${ENV_KEY}="
readonly MIN_LEN=8
readonly MAX_LEN=72   # batas native bcrypt; lebih dari itu dipotong diam-diam

# Service yang akan di-recreate setelah .env berubah.
SERVICE="app"

# `docker compose run/exec/up` untuk service produksi perlu profilnya.
compose() {
  if [ "$SERVICE" = "app-prod" ]; then
    docker compose --profile prod "$@"
  else
    docker compose "$@"
  fi
}

die() {
  printf 'Error: %s\n' "$1" >&2
  exit 1
}

info() {
  printf '  %s\n' "$1"
}

# ---------------------------------------------------------------------------
# 1. Prasyarat
# ---------------------------------------------------------------------------
command -v docker >/dev/null 2>&1 || die "docker tidak ditemukan di PATH."
docker compose version >/dev/null 2>&1 || die "docker compose v2 tidak tersedia."
docker info >/dev/null 2>&1 || die "Tidak bisa menghubungi Docker daemon."
[ -f "$ENV_FILE" ] || die "$ENV_FILE tidak ditemukan. Jalankan dari root project."
grep -qE "$ENV_PATTERN" "$ENV_FILE" \
  || die "Baris ${ENV_KEY} tidak ada di ${ENV_FILE}."

# ---------------------------------------------------------------------------
# 2. Ambil password baru
# ---------------------------------------------------------------------------
# PENTING: fungsi ini wajib assigns ke variabel global NEW_PASSWORD, BUKAN
# mencetak hasilnya.
#
# Versi sebelumnya memakai `NEW_PASSWORD=$(read_password_interactive)`. Di
# dalam command substitution, stdout diarahkan ke pipe, sehingga
# `printf 'Password baru ...'` ikut terserap ke dalam variabel dan tidak
# pernah tampil di layar. Digabung `read -s` yang mematikan echo, terminal
# hanya menampilkan kursor berkedip tanpa prompt apa pun. Lebih buruk, variabel
# berisi teks prompt + password, jadi password yang terpasang menjadi
# "Password baru (minimal 8 karakter): <yang diketik>" yang mustahil
# diketik ulang.
#
# Karena itu: tanpa command substitution, dan semua prompt ditulis langsung ke
# /dev/tty supaya tidak bisa ikut ter-capture.
NEW_PASSWORD=""

# Tulis ke /dev/tty bila tersedia, supaya prompt selalu terlihat.
# Kalau tidak ada TTY (cron, pipe, IDE), pesan error tetap informatif.
prompt() {
  if [ -t 1 ]; then
    printf '%s' "$1"
  else
    printf '%s' "$1" >&2
  fi
}

read_from_tty() {
  # Berhenti dengan pesan jelas, bukan error mentah dari bash.
  if [ ! -r /dev/tty ] || ! { : >/dev/tty; } 2>/dev/null; then
    die "Tidak ada terminal (TTY) untuk membaca password.
       Jalankan script ini langsung di terminal interaktif, atau pakai mode
       non-interaktif:
         ./scripts/reset-admin-password.sh --password 'password-baru'"
  fi
  IFS= read -r -s "$1" </dev/tty || die "Gagal membaca input dari terminal."
}

ask_password() {
  local first second len ans
  while :; do
    prompt "Password baru (minimal ${MIN_LEN} karakter): "
    read_from_tty first
    prompt $'\nUlangi password            : '
    read_from_tty second
    prompt $'\n'

    [ -n "$first" ] || { info "Password tidak boleh kosong."; continue; }
    [ "$first" = "$second" ] || { info "Dua password tidak sama."; continue; }

    len=$(printf '%s' "$first" | wc -c)
    [ "$len" -ge "$MIN_LEN" ] \
      || die "Password terlalu pendek ($len karakter, minimal $MIN_LEN)."
    [ "$len" -le "$MAX_LEN" ] \
      || die "Password terlalu panjang ($len karakter, maksimal $MAX_LEN)."

    # Peringatan ringan, bukan penghalang.
    if [ "$len" -lt 12 ] || [[ ! "$first" =~ [0-9] ]]; then
      info "Disarankan minimal 12 karakter dan mengandung angka."
      prompt "Tetap lanjut? [y/N] "
      read_from_tty ans
      prompt $'\n'
      case "$ans" in
        [yY] | [yY][eE][sS]) ;;
        *) die "Dibatalkan." ;;
      esac
    fi

    # Assignment ke variabel global, tanpa output apa pun.
    NEW_PASSWORD="$first"
    return 0
  done
}

if [ "${1:-}" = "--password" ]; then
  NEW_PASSWORD="${2:-}"
  [ -n "$NEW_PASSWORD" ] \
    || die "Opsi --password butuh nilai, contoh: --password 'rahasia'."
  shift 2
elif [ -n "${1:-}" ]; then
  die "Argumen tidak dikenal: '$1'. Gunakan --password '<password>'."
else
  ask_password
fi

if [ "${1:-}" = "--service" ]; then
  SERVICE="${2:-}"
  [ -n "$SERVICE" ] || die "Opsi --service butuh nama service, contoh: --service app-prod."
  shift 2
fi
[ $# -eq 0 ] || die "Argumen tidak dikenal: '$1'."

# ---------------------------------------------------------------------------
# 3. Generate hash bcrypt di dalam Docker
# ---------------------------------------------------------------------------
printf '\nMembuat hash bcrypt di dalam container...\n'

# Password dikirim sebagai environment variable ke container (bukan argumen)
# supaya tidak muncul di output `ps` milik host.
GEN_OUTPUT=$(
  compose run --rm -T \
    -e AUTH_ADMIN_PASSWORD="$NEW_PASSWORD" \
    "$SERVICE" npm run --silent auth:hash 2>/dev/null
) || die "Gagal menjalankan hash-password.mjs di dalam container."

# Generator mencetak: AUTH_ADMIN_PASSWORD_HASH_B64="...."
HASH_B64=$(
  printf '%s\n' "$GEN_OUTPUT" \
    | grep -oE "${ENV_KEY}=\"[A-Za-z0-9+/=]+\"" \
    | head -n 1 \
    | sed -e "s/^${ENV_KEY}=\"//" -e 's/"$//'
)
[ -n "$HASH_B64" ] || die "Tidak bisa membaca hash dari output generator."

# ---------------------------------------------------------------------------
# 4. Verifikasi hash SEBELUM dipasang
# ---------------------------------------------------------------------------
# Hash baru dibandingkan dengan password baru memakai bcrypt, persis seperti
# yang dilakukan auth.ts saat login. Kalau di sini sudah gagal, lebih baik
# .env tidak disentuh sama sekali.
printf 'Memverifikasi hash baru...\n'
VERIFY=$(compose run --rm -T \
  -e PW="$NEW_PASSWORD" -e HASH="$HASH_B64" \
  "$SERVICE" node -e '
    const { compareSync } = require("bcryptjs");
    const raw = Buffer.from(process.env.HASH, "base64").toString("utf8");
    process.stdout.write(compareSync(process.env.PW, raw) ? "MATCH" : "MISMATCH");
  ' 2>/dev/null) || die "Gagal menjalankan verifikasi bcrypt di dalam container."

[ "$VERIFY" = "MATCH" ] || die "Verifikasi gagal: password tidak cocok dengan hash. .env tidak diubah."

# ---------------------------------------------------------------------------
# 5. Tulis ke .env (dengan backup)
# ---------------------------------------------------------------------------
BACKUP_FILE="${ENV_FILE}.bak.$(date +%Y%m%d-%H%M%S)"
cp -p "$ENV_FILE" "$BACKUP_FILE"
chmod 600 "$BACKUP_FILE" 2>/dev/null || true

printf 'Memperbarui %s...\n' "$ENV_FILE"

# Pemisah '|' aman: string base64 hanya berisi A-Za-z0-9+/= sehingga tidak
# pernah memunculkan karakter khusus sed (&, \, atau |).
TMP_FILE=$(mktemp "${TMPDIR:-/tmp}/env-reset.XXXXXX")
trap 'rm -f "$TMP_FILE"' EXIT

sed -E "s|${ENV_PATTERN}.*|${ENV_KEY}=\"${HASH_B64}\"|" "$ENV_FILE" >"$TMP_FILE"

# Pastikan baris hasil tulis benar-benar berisi hash baru, dan jumlah baris
# .env tidak berubah (mencegah sed merusak struktur file).
grep -qF "${ENV_KEY}=\"${HASH_B64}\"" "$TMP_FILE" \
  || die "Gagal menulis hash baru. ${ENV_FILE} tidak diubah."
[ "$(wc -l <"$TMP_FILE")" -eq "$(wc -l <"$ENV_FILE")" ] \
  || die "Jumlah baris .env berubah. ${ENV_FILE} tidak diubah."

# Tulis in-place supaya inode dan permission file tidak berubah.
cat "$TMP_FILE" >"$ENV_FILE"
rm -f "$TMP_FILE"
trap - EXIT

# ---------------------------------------------------------------------------
# 6. RECREATE container supaya env_file dibaca ulang
# ---------------------------------------------------------------------------
# Penting: `docker compose restart` TIDAK membaca ulang `env_file`. Container
# yang di-restart masih memakai environment dari saat pertama dibuat, dan
# process env menang atas file .env milik Next.js. Akibatnya .env sudah
# ter-update tapi login tetap memakai hash LAMA.
# Karena itu container harus di-recreate (`up -d --force-recreate`).
printf 'Menciptakan ulang container %s (bukan restart)...\n' "$SERVICE"
compose up -d --force-recreate "$SERVICE" >/dev/null \
  || die "Gagal membuat ulang container ${SERVICE}."

# Tunggu sampai container benar-benar running.
for _ in $(seq 1 60); do
  if compose ps --services --status running 2>/dev/null | grep -qx "$SERVICE"; then
    break
  fi
  sleep 1
done
compose ps --services --status running 2>/dev/null | grep -qx "$SERVICE" \
  || die "Container ${SERVICE} tidak kembali running."

# Sambungkan lagi ke jaringan Cloudflare Tunnel.
#
# Wajib karena tunnel me-resolve origin by NAMA container
# (http://yearly-book-dev:3000), dan koneksi antar-jaringan itu tidak
# ada di docker-compose.yml — jadi ikut hilang setiap kali di-recreate.
# Tanpa langkah ini, domain publik balas 502 padahal lokal tetap 200.
# Script-nya best-effort: dilewati diam-diam bila tunnel tidak dipakai.
printf 'Menyambungkan kembali ke jaringan tunnel...\n'
./scripts/connect-tunnel-network.sh

# ---------------------------------------------------------------------------
# 7. Verifikasi akhir terhadap environment yang BENAR-BENAR dipakai aplikasi
# ---------------------------------------------------------------------------
# auth.ts membaca process.env, bukan file .env. Karena itu yang diuji adalah
# nilai environment di dalam container, supaya tidak ada false positive seperti
# saat .env benar tapi container masih memegang hash lama.
printf 'Memverifikasi password yang terpasang...\n'
FINAL=$(compose exec -T -e PW="$NEW_PASSWORD" "$SERVICE" node -e '
    const { compareSync } = require("bcryptjs");

    // Kosong bila process env tidak ada (mis. produksi tanpa env_file).
    const b64 = process.env.AUTH_ADMIN_PASSWORD_HASH_B64;
    if (!b64) { process.stdout.write("NO_ENV"); process.exit(0); }

    const raw = Buffer.from(b64, "base64").toString("utf8");
    process.stdout.write(compareSync(process.env.PW, raw) ? "MATCH" : "MISMATCH");
  ' 2>/dev/null) || die "Gagal memverifikasi dari dalam container."

case "$FINAL" in
  MATCH) ;;
  NO_ENV)
    die "AUTH_ADMIN_PASSWORD_HASH_B64 tidak ada di environment container. ${SERVICE} mungkin dijalankan tanpa env_file. Backup ada di ${BACKUP_FILE}."
    ;;
  *)
    die "Hash di environment container tidak cocok dengan password baru. Backup ada di ${BACKUP_FILE}."
    ;;
esac

ADMIN_USER=$(grep -oE '^AUTH_ADMIN_USERNAME=.*' "$ENV_FILE" | head -n 1 \
  | sed -e 's/^AUTH_ADMIN_USERNAME=//' -e 's/^"//' -e 's/"$//')

# Buang password dari memory shell setelah tidak dipakai lagi.
NEW_PASSWORD=""

cat <<EOF

  Password admin berhasil diganti dan terverifikasi.

    Username : ${ADMIN_USER}
    Backup   : ${BACKUP_FILE}

  PENTING - hard-refresh browser sebelum login:
    Ctrl+Shift+R  (Chrome/Edge)  atau  Ctrl+Shift+Purge  (Firefox)

  Container tadi sengaja di-recreate supaya .env terbaca, dan itu menghapus
  cache .next. Halaman /login yang SUDAH TERBUKA di browser masih memuat
  Server Action versi lama. Kalau kamu submit dari halaman itu, server membalas
  404 dan muncul:
    "Application error: a client-side exception has occurred"
  Itu bukan password yang salah, cukup hard-refresh lalu login ulang.

  Hapus backup lama bila sudah tidak diperlukan:
    rm ${BACKUP_FILE}

EOF
