import { Category, Sentiment } from '../types';

export interface CategoryDefinition {
  category: Category;
  title: string;
  shortDesc: string;
  scope: string;
  color: string;
  bgLight: string;
  borderLight: string;
  targetAgencies: string[];
  anchorPhrases: string[]; // High weight (weight: 5)
  primaryKeywords: string[]; // Specific domain keywords (weight: 3)
  secondaryKeywords: string[]; // Contextual keywords (weight: 1.5)
}

export interface HeuristicAnalysisResult {
  category: Category;
  sentiment: Sentiment;
  confidence: number; // 0 - 100%
  matchedKeywords: string[];
  categoryScores: Record<Category, number>;
  sentimentScores: {
    positive: number;
    negative: number;
    neutral: number;
  };
  explanation: string;
  isUrgent?: boolean;
  urgencyLevel?: 'high' | 'normal';
  sarcasmDetected?: boolean;
  localDialectDetected?: boolean;
  detectedNegativeIssues?: string[];
}

/**
 * Full urban planning taxonomy and rich lexical dictionary for Central Kalimantan
 * Covering all 9 sectors of urban & regional development.
 */
export const CATEGORY_DEFINITIONS: Record<Category, CategoryDefinition> = {
  'Transportasi': {
    category: 'Transportasi',
    title: 'Transportasi & Konektivitas Wilayah',
    shortDesc: 'Jalan arteri, poros penghubung, jembatan, moda angkutan, dan fasilitas pejalan kaki',
    scope: 'Kondisi kelayakan jalan aspal/tanah, jembatan kayu/beton, angkutan umum/bus perintis, kemacetan lalu lintas, rambu keselamatan, marka jalan, trotoar, dan over dimension over loading (ODOL).',
    color: '#3B82F6',
    bgLight: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    borderLight: 'border-blue-500/40',
    targetAgencies: ['Dinas Pekerjaan Umum & Penataan Ruang (PUPR)', 'Dinas Perhubungan (Dishub)', 'Balai Pelaksanaan Jalan Nasional (BPJN) Kalteng', 'Satlantas'],
    anchorPhrases: [
      'jalan poros', 'jalan arteri', 'jalan protokol', 'jalan lingkungan', 'jalan penghubung',
      'kondisi jalan', 'aspal berlubang', 'jalan rusak', 'jalan amblas', 'jembatan penghubung',
      'oprit jembatan', 'bus perintis', 'angkutan umum', 'trayek angkutan', 'rambu lalu lintas',
      'marka jalan', 'lampu lalu lintas', 'traffic light', 'zebra cross', 'trotoar pejalan kaki',
      'truk odol', 'truk sawit', 'truk fuso', 'truk tambang', 'kemacetan lalu lintas',
      'akses jalan', 'perbaikan jalan', 'pengaspalan jalan', 'pelebaran jalan'
    ],
    primaryKeywords: [
      'jalan', 'aspal', 'jembatan', 'trotoar', 'macet', 'kemacetan', 'lubang', 'berlubang',
      'amblas', 'truk', 'bus', 'angkutan', 'trayek', 'rambu', 'marka', 'kendaraan',
      'lalin', 'lalu-lintas', 'perintis', 'penyeberangan', 'pelabuhan', 'dermaga', 'terminal',
      'halte', 'paving', 'aspalan', 'cor beton', 'semenisasi', 'gorong-gorong jalan'
    ],
    secondaryKeywords: [
      'licin', 'becek', 'kecelakaan', 'laka', 'lewat', 'antrean', 'sempit', 'kelancaran',
      'lancar', 'laju', 'roda', 'motor', 'mobil', 'penghubung', 'akses', 'transportasi',
      'kecepatan', 'polisi tidur', 'speed bump', 'retak', 'hancur'
    ]
  },

  'Drainase & Banjir': {
    category: 'Drainase & Banjir',
    title: 'Drainase & Pengendalian Banjir Kawasan',
    shortDesc: 'Saluran air tersumbat, dimensi gorong-gorong, sedimentasi parit, genangan air, dan tanggul',
    scope: 'Sistem saluran air mikro dan makro perkotaan, drainase tersumbat sampah/lumpur, genangan air pasca hujan, kapasitas gorong-gorong u-ditch, sedimentasi saluran, pompa pembuangan, dan luapan air pemukiman.',
    color: '#06B6D4',
    bgLight: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    borderLight: 'border-cyan-500/40',
    targetAgencies: ['Dinas PUPR Bidang Sumber Daya Air', 'Dinas Lingkungan Hidup (DLH)', 'Satgas Drainase Perkotaan', 'Kelurahan & RT/RW'],
    anchorPhrases: [
      'saluran drainase', 'gorong-gorong', 'parit tersumbat', 'selokan mampet', 'sedimentasi lumpur',
      'genangan air', 'air meluap', 'luapan air hujan', 'banjir permukiman', 'tanggul air',
      'pompa air banjir', 'resapan air', 'normalisasi parit', 'pengerukan saluran', 'u-ditch drainase',
      'got mampet', 'air tergenang', 'saluran pembuangan', 'pintu air otomatis', 'saluran primer'
    ],
    primaryKeywords: [
      'drainase', 'gorong-gorong', 'selokan', 'parit', 'got', 'culvert', 'u-ditch', 'talang',
      'genangan', 'tergenang', 'luapan', 'meluap', 'tersumbat', 'mampet', 'sedimentasi',
      'endapan', 'pengerukan', 'normalisasi', 'tanggul', 'pompa', 'resapan', 'biopori'
    ],
    secondaryKeywords: [
      'hujan', 'deras', 'limpasan', 'becek', 'air kotor', 'terendam', 'merendam',
      'surut', 'aliran', 'dangkal', 'pendangkalan', 'debit', 'beban air', 'buntu'
    ]
  },

  'Bencana Alam': {
    category: 'Bencana Alam',
    title: 'Mitigasi Bencana Alam & Karhutla Gambut',
    shortDesc: 'Kebakaran hutan & lahan gambut, kabut asap, tanah longsor, abrasi DAS/pesisir, kekeringan',
    scope: 'Penanggulangan kebakaran hutan dan lahan (Karhutla) gambut, hotspot titik api, kabut asap pekat/ISPA, tanah longsor tebing/poros, abrasi sempadan sungai DAS (Kahayan, Barito, Kapuas, Mentaya), relawan MPA, Manggala Agni, dan kesiapsiagaan BPBD.',
    color: '#EA580C',
    bgLight: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
    borderLight: 'border-orange-500/40',
    targetAgencies: ['Badan Penanggulangan Bencana Daerah (BPBD) Kalteng', 'Manggala Agni KLHK', 'Masyarakat Peduli Api (MPA)', 'Dinas Kesehatan (Posko ISPA)'],
    anchorPhrases: [
      'kebakaran hutan', 'kebakaran lahan', 'lahan gambut', 'karhutla gambut', 'titik api',
      'titik panas', 'kabut asap', 'manggala agni', 'masyarakat peduli api', 'water bombing',
      'helikopter pemadam', 'sekat kanal', 'canal blocking', 'tanah longsor', 'tebing longsor',
      'abrasi pantai', 'abrasi sungai', 'banjir bandang das', 'posko pengungsian', 'status siaga darurat',
      'peringatan dini bencana', 'kekeringan ekstrim', 'angin puting beliung', 'bencana alam'
    ],
    primaryKeywords: [
      'karhutla', 'gambut', 'hotspot', 'asap', 'ispa', 'manggala', 'longsor', 'abrasi',
      'bencana', 'gempa', 'puting-beliung', 'kekeringan', 'bpbd', 'water-bombing', 'mpa',
      'embung', 'kanalisasi', 'pemadaman', 'evakuasi', 'pengungsi', 'posko-bencana'
    ],
    secondaryKeywords: [
      'api', 'membakar', 'terbakar', 'hangus', 'sesak', 'masker', 'oksigen', 'tebing',
      'runtuh', 'ambruk', 'erosi', 'gelombang pasang', 'cuaca ekstrim', 'kemarau',
      'das kahayan', 'das barito', 'das kapuas', 'das mentaya', 'das katingan', 'sungai meluap hulu'
    ]
  },

  'Sampah': {
    category: 'Sampah',
    title: 'Pengelolaan Sampah & Kebersihan Lingkungan',
    shortDesc: 'TPS liar, TPA, ritasi armada truk sampah, daur ulang, bank sampah, dan polusi limbah padat',
    scope: 'Timbulan sampah rumah tangga dan pasar tradisional, keberadaan tempat penampungan sementara (TPS) liar, kebersihan ruang kota, armada truk pengangkut sampah, kapasitas tempat pemrosesan akhir (TPA), air lindi, dan pemilahan daur ulang.',
    color: '#F59E0B',
    bgLight: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    borderLight: 'border-amber-500/40',
    targetAgencies: ['Dinas Lingkungan Hidup (DLH)', 'Unit Pelaksana Teknis Pengelolaan Sampah (UPTD Kebersihan)', 'Kecamatan & Kelurahan', 'Pengelola Bank Sampah'],
    anchorPhrases: [
      'tempat penampungan sementara', 'tps liar', 'tpa sampah', 'timbunan sampah', 'tumpukan sampah',
      'sampah menumpuk', 'armada truk sampah', 'truk pengangkut sampah', 'pengangkutan sampah',
      'bank sampah', 'daur ulang sampah', 'sampah plastik', 'bau busuk sampah', 'sampah pasar',
      'air lindi sampah', 'petugas kebersihan', 'tong sampah umum', 'bak sampah'
    ],
    primaryKeywords: [
      'sampah', 'tps', 'tpa', 'limbah', 'plastik', 'daur-ulang', 'kompos', 'timbulan',
      'tumpukan', 'menumpuk', 'berserakan', 'lindi', 'armada-sampah', 'kebersihan',
      'pemulung', 'kontainer-sampah', 'buang-sampah'
    ],
    secondaryKeywords: [
      'bau', 'busuk', 'menyengat', 'kotor', 'lalat', 'jorok', 'kumal', 'angut',
      'angkut', 'terlambat', 'terbengkalai', 'bersih', 'pemilahan', 'organik'
    ]
  },

  'Air Bersih & Sanitasi': {
    category: 'Air Bersih & Sanitasi',
    title: 'Penyediaan Air Bersih & Sanitasi Layak',
    shortDesc: 'Jaringan pipa PDAM, kontinuitas debit, air keruh, MCK komunal, dan instalasi tangki septik',
    scope: 'Cakupan pipa transmisi dan distribusi PDAM/Perumda Air Minum, kontinuitas suplai air bersih rumah tangga, masalah air keruh/kuning berbau, kebocoran pipa, sanitasi lingkungan, MCK komunal, instalasi pengolahan lumpur tinja (IPLT), dan septic tank kedap air.',
    color: '#0284C7',
    bgLight: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
    borderLight: 'border-sky-500/40',
    targetAgencies: ['PDAM / Perumda Air Minum Daerah Kalteng', 'Dinas PUPR Bidang Cipta Karya & Permukiman', 'Dinas Kesehatan (Inspeksi Sanitasi)', 'Balai Prasarana Permukiman Wilayah (BPPW)'],
    anchorPhrases: [
      'air bersih', 'air minum', 'air pdam', 'pipa pdam', 'aliran pdam', 'kebocoran pipa',
      'pipa bocor', 'mati air', 'air mati', 'air keruh', 'air kuning', 'air berbau',
      'tekanan air', 'suplai air', 'instalasi pengolahan air', 'intake air baku', 'mck komunal',
      'septic tank', 'tangki septik', 'sanitasi lingkungan', 'sedot tinja', 'ipal permukiman'
    ],
    primaryKeywords: [
      'pdam', 'sanitasi', 'mck', 'septic', 'septik', 'pipa', 'keruh', 'tinja',
      'ipal', 'intake', 'ledeng', 'kekeruhan', 'kran', 'meteran', 'tangki-air'
    ],
    secondaryKeywords: [
      'mati', 'mati-air', 'kuning', 'berbau', 'karat', 'lancar', 'jernih', 'bocor',
      'tekanan', 'sedot', 'kakus', 'jamban', 'cuci', 'mandi', 'minum', 'kering'
    ]
  },

  'Ruang Terbuka Hijau': {
    category: 'Ruang Terbuka Hijau',
    title: 'Ruang Terbuka Hijau & Ekologi Perkotaan',
    shortDesc: 'Taman kota, kanopi pohon peneduh, hutan kota, sempadan sungai hijau, dan ruang publik',
    scope: 'Ketersediaan dan pemeliharaan taman rekreasi perkotaan, kanopi pohon peneduh median jalan, sabuk hijau (green belt), hutan kota, perlindungan sempadan sungai dari deforestasi, fasilitas ramah anak, dan keasrian lingkungan.',
    color: '#10B981',
    bgLight: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    borderLight: 'border-emerald-500/40',
    targetAgencies: ['Dinas Lingkungan Hidup (DLH)', 'Dinas PUPR & Pertamanan', 'Dinas Kehutanan Provinsi Kalteng', 'Komunitas Pecinta Lingkungan'],
    anchorPhrases: [
      'ruang terbuka hijau', 'rth', 'taman kota', 'hutan kota', 'pohon peneduh',
      'jalur hijau', 'sabuk hijau', 'penghijauan kota', 'taman bermain anak', 'alun-alun kota',
      'sempadan sungai hijau', 'tanaman hias', 'bangku taman', 'pedestrian hijau', 'kanopi pohon',
      'perawatan taman', 'pemangkasan pohon', 'taman lanskap'
    ],
    primaryKeywords: [
      'taman', 'rth', 'pohon', 'peneduh', 'hutan-kota', 'penghijauan', 'alun-alun',
      'keasrian', 'tanaman', 'kebun', 'reboisasi', 'kanopi', 'rimbun', 'jalur-hijau'
    ],
    secondaryKeywords: [
      'hijau', 'asri', 'sejuk', 'teduh', 'indah', 'rekreasi', 'olahraga', 'jogging',
      'tumbang', 'ranting', 'bermain', 'nyaman', 'estetika', 'oksigen', 'ekologi'
    ]
  },

  'Tata Ruang & Pemukiman': {
    category: 'Tata Ruang & Pemukiman',
    title: 'Tata Ruang & Penataan Kawasan Permukiman',
    shortDesc: 'Penataan kawasan kumuh, zonasi sempadan bangunan, penertiban PKL, perumahan layak huni',
    scope: 'Perencanaan zonasi RTRW/RDTR perkotaan, penataan kawasan permukiman kumuh bantaran sungai/rawa, program Rumah Tidak Layak Huni (RTLH), tertib izin persetujuan bangunan gedung (PBG/IMB), serta penertiban PKL di trotoar dan bahu jalan protokol.',
    color: '#EC4899',
    bgLight: 'bg-pink-500/10 text-pink-400 border-pink-500/30',
    borderLight: 'border-pink-500/40',
    targetAgencies: ['Dinas Perumahan, Kawasan Permukiman & Pertanahan (Disperkimtan)', 'Bappeda Litbang Kalteng', 'Satpol PP (Ketertiban Umum)', 'Dinas Perdagangan'],
    anchorPhrases: [
      'tata ruang', 'rtrw', 'rdtr', 'kawasan kumuh', 'permukiman kumuh', 'rumah tidak layak huni',
      'rtlh', 'bedah rumah', 'pedagang kaki lima', 'pkl trotoar', 'sempadan bangunan',
      'garis sempadan', 'izin pbg', 'imb bangunan', 'bangunan liar', 'relokasi warga',
      'penataan kota', 'alih fungsi lahan', 'ketertiban umum', 'hunian layak'
    ],
    primaryKeywords: [
      'kumuh', 'pkl', 'permukiman', 'perumahan', 'zonasi', 'sempadan', 'rtlh',
      'rtrw', 'rdtr', 'pbg', 'imb', 'relokasi', 'hunian', 'bangunan-liar'
    ],
    secondaryKeywords: [
      'semrawut', 'tertib', 'tertata', 'bahu-jalan', 'trotoar-jualan', 'padat',
      'sempit', 'ilegal', 'izin', 'estetika', 'perencanaan', 'penertiban', 'layak'
    ]
  },

  'Fasilitas Publik': {
    category: 'Fasilitas Publik',
    title: 'Fasilitas Sosial & Penerangan Umum',
    shortDesc: 'Penerangan Jalan Umum (PJU), puskesmas rawat inap, pasar rakyat, pos keamanan, sarana publik',
    scope: 'Penyediaan dan perbaikan lampu penerangan jalan umum (PJU), fasilitas layanan kesehatan dasar (Puskesmas/Pustu/Posyandu), revitalisasi pasar rakyat tradisional, fasilitas gelanggang olahraga/gedung serbaguna pemuda, dan jaringan kamera CCTV pemantau keamanan lingkungan.',
    color: '#8B5CF6',
    bgLight: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    borderLight: 'border-purple-500/40',
    targetAgencies: ['Dinas Perhubungan (PJU)', 'Dinas Kesehatan Kalteng (Puskesmas)', 'Dinas Perdagangan & Perindustrian (Pasar)', 'Dinas Pemuda & Olahraga', 'Kepolisian / Satpol PP'],
    anchorPhrases: [
      'penerangan jalan umum', 'lampu pju', 'lampu jalan', 'pju padam', 'jalan gelap gulita',
      'puskesmas rawat inap', 'puskesmas pembantu', 'pustu desa', 'pelayanan posyandu',
      'pasar rakyat', 'pasar tradisional', 'gedung serbaguna', 'lapangan olahraga',
      'gelanggang olahraga', 'cctv pemantau', 'keamanan lingkungan', 'pos ronda', 'tiang lampu'
    ],
    primaryKeywords: [
      'pju', 'puskesmas', 'pustu', 'posyandu', 'pasar', 'cctv', 'lampu-jalan',
      'keamanan', 'lapangan', 'stadion', 'gelanggang', 'poskamling', 'fasum', 'fasos'
    ],
    secondaryKeywords: [
      'gelap', 'remang', 'padam', 'mati-lampu', 'terang', 'dokter', 'perawat',
      'obat', 'medis', 'belanja', 'los', 'kios', 'kriminal', 'rawan', 'begal'
    ]
  },

  'Lainnya': {
    category: 'Lainnya',
    title: 'Tata Kelola, Birokrasi & Pelayanan Umum',
    shortDesc: 'Pelayanan perizinan publik, jaringan telekomunikasi internet, bantuan sosial, dan UMKM',
    scope: 'Aparatur birokrasi dan administrasi kependudukan (KTP/KK), perizinan terpadu satu pintu (PTSP), konektivitas sinyal seluler dan internet desa (BTS), transparansi dana bansos, serta pendampingan ekonomi kerakyatan UMKM.',
    color: '#64748B',
    bgLight: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
    borderLight: 'border-slate-500/40',
    targetAgencies: ['Dinas Kependudukan & Pencatatan Sipil (Disdukcapil)', 'Dinas Komunikasi, Informatika, Persandian & Statistik (Diskominfo)', 'Dinas Koperasi & UMKM', 'Inspektorat Daerah Kalteng'],
    anchorPhrases: [
      'pelayanan kependudukan', 'administrasi dukcapil', 'perizinan satu pintu', 'ptsp perizinan',
      'sinyal telekomunikasi', 'jaringan internet', 'menara bts', 'internet desa',
      'bantuan sosial', 'bantuan modal umkm', 'pelaku usaha mikro', 'transparansi anggaran',
      'pungutan liar', 'pungli aparat', 'birokrasi pemerintah'
    ],
    primaryKeywords: [
      'birokrasi', 'perizinan', 'dukcapil', 'ptsp', 'internet', 'sinyal', 'bts',
      'telekomunikasi', 'bansos', 'umkm', 'pungli', 'anggaran', 'kependudukan'
    ],
    secondaryKeywords: [
      'pelayanan', 'aparat', 'petugas', 'ktp', 'layanan', 'lemot', 'lelet',
      'modal', 'bantuan', 'transparan', 'aduan', 'sistem', 'online', 'ramah'
    ]
  }
};

