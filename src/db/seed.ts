// src/db/seed.ts
import { db } from "./index";
import {
  islands,
  chapters,
  levels,
  quizzes,
  quizOptions,
  badges,
} from "./schema";

console.log("🌱 Memulai seed data Nusantara Quest...\n");

// ============================================================
// 1. ISLANDS
// ============================================================

const islandData = [
  {
    name: "Pulau Jawa",
    slug: "jawa",
    description:
      "Jantung peradaban Nusantara. Dari kerajaan Hindu-Buddha hingga Islam, Jawa menyimpan ribuan tahun sejarah yang kaya.",
    mapLat: -7.5360639,
    mapLng: 110.0,
    imageUrl: "/images/islands/jawa.webp",
    isDefaultUnlocked: true,
    unlockRequirement: 0,
    orderIndex: 1,
  },
  {
    name: "Pulau Sumatera",
    slug: "sumatera",
    description:
      "Tanah Sriwijaya dan Samudera Pasai. Sumatera adalah gerbang masuknya Islam dan pusat perdagangan rempah dunia.",
    mapLat: -0.5897,
    mapLng: 101.3431,
    imageUrl: "/images/islands/sumatera.webp",
    isDefaultUnlocked: false,
    unlockRequirement: 2,
    orderIndex: 2,
  },
  {
    name: "Pulau Kalimantan",
    slug: "kalimantan",
    description:
      "Pulau terbesar ketiga di dunia, rumah bagi Kerajaan Kutai — kerajaan Hindu tertua di Nusantara.",
    mapLat: 1.6809903,
    mapLng: 113.3824,
    imageUrl: "/images/islands/kalimantan.webp",
    isDefaultUnlocked: false,
    unlockRequirement: 2,
    orderIndex: 3,
  },
  {
    name: "Pulau Sulawesi",
    slug: "sulawesi",
    description:
      "Tanah Bugis-Makassar yang perkasa. Kerajaan Gowa-Tallo menjadi kekuatan maritim terbesar di Indonesia Timur.",
    mapLat: -2.0,
    mapLng: 120.0,
    imageUrl: "/images/islands/sulawesi.webp",
    isDefaultUnlocked: false,
    unlockRequirement: 3,
    orderIndex: 4,
  },
  {
    name: "Kepulauan Maluku",
    slug: "maluku",
    description:
      "Kepulauan Rempah yang menjadi rebutan bangsa-bangsa Eropa. Di sinilah pala dan cengkih mengubah peta dunia.",
    mapLat: -3.2385,
    mapLng: 130.1453,
    imageUrl: "/images/islands/maluku.webp",
    isDefaultUnlocked: false,
    unlockRequirement: 3,
    orderIndex: 5,
  },
];

const insertedIslands = await db
  .insert(islands)
  .values(islandData)
  .returning({ id: islands.id, slug: islands.slug });

const islandMap = Object.fromEntries(
  insertedIslands.map((i) => [i.slug, i.id]),
);
console.log(`✅ ${insertedIslands.length} pulau berhasil dibuat`);

// ============================================================
// 2. CHAPTERS
// ============================================================

