import { CommentData, Category, Sentiment } from '../types';
import { KALTENG_REGIONS, KaltengRegion } from './kaltengRegions';

const INDONESIAN_NAMES = [
  'Ahmad Fauzi', 'Siti Rahmawati', 'Budi Santoso', 'Dewi Lestari', 'Hendra Setiawan',
  'Rina Marlina', 'Agus Prasetyo', 'Nurul Hidayah', 'Eko Wibowo', 'Tri Wahyuni',
  'Yusuf Pratama', 'Endang Sri', 'Bambang Irawan', 'Dian Anggraini', 'Rizky Ramadhan',
  'Ratna Sari', 'Fajar Nugroho', 'Sri Wahyuningsih', 'Warga Anonim', 'Warga Anonim'
];

export function generateKaltengMockData(): CommentData[] {
  const templates: Record<Category, string[]> = {
    Transportasi: [
      'Pelebaran jalan arteri penghubung {wilayah} menuju wilayah sentra ekonomi sangat membantu kelancaran distribusi logistik dan komoditas warga.',
      'Kondisi jalan poros lintas kabupaten di {wilayah} berlubang cukup parah dan rawan genangan saat musim hujan, mohon pengaspalan ulang segera.',
      'Apresiasi penambahan trayek bus perintis rute pedalaman di {wilayah} yang memangkas biaya transportasi pelajar dan pelaku UMKM.',
      'Jembatan penghubung antar-kecamatan di {wilayah} sudah mulai rapuh fondasinya, butuh perbaikan sebelum menimbulkan kecelakaan.',
      'Truk bertonase berat pengangkut sawit dan tambang melintasi jalan permukiman di {wilayah} merusak struktur aspal dan membahayakan warga.',
      'Perlu penambahan rambu keselamatan dan marka jalan di tikungan rawan kecelakaan di poros perbatasan {wilayah}.',
      'Waktu tempuh antar-kecamatan di {wilayah} sekarang jauh lebih cepat berkat penyemenan jalan lingkungan tahun ini.',
      'Trotoar jalan protokol di pusat kota {wilayah} banyak yang rusak dan tidak ramah bagi pejalan kaki maupun disabilitas.'
    ],
    'Drainase & Banjir': [
      'Saluran drainase perkotaan di {wilayah} tersumbat sedimen lumpur tebal, saat hujan lebat 1 jam air langsung meluap ke badan jalan.',
      'Genangan air setinggi 30 cm masih sering merendam kawasan pertokoan dan pasar di {wilayah} karena dimensi gorong-gorong terlalu sempit.',
      'Apresiasi proyek normalisasi parit dan pengerukan sungai primer di {wilayah} yang berhasil mencegah banjir bandang musim ini.',
      'Sistem drainase permukiman di {wilayah} tidak terintegrasi ke saluran pembuangan utama, air limbah rumah tangga menggenang di depan rumah.',
      'Kawasan bantaran sungai di {wilayah} membutuhkan tanggul penahan banjir rob dan sistem pompa air otomatis saat debit air sungai naik.',
      'Pembangunan saluran drainase beton baru di kompleks perumahan {wilayah} sangat rapi dan efektif mengatasi genangan menahun.'
    ],
    'Bencana Alam': [
      'Titik panas (hotspot) dan kebakaran lahan gambut di pinggiran {wilayah} mulai memicu kabut asap, mohon patroli Manggala Agni dan Masyarakat Peduli Api (MPA) diintensifkan.',
      'Apresiasi kesigapan tim BPBD dan relawan Masyarakat Peduli Api (MPA) di {wilayah} yang bergerak cepat memadamkan kebakaran semak belukar sebelum merembet ke permukiman.',
      'Kawasan tebing perbukitan di jalur poros penghubung {wilayah} rawan longsor saat musim hujan lebat, perlu segera dipasang bronjong kawat penahan tanah.',
      'Debit air sungai utama di {wilayah} meluap tinggi setelah hujan lebat di hulu, masyarakat bantaran sungai membutuhkan bantuan tenda darurat dan logistik makanan.',
      'Warga mengusulkan percepatan revitalisasi sekat kanal (canal blocking) di area lahan gambut terdegradasi {wilayah} untuk menjaga kelembapan tanah dan mencegah karhutla.',
      'Gelombang pasang dan abrasi pantai di kawasan pesisir {wilayah} mengancam pondasi rumah nelayan, butuh penanaman sabuk mangrove dan pemecah ombak.'
    ],
    Sampah: [
      'Tempat Penampungan Sementara (TPS) liar di dekat pasar tradisional {wilayah} meluap dan mencemari saluran drainase warga.',
      'Program edukasi bank sampah dan daur ulang sampah organik di {wilayah} mulai menunjukkan dampak positif bagi kebersihan kelurahan.',
      'Armada truk pengangkut sampah di {wilayah} sangat minim sehingga sampah rumah tangga menumpuk hingga berhari-hari di pinggir jalan.',
      'Pengelolaan Tempat Pemrosesan Akhir (TPA) di {wilayah} memerlukan modernisasi sanitasi kontrol lindi agar air tanah tidak tercemar.',
      'Warga mengeluhkan bau menyengat dari TPS sampah dekat sekolah dasar di {wilayah}, mohon segera direlokasi ke tempat tertutup.',
      'Gotong royong pembersihan sampah plastik di kawasan bantaran sungai {wilayah} pekan lalu sangat membanggakan warga.'
    ],
    'Air Bersih & Sanitasi': [
      'Aliran air PDAM di kawasan pemukiman {wilayah} sering mati pada jam sibuk pagi hari dan airnya kadang keruh kecokelatan.',
      'Kualitas suplai air bersih PDAM di {wilayah} kini jauh lebih jernih dan lancar 24 jam setelah revitalisasi intake pengolahan air.',
      'Pipa distribusi air bersih di bawah jalan {wilayah} bocor berhari-hari menyebabkan tekanan air ke rumah warga menjadi sangat lemah.',
      'Masih banyak keluarga di pinggiran {wilayah} yang kesulitan akses air minum layak dan terpaksa mengandalkan air sungai yang keruh.',
      'Bantuan pembangunan fasilitas MCK komunal dan sanitasi septic tank kedap air di kelurahan {wilayah} sangat bermanfaat bagi kesehatan warga.'
    ],
    'Ruang Terbuka Hijau': [
      'Kawasan taman kota dan jalur pedestrian di pusat {wilayah} sangat bersih, nyaman untuk rekreasi keluarga dan olahraga pagi.',
      'Mohon perlindungan kawasan hutan lindung kota dan sempadan sungai di {wilayah} dari ancaman alih fungsi lahan ilegal.',
      'Penambahan fasilitas ramah anak, bangku taman, dan arena terbuka hijau di {wilayah} perlu diperluas ke kecamatan penyangga.',
      'Penanaman pohon peneduh di sepanjang median jalan protokol {wilayah} membuat lingkungan kota terasa jauh lebih sejuk dan asri.',
      'Revitalisasi taman terbuka publik di {wilayah} sukses menarik wisatawan lokal dan membangkitkan ekonomi pedagang kecil.'
    ],
    'Tata Ruang & Pemukiman': [
      'Kawasan permukiman padat di {wilayah} membutuhkan penataan tata ruang agar akses mobil pemadam kebakaran tidak terhalang lorong sempit.',
      'Pedagang Kaki Lima (PKL) menempati bahu jalan dan trotoar utama {wilayah} sehingga memicu kemacetan semrawut setiap sore.',
      'Program bedah rumah tidak layak huni (RTLH) bagi masyarakat berpenghasilan rendah di {wilayah} berjalan transparan dan tepat sasaran.',
      'Penegakan zonasi sempadan bangunan dan izin PBG di {wilayah} perlu diperketat untuk mencegah bangunan liar di atas saluran air.',
      'Penyediaan hunian vertikal terjangkau dan penataan kawasan kumuh bantaran sungai di {wilayah} harus segera direalisasikan.'
    ],
    'Fasilitas Publik': [
      'Lampu Penerangan Jalan Umum (PJU) di poros jalan antar-desa {wilayah} padam berbulan-bulan, rawan tindak kejahatan dan kecelakaan.',
      'Pelayanan di Puskesmas rawat inap {wilayah} sangat sigap, ramah, dan fasilitas alat medisnya kini semakin lengkap.',
      'Revitalisasi pasar rakyat semi-modern di {wilayah} membuat transaksi belanja warga jauh lebih bersih, aman, dan tertib.',
      'Gedung serbaguna dan fasilitas olahraga pemuda di {wilayah} terbengkalai tanpa perawatan, butuh perbaikan atap dan lantai lapangan.',
      'Pemasangan CCTV publik di titik-titik rawan persimpangan jalan {wilayah} sangat membantu meningkatkan rasa aman warga saat malam hari.'
    ],
    Lainnya: [
      'Pelayanan administrasi kependudukan dan perizinan satu pintu (PTSP) di kantor pemerintah {wilayah} sangat cepat dan bebas pungli.',
      'Jaringan telekomunikasi dan sinyal internet 4G di desa pedalaman {wilayah} sering hilang total saat cuaca buruk, butuh menara BTS baru.',
      'Program bantuan modal usaha bagi pelaku UMKM ekonomi kreatif di {wilayah} sangat meringankan beban pasca krisis.',
      'Apresiasi keterbukaan informasi publik dan kecepatan tanggap aduan media sosial pemerintah daerah {wilayah}.'
    ]
  };

  const items: CommentData[] = [];

  // Distribution weights across 14 regions
  const weights: Record<KaltengRegion, number> = {
    'Kota Palangka Raya': 38,
    'Kabupaten Kotawaringin Timur': 32,
    'Kabupaten Kotawaringin Barat': 28,
    'Kabupaten Kapuas': 24,
    'Kabupaten Katingan': 20,
    'Kabupaten Barito Selatan': 18,
    'Kabupaten Barito Utara': 18,
    'Kabupaten Gunung Mas': 16,
    'Kabupaten Pulang Pisau': 16,
    'Kabupaten Murung Raya': 15,
    'Kabupaten Barito Timur': 14,
    'Kabupaten Seruyan': 14,
    'Kabupaten Lamandau': 12,
    'Kabupaten Sukamara': 11,
  };

  const categories: Category[] = [
    'Transportasi', 
    'Drainase & Banjir', 
    'Bencana Alam',
    'Sampah', 
    'Air Bersih & Sanitasi', 
    'Ruang Terbuka Hijau', 
    'Tata Ruang & Pemukiman', 
    'Fasilitas Publik', 
    'Lainnya'
  ];

  let counter = 1;
  const now = Date.now();

  for (const region of KALTENG_REGIONS) {
    const count = weights[region];
    for (let i = 0; i < count; i++) {
      // Probabilistic category picking based on realistic urban concerns
      const randCat = Math.random();
      let cat: Category = 'Transportasi';
      if (randCat < 0.24) cat = 'Transportasi';
      else if (randCat < 0.38) cat = 'Drainase & Banjir';
      else if (randCat < 0.50) cat = 'Bencana Alam';
      else if (randCat < 0.63) cat = 'Sampah';
      else if (randCat < 0.74) cat = 'Air Bersih & Sanitasi';
      else if (randCat < 0.83) cat = 'Ruang Terbuka Hijau';
      else if (randCat < 0.90) cat = 'Tata Ruang & Pemukiman';
      else if (randCat < 0.96) cat = 'Fasilitas Publik';
      else cat = 'Lainnya';

      const randSent = Math.random();
      let sent: Sentiment = 'Neutral';

      // Realistic sentiment weight per category
      if (cat === 'Drainase & Banjir' || cat === 'Transportasi' || cat === 'Air Bersih & Sanitasi' || cat === 'Bencana Alam') {
        sent = randSent < 0.18 ? 'Positive' : randSent < 0.76 ? 'Negative' : 'Neutral';
      } else if (cat === 'Sampah' || cat === 'Tata Ruang & Pemukiman') {
        sent = randSent < 0.22 ? 'Positive' : randSent < 0.72 ? 'Negative' : 'Neutral';
      } else if (cat === 'Ruang Terbuka Hijau') {
        sent = randSent < 0.62 ? 'Positive' : randSent < 0.85 ? 'Neutral' : 'Negative';
      } else {
        sent = randSent < 0.45 ? 'Positive' : randSent < 0.78 ? 'Neutral' : 'Negative';
      }

      const tmpls = templates[cat];
      const template = tmpls[Math.floor(Math.random() * tmpls.length)];
      const text = template.replace('{wilayah}', region);

      // Distribute timestamps: 35% in the last 7 days (for strong weekly trend data), 65% in 8-40 days ago
      let daysAgo = 0;
      if (Math.random() < 0.38) {
        // Last 7 days
        daysAgo = Math.floor(Math.random() * 7);
      } else {
        daysAgo = 7 + Math.floor(Math.random() * 33);
      }
      const hoursAgo = Math.floor(Math.random() * 24);
      const commentDate = new Date(now - (daysAgo * 86400000 + hoursAgo * 3600000)).toISOString();

      const author = INDONESIAN_NAMES[Math.floor(Math.random() * INDONESIAN_NAMES.length)];

      items.push({
        id: `KALTENG-${String(counter++).padStart(4, '0')}`,
        author,
        createdAt: commentDate,
        text,
        region,
        category: cat,
        sentiment: sent,
        processed: true,
      });
    }
  }

  // Sort descending by date so newest comments appear first
  return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