export interface NegativeSectorRule {
  targetCategory: Category;
  subsector: string;
  keywords: string[];
  phrases: string[];
}

/**
 * BASIS PENGETAHUAN KHUSUS: SENTIMEN NEGATIF (AI CORE)
 * 1. Indikator dan Kategorisasi Sektor Sentimen Negatif
 */
export const NEGATIVE_SECTOR_RULES: NegativeSectorRule[] = [
  // Sektor Jalan, Jembatan & Aksesibilitas -> Transportasi
  {
    targetCategory: 'Transportasi',
    subsector: 'Jalan, Jembatan & Aksesibilitas',
    keywords: [
      'rusak', 'berlubang', 'amblas', 'retak', 'hancur', 'berdebu', 'becek', 'berlumpur', 
      'licin', 'berbatu', 'terkelupas', 'bergelombang', 'terisolir', 'putus', 'terhalang', 
      'lapuk', 'patah', 'ponton'
    ],
    phrases: [
      'tidak bisa dilewati', 'rawan longsor', 'jembatan lapuk', 'kayu patah', 'ponton rusak',
      'bikin celaka', 'merusak kendaraan', 'ban bocor', 'patah as', 'membahayakan pengendara',
      'susah lewat', 'jalan rusak', 'jalan berlubang', 'aspal terkelupas', 'jalan amblas'
    ]
  },
  // Sektor Tata Ruang, Lahan & Permukiman -> Tata Ruang & Pemukiman
  {
    targetCategory: 'Tata Ruang & Pemukiman',
    subsector: 'Tata Ruang, Lahan & Permukiman',
    keywords: [
      'sengketa', 'penyerobotan', 'overlapping', 'kumuh', 'semrawut', 'penggusuran', 
      'penyempitan', 'komersialisasi'
    ],
    phrases: [
      'klaim sepihak', 'konflik batas', 'sengketa tanah', 'tumpang tindih', 'alih fungsi liar',
      'tata ruang acak-acakan', 'bangunan liar', 'tidak berizin', 'penutupan akses',
      'kawasan kumuh', 'tanah sengketa'
    ]
  },
  // Sektor Drainase, Kebencanaan & Pengendalian Banjir
  {
    targetCategory: 'Bencana Alam',
    subsector: 'Kebencanaan & Karhutla',
    keywords: [
      'karhutla', 'kebakaran', 'asap', 'longsor', 'erosi', 'gambut', 'hotspot'
    ],
    phrases: [
      'asap tebal', 'kabut asap', 'tanggul jebol', 'luapan sungai', 'tanah longsor', 'titik api',
      'kebakaran hutan', 'kebakaran lahan'
    ]
  },
  {
    targetCategory: 'Drainase & Banjir',
    subsector: 'Drainase & Pengendalian Banjir',
    keywords: [
      'banjir', 'genangan', 'mampet', 'tersumbat', 'tumpat', 'tergenang'
    ],
    phrases: [
      'air meluap', 'banjir rob', 'drainase mampet', 'saluran tersumbat', 'parit pendangkalan',
      'selokan tumpat', 'tidak ada pembuangan', 'air tergenang', 'parit buntu', 'gorong-gorong mampet'
    ]
  },
  // Sektor Lingkungan Hidup, Sampah & Sanitasi
  {
    targetCategory: 'Sampah',
    subsector: 'Lingkungan Hidup & Sampah',
    keywords: [
      'sampah', 'lalat', 'busuk', 'menumpuk', 'berserakan'
    ],
    phrases: [
      'bau busuk', 'tumpukan sampah', 'sampah berserakan', 'tps liar', 'sampah menumpuk',
      'tidak diangkut', 'bau menyengat', 'polusi udara', 'debu pekat'
    ]
  },
  {
    targetCategory: 'Air Bersih & Sanitasi',
    subsector: 'Pencemaran Air & Sanitasi',
    keywords: [
      'limbah', 'beracun', 'sanitasi'
    ],
    phrases: [
      'air keruh', 'air berbau', 'air beracun', 'pencemaran sungai', 'limbah sawit',
      'limbah tambang', 'air hitam'
    ]
  },
  // Sektor Utilitas (Penerangan Jalan, Listrik & Air PDAM)
  {
    targetCategory: 'Fasilitas Publik',
    subsector: 'Utilitas Listrik & Penerangan Jalan (PJU)',
    keywords: [
      'gelap', 'biarpet', 'padam'
    ],
    phrases: [
      'gelap gulita', 'pju mati', 'lampu jalan padam', 'mati lampu', 'mati listrik',
      'tegangan drop', 'kabel menjuntai', 'kabel semrawut', 'tiang miring', 'penerangan jalan padam'
    ]
  },
  {
    targetCategory: 'Air Bersih & Sanitasi',
    subsector: 'Utilitas Air Bersih PDAM',
    keywords: [
      'pdam'
    ],
    phrases: [
      'air pdam mati', 'air mampet', 'air kecil', 'air keruh', 'air kuning',
      'air berbau', 'krisis air', 'tidak mengalir', 'air mati', 'pipa bocor'
    ]
  },
  // Sektor Transportasi, Lalu Lintas & Keselamatan
  {
    targetCategory: 'Transportasi',
    subsector: 'Lalu Lintas & Keselamatan',
    keywords: [
      'macet', 'antrean', 'tikungan'
    ],
    phrases: [
      'macet total', 'antrean panjang', 'rawan kecelakaan', 'jalan sempit', 'parkir liar',
      'tidak ada rambu', 'penerangan minim', 'membahayakan nyawa', 'jalan licin',
      'tikungan tajam', 'tidak ada pembatas', 'jalan miring', 'titik buta'
    ]
  },
  // Sektor Fasilitas Sosial & Publik (Kesehatan & Pendidikan)
  {
    targetCategory: 'Fasilitas Publik',
    subsector: 'Fasilitas Sosial (Kesehatan & Pendidikan)',
    keywords: [
      'puskesmas', 'pustu', 'posyandu', 'sekolah', 'toilet'
    ],
    phrases: [
      'atap bocor', 'dinding retak', 'fasilitas rusak', 'toilet kotor', 'sarana minim',
      'puskesmas tutup', 'tidak ada dokter', 'guru kosong', 'obat habis',
      'tidak ramah disabilitas', 'antrean membludak', 'gedung roboh', 'terbengkalai'
    ]
  },
  // Sektor Ekonomi, Pasar & UMKM
  {
    targetCategory: 'Lainnya',
    subsector: 'Ekonomi, Pasar & UMKM',
    keywords: [
      'pasar', 'lapak', 'umkm', 'bansos'
    ],
    phrases: [
      'pasar becek', 'pasar sepi', 'tempat kumuh', 'lapak liar', 'harga mahal',
      'bahan pokok melonjak', 'sewa mahal', 'bantuan tidak tepat sasaran', 'pilih kasih',
      'modal susah', 'bantuan dipotong'
    ]
  },
  // Sektor Pelayanan Publik, Keamanan & Tata Kelola
  {
    targetCategory: 'Lainnya',
    subsector: 'Pelayanan Publik, Keamanan & Tata Kelola',
    keywords: [
      'pungli', 'begal', 'pencurian', 'maling', 'miras'
    ],
    phrases: [
      'bayar pungutan', 'dipersulit', 'berbelit-belit', 'dipingpong', 'respon lambat',
      'tidak ditanggapi', 'dinas cuek', 'pengaduan diabaikan', 'rawan begal',
      'marak maling', 'tidak aman', 'kawasan rawan', 'pemuda nongkrong', 'pesta miras'
    ]
  }
];