const chapterData = [
  // ── Pulau Jawa ──────────────────────────────────────────
  {
    islandId: islandMap["jawa"],
    name: "Jawa Tengah",
    regionName: "Kerajaan Mataram Islam",
    description:
      "Lahirnya Kerajaan Mataram Islam dan perjuangan Sultan Agung melawan VOC Belanda.",
    pointLat: -7.15,
    pointLng: 110.1403,
    imageUrl: "/images/chapters/jawa-tengah.webp",
    orderIndex: 1,
    totalLevels: 5,
  },
  {
    islandId: islandMap["jawa"],
    name: "Jawa Timur",
    regionName: "Kerajaan Majapahit",
    description:
      "Kejayaan Majapahit di bawah Hayam Wuruk dan Gajah Mada yang menyatukan Nusantara.",
    pointLat: -7.5360639,
    pointLng: 112.2384017,
    imageUrl: "/images/chapters/jawa-timur.webp",
    orderIndex: 2,
    totalLevels: 5,
  },
  // ── Pulau Sumatera ───────────────────────────────────────
  {
    islandId: islandMap["sumatera"],
    name: "Sumatera Selatan",
    regionName: "Kerajaan Sriwijaya",
    description:
      "Pusat kekuasaan Sriwijaya yang menguasai jalur perdagangan maritim Asia Tenggara.",
    pointLat: -3.3194374,
    pointLng: 103.914399,
    imageUrl: "/images/chapters/sriwijaya.webp",
    orderIndex: 1,
    totalLevels: 5,
  },
  {
    islandId: islandMap["sumatera"],
    name: "Aceh",
    regionName: "Kesultanan Aceh Darussalam",
    description:
      "Kerajaan Islam terkuat di Sumatera yang gigih melawan penjajahan Portugis dan Belanda.",
    pointLat: 4.695135,
    pointLng: 96.7493993,
    imageUrl: "/images/chapters/aceh.webp",
    orderIndex: 2,
    totalLevels: 5,
  },
  // ── Pulau Kalimantan ─────────────────────────────────────
  {
    islandId: islandMap["kalimantan"],
    name: "Kalimantan Timur",
    regionName: "Kerajaan Kutai",
    description:
      "Kerajaan Hindu tertua di Nusantara yang dibuktikan dengan prasasti Yupa dari abad ke-4.",
    pointLat: 0.5386586,
    pointLng: 116.419389,
    imageUrl: "/images/chapters/kutai.webp",
    orderIndex: 1,
    totalLevels: 5,
  },
  {
    islandId: islandMap["kalimantan"],
    name: "Kalimantan Selatan",
    regionName: "Kesultanan Banjar",
    description:
      "Kesultanan Islam yang kuat di Kalimantan dan peran pentingnya dalam perdagangan intan.",
    pointLat: -3.0926415,
    pointLng: 115.2837585,
    imageUrl: "/images/chapters/banjar.webp",
    orderIndex: 2,
    totalLevels: 5,
  },
  // ── Pulau Sulawesi ───────────────────────────────────────
  {
    islandId: islandMap["sulawesi"],
    name: "Sulawesi Selatan",
    regionName: "Kerajaan Gowa-Tallo",
    description:
      "Kerajaan maritim Islam terbesar di Indonesia Timur dan perlawanan Sultan Hasanuddin.",
    pointLat: -5.1476651,
    pointLng: 119.4327314,
    imageUrl: "/images/chapters/gowa.webp",
    orderIndex: 1,
    totalLevels: 5,
  },
  // ── Maluku ───────────────────────────────────────────────
  {
    islandId: islandMap["maluku"],
    name: "Maluku Tengah",
    regionName: "Kesultanan Ternate & Tidore",
    description:
      "Dua kesultanan penghasil rempah yang bersaing dan menjadi rebutan bangsa Eropa.",
    pointLat: -3.6954816,
    pointLng: 128.1857199,
    imageUrl: "/images/chapters/ternate.webp",
    orderIndex: 1,
    totalLevels: 5,
  },
];

const insertedChapters = await db
  .insert(chapters)
  .values(chapterData)
  .returning({ id: chapters.id, name: chapters.name });

const chapterMap = Object.fromEntries(
  insertedChapters.map((c) => [c.name, c.id]),
);
console.log(`✅ ${insertedChapters.length} chapter berhasil dibuat`);

// ============================================================
// 3. LEVELS — Jawa Tengah (Mataram Islam) — 5 level
// ============================================================

const levelDataJawaTengah = [
  {
    chapterId: chapterMap["Jawa Tengah"],
    levelNumber: 1,
    title: "Lahirnya Mataram Islam",
    description:
      "Sejarah berdirinya Kerajaan Mataram Islam dari Ki Ageng Pamanahan hingga Panembahan Senopati.",
    eraPeriod: "1575 – 1601 M",
    xpReward: 100,
    minScoreToPass: 60,
  },
  {
    chapterId: chapterMap["Jawa Tengah"],
    levelNumber: 2,
    title: "Sultan Agung & VOC",
    description:
      "Masa kejayaan Sultan Agung dan dua kali serangan besar ke Batavia melawan VOC.",
    eraPeriod: "1613 – 1645 M",
    xpReward: 120,
    minScoreToPass: 60,
  },
  {
    chapterId: chapterMap["Jawa Tengah"],
    levelNumber: 3,
    title: "Perjanjian Giyanti",
    description:
      "Perpecahan Mataram menjadi Kasunanan Surakarta dan Kesultanan Yogyakarta.",
    eraPeriod: "1755 M",
    xpReward: 140,
    minScoreToPass: 60,
  },
  {
    chapterId: chapterMap["Jawa Tengah"],
    levelNumber: 4,
    title: "Perang Diponegoro",
    description:
      "Perlawanan Pangeran Diponegoro dalam Perang Jawa yang mengguncang kekuasaan Belanda.",
    eraPeriod: "1825 – 1830 M",
    xpReward: 160,
    minScoreToPass: 70,
  },
  {
    chapterId: chapterMap["Jawa Tengah"],
    levelNumber: 5,
    title: "Warisan Budaya Mataram",
    description:
      "Peninggalan budaya Mataram: batik, wayang, gamelan, dan arsitektur keraton.",
    eraPeriod: "Warisan Abadi",
    xpReward: 200,
    minScoreToPass: 70,
  },
];

