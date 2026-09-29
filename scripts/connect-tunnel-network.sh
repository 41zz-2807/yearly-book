#!/usr/bin/env bash
# =============================================================================
#  connect-tunnel-network.sh — sambungkan container app ke jaringan Cloudflare
# =============================================================================
#
#  MASALAH YANG DISELESAIKAN
#
#  Tunnel `yearly.bilmary.my.id` dijalankan dari container terpisah
#  (`tunnel-cloudflared`, project `war-nt-web`) yang resolve origin-nya by NAMA:
#
#      yearly.bilmary.my.id  ->  http://yearly-book-dev:3000
#
#  Nama itu hanya bisa di-resolve kalau kedua container berada di jaringan
#  Docker yang sama. Tapi docker-compose.yml milik project ini hanya mendeklarasikan
#  jaringan default-nya sendiri (`yearly-book_default`). Koneksi ke
#  `war-nt-web_default` karena itu harus dipasang MANUAL:
#
#      docker network connect war-nt-web_default yearly-book-dev
#
#  Koneksi manual itu HILANG setiap kali container di-recreate. Recreate
#  dilakukan oleh `reset-admin-password.sh` dan `docker compose up --build`, dan
#  dua-duanya commonplace. Akibatnya:
#
#      dial tcp: lookup yearly-book-dev on 127.0.0.11:53: server misbehaving
#      -> domain publik balas 502 padahal http://localhost:8003 masih 200
#
#  GEJALANYA MENYESATKAN: aplikasi sehat di lokal, jadi gampang disalahkan ke
#  kode. Padahal penyebabnya murni jaringan.
#
#  KENAPA TIDAK DIDEKLARASIKAN DI docker-compose.yml
#
#  Bisa, tapi declare `external: true` untuk `war-nt-web_default` membuat
#  `docker compose up` GAGAL TOTAL di mesin yang tidak punya jaringan itu —
#  termasuk repo ini kalau di-clone di tempat lain. Script ini sengaja
#  best-effort: melakukan apa-apa kalau jaringan/tunnel tidak ada.
#
#  CARA PAKAI
#      ./scripts/connect-tunnel-network.sh
#      docker compose run --rm app ./scripts/connect-tunnel-network.sh   # dari container
# =============================================================================
set -euo pipefail

NETWORK="${TUNNEL_NETWORK:-war-nt-web_default}"
CONTAINER="${APP_CONTAINER:-yearly-book-dev}"

info() { printf '  %s\n' "$1"; }

# 1. Jaringan tunnel ada?
if ! docker network inspect "$NETWORK" >/dev/null 2>&1; then
  info "Jaringan '$NETWORK' tidak ada — dilewati (tunnel mungkin belum disetup)."
  info "Tidak ada yang perlu dikerjakan."
  exit 0
fi

# 2. Container app jalan?
if ! docker container inspect "$CONTAINER" >/dev/null 2>&1; then
  info "Container '$CONTAINER' belum ada — dilewati."
  info "Jalankan setelah `docker compose up -d app`."
  exit 0
fi

# 3. Sudah tersambung?
if docker inspect "$CONTAINER" \
     --format '{{range $k, $v := .NetworkSettings.Networks}}{{$k}} {{end}}' \
   | grep -qw "$NETWORK"; then
  info "'$CONTAINER' sudah tersambung ke '$NETWORK'. Tidak ada yang perlu dikerjakan."
  exit 0
fi

# 4. Sambungkan.
docker network connect "$NETWORK" "$CONTAINER"

if docker inspect "$CONTAINER" \
     --format '{{range $k, $v := .NetworkSettings.Networks}}{{$k}} {{end}}' \
   | grep -qw "$NETWORK"; then
  info "'$CONTAINER' tersambung ke '$NETWORK'."
  info "Domain publik akan kembali menjangkau aplikasi dalam hitungan detik."
else
  printf 'Gagal menyambungkan %s ke %s\n' "$CONTAINER" "$NETWORK" >&2
  exit 1
fi