// 2. Deteksi Variasi Bahasa (Informal / Lokal Daerah Banjar/Dayak/Kalteng)
export const LOCAL_INFORMAL_LEXICON = [
  'ancur',
  'parah banar',
  'kadada perbaikan',
  'kada taurus',
  'dibiarkan jua',
  'lapuk',
  'tebalik',
  'takurung',
  'karamian',
  'pancal',
  'kuyup',
  'uyuh',
  'gawian lambat',
  'balobang',
  'kada karuan',
  'bapusing',
  'tajangkit',
  'rigat'
];

// 2. Deteksi Sarkasme & Sindiran
export const SARCASM_IRONY_PATTERNS = [
  'seperti kolam',
  'seperti lapangan offroad',
  'pemerintah tidur',
  'tunggu ada korban baru diperbaiki',
  'tunggu ada korban',
  'tunggu viral dulu',
  'tunggu viral baru gerak',
  'kolam ikan lele',
  'kolam lele',
  'wisata jeglongan',
  'wisata lubang',
  'dinas tutup mata',
  'dinas cuek',
  'pemerintah tutup mata',
  'cuma janji manis',
  'hanya janji doang',
  'seperti kubangan kerbau',
  'kubangan lumpur',
  'lapangan balap offroad'
];

// 2. Tingkat Urgensi (Alert High)
export const HIGH_URGENCY_KEYWORDS = [
  'segera',
  'tolong',
  'darurat',
  'mengancam nyawa',
  'sudah ada korban',
  'nyaris roboh',
  'bikin celaka',
  'patah as',
  'bahaya maut',
  'darurat bencana',
  'korban jiwa',
  'menelan korban',
  'sekarat',
  'terisolir total',
  'jembatan runtuh'
];