// ── Levels Jawa Timur (Majapahit) ────────────────────────────
const levelDataJawaTimur = [
  {
    chapterId: chapterMap["Jawa Timur"],
    levelNumber: 1,
    title: "Kerajaan Singasari",
    description:
      "Pendiri Singasari Ken Arok dan hubungannya dengan kelahiran Majapahit.",
    eraPeriod: "1222 – 1292 M",
    xpReward: 100,
    minScoreToPass: 60,
  },
  {
    chapterId: chapterMap["Jawa Timur"],
    levelNumber: 2,
    title: "Berdirinya Majapahit",
    description:
      "Raden Wijaya mendirikan Majapahit setelah mengusir tentara Mongol dengan siasat cerdik.",
    eraPeriod: "1293 M",
    xpReward: 120,
    minScoreToPass: 60,
  },
  {
    chapterId: chapterMap["Jawa Timur"],
    levelNumber: 3,
    title: "Sumpah Palapa Gajah Mada",
    description:
      "Patih Gajah Mada bersumpah menyatukan Nusantara di bawah panji Majapahit.",
    eraPeriod: "1336 M",
    xpReward: 140,
    minScoreToPass: 60,
  },
  {
    chapterId: chapterMap["Jawa Timur"],
    levelNumber: 4,
    title: "Puncak Kejayaan Majapahit",
    description:
      "Era keemasan di bawah Raja Hayam Wuruk dan pengaruh Majapahit hingga Asia Tenggara.",
    eraPeriod: "1350 – 1389 M",
    xpReward: 160,
    minScoreToPass: 70,
  },
  {
    chapterId: chapterMap["Jawa Timur"],
    levelNumber: 5,
    title: "Keruntuhan Majapahit",
    description:
      "Perang Paregreg dan runtuhnya Majapahit yang membuka jalan bagi Kesultanan Demak.",
    eraPeriod: "1404 – 1478 M",
    xpReward: 200,
    minScoreToPass: 70,
  },
];

const allLevels = await db
  .insert(levels)
  .values([...levelDataJawaTengah, ...levelDataJawaTimur])
  .returning({
    id: levels.id,
    title: levels.title,
    chapterId: levels.chapterId,
    levelNumber: levels.levelNumber,
  });

console.log(`✅ ${allLevels.length} level berhasil dibuat`);

// Helper: cari level ID
const getLevelId = (chapterName: string, levelNum: number) => {
  const chId = chapterMap[chapterName];
  return allLevels.find(
    (l) => l.chapterId === chId && l.levelNumber === levelNum,
  )?.id!;
};

// ============================================================
// 4. QUIZZES + OPTIONS
// ============================================================

type QuizInsert = {
  levelId: string;
  question: string;
  type: "multiple_choice" | "true_false" | "fill_blank";
  imageUrl?: string;
  explanation: string;
  orderIndex: number;
  options: Array<{
    optionText: string;
    isCorrect: boolean;
    orderIndex: number;
  }>;
};

