# yearly-book

Aplikasi web untuk membuat **buku annual sekolah** (semester kelas): buku publik
berupa halaman yang bisa dibalik seperti buku sungguhan, panel admin untuk
mengelola data, dan export PDF A4.

Halaman publik **tidak butuh login** — begitu juga file PDF-nya. Login hanya
melindungi `/admin`.

```
http://localhost:8003
```

---

## Fitur

**Buku publik**
- 8 bab: Cover · Sambutan · Profil Siswa · Daftar Siswa · Kenang Seru ·
  Wali Kelas · Prestasi · Penutup
- Pembalikan halaman dengan CSS 3D, jalan di desktop maupun mobile, maju & mundur
- Rasio lembar 3:4; bab yang isinya panjang (Profil, Daftar, Kenangan, dst.)
  menggulir di dalam lembar, bukan terpotong
- Tiap bab punya URL sendiri, jadi bisa di-bookmark dan dibagikan

**Panel admin** (`/admin`)
- CRUD lengkap: Siswa, Kegiatan, Wali Kelas, Prestasi, Pengaturan
- Unggah foto siswa, foto kegiatan, foto kelas, dan wali kelas
- Server action + penjaga `requireAdmin()` di setiap aksi tulis

**Export PDF** (`/api/export`)
- Publik tanpa login, A4 portrait
- 15 halaman untuk 24 siswa
- Font bawaan, tidak butuh file font eksternal

**Autentikasi**
- Password admin (`Credentials`, bcrypt) — selalu tersedia
- Opsional: masuk dengan akun Google, dibatasi daftar email

---

## Stack

| | |
|---|---|
| Framework | Next.js 15 (App Router) + React 19 + TypeScript |
| Styling | Tailwind CSS 4 |
| Database | SQLite via Prisma 6 |
| Auth | Auth.js v5 (NextAuth) + bcryptjs |
| PDF | `@react-pdf/renderer` 4.9 |
| Runtime | Node 22 (Alpine) di Docker |

---

## Menjalankan

### Prasyarat

Docker dengan Compose v2. **Jangan** `npm install` di host — semua perintah
npm harus lewat container.

Butuh Docker dengan Compose v2. Lalu:

```bash
cp .env.example .env    # opsional — bisa dilewati, lihat catatan di bawah
docker compose up --build
```

Buka <http://localhost:8003>.

Satu perintah itu sudah cukup: migrasi, pembuatan Prisma Client, dan pemuatan
data contoh berjalan otomatis lewat `scripts/dev-start.sh`.

Kalau `.env` belum diisi, `scripts/dev-start.sh` akan membuat `DATABASE_URL`,
`AUTH_SECRET`, serta username + password admin secara acak, mencetak
kredensialnya ke log container, lalu hanya menyimpan **hash**-nya ke `.env`:

```bash
docker compose logs app | grep -A6 'KREDENSIAL ADMIN'
```

> Ganti password kapan saja dengan `./scripts/reset-admin-password.sh`
> (interaktif). **Setelah itu WAJIB hard-refresh browser** (`Ctrl+Shift+R`)
> sebelum login lagi.

### Perintah lain

```bash
docker compose run --rm app npm run typecheck   # tsc --noEmit
docker compose run --rm app npm run lint        # eslint
docker compose run --rm migrate                 # migrasi manual (produksi)
docker compose run --rm app npm run db:seed     # muat ulang data contoh
```

---

## Environment variables

Semua ada di `.env` (sudah masuk `.gitignore`). Lihat `.env.example` untuk
keterangan lengkap per variabel.

| Key | Wajib | Isi |
|---|:--:|---|
| `DATABASE_URL` | ✅ | `file:/data/dev.db` (di dalam Docker volume) |
| `AUTH_SECRET` | ✅ | Secret Auth.js, minimal 32 karakter |
| `AUTH_TRUST_HOST` | ✅ | `"true"` — aplikasi di belakang reverse proxy |
| `AUTH_URL` | | URL publik aplikasi. Mengikat cookie session — login dari domain lain akan gagal |
| `AUTH_ADMIN_USERNAME` | | Username admin (mode password) |
| `AUTH_ADMIN_PASSWORD_HASH_B64` | | Hash bcrypt, **bentuk base64** |
| `AUTH_GOOGLE_ID` | | Client ID OAuth Google |
| `AUTH_GOOGLE_SECRET` | | Client secret OAuth Google |
| `AUTH_ADMIN_EMAIL` | | Allowlist email yang boleh masuk lewat Google, pisahkan dengan koma |
| `UPLOAD_DIR` | | Lokasi penyimpanan foto di dalam container |
| `UPLOAD_URL_PREFIX` | | Prefix URL untuk menyajikan foto |
| `UPLOAD_MAX_BYTES` | | Batas ukuran unggahan |
| `NEXT_PUBLIC_APP_NAME` | | Nama aplikasi di judul tab |

### Kenapa hash password di-base64?

