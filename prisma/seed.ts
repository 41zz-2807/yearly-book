/**
 * Seed data awal untuk yearly-book.
 *
 * Dijalankan DI DALAM DOCKER:
 *   docker compose run --rm app npm run db:seed
 *
 * Aturan yang dipegang script ini:
 *  - NON-DESTRUKTIF. Baris dicocokkan lewat kolom `urutan` (kunci stabil yang
 *    tidak ikut berubah saat admin menyunting nama), lalu di-update bila sudah
 *    ada. Baris yang tidak ada di daftar seed TIDAK dihapus.
 *  - Kolom foto (`foto`, `fotoKelas`, `url`) SENGAJA TIDAK disentuh sama
 *    sekali, sehingga menjalankan seed ulang tidak menghapus berkas yang
 *    sudah diunggah lewat /admin.
 *  - Tidak ada URL absolut, credential, maupun data yang di-hardcode di
 *    komponen. Semua contoh teks hanya hidup di file ini.
 *  - Setting di-upsert berdasarkan id=1 karena tabel ini baris tunggal.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type SiswaSeed = {
  nama: string;
  citaCita: string | null;
  pesan: string | null;
  suratMasaDepan: string;
  urutan: number;
};

const siswaData: SiswaSeed[] = [
  {
    nama: "Alya Fadhilah",
    citaCita: "Dokter",
    pesan: "Terus berani bermimpi",
    suratMasaDepan:
      "Halo Alya! Waktu kamu membaca ini, aku mungkin sudah menjadi dokter yang menyembuhkan orang. Semoga kamu tidak pernah mengeluh saat shift malam, dan selalu ingat 사진 kita di kelas ini. Sukses ya!",
    urutan: 1,
  },
  {
    nama: "Bimo Prasetyo",
    citaCita: "Pilot",
    pesan: "Jangan menyerah saat gagal",
    suratMasaDepan:
      "Halo Bimo! Kamu pasti sudah melangit berkali-kali sebagai pilot. Semoga setiap takeoff selalu aman, dan kamu ingat teman-teman yang dulu satu kelas denganmu. Semangat!",
    urutan: 2,
  },
  {
    nama: "Citra Lestari",
    citaCita: "Arsitek",
    pesan: "Bangun yang belum ada",
    suratMasaDepan:
      "Hai Citra! Bangunan yang kamu rancang mungkin sudah berdiri saat lembar ini dibuka. Semoga kamu selalu punya keberanian untuk desain yang berbeda dari orang lain. Sukses!",
    urutan: 3,
  },
  {
    nama: "Daffa Ramadhan",
    citaCita: "Programmer",
    pesan: "Konsisten sampai tujuan",
    suratMasaDepan:
      "Halo Daffa! Kode yang kamu tulis mungkin sudah jadi aplikasi yang dipakai banyak orang. Semoga kamu tetap punya rasa ingin tahu dan tidak lupa pada teman-teman dulu. Semangat!",
    urutan: 4,
  },
  {
    nama: "Eka Wulandari",
    citaCita: "Guru",
    pesan: "Tolong lebih lagi",
    suratMasaDepan:
      "Hai Eka! Semoga kamu sudah menjadi guru yang dicintai murid-muridmu. Semoga kamu tetap sabar menghadapi anak-anak kecil, karena itu inti pekerjaanku. Sukses!",
    urutan: 5,
  },
  {
    nama: "Fajar Nugroho",
    citaCita: "Atleta",
    pesan: "Latihan tidak pernah sia-sia",
    suratMasaDepan:
      "Halo Fajar! Medali yang kamu raih mungkin sudah menjadi kenangan. Jangan berhenti berlari, dan lihatlah ke belakang sesekali untuk mengingat teman-teman dulu. Semangat!",
    urutan: 6,
  },
  {
    nama: "Gita Anindya",
    citaCita: "Penulis",
    pesan: "Cerita menunggu untuk ditulis",
    suratMasaDepan:
      "Hai Gita! Buku yang kamu tulis sekarang mungkin sedang dibaca seseorang yang tidak kamu bayangkan. Semoga suaramu selalu jujur dan berani. Tulis terus!",
    urutan: 7,
  },
  {
    nama: "Hafiz Maulana",
    citaCita: "Hakim",
    pesan: "Adil itu pilihan",
    suratMasaDepan:
      "Halo Hafiz! Semoga kamu sudah menjadi hakim yang memutuskan keadilan bagi orang lain. Semoga kamu tidak pernah lupa posisi sederhanamu dulu sebagai anak biasa. Jaga keadilan itu!",
    urutan: 8,
  },
  {
    nama: "Intan Permata",
    citaCita: "Desainer",
    pesan: "Sederhana itu indah",
    suratMasaDepan:
      "Hai Intan! Desain yang pernah kamu buat mungkin sedang dipakai setiap hari. Semoga kamu tetap menjaga kesederhanaan dan tidak tergoda menambah yang tidak perlu. Sukses!",
    urutan: 9,
  },
  {
    nama: "Jovan Kurniawan",
    citaCita: "Koki",
    pesan: "Rasa tidak pernah mengecewakan",
    suratMasaDepan:
      "Halo Jovan! Makanan yang kamu masak mungkin sudah jadi menu andalan. Semoga kamu masih menyimpan tempat untuk teman-teman di dapur kecil itu. Selamat berkarya!",
    urutan: 10,
  },
  {
    nama: "Kirana Dewi",
    citaCita: "Guru Bahasa",
    pesan: "Kata-kata punya kekuatan",
    suratMasaDepan:
      "Hai Kirana! Cerita yang pernah kamu tulis di buku ini mungkin sudah menginspirasi seseorang. Semoga suaramu terus dibutuhkan dan tidak pernah padam. Jangan berhenti menulis!",
    urutan: 11,
  },
  {
    nama: "Lukman Hakim",
    citaCita: "Insinyur",
    pesan: "Hitung dengan cermat, kerja dengan hati",
    suratMasaDepan:
      "Halo Lukman! Bangunan yang kamu rancang mungkin sudah berdiri kokoh saat ini. Semoga perhitunganmu selalu tepat dan hatimu selalu hangat. Semangat!",
    urutan: 12,
  },
  {
    nama: "Maya Sari",
    citaCita: "Psikolog",
    pesan: "Dengarkan yang lain",
    suratMasaDepan:
      "Hai Maya! Semoga kamu sudah membantu banyak orang yang sedang bingung. Semoga kamu tetap empatik dan tidak lupa untuk mendengar. Diri sendiri sudah cukup. Semangat!",
    urutan: 13,
  },
  {
    nama: "Naufal Rizqi",
    citaCita: "Teknisi",
    pesan: "Sabar itu penting",
    suratMasaDepan:
      "Halo Naufal! Mungkin kamu sudah memperbaiki banyak hal yang rusak di sekitarmu. Semoga tanganmu tetap terampil dan hatimu tetap tenang. Sukses!",
    urutan: 14,
  },
  {
    nama: "Olivia Putri",
    citaCita: "Model",
    pesan: "Kamu sudah cukup luar biasa",
    suratMasaDepan:
      "Hai Olivia! Semoga kamu sudah tampil di banyak panggung. Tapi jangan lupa, yang paling penting adalah kamu yang asli, bukan versi yang mereka pilih. Tetap rendah hati!",
    urutan: 15,
  },
  {
    nama: "Panji Wicaksono",
    citaCita: "Fotografer",
    pesan: "Tangkap momennya",
    suratMasaDepan:
      "Halo Panji! Foto-foto yang kamu ambil mungkin sedang dipajang di galeri. Semoga matamu selalu peka terhadap hal-hal indah. Terus berkarya!",
    urutan: 16,
  },
  {
    nama: "Qonita Zahra",
    citaCita: "Dentis",
    pesan: "Hati-hati dalam bekerja",
    suratMasaDepan:
      "Hai Qonita! Semoga kamu sudah menyembuhkan banyak senyum. Semoga tanganmu tetap lembut dan hatimu tetap sabar. Sukses!",
    urutan: 17,
  },
  {
    nama: "Raka Aditya",
    citaCita: "Entrepreneur",
    pesan: "Mulai dari nol",
    suratMasaDepan:
      "Halo Raka! Perusahaan yang kamu bangun mungkin sudah besar. Tapi jangan lupa siapa yang mendampingimu di awal. Tetap rendah hati!",
    urutan: 18,
  },
  {
    nama: "Salsabila",
    citaCita: "Penyanyi",
    pesan: "Nyanyikan yang terasa",
    suratMasaDepan:
      "Hai Salsa! Lagu yang kamu nyanyikan mungkin sudah jadi milik banyak orang. Semoga suaramu tetap menyentuh hati. Terus menyanyikan!",
    urutan: 19,
  },
  {
    nama: "Taufik Hidayat",
    citaCita: "Mekanik",
    pesan: "Bekerja dengan bersih",
    suratMasaDepan:
      "Halo Taufik! Mobil yang kamu servis mungkin sudah berjalan jauh. Semoga tanganmu tetap terampil dan kerjaanmu tetap rapi. Semangat!",
    urutan: 20,
  },
  {
    nama: "Umi Kalsum",
    citaCita: "Pedagang",
    pesan: "Jujur dalam berjualan",
    suratMasaDepan:
      "Hai Umi! Bisnis yang kamu bangun mungkin sudah berkembang. Tapi kejujuran yang kamu mulai dari sekarang tetap jadi modal terbaik. Sukses!",
    urutan: 21,
  },
  {
    nama: "Vino Ardiansyah",
    citaCita: "Programmer",
    pesan: "Bug itu teman belajar",
    suratMasaDepan:
      "Halo Vino! Kode yang kamu tulis mungkin sudah jadi hal yang diandalkan orang lain. Semoga kamu tetap berani menghadapi masalah. Semangat!",
    urutan: 22,
  },
  {
    nama: "Widya Ningrum",
    citaCita: "Akuntan",
    pesan: "Angka tidak pernah berbohong",
    suratMasaDepan:
      "Hai Widya! Laporan yang kamu buat mungkin sudah jadi acuan banyak orang. Semoga hitunganmu selalu teliti dan hatimu selalu tenang. Sukses!",
    urutan: 23,
  },
  {
    nama: "Yoga Pratama",
    citaCita: "Pilot",
    pesan: "Arah itu penting",
    suratMasaDepan:
      "Halo Yoga! Pesawat yang kamu kendalikan mungkin sudah mendarat di banyak bandara. Semoga kamu selalu ingat untuk pulang membawa cerita untuk teman-teman. Hati-hati di atas!",
    urutan: 24,
  },
];

/**
 * Foto kegiatan untuk halaman "Kenang Seru".
 *
 * `url` sengaja null supaya placeholder berlabel yang tampil, bukan gambar
 * rusak. Isi gambarnya lewat /admin/kegiatan; hasil upload disimpan sebagai
 * path publik relatif oleh `lib/upload.ts`.
 *
 * Kolom `url` tidak pernah ditulis oleh seed ini, jadi foto yang sudah
 * Anda unggah aman saat seed dijalankan ulang.
 */
