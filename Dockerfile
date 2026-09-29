# syntax=docker/dockerfile:1.7

# ==============================================================================
#  yearly-book — Next.js 15 (App Router) + TypeScript + Tailwind CSS
#                          + Prisma 6 + SQLite
#  Seluruh proses install, generate, migrate, dan build HANYA di dalam Docker.
#  Host tidak pernah menjalankan npm / prisma / npx.
# ==============================================================================

ARG NODE_VERSION=22-alpine

# ------------------------------------------------------------------------------
# 1) deps — satu-satunya tempat dependency di-install.
#    di-chown ke user `node` (uid 1000) supaya named volume di /app/node_modules
#    tetap bisa ditulis user non-root.
#
#    `openssl` wajib: Prisma butuh libcrypto/openssl untuk engine-nya di Alpine.
#    `PRISMA_SKIP_POSTINSTALL_GENERATE=1` mematikan auto-generate bawaan
#    @prisma/client, karena pada stage ini prisma/schema.prisma belum di-copy.
#    Generate dijalankan eksplisit di stage development & builder.
# ------------------------------------------------------------------------------
FROM node:${NODE_VERSION} AS deps
ENV NEXT_TELEMETRY_DISABLED=1 \
    NPM_CONFIG_UPDATE_NOTIFIER=false \
    NPM_CONFIG_FUND=false \
    NPM_CONFIG_AUDIT=false \
    PRISMA_SKIP_POSTINSTALL_GENERATE=1
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi \
 && mkdir -p /app/.next /data /app/public/uploads \
 && chown -R node:node /app /data

# ------------------------------------------------------------------------------
# 2) development — hot reload, di-mount ke host via bind mount.
#    CMD menjalankan `scripts/dev-start.sh`, bukan `next dev` langsung, supaya
#    `docker compose up --build` cukup sendiri: script itu menerapkan migrasi
#    (tanpa ini aplikasi balas 500 Prisma P2021 pada volume yang masih kosong),
#    menyiapkan Prisma Client, memuat data contoh pada database baru, lalu
#    menjalankan dev server.
#
#    Script ikut di-COPY ke dalam image supaya CMD tetap bekerja walau image
#    development dijalankan tanpa bind mount.
# ------------------------------------------------------------------------------
FROM deps AS development
WORKDIR /app
ENV NODE_ENV=development \
    NEXT_TELEMETRY_DISABLED=1 \
    # Polling: wajib agar file watcher Next.js (webpack/watchpack) mendeteksi
    # perubahan file yang datang dari bind mount di Docker.
    WATCHPACK_POLLING=true \
    WATCHPACK_POLLING_TIMEOUT=2000 \
    CHOKIDAR_USEPOLLING=true
COPY --chown=node:node scripts/dev-start.sh ./scripts/dev-start.sh
USER node
EXPOSE 3000
# `npm run` (bukan `npx`) dipakai sengaja: npm run memakai binary dari
# node_modules/.bin dan GAGAL KERAS bila tidak ada, sedangkan `npx` akan
# diam-diam mengunduh paket dari registry bila binary lokal hilang.
# `sh` dipakai, bukan `./scripts/dev-start.sh`, supaya tidak bergantung pada
# bit executable saat file datang dari bind mount host.
CMD ["sh", "scripts/dev-start.sh"]

# ------------------------------------------------------------------------------
# 3) builder — generate Prisma Client lalu `next build` (output standalone).
#    `--prisma` memberi tahu Next.js untuk menyertakan Prisma Client & engine
#    ke dalam trace output standalone.
# ------------------------------------------------------------------------------
FROM deps AS builder
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1
COPY . .
RUN npm run db:generate && npm run build

# ------------------------------------------------------------------------------
# 4) runner — image produksi final, hanya berisi server standalone.
# ------------------------------------------------------------------------------
FROM node:${NODE_VERSION} AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
# openssl ikut karena Prisma engine membutuhkannya saat runtime.
# Sengaja memakai user bawaan `node` (uid 1000), bukan user baru uid 1001,
# supaya volume /data bisa dipakai bersama oleh stage development (uid 1000)
# dan runner (uid 1000) tanpa bentrok kepemilikan.
RUN apk add --no-cache libc6-compat openssl

COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public

# Dibuat & di-chown SEBELUM USER agar named volume mewarisi kepemilikan yang
# benar saat Docker menginisialisasinya. Dipakai untuk /data (SQLite) dan
# /app/public/uploads (foto hasil upload).
RUN mkdir -p /data /app/public/uploads && chown node:node /data /app/public/uploads
VOLUME ["/data", "/app/public/uploads"]

USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/ >/dev/null 2>&1 || exit 1

CMD ["node", "server.js"]