Docker Compose (`env_file`) meng-interpolasi karakter `$`, sedangkan Next.js
membaca `.env` apa adanya. Hash bcrypt selalu diawali `$2b$12$...`, jadi bentuk
mentah akan terpotong di salah satu sisi dan login **selalu** gagal. Base64 tidak
mengandung `$`, aman untuk keduanya.

### Login dengan Google (opsional)

1. Buat OAuth client ID *(Web application)* di
   [Google Cloud Console](https://console.cloud.google.com).
2. Daftarkan callback URI, **persis termasuk garis miring di akhir**:
   ```
   https://domain-anda.tld/api/auth/callback/google
   ```
3. Isi `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, dan `AUTH_ADMIN_EMAIL`.
4. `docker compose up -d --force-recreate app`

`AUTH_ADMIN_EMAIL` adalah **satu-satunya tempat** menambah atau mencabut admin
Google. Email yang tidak terdaftar tetap bisa menyelesaikan login di sisi Google,
tapi ditolak oleh aplikasi dan diarahkan ke `/login?error=AccessDenied`.

Tidak ada UI pendaftaran. Siapa pun tidak bisa mendaftarkan diri sebagai admin —
Google hanya membuka pintu ke aplikasi, keputusan ada di allowlist.

---

## Struktur project

```
app/
  (public)/           route publik, tanpa auth
  admin/              route admin, wajib auth
  api/export/         GET -> PDF A4 (publik)
  api/auth/           Auth.js
  media/              menyajikan foto upload dari disk
  login/
components/
  book/               daftar bab (sumber kebenaran urutan), data, isi bab
  pdf/                <Document> PDF
lib/                  prisma, guard, upload, validate, tema PDF
prisma/               schema, seed, migrations
scripts/              dev-start, reset password, hashing, jaringan tunnel
```

`components/book/chapters.ts` adalah **satu-satunya sumber urutan bab**. Kalau
menambah bab, ubah sana dulu.

---

## Data

Skema ada di `prisma/schema.prisma`: `Setting` (1 baris), `Siswa`,
`FotoKegiatan`, `WaliKelas`, `Prestasi`. Semua kolom foto opsional — yang belum
diunggah akan tampil sebagai placeholder berlabel, bukan gambar rusak.

`prisma/seed.ts` bersifat **non-destruktif**: baris dicocokkan lewat kolom
`urutan` lalu di-*update* bila sudah ada, dan kolom foto tidak pernah disentuh.
Aman dijalankan berulang kali.

> Urutan bab di buku publik dan di PDF **berbeda dengan sengaja** — PDF
> menyisipkan halaman Foto Kelas yang tidak ada di web. Lihat AGENTS.md §9.

---

## Troubleshooting

Lihat **[`AGENTS.md`](./AGENTS.md)** untuk catatan lengkap — termasuk jebakan
yang sudah pernah menyakitkan dan cara mengatasinya. Yang paling sering:

| Gejala | Penyebab | Solusi |
|---|---|---|
| `Application error` setelah login | Halaman `/login` masih memuat Server Action versi lama setelah container di-recreate | Hard-refresh browser (`Ctrl+Shift+R`) |
| Login selalu gagal padahal password benar | Cookie session terikat `AUTH_URL`, sedangkan login dilakukan dari domain lain | Login lewat domain yang sama dengan `AUTH_URL` |
| Domain publik 502, lokal 200 | Container app tidak tersambung ke jaringan Cloudflare Tunnel | `./scripts/connect-tunnel-network.sh` |
| Build produksi gagal, tapi lint & typecheck hijau | `package-lock.json` tidak sinkron dengan `package.json` | `docker compose run --rm app npm install --package-lock-only` lalu build ulang |
| `Cannot find module .../standard-fonts/...` saat export | Trace file pdfkit tidak lengkap | Sudah ditangani `outputFileTracingIncludes` di `next.config.ts` |

---

## Produksi

```bash
docker compose run --rm migrate                 # WAJIB lebih dulu
docker compose --profile prod up -d --build app-prod
```

`app` dan `app-prod` sama-sama memakai port 8003 — jangan jalankan keduanya
sekaligus.

---

## Keamanan

- Tidak ada credential di repo ini. `.env`, backup `.env`, dan backup sesi
  opencode semuanya masuk `.gitignore`.
- Password admin tidak pernah disimpan plaintext di mana pun.
- Ganti password hanya lewat `./scripts/reset-admin-password.sh`.
- Upload divalidasi nama, tipe, dan ukuran sebelum disimpan; nama berkas
  dibersihkan dan disajikan lewat route berlapis allowlist.
- Server action di `/admin` dilindungi `requireAdmin()` — layout halaman saja
  tidak cukup, karena action adalah endpoint POST tersendiri.

## Dokumentasi lain

[`AGENTS.md`](./AGENTS.md) — panduan lengkap untuk developer dan AI agent:
arsitektur, keputusan desain, jebakan yang pernah terjadi, dan cara verifikasi
sebelum menyatakan selesai.
