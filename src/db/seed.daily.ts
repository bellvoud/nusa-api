// src/db/seed.daily.ts
// Jalankan SETELAH seed.ts utama: bun run src/db/seed.daily.ts
// File ini hanya menambahkan data daily quiz dan weekly tasks

import { db } from "./index";
import { dailyQuizzes, dailyQuizOptions, weeklyTasks } from "./schema";

console.log("🌱 Memulai seed daily quiz & weekly tasks...\n");

// ============================================================
// DAILY QUIZZES — 30 soal bank harian
// Mencakup berbagai topik sejarah Indonesia
// Soal dipilih dengan rumus: dayOfYear % totalSoal
// ============================================================

type DailyQuizInsert = {
  question: string;
  type: "multiple_choice" | "true_false" | "fill_blank";
  explanation: string;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  options: Array<{
    optionText: string;
    isCorrect: boolean;
    orderIndex: number;
  }>;
};

const dailyQuizData: DailyQuizInsert[] = [
  // ── Proklamasi Kemerdekaan ────────────────────────────────
  {
    question: "Pada tanggal berapa Proklamasi Kemerdekaan Indonesia dibacakan?",
    type: "multiple_choice",
    explanation:
      "Proklamasi Kemerdekaan Indonesia dibacakan oleh Soekarno-Hatta pada tanggal 17 Agustus 1945 di Jalan Pegangsaan Timur No. 56, Jakarta.",
    topic: "Proklamasi",
    difficulty: "easy",
    options: [
      { optionText: "15 Agustus 1945", isCorrect: false, orderIndex: 1 },
      { optionText: "17 Agustus 1945", isCorrect: true, orderIndex: 2 },
      { optionText: "18 Agustus 1945", isCorrect: false, orderIndex: 3 },
      { optionText: "20 Agustus 1945", isCorrect: false, orderIndex: 4 },
    ],
  },
  {
    question: "Siapakah yang mengetik naskah Proklamasi Kemerdekaan Indonesia?",
    type: "multiple_choice",
    explanation:
      "Sayuti Melik adalah orang yang mengetik naskah Proklamasi setelah teks tulisan tangan Soekarno mengalami beberapa perubahan. Naskah diketik dini hari tanggal 17 Agustus 1945.",
    topic: "Proklamasi",
    difficulty: "medium",
    options: [
      { optionText: "Mohammad Hatta", isCorrect: false, orderIndex: 1 },
      { optionText: "Ahmad Soebardjo", isCorrect: false, orderIndex: 2 },
      { optionText: "Sayuti Melik", isCorrect: true, orderIndex: 3 },
      { optionText: "B.M. Diah", isCorrect: false, orderIndex: 4 },
    ],
  },
  {
    question: "Peristiwa Rengasdengklok terjadi pada tanggal 16 Agustus 1945.",
    type: "true_false",
    explanation:
      "Benar. Peristiwa Rengasdengklok terjadi pada 16 Agustus 1945, ketika para pemuda membawa Soekarno-Hatta ke Rengasdengklok untuk mendesak agar proklamasi segera dilaksanakan tanpa menunggu persetujuan Jepang.",
    topic: "Proklamasi",
    difficulty: "medium",
    options: [
      { optionText: "Benar", isCorrect: true, orderIndex: 1 },
      { optionText: "Salah", isCorrect: false, orderIndex: 2 },
    ],
  },

  // ── Sumpah Pemuda ─────────────────────────────────────────
  {
    question: "Sumpah Pemuda dicetuskan pada tanggal berapa?",
    type: "multiple_choice",
    explanation:
      "Sumpah Pemuda dicetuskan pada 28 Oktober 1928 dalam Kongres Pemuda II di Batavia (Jakarta). Tanggal ini kini diperingati sebagai Hari Sumpah Pemuda.",
    topic: "Sumpah Pemuda",
    difficulty: "easy",
    options: [
      { optionText: "20 Mei 1908", isCorrect: false, orderIndex: 1 },
      { optionText: "28 Oktober 1928", isCorrect: true, orderIndex: 2 },
      { optionText: "17 Agustus 1945", isCorrect: false, orderIndex: 3 },
      { optionText: "1 Juni 1945", isCorrect: false, orderIndex: 4 },
    ],
  },
  {
    question:
      "Lagu Indonesia Raya pertama kali dikumandangkan pada Kongres Pemuda II oleh...",
    type: "multiple_choice",
    explanation:
      "W.R. Supratman pertama kali memperdengarkan lagu Indonesia Raya dengan biola pada Kongres Pemuda II tanggal 28 Oktober 1928. Lagu ini kemudian menjadi lagu kebangsaan Indonesia.",
    topic: "Sumpah Pemuda",
    difficulty: "medium",
    options: [
      { optionText: "Wage Rudolf Supratman", isCorrect: true, orderIndex: 1 },
      { optionText: "Kusbini", isCorrect: false, orderIndex: 2 },
      { optionText: "Ismail Marzuki", isCorrect: false, orderIndex: 3 },
      { optionText: "C. Simanjuntak", isCorrect: false, orderIndex: 4 },
    ],
  },

  // ── Boedi Oetomo & Kebangkitan Nasional ───────────────────
  {
    question:
      "Organisasi Boedi Oetomo didirikan pada tanggal 20 Mei 1908 oleh para mahasiswa STOVIA. Tanggal ini diperingati sebagai...",
    type: "multiple_choice",
    explanation:
      "Tanggal 20 Mei 1908 diperingati sebagai Hari Kebangkitan Nasional, karena berdirinya Boedi Oetomo dianggap sebagai tonggak awal pergerakan nasional Indonesia yang terorganisir.",
    topic: "Kebangkitan Nasional",
    difficulty: "easy",
    options: [
      {
        optionText: "Hari Pendidikan Nasional",
        isCorrect: false,
        orderIndex: 1,
      },
      {
        optionText: "Hari Kebangkitan Nasional",
        isCorrect: true,
        orderIndex: 2,
      },
      { optionText: "Hari Pahlawan", isCorrect: false, orderIndex: 3 },
      { optionText: "Hari Pemuda", isCorrect: false, orderIndex: 4 },
    ],
  },
  {
    question: "Siapakah pendiri Boedi Oetomo?",
    type: "multiple_choice",
    explanation:
      "Dr. Wahidin Sudirohusodo adalah tokoh yang menginspirasi berdirinya Boedi Oetomo, namun pendiri resminya adalah Dr. Soetomo bersama para mahasiswa STOVIA lainnya pada 20 Mei 1908.",
    topic: "Kebangkitan Nasional",
    difficulty: "medium",
    options: [
      {
        optionText: "Dr. Wahidin Sudirohusodo",
        isCorrect: false,
        orderIndex: 1,
      },
      { optionText: "Dr. Soetomo", isCorrect: true, orderIndex: 2 },
      { optionText: "Ki Hajar Dewantara", isCorrect: false, orderIndex: 3 },
      { optionText: "H.O.S. Tjokroaminoto", isCorrect: false, orderIndex: 4 },
    ],
  },

  // ── Sriwijaya ─────────────────────────────────────────────
  {
    question:
      "Kerajaan Sriwijaya mencapai puncak kejayaannya pada abad ke berapa?",
    type: "multiple_choice",
    explanation:
      "Sriwijaya mencapai puncak kejayaannya pada abad ke-7 hingga ke-9 M, terutama di bawah penguasa-penguasa yang memperluas wilayah dan menguasai jalur perdagangan di Selat Malaka.",
    topic: "Sriwijaya",
    difficulty: "medium",
    options: [
      { optionText: "Abad ke-4 – 5 M", isCorrect: false, orderIndex: 1 },
      { optionText: "Abad ke-7 – 9 M", isCorrect: true, orderIndex: 2 },
      { optionText: "Abad ke-11 – 13 M", isCorrect: false, orderIndex: 3 },
      { optionText: "Abad ke-14 – 15 M", isCorrect: false, orderIndex: 4 },
    ],
  },
  {
    question:
      "Prasasti tertua yang membuktikan keberadaan Kerajaan Sriwijaya adalah Prasasti Kedukan Bukit (682 M).",
    type: "true_false",
    explanation:
      "Benar. Prasasti Kedukan Bukit yang ditemukan di tepi Sungai Tatang dekat Palembang, berangka tahun 682 M, merupakan bukti tertulis tertua keberadaan Kerajaan Sriwijaya.",
    topic: "Sriwijaya",
    difficulty: "hard",
    options: [
      { optionText: "Benar", isCorrect: true, orderIndex: 1 },
      { optionText: "Salah", isCorrect: false, orderIndex: 2 },
    ],
  },

  // ── Kutai ─────────────────────────────────────────────────
  {
    question:
      "Kerajaan Kutai merupakan kerajaan Hindu tertua di Indonesia. Bukti keberadaannya ditemukan berupa...",
    type: "multiple_choice",
    explanation:
      "Bukti keberadaan Kerajaan Kutai adalah tujuh buah prasasti Yupa (tiang batu) yang ditulis dalam bahasa Sanskerta dengan huruf Pallawa, diperkirakan berasal dari abad ke-4 M.",
    topic: "Kutai",
    difficulty: "medium",
    options: [
      { optionText: "Prasasti Canggal", isCorrect: false, orderIndex: 1 },
      { optionText: "Prasasti Yupa", isCorrect: true, orderIndex: 2 },
      { optionText: "Prasasti Kedukan Bukit", isCorrect: false, orderIndex: 3 },
      { optionText: "Prasasti Tugu", isCorrect: false, orderIndex: 4 },
    ],
  },
  {
    question:
      "Raja pertama Kerajaan Kutai yang namanya tercatat dalam prasasti adalah...",
    type: "multiple_choice",
    explanation:
      "Kudungga adalah raja pertama Kutai yang namanya tercatat dalam Prasasti Yupa. Nama Kudungga diyakini masih merupakan nama asli Indonesia (bukan Sanskerta), menandakan ia hidup di masa transisi sebelum pengaruh Hindu sepenuhnya masuk.",
    topic: "Kutai",
    difficulty: "hard",
    options: [
      { optionText: "Mulawarman", isCorrect: false, orderIndex: 1 },
      { optionText: "Aswawarman", isCorrect: false, orderIndex: 2 },
      { optionText: "Kudungga", isCorrect: true, orderIndex: 3 },
      { optionText: "Purnawarman", isCorrect: false, orderIndex: 4 },
    ],
  },

  // ── Tarumanagara ──────────────────────────────────────────
  {
    question:
      "Kerajaan Tarumanagara terletak di wilayah yang sekarang menjadi provinsi...",
    type: "multiple_choice",
    explanation:
      "Kerajaan Tarumanagara (abad ke-4 hingga ke-7 M) berpusat di wilayah yang kini menjadi Jawa Barat. Prasasti Ciaruteun dan beberapa prasasti lainnya ditemukan di sekitar Bogor.",
    topic: "Tarumanagara",
    difficulty: "easy",
    options: [
      { optionText: "Jawa Tengah", isCorrect: false, orderIndex: 1 },
      { optionText: "Jawa Timur", isCorrect: false, orderIndex: 2 },
      { optionText: "Jawa Barat", isCorrect: true, orderIndex: 3 },
      { optionText: "Banten", isCorrect: false, orderIndex: 4 },
    ],
  },

  // ── Majapahit lanjutan ────────────────────────────────────
  {
    question:
      "Kitab Negarakertagama ditulis oleh Mpu Prapanca pada masa pemerintahan Raja...",
    type: "multiple_choice",
    explanation:
      "Negarakertagama ditulis oleh Mpu Prapanca pada tahun 1365 M semasa pemerintahan Raja Hayam Wuruk. Kitab ini merupakan sumber sejarah utama tentang kejayaan Majapahit dan wilayah kekuasaannya.",
    topic: "Majapahit",
    difficulty: "hard",
    options: [
      { optionText: "Raden Wijaya", isCorrect: false, orderIndex: 1 },
      { optionText: "Jayanagara", isCorrect: false, orderIndex: 2 },
      { optionText: "Hayam Wuruk", isCorrect: true, orderIndex: 3 },
      { optionText: "Wikramawardhana", isCorrect: false, orderIndex: 4 },
    ],
  },
  {
    question: "Semboyan 'Bhinneka Tunggal Ika' berasal dari kitab...",
    type: "multiple_choice",
    explanation:
      "Semboyan Bhinneka Tunggal Ika berasal dari Kitab Sutasoma karya Mpu Tantular, ditulis pada masa Kerajaan Majapahit abad ke-14. Frasa lengkapnya adalah 'Bhinneka Tunggal Ika Tan Hana Dharma Mangrwa'.",
    topic: "Majapahit",
    difficulty: "medium",
    options: [
      { optionText: "Negarakertagama", isCorrect: false, orderIndex: 1 },
      { optionText: "Pararaton", isCorrect: false, orderIndex: 2 },
      { optionText: "Sutasoma", isCorrect: true, orderIndex: 3 },
      { optionText: "Arjunawiwaha", isCorrect: false, orderIndex: 4 },
    ],
  },

  // ── VOC & Kolonialisme ────────────────────────────────────
  {
    question:
      "VOC (Vereenigde Oostindische Compagnie) resmi dibubarkan pada tahun...",
    type: "multiple_choice",
    explanation:
      "VOC resmi dibubarkan pada 31 Desember 1799 akibat kebangkrutan dan korupsi yang merajalela. Setelah pembubaran, semua aset dan utang VOC diambil alih oleh Pemerintah Belanda.",
    topic: "VOC",
    difficulty: "hard",
    options: [
      { optionText: "1750", isCorrect: false, orderIndex: 1 },
      { optionText: "1799", isCorrect: true, orderIndex: 2 },
      { optionText: "1811", isCorrect: false, orderIndex: 3 },
      { optionText: "1830", isCorrect: false, orderIndex: 4 },
    ],
  },
  {
    question:
      "Sistem Tanam Paksa (Cultuurstelsel) diterapkan di Indonesia oleh Gubernur Jenderal...",
    type: "multiple_choice",
    explanation:
      "Sistem Tanam Paksa diterapkan oleh Gubernur Jenderal Johannes van den Bosch mulai tahun 1830. Kebijakan ini mewajibkan rakyat menyerahkan 1/5 lahan atau 66 hari kerja per tahun untuk menanam komoditas ekspor.",
    topic: "VOC",
    difficulty: "medium",
    options: [
      { optionText: "Daendels", isCorrect: false, orderIndex: 1 },
      { optionText: "Raffles", isCorrect: false, orderIndex: 2 },
      { optionText: "Van den Bosch", isCorrect: true, orderIndex: 3 },
      { optionText: "De Kock", isCorrect: false, orderIndex: 4 },
    ],
  },

  // ── Pahlawan Nasional ─────────────────────────────────────
  {
    question:
      "Siapakah pahlawan nasional yang mendapat julukan 'Ayam Jantan dari Timur'?",
    type: "multiple_choice",
    explanation:
      "Sultan Hasanuddin dari Kerajaan Gowa-Tallo mendapat julukan 'Ayam Jantan dari Timur' karena keberaniannya melawan VOC. Perlawanannya begitu gigih hingga Belanda harus mengakui keberaniannya.",
    topic: "Pahlawan Nasional",
    difficulty: "easy",
    options: [
      { optionText: "Pangeran Diponegoro", isCorrect: false, orderIndex: 1 },
      { optionText: "Sultan Hasanuddin", isCorrect: true, orderIndex: 2 },
      { optionText: "Teuku Umar", isCorrect: false, orderIndex: 3 },
      { optionText: "Cut Nyak Dien", isCorrect: false, orderIndex: 4 },
    ],
  },
  {
    question:
      "R.A. Kartini dikenal sebagai pelopor emansipasi wanita Indonesia. Kumpulan suratnya yang terkenal berjudul...",
    type: "multiple_choice",
    explanation:
      "'Door Duisternis tot Licht' (Habis Gelap Terbitlah Terang) adalah kumpulan surat R.A. Kartini yang diterbitkan pada 1911, dua tahun setelah wafatnya. Surat-surat ini ditujukan kepada teman-temannya di Belanda.",
    topic: "Pahlawan Nasional",
    difficulty: "easy",
    options: [
      {
        optionText: "Dari Sabang sampai Merauke",
        isCorrect: false,
        orderIndex: 1,
      },
      {
        optionText: "Habis Gelap Terbitlah Terang",
        isCorrect: true,
        orderIndex: 2,
      },
      { optionText: "Indonesia Menggugat", isCorrect: false, orderIndex: 3 },
      {
        optionText: "Di Bawah Bendera Revolusi",
        isCorrect: false,
        orderIndex: 4,
      },
    ],
  },

  // ── Perang Kemerdekaan ────────────────────────────────────
  {
    question:
      "Pertempuran Surabaya yang terjadi pada 10 November 1945 dipimpin oleh...",
    type: "multiple_choice",
    explanation:
      "Bung Tomo (Sutomo) adalah tokoh yang dengan pidato-pidatonya yang berapi-api di radio berhasil membakar semangat arek-arek Surabaya untuk bertempur melawan tentara Inggris. Tanggal 10 November kini diperingati sebagai Hari Pahlawan.",
    topic: "Perang Kemerdekaan",
    difficulty: "easy",
    options: [
      { optionText: "Jenderal Soedirman", isCorrect: false, orderIndex: 1 },
      { optionText: "Bung Tomo", isCorrect: true, orderIndex: 2 },
      { optionText: "Mohammad Toha", isCorrect: false, orderIndex: 3 },
      { optionText: "Ksatria Siliwangi", isCorrect: false, orderIndex: 4 },
    ],
  },
  {
    question:
      "Agresi Militer Belanda I terjadi pada tahun 1947. Tindakan ini mengakibatkan...",
    type: "multiple_choice",
    explanation:
      "Agresi Militer Belanda I (21 Juli – 5 Agustus 1947) mengakibatkan PBB turun tangan dan membentuk Komisi Tiga Negara (KTN) untuk menengahi konflik. Hal ini berujung pada Perjanjian Renville pada Januari 1948.",
    topic: "Perang Kemerdekaan",
    difficulty: "hard",
    options: [
      {
        optionText: "Perjanjian Linggarjati ditandatangani",
        isCorrect: false,
        orderIndex: 1,
      },
      {
        optionText: "PBB membentuk Komisi Tiga Negara",
        isCorrect: true,
        orderIndex: 2,
      },
      {
        optionText: "Indonesia merdeka diakui dunia",
        isCorrect: false,
        orderIndex: 3,
      },
      {
        optionText: "Belanda menarik semua pasukan",
        isCorrect: false,
        orderIndex: 4,
      },
    ],
  },

  // ── Orde Lama & Baru ──────────────────────────────────────
  {
    question:
      "Dekrit Presiden 5 Juli 1959 yang dikeluarkan Soekarno berisi tentang...",
    type: "multiple_choice",
    explanation:
      "Dekrit Presiden 5 Juli 1959 berisi: pembubaran Konstituante, berlakunya kembali UUD 1945, dan tidak berlakunya lagi UUDS 1950. Dekrit ini menandai dimulainya era Demokrasi Terpimpin.",
    topic: "Orde Lama",
    difficulty: "hard",
    options: [
      {
        optionText: "Pembentukan kabinet baru",
        isCorrect: false,
        orderIndex: 1,
      },
      {
        optionText: "Kembali ke UUD 1945 dan bubarkan Konstituante",
        isCorrect: true,
        orderIndex: 2,
      },
      { optionText: "Pembentukan MPRS", isCorrect: false, orderIndex: 3 },
      {
        optionText: "Pengakuan kedaulatan Indonesia",
        isCorrect: false,
        orderIndex: 4,
      },
    ],
  },
  {
    question:
      "Pancasila pertama kali dirumuskan oleh Soekarno dalam sidang BPUPKI pada tanggal 1 Juni 1945.",
    type: "true_false",
    explanation:
      "Benar. Soekarno menyampaikan pidato tentang dasar negara yang kemudian dikenal sebagai Pancasila pada sidang BPUPKI tanggal 1 Juni 1945. Tanggal ini diperingati sebagai Hari Lahir Pancasila.",
    topic: "Orde Lama",
    difficulty: "easy",
    options: [
      { optionText: "Benar", isCorrect: true, orderIndex: 1 },
      { optionText: "Salah", isCorrect: false, orderIndex: 2 },
    ],
  },

  // ── Kerajaan Islam Nusantara ──────────────────────────────
  {
    question: "Kerajaan Islam pertama di Indonesia adalah...",
    type: "multiple_choice",
    explanation:
      "Samudera Pasai di Aceh (berdiri sekitar abad ke-13) dianggap sebagai kerajaan Islam pertama di Indonesia. Marco Polo yang singgah pada 1292 mencatat adanya kerajaan Islam di wilayah ini.",
    topic: "Kerajaan Islam",
    difficulty: "medium",
    options: [
      { optionText: "Kesultanan Demak", isCorrect: false, orderIndex: 1 },
      { optionText: "Samudera Pasai", isCorrect: true, orderIndex: 2 },
      { optionText: "Kesultanan Mataram", isCorrect: false, orderIndex: 3 },
      { optionText: "Kesultanan Ternate", isCorrect: false, orderIndex: 4 },
    ],
  },
  {
    question:
      "Wali Songo adalah sembilan ulama penyebar Islam di Jawa. Siapakah yang dikenal sebagai 'Sunan Kalijaga'?",
    type: "multiple_choice",
    explanation:
      "Raden Said dikenal sebagai Sunan Kalijaga, salah satu Wali Songo yang terkenal karena pendekatannya menyebarkan Islam melalui budaya Jawa seperti wayang, gamelan, dan tembang.",
    topic: "Kerajaan Islam",
    difficulty: "medium",
    options: [
      { optionText: "Raden Rahmat", isCorrect: false, orderIndex: 1 },
      { optionText: "Raden Said", isCorrect: true, orderIndex: 2 },
      { optionText: "Maulana Malik Ibrahim", isCorrect: false, orderIndex: 3 },
      { optionText: "Raden Paku", isCorrect: false, orderIndex: 4 },
    ],
  },

  // ── Candi & Arkeologi ─────────────────────────────────────
  {
    question: "Candi Borobudur dibangun pada masa pemerintahan dinasti...",
    type: "multiple_choice",
    explanation:
      "Candi Borobudur dibangun pada masa Dinasti Syailendra sekitar abad ke-8 hingga ke-9 M. Candi ini merupakan monumen Buddha terbesar di dunia dan ditetapkan sebagai Situs Warisan Dunia UNESCO.",
    topic: "Candi",
    difficulty: "easy",
    options: [
      { optionText: "Dinasti Sanjaya", isCorrect: false, orderIndex: 1 },
      { optionText: "Dinasti Syailendra", isCorrect: true, orderIndex: 2 },
      { optionText: "Dinasti Mataram Kuno", isCorrect: false, orderIndex: 3 },
      { optionText: "Dinasti Isyana", isCorrect: false, orderIndex: 4 },
    ],
  },
  {
    question:
      "Kompleks Candi Prambanan didedikasikan untuk Trimurti Hindu yaitu...",
    type: "multiple_choice",
    explanation:
      "Candi Prambanan didedikasikan untuk Trimurti: Brahma (Sang Pencipta), Wisnu (Sang Pemelihara), dan Siwa (Sang Perusak/Penghancur). Candi Siwa adalah yang terbesar dan tertinggi di kompleks ini.",
    topic: "Candi",
    difficulty: "medium",
    options: [
      {
        optionText: "Brahma, Indra, dan Wisnu",
        isCorrect: false,
        orderIndex: 1,
      },
      { optionText: "Brahma, Wisnu, dan Siwa", isCorrect: true, orderIndex: 2 },
      {
        optionText: "Siwa, Durga, dan Ganesha",
        isCorrect: false,
        orderIndex: 3,
      },
      {
        optionText: "Wisnu, Lakshmi, dan Saraswati",
        isCorrect: false,
        orderIndex: 4,
      },
    ],
  },

  // ── Pergerakan Nasional Lanjutan ──────────────────────────
  {
    question:
      "Partai Nasional Indonesia (PNI) didirikan oleh Soekarno pada tahun...",
    type: "multiple_choice",
    explanation:
      "PNI didirikan oleh Soekarno pada 4 Juli 1927 di Bandung. PNI menjadi partai yang secara tegas memperjuangkan kemerdekaan Indonesia penuh tanpa kerja sama dengan pemerintah kolonial Belanda.",
    topic: "Pergerakan Nasional",
    difficulty: "medium",
    options: [
      { optionText: "1920", isCorrect: false, orderIndex: 1 },
      { optionText: "1927", isCorrect: true, orderIndex: 2 },
      { optionText: "1930", isCorrect: false, orderIndex: 3 },
      { optionText: "1935", isCorrect: false, orderIndex: 4 },
    ],
  },
  {
    question:
      "Kongres Perempuan Indonesia I yang diadakan pada 1928 di Yogyakarta merupakan cikal bakal peringatan...",
    type: "multiple_choice",
    explanation:
      "Kongres Perempuan Indonesia I pada 22 Desember 1928 di Yogyakarta menjadi cikal bakal peringatan Hari Ibu yang diperingati setiap 22 Desember. Kongres ini membahas masalah perkawinan, pendidikan, dan nasib perempuan.",
    topic: "Pergerakan Nasional",
    difficulty: "medium",
    options: [
      { optionText: "Hari Kartini", isCorrect: false, orderIndex: 1 },
      { optionText: "Hari Ibu", isCorrect: true, orderIndex: 2 },
      {
        optionText: "Hari Perempuan Nasional",
        isCorrect: false,
        orderIndex: 3,
      },
      { optionText: "Hari Emansipasi", isCorrect: false, orderIndex: 4 },
    ],
  },
];