const quizData: QuizInsert[] = [
  // ══════════════════════════════════════════════════════════
  // LEVEL 1 — Lahirnya Mataram Islam
  // ══════════════════════════════════════════════════════════
  {
    levelId: getLevelId("Jawa Tengah", 1),
    question: "Siapakah yang mendirikan Kerajaan Mataram Islam?",
    type: "multiple_choice",
    explanation:
      "Kerajaan Mataram Islam didirikan oleh Panembahan Senopati (Sutawijaya) sekitar tahun 1586, setelah menerima tanah Mataram dari Sultan Pajang sebagai hadiah kepada ayahnya, Ki Ageng Pamanahan.",
    orderIndex: 1,
    options: [
      { optionText: "Sultan Agung", isCorrect: false, orderIndex: 1 },
      { optionText: "Panembahan Senopati", isCorrect: true, orderIndex: 2 },
      { optionText: "Ki Ageng Pamanahan", isCorrect: false, orderIndex: 3 },
      { optionText: "Sultan Hadiwijaya", isCorrect: false, orderIndex: 4 },
    ],
  },
  {
    levelId: getLevelId("Jawa Tengah", 1),
    question: "Ibu kota pertama Kerajaan Mataram Islam adalah...",
    type: "multiple_choice",
    explanation:
      "Kota Gede (sekarang bagian dari Yogyakarta) menjadi ibu kota pertama Mataram Islam dan masih menyimpan makam para raja pertama Mataram hingga saat ini.",
    orderIndex: 2,
    options: [
      { optionText: "Yogyakarta", isCorrect: false, orderIndex: 1 },
      { optionText: "Plered", isCorrect: false, orderIndex: 2 },
      { optionText: "Kota Gede", isCorrect: true, orderIndex: 3 },
      { optionText: "Surakarta", isCorrect: false, orderIndex: 4 },
    ],
  },
  {
    levelId: getLevelId("Jawa Tengah", 1),
    question:
      "Kerajaan Mataram Islam lahir dari wilayah kekuasaan Kerajaan Pajang.",
    type: "true_false",
    explanation:
      "Benar. Mataram Islam bermula dari tanah perdikan Mataram yang dihadiahkan Sultan Pajang kepada Ki Ageng Pamanahan. Setelah Ki Ageng Pamanahan wafat, putranya Sutawijaya (Panembahan Senopati) memerdekakan diri dari Pajang.",
    orderIndex: 3,
    options: [
      { optionText: "Benar", isCorrect: true, orderIndex: 1 },
      { optionText: "Salah", isCorrect: false, orderIndex: 2 },
    ],
  },
  {
    levelId: getLevelId("Jawa Tengah", 1),
    question:
      "Apa nama gelar yang digunakan oleh pendiri Mataram Islam setelah menjadi raja?",
    type: "multiple_choice",
    explanation:
      "Sutawijaya menggunakan gelar 'Panembahan Senopati ing Alaga Sayidin Panatagama' yang berarti pemimpin besar panglima perang yang mengatur agama.",
    orderIndex: 4,
    options: [
      { optionText: "Sultan", isCorrect: false, orderIndex: 1 },
      { optionText: "Sunan", isCorrect: false, orderIndex: 2 },
      { optionText: "Panembahan", isCorrect: true, orderIndex: 3 },
      { optionText: "Prabu", isCorrect: false, orderIndex: 4 },
    ],
  },
  {
    levelId: getLevelId("Jawa Tengah", 1),
    question:
      "Kerajaan Pajang yang merupakan cikal bakal Mataram Islam didirikan oleh...",
    type: "multiple_choice",
    explanation:
      "Jaka Tingkir atau Sultan Hadiwijaya mendirikan Kerajaan Pajang pada tahun 1549, memindahkan pusat kekuasaan dari Demak ke pedalaman Jawa Tengah.",
    orderIndex: 5,
    options: [
      { optionText: "Raden Patah", isCorrect: false, orderIndex: 1 },
      {
        optionText: "Jaka Tingkir (Sultan Hadiwijaya)",
        isCorrect: true,
        orderIndex: 2,
      },
      { optionText: "Arya Penangsang", isCorrect: false, orderIndex: 3 },
      { optionText: "Sunan Kalijaga", isCorrect: false, orderIndex: 4 },
    ],
  },

  // ══════════════════════════════════════════════════════════
  // LEVEL 2 — Sultan Agung & VOC
  // ══════════════════════════════════════════════════════════
  {
    levelId: getLevelId("Jawa Tengah", 2),
    question: "Berapa kali Sultan Agung menyerang Batavia (markas VOC)?",
    type: "multiple_choice",
    explanation:
      "Sultan Agung menyerang Batavia dua kali: pada tahun 1628 dan 1629. Kedua serangan tersebut gagal karena keterbatasan logistik dan VOC berhasil menghancurkan gudang perbekalan pasukan Mataram.",
    orderIndex: 1,
    options: [
      { optionText: "1 kali", isCorrect: false, orderIndex: 1 },
      { optionText: "2 kali", isCorrect: true, orderIndex: 2 },
      { optionText: "3 kali", isCorrect: false, orderIndex: 3 },
      { optionText: "4 kali", isCorrect: false, orderIndex: 4 },
    ],
  },
  {
    levelId: getLevelId("Jawa Tengah", 2),
    question:
      "Sultan Agung memperkenalkan sistem penanggalan baru yang menggabungkan kalender Islam dan Jawa. Sistem ini disebut...",
    type: "multiple_choice",
    explanation:
      "Kalender Jawa Sultan Agung (Anno Javanico) diperkenalkan pada tahun 1633 M / 1555 Saka. Kalender ini memadukan siklus tahun Hijriyah (lunar) dengan nama-nama bulan Jawa.",
    orderIndex: 2,
    options: [
      { optionText: "Kalender Saka", isCorrect: false, orderIndex: 1 },
      {
        optionText: "Kalender Jawa Sultan Agung",
        isCorrect: true,
        orderIndex: 2,
      },
      { optionText: "Kalender Hijriyah Jawa", isCorrect: false, orderIndex: 3 },
      {
        optionText: "Kalender Pranata Mangsa",
        isCorrect: false,
        orderIndex: 4,
      },
    ],
  },
  {
    levelId: getLevelId("Jawa Tengah", 2),
    question:
      "Kegagalan serangan kedua Mataram ke Batavia (1629) terutama disebabkan oleh...",
    type: "multiple_choice",
    explanation:
      "VOC berhasil menghancurkan lumbung-lumbung padi pasukan Mataram di Karawang dan Tegal yang disiapkan sebagai cadangan logistik. Tanpa perbekalan, pasukan Mataram yang berjumlah besar tidak mampu bertahan.",
    orderIndex: 3,
    options: [
      {
        optionText: "Pasukan Mataram terlalu sedikit",
        isCorrect: false,
        orderIndex: 1,
      },
      {
        optionText: "VOC menghancurkan gudang logistik Mataram",
        isCorrect: true,
        orderIndex: 2,
      },
      {
        optionText: "Sultan Agung wafat di perjalanan",
        isCorrect: false,
        orderIndex: 3,
      },
      {
        optionText: "Terjadi pemberontakan internal",
        isCorrect: false,
        orderIndex: 4,
      },
    ],
  },
  {
    levelId: getLevelId("Jawa Tengah", 2),
    question:
      "Sultan Agung mendapat gelar 'Sultan' dari Kesultanan Mekah setelah mengirim utusan ke sana.",
    type: "true_false",
    explanation:
      "Benar. Sultan Agung mengirim utusan ke Mekah dan mendapat pengakuan gelar Sultan dari pemimpin di Mekah. Sebelumnya, para raja Mataram hanya menggunakan gelar Panembahan.",
    orderIndex: 4,
    options: [
      { optionText: "Benar", isCorrect: true, orderIndex: 1 },
      { optionText: "Salah", isCorrect: false, orderIndex: 2 },
    ],
  },
  {
    levelId: getLevelId("Jawa Tengah", 2),
    question: "VOC singkatan dari bahasa Belanda yang berarti...",
    type: "multiple_choice",
    explanation:
      "VOC (Vereenigde Oostindische Compagnie) adalah Perusahaan Hindia Timur Belanda yang didirikan pada tahun 1602. VOC menjadi salah satu perusahaan terkaya dan paling berkuasa di dunia pada abad ke-17.",
    orderIndex: 5,
    options: [
      {
        optionText: "Perusahaan Perdagangan Hindia Barat",
        isCorrect: false,
        orderIndex: 1,
      },
      {
        optionText: "Persatuan Dagang Belanda",
        isCorrect: false,
        orderIndex: 2,
      },
      {
        optionText: "Perusahaan Hindia Timur Bersatu",
        isCorrect: true,
        orderIndex: 3,
      },
      { optionText: "Kongsi Dagang Eropa", isCorrect: false, orderIndex: 4 },
    ],
  },

  // ══════════════════════════════════════════════════════════
  // LEVEL 3 — Perjanjian Giyanti
  // ══════════════════════════════════════════════════════════
  {
    levelId: getLevelId("Jawa Tengah", 3),
    question:
      "Perjanjian Giyanti (1755) membagi Kerajaan Mataram menjadi dua. Sebutkan kedua kerajaan tersebut!",
    type: "multiple_choice",
    explanation:
      "Perjanjian Giyanti ditandatangani pada 13 Februari 1755 membagi Mataram menjadi Kasunanan Surakarta (dipegang Pakubuwono III) dan Kesultanan Yogyakarta (dipegang Pangeran Mangkubumi yang kemudian bergelar Sultan Hamengkubuwono I).",
    orderIndex: 1,
    options: [
      {
        optionText: "Kasunanan Surakarta & Kasultanan Yogyakarta",
        isCorrect: true,
        orderIndex: 1,
      },
      {
        optionText: "Kerajaan Solo & Kerajaan Jogja",
        isCorrect: false,
        orderIndex: 2,
      },
      {
        optionText: "Kadipaten Mangkunegaran & Pakualaman",
        isCorrect: false,
        orderIndex: 3,
      },
      {
        optionText: "Kasunanan Solo & Kadipaten Yogya",
        isCorrect: false,
        orderIndex: 4,
      },
    ],
  },
  {
    levelId: getLevelId("Jawa Tengah", 3),
    question: "Siapakah yang menjadi Sultan pertama Kesultanan Yogyakarta?",
    type: "multiple_choice",
    explanation:
      "Pangeran Mangkubumi menjadi Sultan Hamengkubuwono I, raja pertama Kesultanan Yogyakarta. Beliau membangun Keraton Yogyakarta dan memerintah hingga tahun 1792.",
    orderIndex: 2,
    options: [
      { optionText: "Pakubuwono III", isCorrect: false, orderIndex: 1 },
      {
        optionText: "Pangeran Mangkubumi (Hamengkubuwono I)",
        isCorrect: true,
        orderIndex: 2,
      },
      { optionText: "Pangeran Diponegoro", isCorrect: false, orderIndex: 3 },
      {
        optionText: "Mas Said (Mangkunegara I)",
        isCorrect: false,
        orderIndex: 4,
      },
    ],
  },
  {
    levelId: getLevelId("Jawa Tengah", 3),
    question:
      "Perjanjian Giyanti menguntungkan VOC karena kerajaan Jawa yang terpecah lebih mudah dikendalikan.",
    type: "true_false",
    explanation:
      "Benar. VOC secara aktif mendorong dan memfasilitasi perpecahan Mataram karena kerajaan yang terbagi lebih lemah dan lebih mudah dipengaruhi. Ini adalah strategi 'devide et impera' (pecah belah dan kuasai) yang sering digunakan kolonialisme.",
    orderIndex: 3,
    options: [
      { optionText: "Benar", isCorrect: true, orderIndex: 1 },
      { optionText: "Salah", isCorrect: false, orderIndex: 2 },
    ],
  },
  {
    levelId: getLevelId("Jawa Tengah", 3),
    question:
      "Perjanjian Salatiga (1757) yang menyusul Perjanjian Giyanti menciptakan wilayah...",
    type: "multiple_choice",
    explanation:
      "Perjanjian Salatiga (1757) mengakui Kadipaten Mangkunegaran yang dipimpin Mas Said (Mangkunegara I) sebagai wilayah otonom di dalam Kasunanan Surakarta.",
    orderIndex: 4,
    options: [
      { optionText: "Kadipaten Pakualaman", isCorrect: false, orderIndex: 1 },
      { optionText: "Kadipaten Mangkunegaran", isCorrect: true, orderIndex: 2 },
      { optionText: "Kerajaan Madiun", isCorrect: false, orderIndex: 3 },
      {
        optionText: "Kasunanan Surakarta Baru",
        isCorrect: false,
        orderIndex: 4,
      },
    ],
  },
  {
    levelId: getLevelId("Jawa Tengah", 3),
    question: "Di kota manakah Perjanjian Giyanti ditandatangani?",
    type: "fill_blank",
    explanation:
      "Perjanjian Giyanti ditandatangani di Desa Giyanti (sekarang masuk wilayah Karanganyar, Jawa Tengah) pada tanggal 13 Februari 1755.",
    orderIndex: 5,
    options: [{ optionText: "Giyanti", isCorrect: true, orderIndex: 1 }],
  },

  // ══════════════════════════════════════════════════════════
  // LEVEL 1 — Kerajaan Singasari (Jawa Timur)
  // ══════════════════════════════════════════════════════════
  {
    levelId: getLevelId("Jawa Timur", 1),
    question: "Siapakah pendiri Kerajaan Singasari?",
    type: "multiple_choice",
    explanation:
      "Ken Arok mendirikan Kerajaan Singasari pada tahun 1222 M setelah mengalahkan Kertajaya, raja terakhir Kerajaan Kediri, dalam Pertempuran Ganter.",
    orderIndex: 1,
    options: [
      { optionText: "Kertanegara", isCorrect: false, orderIndex: 1 },
      { optionText: "Ken Arok", isCorrect: true, orderIndex: 2 },
      { optionText: "Raden Wijaya", isCorrect: false, orderIndex: 3 },
      { optionText: "Jayakatwang", isCorrect: false, orderIndex: 4 },
    ],
  },
  {
    levelId: getLevelId("Jawa Timur", 1),
    question:
      "Raja terakhir Singasari yang terkenal karena kebijakan ekspansinya adalah...",
    type: "multiple_choice",
    explanation:
      "Kertanegara (1268-1292) adalah raja terakhir Singasari. Ia dikenal berani menolak tunduk kepada Kubilai Khan dan mengirim ekspedisi Pamalayu ke Sumatera untuk memperluas pengaruh Singasari.",
    orderIndex: 2,
    options: [
      { optionText: "Ken Arok", isCorrect: false, orderIndex: 1 },
      { optionText: "Anusapati", isCorrect: false, orderIndex: 2 },
      { optionText: "Kertanegara", isCorrect: true, orderIndex: 3 },
      { optionText: "Tohjaya", isCorrect: false, orderIndex: 4 },
    ],
  },
  {
    levelId: getLevelId("Jawa Timur", 1),
    question:
      "Kertanegara menolak tunduk kepada Kubilai Khan dari Mongol dengan cara memotong telinga utusannya.",
    type: "true_false",
    explanation:
      "Benar. Kertanegara menghina utusan Kubilai Khan dengan merusak wajah/telinga utusannya sebagai tanda penolakan. Tindakan ini memicu pengiriman pasukan Mongol ke Jawa pada tahun 1293.",
    orderIndex: 3,
    options: [
      { optionText: "Benar", isCorrect: true, orderIndex: 1 },
      { optionText: "Salah", isCorrect: false, orderIndex: 2 },
    ],
  },
  {
    levelId: getLevelId("Jawa Timur", 1),
    question: "Singasari runtuh akibat serangan dari...",
    type: "multiple_choice",
    explanation:
      "Singasari runtuh akibat serangan Jayakatwang dari Kediri pada tahun 1292. Kertanegara terbunuh, dan Raden Wijaya (menantu Kertanegara) kemudian memanfaatkan tentara Mongol untuk membalas dendam kepada Jayakatwang.",
    orderIndex: 4,
    options: [
      { optionText: "Pasukan Mongol", isCorrect: false, orderIndex: 1 },
      { optionText: "Jayakatwang dari Kediri", isCorrect: true, orderIndex: 2 },
      { optionText: "Kerajaan Sriwijaya", isCorrect: false, orderIndex: 3 },
      { optionText: "Pasukan Majapahit", isCorrect: false, orderIndex: 4 },
    ],
  },
  {
    levelId: getLevelId("Jawa Timur", 1),
    question:
      "Ekspedisi Pamalayu (1275) dikirim Kertanegara ke Sumatera untuk menghadapi ancaman dari...",
    type: "multiple_choice",
    explanation:
      "Ekspedisi Pamalayu dikirim untuk menghadapi dan mengimbangi ekspansi Kubilai Khan. Dengan menguasai Sumatera, Singasari bisa memotong jalur masuk Mongol dari arah barat.",
    orderIndex: 5,
    options: [
      { optionText: "Sriwijaya", isCorrect: false, orderIndex: 1 },
      {
        optionText: "Kekaisaran Mongol (Kubilai Khan)",
        isCorrect: true,
        orderIndex: 2,
      },
      { optionText: "Kerajaan Siam", isCorrect: false, orderIndex: 3 },
      { optionText: "Portugis", isCorrect: false, orderIndex: 4 },
    ],
  },

  // ══════════════════════════════════════════════════════════
  // LEVEL 3 — Sumpah Palapa Gajah Mada
  // ══════════════════════════════════════════════════════════
  {
    levelId: getLevelId("Jawa Timur", 3),
    question:
      "Sumpah Palapa diucapkan Gajah Mada pada saat pelantikannya sebagai...",
    type: "multiple_choice",
    explanation:
      "Gajah Mada mengucapkan Sumpah Palapa pada tahun 1336 saat dilantik sebagai Mahapatih (Patih Amangkubhumi) Majapahit oleh Ratu Tribhuwana Tunggadewi.",
    orderIndex: 1,
    options: [
      {
        optionText: "Panglima Perang Majapahit",
        isCorrect: false,
        orderIndex: 1,
      },
      { optionText: "Mahapatih Majapahit", isCorrect: true, orderIndex: 2 },
      { optionText: "Raja Majapahit", isCorrect: false, orderIndex: 3 },
      {
        optionText: "Kepala Intelijen Majapahit",
        isCorrect: false,
        orderIndex: 4,
      },
    ],
  },
  {
    levelId: getLevelId("Jawa Timur", 3),
    question:
      "Dalam Sumpah Palapa, Gajah Mada bersumpah tidak akan menikmati palapa (rempah-rempah) sebelum berhasil menyatukan wilayah Nusantara. 'Palapa' dalam konteks ini berarti...",
    type: "multiple_choice",
    explanation:
      "'Palapa' berasal dari kata 'amukti palapa' yang berarti menikmati kenikmatan duniawi berupa rempah-rempah atau makanan lezat. Ada pula tafsiran bahwa palapa berarti istirahat atau kesenangan.",
    orderIndex: 2,
    options: [
      {
        optionText: "Kenikmatan duniawi / rempah-rempah",
        isCorrect: true,
        orderIndex: 1,
      },
      { optionText: "Tahta kerajaan", isCorrect: false, orderIndex: 2 },
      { optionText: "Perdamaian abadi", isCorrect: false, orderIndex: 3 },
      { optionText: "Kekayaan emas", isCorrect: false, orderIndex: 4 },
    ],
  },
  {
    levelId: getLevelId("Jawa Timur", 3),
    question:
      "Salah satu wilayah yang disebutkan dalam Sumpah Palapa sebagai target penyatuan adalah Nusantara. 'Nusantara' pada masa Majapahit merujuk kepada...",
    type: "multiple_choice",
    explanation:
      "Pada masa Majapahit, 'Nusantara' (dari kata 'nusa' = pulau dan 'antara' = luar/seberang) merujuk kepada pulau-pulau di luar Jawa yang berada di bawah pengaruh Majapahit, bukan seluruh wilayah Indonesia modern.",
    orderIndex: 3,
    options: [
      {
        optionText: "Seluruh wilayah Indonesia modern",
        isCorrect: false,
        orderIndex: 1,
      },
      {
        optionText:
          "Pulau-pulau di luar Jawa dalam lingkup kekuasaan Majapahit",
        isCorrect: true,
        orderIndex: 2,
      },
      {
        optionText: "Hanya Pulau Jawa dan Bali",
        isCorrect: false,
        orderIndex: 3,
      },
      {
        optionText: "Asia Tenggara seluruhnya",
        isCorrect: false,
        orderIndex: 4,
      },
    ],
  },
  {
    levelId: getLevelId("Jawa Timur", 3),
    question: "Gajah Mada berhasil menaklukkan Bali pada tahun 1343 M.",
    type: "true_false",
    explanation:
      "Benar. Penaklukan Bali pada tahun 1343 merupakan salah satu ekspansi awal Gajah Mada sebagai Mahapatih. Setelah Bali, ia terus memperluas kekuasaan Majapahit ke berbagai kepulauan.",
    orderIndex: 4,
    options: [
      { optionText: "Benar", isCorrect: true, orderIndex: 1 },
      { optionText: "Salah", isCorrect: false, orderIndex: 2 },
    ],
  },
  {
    levelId: getLevelId("Jawa Timur", 3),
    question:
      "Sumber sejarah utama yang memuat teks Sumpah Palapa Gajah Mada adalah kitab...",
    type: "multiple_choice",
    explanation:
      "Sumpah Palapa tercatat dalam Kitab Pararaton (Kitab Raja-Raja), sebuah naskah Jawa kuno yang ditulis sekitar abad ke-15 dan 16. Kitab ini juga menjadi sumber sejarah penting tentang Singasari dan Majapahit.",
    orderIndex: 5,
    options: [
      { optionText: "Negarakertagama", isCorrect: false, orderIndex: 1 },
      { optionText: "Pararaton", isCorrect: true, orderIndex: 2 },
      { optionText: "Sutasoma", isCorrect: false, orderIndex: 3 },
      { optionText: "Arjunawiwaha", isCorrect: false, orderIndex: 4 },
    ],
  },
];

