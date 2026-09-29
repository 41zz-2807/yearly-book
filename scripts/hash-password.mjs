#!/usr/bin/env node
/**
 * Generate hash bcrypt dari password admin, lalu encode ke base64.
 *
 * Password TIDAK PERNAH ditulis di file mana pun dan tidak disimpan.
 * Dibaca dari environment variable, lalu hanya hash-nya yang dicetak.
 *
 * Cara pakai (di dalam Docker):
 *   docker compose run --rm -e AUTH_ADMIN_PASSWORD='password-anda' app npm run auth:hash
 *
 * Kenapa base64? bcrypt selalu diawali "$2b$12$...". Nilai .env punya dua
 * pembaca yang saling bertentangan: Docker Compose (env_file) meng-interpolasi
 * karakter '$', sedangkan Next.js memuat .env apa adanya. Hash mentah akan
 * terpotong di salah satu sisi sehingga login selalu gagal. Base64 tidak
 * mengandung '$', jadi satu nilai aman untuk keduanya.
 */
import { hashSync } from "bcryptjs";

const password = process.env.AUTH_ADMIN_PASSWORD;

if (!password) {
  console.error(
    "Error: environment variable AUTH_ADMIN_PASSWORD belum di-set.\n" +
      "Contoh:\n" +
      "  docker compose run --rm -e AUTH_ADMIN_PASSWORD='...' app npm run auth:hash",
  );
  process.exit(1);
}

if (password.length < 8) {
  console.error("Error: password minimal 8 karakter.");
  process.exit(1);
}

// cost 12 = bcrypt default, cukup kuat untuk login admin.
const raw = hashSync(password, 12);
const encoded = Buffer.from(raw, "utf8").toString("base64");

console.log("Hash bcrypt berhasil dibuat.");
console.log("\nSalin baris di bawah ke .env:\n");
console.log(`AUTH_ADMIN_PASSWORD_HASH_B64="${encoded}"`);
console.log(`\nHash bcrypt aslinya (untuk di luar aplikasi): ${raw}`);
console.log(
  "\nPeringatan: jangan pernah commit nilai aslinya, hanya hash-nya.",
);
