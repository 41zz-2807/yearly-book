# AGENTS.md — yearly-book

Dokumen ini adalah titik masuk untuk agent AI mana pun yang akan melanjutkan
pekerjaan pada project ini. **Baca seluruh file ini sebelum menyentuh kode.**

---

## 1. Ringkasan singkat

Aplikasi web untuk membuat **buku annual sekolah** (semester kelas), dengan
buku publik berbentuk halaman yang bisa di-flip, panel admin untuk mengelola
data, dan **export PDF A4**.

| | |
|---|---|
| Nama | `yearly-book` |
| Lokasi | `/home/warnet/docker/yearly-book` |
| Stack | Next.js 15 (App Router) + React 19 + TypeScript + Tailwind 4 |
| Database | SQLite via Prisma 6 |
| Auth | Auth.js v5 (NextAuth) + Credentials provider + bcrypt |
| Deployment | Docker Compose, **tidak pernah** naked install di host |
| URL publik | `https://yearly.bilmary.my.id` (Cloudflare Tunnel) |
| URL lokal | `http://localhost:8003` |
| Data demo | Grade 6 - Jannatul Firdaus, SDIT GIIS, angkatan 2021 |

---

## 2. Aturan mutlak (WAJIB dipatuhi)

### 2.1 Docker-only
Project ini **tidak boleh** menjalankan `npm install`, `npx`, `prisma`, atau
build tool langsung di host. Host hanya dipakai untuk `docker compose` dan
mengedit file.

```bash
# BENAR
docker compose run --rm app npm run typecheck
docker compose exec -T app node -e '...'

# SALAH - jangan pernah
npm install
npx prisma migrate dev
```

Instal dependency baru:
```bash
# ubah package.json seperti biasa, lalu:
docker compose up -d --build app
# node_modules & .next ada di named volume, jadi volume TIDAK perlu dihapus
# kecuali lockfile berubah sedemikianrupa sehingga paket membingungkan.
```

### 2.2 Jangan bocorkan secret
- Password admin **tidak pernah** disimpan plaintext. Yang ada hanya
  `AUTH_ADMIN_PASSWORD_HASH_B64` (bcrypt cost 12, di-encode base64).
- Jangan pernah mencetak isi `.env` ke output, commit, atau log.
- Untuk membuat password baru **wajib** lewat `scripts/reset-admin-password.sh`.

**Kenapa hash-nya base64?** bcrypt selalu diawali `$2b$12$...`. Nilai di
`env_file` Docker Compose meng-interpolasi karakter `$`, sementara Next.js
membacanya apa adanya. Hash mentah akan terpotong di salah satu sisi sehingga
login selalu gagal. Base64 tidak mengandung `$`, jadi aman untuk keduanya.