// Insert quizzes satu per satu dan tambahkan options-nya
let quizCount = 0;
let optionCount = 0;

for (const quiz of quizData) {
  const { options, ...quizFields } = quiz;

  const [inserted] = await db
    .insert(quizzes)
    .values(quizFields)
    .returning({ id: quizzes.id });

  await db
    .insert(quizOptions)
    .values(options.map((opt) => ({ ...opt, quizId: inserted.id })));

  quizCount++;
  optionCount += options.length;
}

console.log(
  `✅ ${quizCount} soal quiz berhasil dibuat (${optionCount} pilihan jawaban)`,
);

// ============================================================
// 5. BADGES
// ============================================================

const badgeData = [
  // ── Exploration badges ───────────────────────────────────
  {
    name: "Penjelajah Pertama",
    description: "Selesaikan level pertama dalam perjalananmu.",
    iconUrl: "/images/badges/explorer-1.webp",
    category: "exploration" as const,
    criteriaType: "levels_completed" as const,
    criteriaValue: 1,
    xpReward: 50,
  },
  {
    name: "Petualang Nusantara",
    description: "Selesaikan 10 level di berbagai chapter.",
    iconUrl: "/images/badges/explorer-10.webp",
    category: "exploration" as const,
    criteriaType: "levels_completed" as const,
    criteriaValue: 10,
    xpReward: 150,
  },
  {
    name: "Penakluk Jawa",
    description: "Selesaikan semua level di Pulau Jawa.",
    iconUrl: "/images/badges/jawa-master.webp",
    category: "exploration" as const,
    criteriaType: "levels_completed" as const,
    criteriaValue: 10,
    xpReward: 300,
  },
  // ── Achievement badges ───────────────────────────────────
  {
    name: "Nilai Sempurna",
    description: "Raih skor 100 dalam satu sesi quiz.",
    iconUrl: "/images/badges/perfect-score.webp",
    category: "achievement" as const,
    criteriaType: "perfect_score" as const,
    criteriaValue: 100,
    xpReward: 200,
  },
  {
    name: "Cendekiawan Sejarah",
    description: "Kumpulkan 1000 XP total.",
    iconUrl: "/images/badges/scholar.webp",
    category: "achievement" as const,
    criteriaType: "total_xp" as const,
    criteriaValue: 1000,
    xpReward: 100,
  },
  {
    name: "Mahaguru Nusantara",
    description: "Kumpulkan 5000 XP total.",
    iconUrl: "/images/badges/grandmaster.webp",
    category: "achievement" as const,
    criteriaType: "total_xp" as const,
    criteriaValue: 5000,
    xpReward: 500,
  },
  // ── Streak badges ────────────────────────────────────────
  {
    name: "Konsisten 3 Hari",
    description: "Login dan bermain 3 hari berturut-turut.",
    iconUrl: "/images/badges/streak-3.webp",
    category: "streak" as const,
    criteriaType: "login_streak" as const,
    criteriaValue: 3,
    xpReward: 75,
  },
  {
    name: "Semangat Sepekan",
    description: "Login dan bermain 7 hari berturut-turut.",
    iconUrl: "/images/badges/streak-7.webp",
    category: "streak" as const,
    criteriaType: "login_streak" as const,
    criteriaValue: 7,
    xpReward: 200,
  },
  {
    name: "Dedikasi Sebulan",
    description: "Login dan bermain 30 hari berturut-turut.",
    iconUrl: "/images/badges/streak-30.webp",
    category: "streak" as const,
    criteriaType: "login_streak" as const,
    criteriaValue: 30,
    xpReward: 750,
  },
  // ── Collection badges ────────────────────────────────────
  {
    name: "Kolektor Pemula",
    description: "Kumpulkan 5 badge berbeda.",
    iconUrl: "/images/badges/collector-5.webp",
    category: "collection" as const,
    criteriaType: "badges_collected" as const,
    criteriaValue: 5,
    xpReward: 100,
  },
  {
    name: "Pemburu Badge",
    description: "Kumpulkan 10 badge berbeda.",
    iconUrl: "/images/badges/collector-10.webp",
    category: "collection" as const,
    criteriaType: "badges_collected" as const,
    criteriaValue: 10,
    xpReward: 250,
  },
];

const insertedBadges = await db
  .insert(badges)
  .values(badgeData)
  .returning({ id: badges.id });

console.log(`✅ ${insertedBadges.length} badge berhasil dibuat`);

// ============================================================
// RINGKASAN
// ============================================================

console.log("\n🎉 Seed data selesai!");
console.log("────────────────────────────────");
console.log(`🏝️  Pulau     : ${insertedIslands.length}`);
console.log(`📍  Chapter   : ${insertedChapters.length}`);
console.log(`🎯  Level     : ${allLevels.length}`);
console.log(`❓  Soal Quiz : ${quizCount}`);
console.log(`🏆  Badge     : ${insertedBadges.length}`);
console.log("────────────────────────────────");
console.log("Buka Drizzle Studio untuk melihat data: bun db:studio");