const kegiatanData: {
  url: string | null;
  caption: string | null;
  urutan: number;
}[] = [
  { url: null, caption: "Hari pertama masuk kelas, penuh semangat", urutan: 1 },
  { url: null, caption: "Belajar bersama di taman sekolah", urutan: 2 },
  { url: null, caption: "Lomba Tahfidz, alhamdulillah berhasil menjadi juara", urutan: 3 },
  { url: null, caption: "Outing bersama ke museum", urutan: 4 },
  { url: null, caption: "Puasa bersama dan berbagi takzir", urutan: 5 },
  { url: null, caption: "Pentas seni sebagai penutup tahun", urutan: 6 },
  { url: null, caption: "Class meeting, semangat belum padam", urutan: 7 },
  { url: null, caption: "Foto bersama sebelum lulus", urutan: 8 },
  { url: null, caption: null, urutan: 9 },
];

/** Wali kelas. `foto` tidak pernah ditulis seed, jadi foto yang sudah diunggah aman. */
const waliKelas = {
  nama: "Ibu Siti Rahmawati",
  pesan:
    "Terima kasih atas kekompakan dan kejujuran yang kita bangun bersama. Semoga langkah kalian selalu dilindungi.",
};

const prestasiData: {
  judul: string;
  deskripsi: string | null;
  urutan: number;
}[] = [
  {
    judul: "Juara 1 Lomba Essay",
    deskripsi: "Kelas kami meraih juara pertama tingkat kabupaten.",
    urutan: 1,
  },
  { judul: "Juara 2 Pancak Silat", deskripsi: null, urutan: 2 },
  { judul: "Juara 3 Lomba Matematika", deskripsi: null, urutan: 3 },
];