// Insert daily quizzes
let dqCount = 0;
let dqOptionCount = 0;

for (const quiz of dailyQuizData) {
  const { options, ...quizFields } = quiz;
  const [inserted] = await db
    .insert(dailyQuizzes)
    .values(quizFields)
    .returning({ id: dailyQuizzes.id });

  await db
    .insert(dailyQuizOptions)
    .values(options.map((opt) => ({ ...opt, dailyQuizId: inserted.id })));

  dqCount++;
  dqOptionCount += options.length;
}

console.log(
  `✅ ${dqCount} soal quiz harian berhasil dibuat (${dqOptionCount} pilihan jawaban)`,
);

// ============================================================
// WEEKLY TASKS — 4 task aktif setiap minggu
// ============================================================

const weeklyTaskData = [
  {
    title: "Penjelajah Mingguan",
    description: "Selesaikan 3 level manapun dalam minggu ini.",
    type: "complete_levels" as const,
    targetValue: 3,
    xpReward: 75,
    isActive: true,
  },
  {
    title: "Perfeksionis",
    description: "Raih skor sempurna (100) sebanyak 2 kali dalam minggu ini.",
    type: "perfect_score" as const,
    targetValue: 2,
    xpReward: 100,
    isActive: true,
  },
  {
    title: "Setia Belajar",
    description: "Login dan bermain selama 5 hari dalam minggu ini.",
    type: "login_streak" as const,
    targetValue: 5,
    xpReward: 60,
    isActive: true,
  },
  {
    title: "Pemburu XP",
    description: "Kumpulkan total 300 XP dari gameplay dalam minggu ini.",
    type: "collect_xp" as const,
    targetValue: 300,
    xpReward: 80,
    isActive: true,
  },
];

const insertedWeeklyTasks = await db
  .insert(weeklyTasks)
  .values(weeklyTaskData)
  .returning({ id: weeklyTasks.id, title: weeklyTasks.title });

console.log(`✅ ${insertedWeeklyTasks.length} weekly task berhasil dibuat`);

// ── Ringkasan ─────────────────────────────────────────────
console.log("\n🎉 Seed daily & weekly selesai!");
console.log("────────────────────────────────");
console.log(`📅  Quiz Harian  : ${dqCount} soal`);
console.log(`📋  Weekly Tasks : ${insertedWeeklyTasks.length} task`);
console.log("────────────────────────────────");