### 2.3 Setelah menjalankan reset password, wajib hard-refresh browser
Lihat [§8.1](#81-application-error-setelah-login). Ini akan annoy user
kalau tidak diberi tahu.

---

## 3. Struktur project

```
app/
  (public)/                 # route publik, tanpa auth
    page.tsx                # cover (bab 1)
    [page]/page.tsx         # semua bab lain via slug
    layout.tsx
  admin/                    # WAJIB auth
    layout.tsx              # shell + nav + guard
    page.tsx                # dashboard  (+ tombol Unduh PDF)
    siswa/ kegiatan/ wali-kelas/ prestasi/ pengaturan/
      page.tsx              # list + form
      actions.ts            # server actions (CRUD)
      *-form.tsx            # client component
  api/
    auth/[...nextauth]/route.ts
    export/route.tsx        # GET -> PDF A4   (publik, tanpa auth)
  media/[...path]/route.ts  # menyajikan foto upload dari UPLOAD_DIR (publik)
  login/                    # page.tsx + actions.ts
  layout.tsx

components/
  book/
    chapters.ts             # SATU-SATUNYA sumber urutan bab  (WAJIB dibaca)
    book-data.ts            # ambil semua data dari DB
    book-view.tsx           # pembalikan halaman CSS 3D
    chapter-contents.tsx    # isi tiap bab
  pdf/
    yearbook-pdf.tsx        # <Document> PDF, urutan halaman
    pdf-chapters.tsx        # komponen bab + stylesheet A4
  book-nav.tsx              # nav buku + tombol Unduh PDF (A4)
  admin-page.tsx, admin-form.tsx, student-card.tsx,
  book-frame.tsx, book-pagination.tsx, login-form.tsx

lib/
  prisma.ts   guard.ts (requireAdmin/publicError)
  upload.ts   validate.ts
  pdf/theme.ts   # ukuran A4, font, palet

prisma/     schema.prisma, seed.ts, migrations/
            prisma.config.ts (config Prisma CLI, root)
scripts/    dev-start.sh, hash-password.mjs, reset-admin-password.sh,
            backup-sesi-opencode.sh
```

> Direktori `sementara2/` kosong dan tidak direferensikan kode mana pun.
> Abaikan; jangan menghapusnya tanpa bertanya lebih dulu.

---

## 4. Database

SQLite di `DATABASE_URL` (file `/data/dev.db`, berada di named volume
`yearly-book_db_data` — **tidak pernah ada di host**).

| Model | Isi | Catatan |
|---|---|---|
| `Setting` | 1 baris | identitas kelas + sambutan + penutup + `fotoKelas` |
| `Siswa` | 24 | `nama`, `citaCita`, `pesan`, `suratMasaDepan`, `foto`, `urutan` |
| `FotoKegiatan` | 9 | `url`, `caption`, `urutan`. `url` opsional |
| `WaliKelas` | 1 | `nama`, `foto`, `pesan` |
| `Prestasi` | 3 | `judul`, `deskripsi`, `foto`, `urutan` |

Kolom yang boleh null = user boleh mengisinya belakangan. **Selalu
render placeholder berlabel, jangan gambar rusak / `<img src="">`.**

Semua field teks panjang tetap `String` (SQLite tidak membatasi panjang TEXT,
jadi tidak perlu `@db.Text`).

Migrasi:
```bash
docker compose run --rm migrate
```

> Seed command ada di `prisma.config.ts`, bukan lagi `package.json#prisma`
> (properti itu DEPRECATED di Prisma 6, dihapus di Prisma 7). File itu sengaja
> **tidak** meng-import `dotenv/config`: `dotenv` hanya ada sebagai dependensi
> transitif, dan `next build` menjalankan `prisma generate` di dalam image
> tanpa environment produksi. Nilai .env sudah menerobos ke process env lewat
> `env_file` Compose, jadi tidak perlu dimuat ulang.

Data contoh (seed):
```bash
docker compose run --rm app npm run db:seed
```

`prisma/seed.ts` bersifat **non-destruktif**: baris dicocokkan lewat kolom
`urutan` lalu di-*update* bila sudah ada, dan kolom foto (`foto`, `url`,
`fotoKelas`) tidak pernah disentuh. Aman dijalankan berulang kali; foto yang
sudah diunggah lewat `/admin` tidak hilang.

Kalau ada baris yang `urutan`-nya di luar rentang seed (sisa seed versi lama),
script hanya **memperingatkan**, tidak menghapus. Hapus lewat `/admin`.

---

## 5. Menjalankan

### Development (default) — cukup satu perintah
```bash
docker compose up --build      # http://localhost:8003
```

Tidak ada langkah migrate/seed terpisah. `CMD` image `development` adalah
`scripts/dev-start.sh`, yang berurutan melakukan:

| # | Langkah | Syarat |
|---|---|---|
| 1 | Isi `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`, `AUTH_TRUST_HOST` bila kosong | nilai yang sudah ada **tidak** ditimpa |
| 2 | Username + password admin acak, dicetak ke log container | hanya bila `AUTH_ADMIN_USERNAME` atau hash-nya kosong |
| 3 | `npm run db:deploy` (WAJIB) | selalu |
| 4 | `npm run db:generate` | selalu |
| 5 | `npm run db:seed` | hanya bila tabel `Setting` kosong |
| 6 | `npm run dev` | — |

> **Kenapa langkah 3 wajib ada di dalam start?** Tanpa itu, instalasi baru
> (volume `db_data` masih kosong) aplikasi balas **500** dengan Prisma
> `P2021 — table does not exist`. Symptom-nya tidak menunjuk ke migrasi sama
> sekali, jadi mudah salah diagnosis.

> **Kenapa `AUTH_URL` diisi otomatis?** Kalau kosong, Auth.js memakai
> `http://localhost:3000` — port internal container yang tidak dipublish, jadi
> redirect setelah login mengarah ke alamat yang tidak terjangkau. Nilai
> auto-nya diambil dari `ports:` di `docker-compose.yml`, jadi angka port tidak
> diduplikasi di dua tempat. **Ganti dengan domain publik** begitu dipasang di
> belakang reverse proxy.

> **Kenapa seed memakai tabel `Setting` sebagai penanda, bukan "semua kosong"?**
> `Setting` tidak punya tombol hapus di `/admin`, jadi `Setting` kosong berarti
> instalasi baru — bukan user yang sengaja mengosongkan. Kalau penandanya
> "semua tabel kosong", menghapus semua siswa lewat `/admin` akan memicu seed
> ulang saat restart.

`env_file` di `docker-compose.yml` memakai `required: false`, jadi
`docker compose up --build` tetap jalan walau `.env` belum ada. Nilai yang
di-generate ditulis balik ke `.env` (mode 600) agar container berikutnya
konsisten.

### Mengganti password admin
```bash
./scripts/reset-admin-password.sh    # interaktif, aman, recreate otomatis
```

### Produksi
```bash
docker compose run --rm migrate              # WAJIB lebih dulu
docker compose --profile prod up -d --build app-prod
```

> `migrate` tetap service terpisah untuk produksi. Image `runner` tidak punya
> `prisma` di dalam image final, jadi migrasi tidak bisa dijalankan dari sana.
> Untuk `app` (dev) langkah ini sudah otomatis oleh `dev-start.sh`.

### Service di `docker-compose.yml`
| Service | Port | Keterangan |
|---|---|---|
| `app` | 8003 | dev + hot reload, default, start mandiri |
| `migrate` | — | sekali jalan, `profile: tools` |
| `app-prod` | 8003 | standalone, `profile: prod` |

`app` dan `app-prod` **sama-sama pakai port 8003**. Jangan jalankan
keduanya bersamaan. Menghentikan salah satunya dengan `docker compose down`
juga bisa menghapus default network — kalau lalu `up` gagal dengan
`network ... not found`, jalankan `docker compose down --remove-orphans`
lalu `up` lagi.


---

## 6. Environment variables

Semua ada di `.env` (sudah di-`.gitignore`).

| Key | Isi |
|---|---|
| `DATABASE_URL` | `file:/data/dev.db` |
| `AUTH_SECRET` | secret Auth.js |
| `AUTH_TRUST_HOST` | `true` (wajib, karena di belakang reverse proxy) |
| `AUTH_URL` | domain publik, **cookie session terikat ke sini** |
| `AUTH_ADMIN_USERNAME` | username admin |
| `AUTH_ADMIN_PASSWORD_HASH_B64` | bcrypt hash, base64 |
| `UPLOAD_DIR` | `/app/public/uploads` |
| `UPLOAD_URL_PREFIX` | prefix URL untuk media |
| `UPLOAD_MAX_BYTES` | batas ukuran upload |
| `NEXT_PUBLIC_APP_NAME` | nama aplikasi di judul tab |

> `NEXT_PUBLIC_APP_URL` **sudah dihapus** dari `.env.example` (2026-09-28).
> Tidak ada kode yang membacanya; `AUTH_URL` sudah memegang peran itu.

> **Penting:** nilai di `.env` ditulis dengan tanda kutip. Docker Compose
> (`env_file`) **melepas** tanda kutip, tapi `docker run --env-file` **tidak**.
> Kalau muncul
> `the URL must start with the protocol 'file:'`, itu karena test harness
> dipakai `docker run`, bukan Compose. Bukan bug aplikasi.

---

## 7. Fitur yang sudah jadi

### 7.1 Buku publik
- 8 bab, urutan didefinisikan di `components/book/chapters.ts`
- **Satu halaman, dibalik seperti buku, di semua ukuran layar** (lihat §7.6)
- Rasio lembar 3:4 (desktop & tablet); di mobile mengisi tinggi layar
- Bab `flow: true` boleh lebih panjang dari 3:4 — isinya bergulir di dalam
  lembar (`overflow-y-auto`), bukan memotong halaman

### 7.2 Admin
CRUD lengkap (Siswa, Kegiatan, Wali Kelas, Prestasi, Pengaturan) memakai
server actions + `requireAdmin()` dari `lib/guard.ts`.

### 7.3 Export PDF (`/api/export`)
- **Publik**, tanpa auth
- `@react-pdf/renderer` 4.9.0 (dipilih karena stabil di `node:22-alpine`,
  berbeda dari Puppeteer yang butuh Chromium)
- A4 portrait, **15 halaman** untuk 24 siswa
- Font bawaan `Times-*` / `Helvetica` → tidak butuh file font eksternal
- Gambar diambil dari path di DB, dibuat absolut memakai **origin request**
  (bukan URL hardcode), lalu di-convert jadi data URI, cap **4 MB**
- `content-disposition: attachment`, nama file di-slug dari `namaKelas`

Urutan PDF: Cover → Sambutan → **Foto Kelas** → Profil Siswa (3/halaman) →
Kenang Seru → Wali Kelas → Prestasi → Penutup.

### 7.4 Reset password admin
`scripts/reset-admin-password.sh` — baca [§8.2](#82-reset-admin-password).

### 7.5 Design system
Semua token warna & radius ada di `app/globals.css` (`@theme`).
`lib/pdf/theme.ts` harus **di-mirror** dari sana kalau palet berubah.

Superficie, isian, dan pemberitahuan **wajib** memakai kelas `ds-*`, bukan
menulis ulang utility Tailwind per komponen:

| Kelas | Untuk |
|---|---|
| `ds-panel` | kartu/panel gelap (`/admin`, `/login`) |
| `ds-panel-light` | kartu terang di atas kertas buku |
| `ds-input` | isian formulir (dipakai `admin-form.tsx` **dan** `login-form.tsx`) |
| `ds-btn-brand` | tombol utama |
| `ds-alert` + `ds-alert-error/-success/-warn` | pemberitahuan |
| `ds-pattern`, `ds-pattern-ink`, `ds-gradient-brand`, `ds-gradient-mist`, `ds-ornament-frame` | ornamen |

Radius: `--radius-sheet` (lembar) · `--radius-panel` (panel) ·
`--radius-card` (isian/tombol).

> Token `accent-*` **sudah dihapus** (2026-09-28). Dulu dipakai `/admin` dan
> dipetakan ke emerald; sekarang semuanya emerald/sky/gold langsung. Kalau
> ketemu `accent-` di kode, itu regresi.

Empty state ada dalam dua pasangan — jangan buat yangketiga sendiri:
- Terang (buku): `EmptyState` di `components/book-frame.tsx`
- Gelap (admin): `AdminEmptyState` di `components/admin-page.tsx`

### 7.6 Pembalikan halaman (CSS 3D, sendiri)
`react-pageflip` **sudah dibuang** (2026-09-28). Alasannya terukur: di mode
portrait library itu menghasilkan `transform: matrix(1,0,0,1,0,0)` —
identitas, tanpa rotasi — pada 21 dari 21 sampel selama 900 ms. Yang terlihat
hanya lompatan + bayangan. Ditambah 7 keanehan 2.0.3 yang harus diakali.

Sekarang digambar sendiri dengan CSS 3D (kelas `.ds-book-*` di
`app/globals.css`, blok sekitar 160 baris termasuk komentar):

| Konsep | Kenapa |
|---|---|
| Semua bab ter-mount, ditumpuk `absolute inset-0` | state paginasi Profil bertahan saat pindah bab |
| Yang tidak aktif `visibility: hidden`, **bukan** di-unmount | mem-unmount akan mereset state |
| `.ds-book-stage` `perspective` | supaya `rotateY` terbaca 3D |
| `.ds-book-turning` + `@keyframes ds-book-turn-next/prev` | rotasi `0 → -172deg`, mundur dibalik |
| `.ds-book-cast` | bayangan terpampang di lembar tujuan, menyatu 720 ms |
| `onAnimationEnd` + jaring pengaman `setTimeout` | `animationend` tak pernah datang saat `prefers-reduced-motion` |

**Dua jebakan sizing yang sudah diuji** (jangan dibalik tanpa mengukur):

| Yang ditulis | Yang terjadi |
|---|---|
| `width` + `aspect-ratio` + `max-height` | Chromium **tidak** menyempitkan lebar → 576×628 (rasio 0,92, hampir persegi) |
| `height: auto` + `aspect-ratio: auto` | tinggi **runtuh ke 0** — semua lembar `absolute`, tidak ada konten in-flow |
| `height: 100%` + `aspect-ratio` ✅ | rasio tepat 0,75 di desktop & tablet |

Tinggi `100%` aman karena `<main>` punya tinggi definite (induknya `h-dvh`).
**Jangan** menggantinya dengan `calc(100dvh - …)` — tidak memperhitungkan
tinggi nav, hasilnya cuma 349px dari 700px.

Juga sudah ditemukan: `<ol>` daftar bab harus dibungkus `min-w-0` +
`overflow-x-auto` di dalam `div`, kalau tidak ia menimpa tombol "Bab
sebelumnya" dan membuatnya tidak bisa diklik (teramati di 1440px).

### 7.7 Login admin lewat Google
Ditambahkan 2026-09-29. **Hanya untuk `/admin`** — buku publik dan `/api/export`
tetap terbuka tanpa login, persis seperti sebelumnya.

Provider `Google` di `auth.ts` ditulis **tanpa argumen**: Auth.js v5 membaca
`AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` sendiri dari environment. Jangan diisi
literal di kode — nilainya akan ikut ter-inline ke build produksi.

**Allowlist email = satu-satunya tempat menambah admin.**
`AUTH_ADMIN_EMAIL` di `.env`, dipisah koma:

```
AUTH_ADMIN_EMAIL="email-a@gmail.com,email-b@gmail.com"
```

Setiap sesi baru melewati callback `signIn` di `auth.ts`. Akun Google yang
tidak ada di daftar itu **tetap bisa menyelesaikan login di sisi Google**, tapi
Auth.js menolaknya dan mengirim user ke `/login?error=AccessDenied` (halaman
login menampilkannya sebagai `ds-alert-error`).

> **Kenapa wajib allowlist, bukan "semua yang punya akun Google"?** Begitu
> provider aktif, siapa pun bisa menyelesaikan alur OAuth di depan aplikasi.
> Kalau semua Doing dianggap admin, satu klik keliru = `/admin` terbuka untuk
> siapa saja, termasuk data siswa dan wali kelas.

Daftar kosong = semua login Google ditolak (bukan dibuka semua), dan tombolnya
disembunyikan. `googleEnabled` di `app/login/page.tsx` hanya `true` bila
`AUTH_GOOGLE_ID` + `AUTH_GOOGLE_SECRET` + `AUTH_ADMIN_EMAIL` terisi — supaya
tidak pernah menampilkan tombol yang pasti gagal.

Setelah mengubah allowlist: `docker compose up -d --force-recreate app`
(`restart` tidak cukup — §8.2.2), lalu `./scripts/connect-tunnel-network.sh`
(§8.10).

Callback URIs yang didaftarkan di Google Cloud Console — satu per domain,
WAJIB persis termasuk garis miring di akhir:

```
produksi : https://yearly.bilmary.my.id/api/auth/callback/google
lokal    : http://localhost:8003/api/auth/callback/google
```

Login password (`Credentials`) **tidak dihapus** — tetap ada sebagai cadangan,
dan `requireAdmin()` kini juga memeriksa `role === "admin"`, bukan sekadar
keberadaan sesi.

---

## 8. Jebakan yang sudah pernah menyakitkan
---


Bagian ini hasil dari kesalahan nyata. **Baca dengan saksama.**

### 8.1 "Application error" setelah login
Gejala: `Application error: a client-side exception has occurred while loading ...`

Penyebab **bukan** password salah. `docker compose up -d --force-recreate`
menghapus cache `.next`, sehingga dev server punya **Server Action ID** yang
baru. Tapi halaman `/login` yang masih terbuka di browser memuat ID versi
lama. Submit → `POST /login` dapat **404** → Next.js menampilkan error
boundary.

Jejak di log container:
```
[Error: Failed to find Server Action "60ecee...."
 POST /login 404
```

**Solusi:** hard-refresh browser (`Ctrl+Shift+R`), lalu login lagi.
Hanya terjadi di mode dev. Tidak terjadi di produksi.

### 8.2 Reset admin password
```bash
cd ~/docker/yearly-book
./scripts/reset-admin-password.sh                     # interaktif
./scripts/reset-admin-password.sh --password '...'    # non-interaktif
./scripts/reset-admin-password.sh --service app-prod  # untuk image produksi
```

Yang dilakukan: baca password tanpa echo → generate hash di dalam Docker →
verifikasi hash **sebelum** `.env` disentuh → backup `.env` → ganti satu
baris → **recreate** container → verifikasi lagi terhadap `process.env`.

Tiga jebakan yang sudah diperbaiki di script ini. **Jangan kembalikan:**

1. **Jangan pakai `NEW_PASSWORD=$(read_password_interactive)`.**
   Di dalam command substitution, stdout diarahkan ke pipe, jadi `printf`
   untuk prompt ikut terserap ke dalam variabel dan tidak pernah tampil.
   Digabung `read -s`, user hanya melihat kursor berkedip tanpa prompt.
   Lebih buruk, variabel berisi *teks prompt + password*, jadi password yang
   terpasang mustahil diketik ulang. Fungsi sekarang **assignment ke variabel
   global** dan prompt ditulis ke `/dev/tty`.

2. **Jangan pakai `docker compose restart`.**
   `restart` **tidak** membaca ulang `env_file`. Container masih memegang
   environment dari saat pertama dibuat, dan `process.env` menang atas file
   `.env`. Akibatnya `.env` sudah benar tapi login tetap ditolak. Wajib
   `docker compose up -d --force-recreate app`.

3. **Verifikasi harus menguji `process.env`, bukan isi file `.env`.**
   `auth.ts` membaca `process.env`. Memverifikasi file `.env` memberi
   false positive karena `.env` bisa benar sementara container masih
   memegang hash lama.

### 8.3 Tipe `Frame` di PDF
`Frame` di `components/pdf/pdf-chapters.tsx` menerima
`PdfStyle | PdfStyle[]` untuk style dan `initStyle`.

- Jangan pakai `flex: 1` pada kartu profil — teks surat terpotong.
- Jangan pakai `wrap={false}` pada kartu profil.
- react-pdf **menolak `null` di dalam array style**. Pakai spread kosong:
  ```tsx
  style={[s.shot, ...(kondisi ? [] : [{ marginRight: GALLERY_GAP }])]}
  ```

### 8.4 `outputFileTracingIncludes` wajib untuk pdfkit
Build produksi **sukses** tapi `/api/export` balas **500** dengan
`Cannot find module '/app/node_modules/pdfkit/js/standard-fonts/Helvetica.cjs'`.

29 file font standar hanya bisa ditemukan saat runtime, jadi tidak ter-trace
otomatis. `next.config.ts` sudah menambahkan:

```ts
"./node_modules/pdfkit/**",
"./node_modules/fontkit/**",
```

Kalau muncul error module seperti ini, cek dulu `next.config.ts` sebelum
mengira layout PDF-nya salah.

### 8.5 Cloudflare Tunnel hanya IPv4
`yearly.bilmary.my.id` **tidak** bisa diakses via IPv6 dari container mana
pun. Selalu pakai `curl -4`.

Karena `AUTH_URL` = domain tunnel, **cookie session terikat ke domain itu**.
Test login dari `localhost` akan selalu gagal walau password benar —
harus lewat `https://yearly.bilmary.my.id`.

### 8.6 ✅ SUDAH DIPERBAIKI: URL hasil upload sekarang bisa diakses
**Status: sudah diperbaiki (opsi 2). Ditemukan 2026-09-27, diperbaiki
2026-09-28. `AGENTS.md` versi lama masih menyebutnya belum selesai.**

Awalnya tidak konsisten:

| Env | Nilai | Arti |
|---|---|---|
| `UPLOAD_DIR` | `/app/public/uploads` | file ditulis ke dalam `public/` |
| `UPLOAD_URL_PREFIX` | `/media` | URL yang disimpan di DB |

`saveUpload()` menulis ke `UPLOAD_DIR` lalu mengembalikan
`${UPLOAD_URL_PREFIX}/${nama}` → `/media/<nama>`. Tapi Next menyusun daftar
file `public/` saat server start, sehingga file yang diunggah **sesudah**
container berjalan akan 404 di produksi.

**Perbaikannya:** route `app/media/[...path]/route.ts` menyajikan file langsung
dari `UPLOAD_DIR` (bukan static file). Route ini membaca disk tiap request,
jadi upload langsung tersedia di dev maupun produksi.

Bukti sekarang:
```
/media/abc123.jpg -> 200 image/jpeg
```

> ⚠️ Allowlist nama file di `app/media/[...path]/route.ts` menolak nama yang
> diawali non-alnum (`SAFE_NAME` = `^[A-Za-z0-9][A-Za-z0-9._-]*$`). Jadi
> `_probe.jpg` memang 404 — itu perilaku yang benar, bukan bug. Nama asli dari
> `lib/upload.ts` selalu diawali base36 timestamp, jadi tidak terpengaruh.

`outputFileTracingIncludes` **tidak perlu** diubah karena file upload berada
di volume, bukan di build.

### 8.7 Build produksi gagal dengan error yang sama sekali tidak terkait
Gejalanya **hanya muncul di `next build`**, sedangkan dev & typecheck & lint
tetap hijau:

```
Error: Cannot find module '../lightningcss.linux-x64-musl.node'
  at /app/node_modules/lightningcss/node/index.js
```

**Penyebabnya: `package.json` diubah tapi `package-lock.json` tidak ikut.**
Stage `deps` di Dockerfile menjalankan `npm ci`, yang membaca lockfile. Kalau
lockfile masih memuat keadaan lama, paket native untuk platform yang sekarang
terpasang tidak ikut ter-*resolve*, dan Tailwind/PostCSS gagal saat memproses
`globals.css`.

**Perbaikannya (Docker-only):**
```bash
docker compose run --rm app npm install --package-lock-only
```

Aturan singkat: **setiap kali `package.json` berubah, sinkronkan lockfile di
dalam Docker.** Tanda sudah sinkron:
```bash
docker compose run --rm app node -e 'const l=require("./package-lock.json"),p=require("./package.json");const a=Object.keys(l.packages[""].dependencies||{}),b=Object.keys(p.dependencies||{});console.log(JSON.stringify(a.sort())===JSON.stringify(b.sort())?"sinkron":"TIDAK sinkron")'
```

### 8.8 Setelah sinkronkan lockfile, rebuild image produksi
Volume `node_modules` masih berisi paket lama, tapi itu tidak masalah:
build produksi memakai `npm ci` di image baru, bukan volume tersebut. Jadi
cukup rebuild image — **jangan** menghapus volume, development masih memakainya.
```bash
docker compose --profile prod build app-prod
```

### 8.9 Animasi bisa "berjalan" padahal tidak sama sekali
`transform: matrix(1, 0, 0, 1, 0, 0)` itu **identitas** — artinya tidak ada
rotasi sama sekali, cuma bayangan yang bergerak. Inilah yang membuat
`react-pageflip` dibuang: di mode portrait ia melaporkan "flip" padahal
yang terjadi lompatan.

Jadi **jangan menilai animasi dari satu screenshot**. Ukur `transform`
selama transisi (lihat §10). Kalau yang muncul hanya matriks identitas,
animasinya memang tidak ada — tulis ulang pakai CSS 3D (§7.6).

### 8.10 Tunnel 502 setelah container di-recreate
**Status: sudah diperbaiki 2026-09-29. Ditemukan saat menambah login Google.**

Gejala: `https://yearly.bilmary.my.id` balas **502**, padahal
`http://localhost:8003` balas 200. Aplikasinya sehat.

Jejak di log `tunnel-cloudflared`:
```
dial tcp: lookup yearly-book-dev on 127.0.0.11:53: server misbehaving
  originService=http://yearly-book-dev:3000
```

**Penyebabnya bukan DNS yang rusak dan bukan kode.** Tunnel berjalan dari
container terpisah (`tunnel-cloudflared`, project `war-nt-web`) yang
me-resolve origin **by nama container**:

| | |
|---|---|
| Tunnel | `war-nt-web_default` (172.18.0.8) |
| App | `yearly-book_default` (172.19.0.2) |

Nama `yearly-book-dev` hanya resolve di dalam jaringan yang sama. Koneksi
lintasnya harus dipasang manual (`docker network connect war-nt-web_default
yearly-book-dev`) dan **tidak ada di `docker-compose.yml`** — jadi ikut hilang
setiap kali container di-recreate. Padahal recreate itu routine: dilakukan
`reset-admin-password.sh` dan `docker compose up --build`.

**Perbaikannya:** `scripts/connect-tunnel-network.sh`, dipanggil otomatis oleh
`reset-admin-password.sh` setelah container di-recreate. Script ini
best-effort dan idempotent — dilewati diam-diam kalau jaringan tunnel tidak
ada, jadi aman di mesin yang tidak memakai tunnel.

```bash
./scripts/connect-tunnel-network.sh
```

> **Kenapa tidak `external: true` di `docker-compose.yml`?** Itu akan membuat
> `docker compose up` gagal total di mesin yang tidak punya jaringan
> `war-nt-web_default` — termasuk repo ini kalau di-clone di tempat lain.

Gejalanya sangat menyesatkan karena aplikasi terbukti jalan di lokal, jadi
gampang disalahkan ke kode. Kalau domain publik 502 tapi lokal 200, cek
jaringan container dulu sebelum menyentuh kode:

```bash
docker inspect yearly-book-dev \
  --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}} {{end}}'
```

---

## 9. Urutan bab: buku publik vs PDF (BEDA — ini disengaja)

`components/book/chapters.ts` (buku publik, 8 bab) dan
`components/pdf/yearbook-pdf.tsx` (PDF) **tidak** memakai daftar yang sama:

| Buku publik | PDF |
|---|---|
| Cover | Cover |
| Sambutan | Sambutan |
| — | **Foto Kelas** (tidak ada di web) |
| Profil Siswa | Profil Siswa |
| **Daftar Siswa** (tidak ada di PDF) | — |
| Kenang Seru | Kenang Seru |
| Wali Kelas | Wali Kelas |
| Prestasi | Prestasi |
| Penutup | Penutup |

Nomor "Bab Tiga/Empat/…" juga berbeda karena PDF menyisipkan Foto Kelas.

**User sudah memutuskan untuk membiarkan begitu.** Jangan "menyelaraskan"
dengan sendirinya tanpa diminta — tapi jangan lupa menyebutkannya kalau
menambah bab baru.

---

## 10. Verifikasi sebelum menyatakan selesai

```bash
# wajib
docker compose run --rm app npm run typecheck
docker compose run --rm app npm run lint

# aplikasi hidup
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:8003/          # 200
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:8003/api/export # 200
```

Cek struktur PDF (pakai container, jangan install di host):
```bash
curl -s -o /tmp/b.pdf http://localhost:8003/api/export
docker run --rm -v /tmp:/w alpine:latest sh -c \
  "apk add --no-cache poppler-utils >/dev/null && pdfinfo /w/b.pdf | grep -E '^(Pages|Page size)'"
```

Untuk cek isi teks per halaman: `pdftotext -f N -l N /w/b.pdf -`

### Mengukur animasi pembalikan halaman (WAJIB setelah menyentuh §7.6)
Screenshot **tidak bisa dijadikan bukti** — animasi bisa hilang total tanpa
perubahan visual pada frame diam. Yang diukur adalah `transform` selama
transisi. Tanpa ini, bug yang mencederai §7.6 bisa lolos tanpa terdeteksi.

```bash
mkdir -p /tmp/pw
cat > /tmp/pw/t.mjs <<'EOF'
import { chromium } from 'playwright-core';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();
await p.goto('http://localhost:8003/', { waitUntil: 'networkidle' });
await p.waitForTimeout(2500);
const r = await p.evaluate(async () => {
  const s = [];
  const id = setInterval(() => {
    const t = document.querySelector('.ds-book-turning');
    if (t) s.push(getComputedStyle(t).transform);
  }, 50);
  document.querySelector('button[aria-label="Bab berikutnya"]').click();
  await new Promise(r => setTimeout(r, 900));
  clearInterval(id);
  return { sampel: s.length, unik: new Set(s).size };
});
console.log(r);   // unik harus > 5
await b.close();
EOF
docker run --rm --network host -v /tmp/pw:/w -w /w \
  -e PLAYWRIGHT_BROWSERS_PATH=/ms-playwright \
  mcr.microsoft.com/playwright:v1.55.0-noble \
  bash -c 'npm i --silent playwright-core@1.55.0 && node t.mjs'
```

Kalau `unik: 1`, atau transform-nya `matrix(1, 0, 0, 1, 0, 0)`, animasi
tidak jalan — bukan "kurang halus", tapi memang tidak ada.

Ukuran lembar juga wajib dicek: `height: 100%` + `aspect-ratio` harus
memberi rasio **0,750** di desktop dan tablet. Kalau 0,9-an, berarti
`max-width` ikut aktif dan constrain — lihat tabel di §7.6.

Untuk uji login (wajib lewat domain tunnel, lihat §8.5):
```bash
CSRF=$(curl -s -4 -c /tmp/cj https://yearly.bilmary.my.id/api/auth/csrf \
  | sed -E 's/.*"csrfToken":"([^"]+)".*/\1/')
curl -s -4 -b /tmp/cj -c /tmp/cj -o /dev/null -w '%{http_code}\n' \
  -X POST https://yearly.bilmary.my.id/api/auth/callback/credentials \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  --data-urlencode "csrfToken=$CSRF" \
  --data-urlencode "username=USERNAME_ADMIN_ANDA" \
  --data-urlencode "password=..." \
  --data-urlencode "callbackUrl=https://yearly.bilmary.my.id/admin"
# 302 ke /admin = BERHASIL. 302 ke /login?error=CredentialsSignin = GAGAL.
```

---

## 11. Testing browser (headless)

Playwright. Image `mcr.microsoft.com/playwright:v1.55.0-noble` **tidak**
punya paket npm `playwright` — pasang `playwright-core` di dalam container:

```bash
docker run --rm --network host -v /tmp/pw:/w -w /w \
  -e PLAYWRIGHT_BROWSERS_PATH=/ms-playwright \
  mcr.microsoft.com/playwright:v1.55.0-noble bash -c \
  'npm i --silent playwright-core@1.55.0 && node test.mjs'
```

Import dari `'playwright-core'`, bukan `'playwright'`.
Browser sudah ada di `/ms-playwright` jadi tidak perlu diunduh.
File hasil `npm i` dimiliki root — bersihkan lewat container kalau `rm` host
menolak (`Permission denied`).

---

## 12. State saat ini

- Container `yearly-book-dev` **running** di port 8003
- Volume: `yearly-book_db_data`, `yearly-book_next_data`,
  `yearly-book_node_modules`, `yearly-book_uploads`
- Data: 1 setting (`Grade 6 - Jannatul Firdaus (Angkatan 2)`, 2021/2027),
  24 siswa, 9 foto kegiatan, 1 wali, 3 prestasi
- **Semua 24 siswa belum punya foto** — tampil placeholder inisial
- `docker compose up --build` sudah cukup sendiri: migrasi, generate, dan
  seed (bila DB kosong) berjalan otomatis lewat `scripts/dev-start.sh`
- `react-pageflip` sudah dibuang; pembalikan halaman = CSS 3D sendiri (§7.6)
- Typecheck & lint bersih
- Terverifikasi: 10 route publik + 6 route admin (dengan sesi) 200, PDF 15
  halaman A4, pembalikan halaman beranimasi di desktop & mobile (maju dan
  mundur), build produksi lolos, login via tunnel 302 ke `/admin`

---

## 13. Kalau mulai dari sesi opencode yang baru

Kalau user membuka sesi opencode baru, **dokumen ini adalah sumber kebenaran**.
Tugas pertama agent: baca `AGENTS.md` sampai habis SEBELUM menyentuh kode.

Untuk melanjutkan obrolan yang sudah ada, pakai session ID di
`SESI-INI.txt` (root project):
```bash
opencode -s ses_f22de2eb7ffeCUC9olNhJbw3Wf
```

Kalau session itu sudah tidak ada, jangan menebak — pakai `AGENTS.md`.
Status aplikasi saat itu sudah tertulis di section 12; tapi **verifikasi
ulang** dengan perintah section 10 karena state bisa sudah berubah.

### Backup sesi (portable ke project lain)
`scripts/backup-sesi-opencode.sh` mencari sesi opencode terakhir untuk
direktori project ini, export ke `sesi-opencode.json`, tulis ulang
`SESI-INI.txt`, dan memastikan keduanya masuk `.gitignore`.

```bash
./scripts/backup-sesi-opencode.sh
```

Jalankan ulang **setiap selesai sesi** — session ID bisa berubah kalau
sesi dipecah atau dilanjutkan dengan `opencode -c`.

Script ini sengaja dibuat portabel untuk dipakai di project lain:
```bash
cp scripts/backup-sesi-opencode.sh /path/project/scripts/
cd /path/project && ./scripts/backup-sesi-opencode.sh
```

Cara kerjanya: `opencode.db` (SQLite mode WAL) disalin bersama `-wal`/`-shm`
lalu dibaca pakai `python3` — `sqlite3` CLI tidak ada di host. Hanya
membutuhkan `opencode` + `python3`, tidak perlu dependency project.

---

## 14. Kalau mau cepat paham

Baca berurutan:
1. `components/book/chapters.ts` — urutan & bentuk bab
2. `components/book/book-data.ts` — data apa yang tersedia
3. `prisma/schema.prisma` — bentuk data
4. `auth.ts` — cara kerja login
5. `components/pdf/yearbook-pdf.tsx` — urutan halaman PDF
6. `components/book/book-view.tsx` — cara buku membalik halaman
7. `scripts/dev-start.sh` — kenapa `docker compose up --build` cukup sendiri
8. `scripts/reset-admin-password.sh` — contoh bash yang solid di project ini