/**
 * Siswa per halaman pada bab Profil Siswa.
 *
 * Disalin nilainya, bukan di-import dari `components/book/chapters.ts`, supaya
 * file seed tetap jalan tanpa bergantung pada alias path `@/`. Kalau nilai di
 * sana berubah, samakan juga nilai ini.
 */
const PROFIL_PER_PAGE = 3;

async function main() {
  // Teks identitas kelas. `fotoKelas` sengaja tidak ada di `update` supaya
  // foto yang sudah diunggah tidak terhapus saat seed dijalankan ulang.
  const identitas = {
    namaKelas: "Grade 6 - Jannatul Firdaus (Angkatan 2)",
    sekolah: "SDIT GIIS",
    angkatan: 2021,
    tahun: 2027,
    sambutan:
      "Segala puji bagi Tuhan Yang Maha Esa. Dengan rahmat-Nya, buku annual ini berhasil tersusun sebagai kenangan bersama. Semoga menjadi pengingat akan perjalanan kita di bangku sekolah.\n\nTerima kasih untuk semua momen yang kita lewati bersama: pagi yang ramai di gerbang sekolah, tugas kelompok yang berantakan, hingga langkah pertama memasuki SMP. Buku ini adalah bukti bahwa kita pernah muda bersama.",
    penutup:
      "Terima kasih kepada guru-guru yang sabar membimbing, teman-teman yang selalu mendukung, dan orang tua yang selalu mendoakan. Semoga kita menjadi alumni yang membanggakan.\n\nDan semoga kita tidak berhenti belajar setelah meninggalkan kelas ini. Sampai jumpa di angkatan yang sama, beberapa tahun dari sekarang.",
  };

  const setting = await prisma.setting.upsert({
    where: { id: 1 },
    update: identitas,
    create: { id: 1, ...identitas, fotoKelas: null },
  });

  // Siswa: dicocokkan lewat `urutan` (kunci yang tidak ikut berubah saat admin
  // mengganti nama). Kolom `foto` tidak dikirim, jadi foto lama bertahan.
  for (const row of siswaData) {
    const ada = await prisma.siswa.findFirst({ where: { urutan: row.urutan } });
    if (ada) {
      await prisma.siswa.update({ where: { id: ada.id }, data: row });
    } else {
      await prisma.siswa.create({ data: { ...row, foto: null } });
    }
  }

  // Wali kelas: `foto` juga tidak ikut di-update.
  await prisma.waliKelas.upsert({
    where: { id: 1 },
    update: { nama: waliKelas.nama, pesan: waliKelas.pesan },
    create: { id: 1, ...waliKelas, foto: null },
  });

  for (const row of prestasiData) {
    const ada = await prisma.prestasi.findFirst({ where: { urutan: row.urutan } });
    if (ada) {
      await prisma.prestasi.update({ where: { id: ada.id }, data: row });
    } else {
      await prisma.prestasi.create({ data: { ...row, foto: null } });
    }
  }

  // Foto kegiatan: `url` tidak pernah disentuh. Caption hanya diisi bila masih
  // kosong, supaya caption yang sudah disunting admin tidak tertimpa contoh.
  for (const row of kegiatanData) {
    const ada = await prisma.fotoKegiatan.findFirst({ where: { urutan: row.urutan } });
    if (!ada) {
      await prisma.fotoKegiatan.create({ data: row });
    } else if (!ada.caption) {
      await prisma.fotoKegiatan.update({
        where: { id: ada.id },
        data: { caption: row.caption },
      });
    }
  }

  const [jumlahSiswa, jumlahKegiatan, jumlahPrestasi, jumlahWali] =
    await Promise.all([
      prisma.siswa.count(),
      prisma.fotoKegiatan.count(),
      prisma.prestasi.count(),
      prisma.waliKelas.count(),
    ]);

  // Seed ini NON-DESTRUKTIF, jadi baris yang tidak ada di daftar seed (sisa
  // seed versi lama, atau data yang ditambahkan admin) sengaja dibiarkan.
  // Akibatnya baris semacam itu bisa berduplikat tanpa terlihat. Laporan di
  // bawah membuat masalah itu kelihatan; menghapusnya tetap keputusan manusia.
  const [siswaDoble, kegiatanDoble, prestasiDoble] = await Promise.all([
    prisma.siswa.count({ where: { urutan: { gt: siswaData.length } } }),
    prisma.fotoKegiatan.count({ where: { urutan: { gt: kegiatanData.length } } }),
    prisma.prestasi.count({ where: { urutan: { gt: prestasiData.length } } }),
  ]);

  const jumlahDiLuar: [string, number][] = [
    ["siswa", siswaDoble],
    ["kegiatan", kegiatanDoble],
    ["prestasi", prestasiDoble],
  ];
  const peringatan = jumlahDiLuar.filter(([, n]) => n > 0);

  console.log("Seed selesai:", {
    setting: setting.namaKelas,
    sekolah: setting.sekolah,
    angkatan: `${setting.angkatan}/${setting.tahun}`,
    siswa: jumlahSiswa,
    waliKelas: jumlahWali,
    prestasi: jumlahPrestasi,
    fotoKegiatan: jumlahKegiatan,
    totalHalamanProfil: Math.ceil(jumlahSiswa / PROFIL_PER_PAGE),
  });

  if (peringatan.length > 0) {
    console.warn(
      "\nPERINGATAN: ada baris di luar daftar seed (tidak dihapus oleh script ini):",
    );
    for (const [label, n] of peringatan) {
      console.warn(`  - ${label}: ${n} baris`);
    }
    console.warn(
      "  Periksa di /admin. Baris seperti ini bisa sisa seed versi lama dan\n  boleh menyebabkan duplikat. Hapus lewat /admin bila tidak diperlukan.\n",
    );
  }
}

main()
  .catch((error) => {
    console.error("Seed GAGAL:", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