/**
 * Sentiment Lexicons with Weighted Nuance
 */
export const POSITIVE_LEXICON = [
  // High confidence positive (weight: 2)
  'sangat bagus', 'sangat puas', 'luar biasa', 'terima kasih', 'apresiasi setinggi-tingginya',
  'sangat membantu', 'acung jempol', 'paten', 'mantap betul', 'sangat memuaskan',
  // Standard positive (weight: 1)
  'bagus', 'puas', 'apresiasi', 'senang', 'nyaman', 'indah', 'bersih', 'lancar',
  'mantap', 'hebat', 'membantu', 'tertata', 'ramah', 'cepat', 'gercep', 'responsif',
  'asri', 'sejuk', 'membaik', 'berhasil', 'sukses', 'terpuji', 'bermanfaat', 'rapi',
  'efektif', 'jernih', 'terang', 'aman', 'terawat', 'berkualitas', 'solutif', 'tanggap',
  'bangga', 'lega', 'senang sekali', 'berfungsi baik'
];

export const NEGATIVE_LEXICON = [
  // High confidence negative & urgent phrases (weight: 2.5 - 3)
  'sangat parah', 'rusak parah', 'hancur lebur', 'berbahaya sekali', 'sangat lambat',
  'kecewa berat', 'tidak layak', 'mati total', 'bau menyengat', 'terbengkalai parah',
  'sangat mengecewakan', 'ancur', 'rawan kecelakaan', 'membahayakan keselamatan',
  'membahayakan nyawa', 'bikin celaka', 'merusak kendaraan', 'ban bocor', 'patah as',
  'tidak bisa dilewati', 'jembatan lapuk', 'kayu patah', 'ponton rusak', 'klaim sepihak',
  'konflik batas', 'sengketa tanah', 'tata ruang acak-acakan', 'bangunan liar',
  'tidak berizin', 'drainase mampet', 'saluran tersumbat', 'parit pendangkalan',
  'selokan tumpat', 'tidak ada pembuangan', 'bau busuk', 'tumpukan sampah',
  'sampah berserakan', 'tps liar', 'sampah menumpuk', 'tidak diangkut', 'pencemaran sungai',
  'polusi udara', 'debu pekat', 'limbah sawit', 'limbah tambang', 'air hitam', 'air beracun',
  'gelap gulita', 'pju mati', 'lampu jalan padam', 'mati lampu', 'mati listrik',
  'tegangan drop', 'kabel menjuntai', 'kabel semrawut', 'tiang miring', 'air pdam mati',
  'air mampet', 'air kecil', 'air keruh', 'air kuning', 'air berbau', 'krisis air',
  'tidak mengalir', 'macet total', 'antrean panjang', 'parkir liar', 'tidak ada rambu',
  'penerangan minim', 'tikungan tajam', 'tidak ada pembatas', 'titik buta', 'atap bocor',
  'dinding retak', 'toilet kotor', 'sarana minim', 'puskesmas tutup', 'tidak ada dokter',
  'guru kosong', 'obat habis', 'tidak ramah disabilitas', 'antrean membludak',
  'pasar becek', 'lapak liar', 'harga mahal', 'bahan pokok melonjak', 'sewa mahal',
  'bantuan tidak tepat sasaran', 'pilih kasih', 'modal susah', 'bantuan dipotong',
  'bayar pungutan', 'dipersulit', 'berbelit-belit', 'dipingpong', 'respon lambat',
  'tidak ditanggapi', 'dinas cuek', 'pengaduan diabaikan', 'rawan begal', 'marak maling',
  'tidak aman', 'kawasan rawan', 'pemuda nongkrong', 'pesta miras',
  // Local Informal / Kalteng Dialect Terms
  'parah banar', 'kadada perbaikan', 'kada taurus', 'dibiarkan jua', 'lapuk', 'tebalik', 'takurung',
  // Sarcasm / Irony
  'seperti kolam', 'seperti lapangan offroad', 'pemerintah tidur', 'tunggu ada korban baru diperbaiki',
  'kolam lele', 'wisata jeglongan', 'tunggu viral dulu',
  // Standard negative keywords (weight: 1.5)
  'rusak', 'parah', 'berlubang', 'lubang', 'kecewa', 'macet', 'bau', 'banjir',
  'sampah', 'tumpukan', 'lambat', 'bahaya', 'jelek', 'kumuh', 'terbengkalai', 'gelap',
  'sulit', 'keluhan', 'protes', 'hancur', 'terganggu', 'becek', 'mati', 'terputus',
  'rapuh', 'tercemar', 'meluap', 'tenggelam', 'memprihatinkan', 'keruh', 'tersumbat',
  'mampet', 'semrawut', 'amblas', 'jorok', 'kotor', 'pesing', 'ambruk', 'retak',
  'lelet', 'terabaikan', 'was-was', 'pungli', 'gagal', 'bocor', 'kering', 'berdebu',
  'berlumpur', 'licin', 'berbatu', 'terkelupas', 'bergelombang', 'terisolir', 'putus',
  'terhalang', 'sengketa', 'penyerobotan', 'overlapping', 'tumpang tindih', 'penggusuran',
  'penyempitan', 'komersialisasi', 'genangan', 'banjir rob', 'karhutla', 'kebakaran',
  'kabut asap', 'longsor', 'erosi', 'tanggul jebol', 'limbah', 'biarpet', 'rawan',
  'roboh', 'sepi', 'begal', 'pencurian', 'maling'
];

export const NEGATION_WORDS = [
  'tidak', 'tak', 'belum', 'bukan', 'kurang', 'jangan', 'tanpa', 'minim', 'nihil', 'sulit'
];

export const INTENSIFIERS = [
  'sangat', 'amat', 'sekali', 'banget', 'sungguh', 'teramat', 'ekstrim', 'benar-benar'
];

/**
 * Normalizes input Indonesian text into clean words and 2-grams / 3-grams
 */
export function tokenizeText(text: string): { words: string[]; ngrams: string[] } {
  const clean = text
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const words = clean.split(' ').filter(w => w.length > 1);
  const ngrams: string[] = [];

  // Generate bigrams
  for (let i = 0; i < words.length - 1; i++) {
    ngrams.push(`${words[i]} ${words[i + 1]}`);
  }

  // Generate trigrams
  for (let i = 0; i < words.length - 2; i++) {
    ngrams.push(`${words[i]} ${words[i + 1]} ${words[i + 2]}`);
  }

  return { words, ngrams };
}

/**
 * Intelligent Multi-Tier Text Classifier & Heuristic Engine
 * Computes thematic density scores across all 9 development categories.
 */
export function analyzeAspirationIntelligent(
  text: string,
  userCategoryHint?: Category
): HeuristicAnalysisResult {
  const lower = text.toLowerCase();
  const { words, ngrams } = tokenizeText(text);

  const matchedKeywords: string[] = [];
  const categoryScores: Record<Category, number> = {
    'Transportasi': 0,
    'Drainase & Banjir': 0,
    'Bencana Alam': 0,
    'Sampah': 0,
    'Air Bersih & Sanitasi': 0,
    'Ruang Terbuka Hijau': 0,
    'Tata Ruang & Pemukiman': 0,
    'Fasilitas Publik': 0,
    'Lainnya': 0
  };

  // Evaluate scores for each category
  const allCategories = Object.keys(CATEGORY_DEFINITIONS) as Category[];

  for (const cat of allCategories) {
    const def = CATEGORY_DEFINITIONS[cat];
    let score = 0;

    // 1. Anchor Phrases Matching (Weight: 5 per match)
    for (const phrase of def.anchorPhrases) {
      if (lower.includes(phrase)) {
        score += 5;
        if (!matchedKeywords.includes(phrase)) matchedKeywords.push(phrase);
      }
    }

    // 2. Primary Domain Keywords (Weight: 3 per match)
    for (const kw of def.primaryKeywords) {
      const regex = new RegExp(`\\b${kw.replace('-', '[ -]?')}\\b`, 'i');
      if (regex.test(lower)) {
        score += 3;
        if (!matchedKeywords.includes(kw)) matchedKeywords.push(kw);
      }
    }

    // 3. Secondary Contextual Keywords (Weight: 1.2 per match)
    for (const kw of def.secondaryKeywords) {
      const regex = new RegExp(`\\b${kw.replace('-', '[ -]?')}\\b`, 'i');
      if (regex.test(lower)) {
        score += 1.2;
      }
    }

    categoryScores[cat] = score;
  }

  // DISAMBIGUATION & CONTEXTUAL OVERRIDE RULES
  // Rule A: Bencana Alam vs Drainase & Banjir
  // If mentions 'karhutla', 'kebakaran hutan/lahan', 'gambut', 'kabut asap', 'manggala agni', 'longsor tebing', 'abrasi' -> Strongly favor Bencana Alam
  if (/\b(karhutla|kebakaran hutan|kebakaran lahan|lahan gambut|gambut|titik api|hotspot|kabut asap|manggala agni|tanah longsor|abrasi|puting beliung)\b/.test(lower)) {
    categoryScores['Bencana Alam'] += 8;
  }

  // Rule B: Drainase & Banjir vs Transportasi
  // "Jalan banjir karena drainase mampet" -> Primary cause is Drainage
  if (/\b(drainase|gorong-gorong|parit|selokan)\b/.test(lower) && /\b(tersumbat|mampet|genangan|luapan|buntu)\b/.test(lower)) {
    categoryScores['Drainase & Banjir'] += 4;
  }

  // Rule C: Tata Ruang PKL vs Transportasi Kemacetan
  if (/\b(pkl|pedagang kaki lima|lapak liar|bangunan liar)\b/.test(lower)) {
    categoryScores['Tata Ruang & Pemukiman'] += 5;
  }

  // Rule D: Air Bersih PDAM vs Banjir
  if (/\b(pdam|ledeng|air bersih|mati air|air keruh|kran|septic)\b/.test(lower)) {
    categoryScores['Air Bersih & Sanitasi'] += 6;
  }

  // EVALUASI BASIS PENGETAHUAN KHUSUS SENTIMEN NEGATIF
  let hasSpecificNegative = false;
  let isUrgent = false;
  let sarcasmDetected = false;
  let localDialectDetected = false;
  const detectedNegativeIssues: string[] = [];

  // 1. Evaluasi Sektor Spesifik Sentimen Negatif
  for (const rule of NEGATIVE_SECTOR_RULES) {
    let ruleMatched = false;
    // Cek multi-word phrases
    for (const phrase of rule.phrases) {
      if (lower.includes(phrase)) {
        ruleMatched = true;
        categoryScores[rule.targetCategory] += 7;
        if (!matchedKeywords.includes(phrase)) matchedKeywords.push(phrase);
        if (!detectedNegativeIssues.includes(phrase)) detectedNegativeIssues.push(phrase);
      }
    }
    // Cek keyword tunggal
    for (const kw of rule.keywords) {
      const regex = new RegExp(`\\b${kw.replace('-', '[ -]?')}\\b`, 'i');
      if (regex.test(lower)) {
        ruleMatched = true;
        categoryScores[rule.targetCategory] += 3.5;
        if (!matchedKeywords.includes(kw)) matchedKeywords.push(kw);
        if (!detectedNegativeIssues.includes(kw)) detectedNegativeIssues.push(kw);
      }
    }
    if (ruleMatched) {
      hasSpecificNegative = true;
    }
  }

  // 2. Evaluasi Variasi Bahasa & Dialek Lokal (Banjar / Dayak / Kalteng)
  for (const term of LOCAL_INFORMAL_LEXICON) {
    if (lower.includes(term)) {
      localDialectDetected = true;
      hasSpecificNegative = true;
      if (!matchedKeywords.includes(term)) matchedKeywords.push(term);
      if (!detectedNegativeIssues.includes(term)) detectedNegativeIssues.push(term);
    }
  }

  // 3. Evaluasi Sarkasme & Sindiran Warga
  for (const pattern of SARCASM_IRONY_PATTERNS) {
    if (lower.includes(pattern)) {
      sarcasmDetected = true;
      hasSpecificNegative = true;
      if (!matchedKeywords.includes(pattern)) matchedKeywords.push(pattern);
      if (!detectedNegativeIssues.includes(pattern)) detectedNegativeIssues.push(pattern);
    }
  }

  // 4. Evaluasi Tingkat Urgensi Darurat (Alert High)
  for (const kw of HIGH_URGENCY_KEYWORDS) {
    if (lower.includes(kw)) {
      isUrgent = true;
      hasSpecificNegative = true;
      if (!matchedKeywords.includes(kw)) matchedKeywords.push(kw);
      if (!detectedNegativeIssues.includes(kw)) detectedNegativeIssues.push(kw);
    }
  }

  // If user provided a category hint that is NOT 'Lainnya', give it a baseline boost of +2
  if (userCategoryHint && userCategoryHint !== 'Lainnya') {
    categoryScores[userCategoryHint] += 2;
  }

  // Identify highest scoring category
  let bestCategory: Category = 'Lainnya';
  let highestScore = 0;
  let totalPositiveScore = 0;

  for (const cat of allCategories) {
    const s = categoryScores[cat];
    totalPositiveScore += s;
    if (s > highestScore) {
      highestScore = s;
      bestCategory = cat;
    }
  }

  // If no category scored significantly and user provided hint, fallback to hint
  if (highestScore < 1.5 && userCategoryHint && userCategoryHint !== 'Lainnya') {
    bestCategory = userCategoryHint;
  }

  // Confidence Calculation (0 - 100%)
  let confidence = 40;
  if (highestScore >= 8) confidence = 95;
  else if (highestScore >= 5) confidence = 85;
  else if (highestScore >= 3) confidence = 75;
  else if (highestScore >= 1.5) confidence = 60;
  else confidence = 45;

  // SENTIMENT ANALYSIS WITH VALENCE SHIFTERS & NEGATIONS
  let posScore = 0;
  let negScore = 0;

  // Check multi-word phrase patterns
  for (const phrase of POSITIVE_LEXICON) {
    if (lower.includes(phrase)) {
      posScore += phrase.includes(' ') ? 2 : 1;
    }
  }

  for (const phrase of NEGATIVE_LEXICON) {
    if (lower.includes(phrase)) {
      negScore += phrase.includes(' ') ? 2 : 1;
    }
  }

  // Extra boost from special negative patterns
  if (hasSpecificNegative) negScore += 4;
  if (sarcasmDetected) negScore += 4;
  if (localDialectDetected) negScore += 3;
  if (isUrgent) negScore += 3;

  // Negation detection around positive words (e.g., "tidak bagus", "belum lancar", "kurang memadai")
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    if (NEGATION_WORDS.includes(w)) {
      // Check next 1-2 words
      const next1 = words[i + 1] || '';
      const next2 = words[i + 2] || '';
      if (POSITIVE_LEXICON.some(p => p === next1 || p === next2)) {
        // Negated positive becomes negative
        posScore = Math.max(0, posScore - 1.5);
        negScore += 2;
      } else if (NEGATIVE_LEXICON.some(n => n === next1 || n === next2)) {
        // Negated negative (e.g. "tidak rusak", "tidak ada banjir")
        negScore = Math.max(0, negScore - 1.5);
        posScore += 1.5;
      }
    }
  }

  let sentiment: Sentiment = 'Neutral';
  // Strict rule: if specific negative aduan, sarcasm, or local grievance terms are detected
  if (hasSpecificNegative || negScore > posScore + 0.3) {
    sentiment = 'Negative';
  } else if (posScore > negScore + 0.5) {
    sentiment = 'Positive';
  } else {
    sentiment = 'Neutral';
  }

  const sentimentScores = {
    positive: posScore,
    negative: negScore,
    neutral: Math.max(0, 5 - (posScore + negScore))
  };

  const badges: string[] = [];
  if (isUrgent) badges.push('URGENSI TINGGI');
  if (sarcasmDetected) badges.push('Sarkasme Terdeteksi');
  if (localDialectDetected) badges.push('Dialek Lokal/Informal Terdeteksi');

  const badgePrefix = badges.length > 0 ? `[${badges.join(' • ')}] ` : '';
  const explanation = matchedKeywords.length > 0
    ? `${badgePrefix}Terdeteksi melalui heuristik kata kunci: [${matchedKeywords.slice(0, 5).join(', ')}] dengan afinitas dominan sektor ${bestCategory}.`
    : `${badgePrefix}Analisis teks berbasis semantik dan penalaran tata kelola pembangunan wilayah.`;

  return {
    category: bestCategory,
    sentiment,
    confidence,
    matchedKeywords,
    categoryScores,
    sentimentScores,
    explanation,
    isUrgent,
    urgencyLevel: isUrgent ? 'high' : 'normal',
    sarcasmDetected,
    localDialectDetected,
    detectedNegativeIssues
  };
}
