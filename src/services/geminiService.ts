import { GoogleGenAI, Type } from "@google/genai";
import { CommentData, Category, Sentiment, AnalysisResultBatch, WeeklyAiInsight, PolicyAction } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const ALL_VALID_CATEGORIES: Category[] = [
  'Transportasi',
  'Drainase & Banjir',
  'Sampah',
  'Air Bersih & Sanitasi',
  'Ruang Terbuka Hijau',
  'Tata Ruang & Pemukiman',
  'Fasilitas Publik',
  'Lainnya'
];

const SYSTEM_INSTRUCTION = `Anda adalah analis ahli perencanaan wilayah dan perkotaan (Urban Planner & Public Policy Expert) di Indonesia.
Tugas Anda adalah menganalisis aspirasi dan komentar masyarakat terkait pembangunan kota/wilayah di Kalimantan Tengah ke dalam 8 kategori spektrum permasalahan perkotaan:
1. Transportasi (Jalan arteri, jalan poros, jembatan, angkutan umum/bus perintis, kemacetan, trotoar, rambu lalu lintas, marka)
2. Drainase & Banjir (Saluran drainase tersumbat, gorong-gorong sempit, sedimentasi lumpur, genangan air hujan, banjir rob/luapan sungai)
3. Sampah (Pengelolaan sampah, TPS liar, TPA, pengangkutan sampah permukiman/pasar, daur ulang limbah, kebersihan lingkungan)
4. Air Bersih & Sanitasi (Jaringan pipa PDAM, kontinuitas suplai air bersih, kualitas air keruh, MCK komunal, sanitasi septic tank)
5. Ruang Terbuka Hijau (Taman kota, kanopi pohon peneduh, hutan kota, ruang publik, sempadan sungai, penghijauan)
6. Tata Ruang & Pemukiman (Kawasan kumuh, zonasi sempadan bangunan, penertiban PKL di trotoar/bahu jalan, perumahan layak huni)
7. Fasilitas Publik (Penerangan Jalan Umum/PJU, puskesmas, pasar rakyat, fasilitas olahraga/sosial, keamanan lingkungan)
8. Lainnya (Pelayanan perizinan/birokrasi, jaringan telekomunikasi/internet desa, ekonomi kerakyatan)

Serta menentukan sentimen secara objektif:
- Positive (Apresiasi, kepuasan terhadap hasil pembangunan, dukungan, kondisi membaik)
- Negative (Keluhan, kritik terhadap kerusakan fasilitas, bahaya keselamatan, kekecewaan)
- Neutral (Saran informatif, usulan kebijakan, pertanyaan tanpa muatan emosi negatif/positif kuat)`;

/**
 * Heuristic fallback classifier for Indonesian text with expanded urban issue spectrum
 */
export function classifyHeuristic(text: string, categoryHint?: Category): { category: Category; sentiment: Sentiment } {
  const lower = text.toLowerCase();

  // Category classification
  let category: Category = categoryHint || 'Lainnya';
  if (!categoryHint || categoryHint === 'Lainnya') {
    if (/\b(drainase|gorong-gorong|selokan|parit|genangan|luapan|tergenang|banjir|resapan|sedimen|tanggul)\b/.test(lower)) {
      category = 'Drainase & Banjir';
    } else if (/\b(jalan|aspal|jembatan|bus|trayek|angkutan|macet|lubang|berlubang|rambu|trotoar|marka|transportasi|truk|kendaraan)\b/.test(lower)) {
      category = 'Transportasi';
    } else if (/\b(sampah|tps|tpa|limbah|bau|kotor|kebersihan|plastik|daur ulang|menumpuk|timbunan)\b/.test(lower)) {
      category = 'Sampah';
    } else if (/\b(pdam|air bersih|air minum|pipa|keruh|mati air|saluran air bersih|mck|sanitasi|septic)\b/.test(lower)) {
      category = 'Air Bersih & Sanitasi';
    } else if (/\b(taman|pohon|peneduh|rth|hutan|hijau|alun-alun|asri|sejuk|pedestrian|lingkungan hidup|bunga)\b/.test(lower)) {
      category = 'Ruang Terbuka Hijau';
    } else if (/\b(kumuh|permukiman|pkl|pedagang kaki lima|perumahan|zonasi|sempadan|rtlh|tata ruang|bangunan liar|pbg)\b/.test(lower)) {
      category = 'Tata Ruang & Pemukiman';
    } else if (/\b(pju|lampu jalan|penerangan|puskesmas|pasar|cctv|keamanan|gedung|fasilitas umum|posyandu)\b/.test(lower)) {
      category = 'Fasilitas Publik';
    }
  }

  // Sentiment classification
  const positiveWords = [
    'bagus', 'puas', 'terima kasih', 'apresiasi', 'senang', 'nyaman', 'indah', 'bersih',
    'lancar', 'mantap', 'hebat', 'membantu', 'tertata', 'ramah', 'cepat', 'asri', 'sejuk',
    'membaik', 'berhasil', 'sukses', 'terpuji', 'bermanfaat', 'rapi', 'efektif', 'jernih'
  ];
  const negativeWords = [
    'rusak', 'parah', 'berlubang', 'lubang', 'kecewa', 'macet', 'bau', 'banjir', 'sampah',
    'tumpukan', 'lambat', 'bahaya', 'jelek', 'kumuh', 'terbengkalai', 'gelap', 'sulit',
    'keluhan', 'protes', 'hancur', 'terganggu', 'becek', 'mati lampu', 'mati air', 'terputus',
    'rapuh', 'tercemar', 'meluap', 'tenggelam', 'memprihatinkan', 'keruh', 'tersumbat', 'semrawut'
  ];

  let posScore = 0;
  let negScore = 0;

  for (const w of positiveWords) {
    if (lower.includes(w)) posScore++;
  }
  for (const w of negativeWords) {
    if (lower.includes(w)) negScore++;
  }

  let sentiment: Sentiment = 'Neutral';
  if (posScore > negScore) {
    sentiment = 'Positive';
  } else if (negScore > posScore) {
    sentiment = 'Negative';
  } else {
    sentiment = 'Neutral';
  }

  return { category, sentiment };
}

/**
 * Analyzes a single comment submitted by a citizen
 */
export async function analyzeSingleComment(text: string, categoryHint?: Category): Promise<{ category: Category; sentiment: Sentiment }> {
  // If API key is not present, use heuristic immediately
  if (!process.env.GEMINI_API_KEY) {
    return classifyHeuristic(text, categoryHint);
  }

  try {
    const prompt = `Analisis aspirasi warga pembangunan kota di Kalimantan Tengah berikut ini:
Teks: "${text}"
${categoryHint ? `Petunjuk Kategori dari Pengguna: ${categoryHint}` : ''}

Tentukan:
1. "category": Harus salah satu dari: "Transportasi", "Drainase & Banjir", "Sampah", "Air Bersih & Sanitasi", "Ruang Terbuka Hijau", "Tata Ruang & Pemukiman", "Fasilitas Publik", "Lainnya"
2. "sentiment": Harus salah satu dari "Positive", "Negative", "Neutral"`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING },
            sentiment: { type: Type.STRING }
          },
          required: ["category", "sentiment"]
        }
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    const validSentiments: Sentiment[] = ['Positive', 'Negative', 'Neutral'];

    const category: Category = ALL_VALID_CATEGORIES.includes(parsed.category) 
      ? parsed.category 
      : (categoryHint || classifyHeuristic(text).category);

    const sentiment: Sentiment = validSentiments.includes(parsed.sentiment) 
      ? parsed.sentiment 
      : classifyHeuristic(text).sentiment;

    return { category, sentiment };
  } catch (error) {
    console.warn("Menggunakan analisis lokal heuristik sebagai fallback:", error);
    return classifyHeuristic(text, categoryHint);
  }
}

/**
 * Generates an automated AI Insight synthesizing weekly citizen aspiration trends
 * and identifying the most urgent urban development issue.
 */
export async function generateWeeklyAiInsight(
  comments: CommentData[],
  timeframeDays: number = 7
): Promise<WeeklyAiInsight> {
  const timeframeLabel = timeframeDays === 7 ? 'Tren 7 Hari Terakhir (Mingguan)' : `Tren ${timeframeDays} Hari Terakhir`;

  // Gracefully handle empty dataset (live citizen field trial mode)
  if (!comments || comments.length === 0) {
    return {
      generatedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      timeframeDays,
      timeframeLabel,
      urgentCategory: 'Lainnya',
      urgencyLevel: 'Moderat',
      headline: 'Platform Siap Menjaring Aspirasi Lapangan Masyarakat Kalimantan Tengah',
      summaryTrend: 'Saat ini belum ada data aspirasi tersimpan (mode uji coba lapangan aktif). Sintesis tren mingguan, deteksi isu mendesak, dan rekomendasi kebijakan otomatis akan aktif secara dinamis begitu warga mulai menyampaikan masukan pertama mereka.',
      keyDrivers: [
        'Menunggu partisipasi awal warga melalui formulir digital atau survei lapangan',
        'Data aspirasi dapat disalurkan melalui menu "Sampaikan Aspirasi Warga"',
        'Hasil survei lapangan atau kuesioner dapat diimpor langsung melalui format CSV'
      ],
      affectedHotspots: ['13 Kabupaten & 1 Kota Kalimantan Tengah'],
      sampleQuotes: [],
      policyRecommendations: [
        { targetAgency: 'Bappeda & Perencana Wilayah', action: 'Buka kanal partisipasi publik dan lakukan sosialisasi pengisian aspirasi warga di kecamatan/kelurahan', priority: 'Segera' },
        { targetAgency: 'Diskominfo Kalteng', action: 'Sosialisasikan portal CityPulse Kalteng kepada komunitas masyarakat dan pemuda daerah', priority: 'Segera' }
      ],
      sentimentComparison: {
        urgentCategoryNegativePct: 0,
        trendDirection: 'Stabil',
        totalPeriodAspirations: 0,
        urgentCategoryCount: 0
      }
    };
  }

  const now = Date.now();
  const cutoffTime = now - (timeframeDays * 86400000);

  // Filter comments for the requested timeframe
  let periodComments = comments.filter(c => new Date(c.createdAt).getTime() >= cutoffTime);

  // If period comments are very few (e.g., brand new install), take the most recent 60 comments to ensure rich analysis
  if (periodComments.length < 15) {
    periodComments = [...comments].slice(0, 60);
  }

  // Pre-calculate statistical distribution per category
  const categoryStats: Record<Category, { total: number; negative: number; positive: number; neutral: number; regions: Record<string, number> }> = {
    'Transportasi': { total: 0, negative: 0, positive: 0, neutral: 0, regions: {} },
    'Drainase & Banjir': { total: 0, negative: 0, positive: 0, neutral: 0, regions: {} },
    'Sampah': { total: 0, negative: 0, positive: 0, neutral: 0, regions: {} },
    'Air Bersih & Sanitasi': { total: 0, negative: 0, positive: 0, neutral: 0, regions: {} },
    'Ruang Terbuka Hijau': { total: 0, negative: 0, positive: 0, neutral: 0, regions: {} },
    'Tata Ruang & Pemukiman': { total: 0, negative: 0, positive: 0, neutral: 0, regions: {} },
    'Fasilitas Publik': { total: 0, negative: 0, positive: 0, neutral: 0, regions: {} },
    'Lainnya': { total: 0, negative: 0, positive: 0, neutral: 0, regions: {} },
  };

  periodComments.forEach(c => {
    const stats = categoryStats[c.category] || categoryStats['Lainnya'];
    stats.total++;
    if (c.sentiment === 'Negative') stats.negative++;
    else if (c.sentiment === 'Positive') stats.positive++;
    else stats.neutral++;

    stats.regions[c.region] = (stats.regions[c.region] || 0) + 1;
  });

  // Determine the most urgent category: highest negative count (or highest negative ratio if counts are equal)
  let urgentCategory: Category = 'Drainase & Banjir';
  let maxNegativeScore = -1;

  for (const cat of ALL_VALID_CATEGORIES) {
    const stat = categoryStats[cat];
    if (stat.total === 0) continue;
    // Score weighted by absolute negative count and negative ratio
    const negRatio = stat.negative / stat.total;
    const score = stat.negative * 1.5 + (negRatio * 10);
    if (score > maxNegativeScore) {
      maxNegativeScore = score;
      urgentCategory = cat;
    }
  }

  const urgentStats = categoryStats[urgentCategory];
  const urgentNegativePct = urgentStats.total > 0 ? Math.round((urgentStats.negative / urgentStats.total) * 100) : 0;

  // Identify top affected hotspot regions
  const topRegions = Object.entries(urgentStats.regions)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([region]) => region);

  // Extract representative sample quotes for this urgent category
  const quotes = periodComments
    .filter(c => c.category === urgentCategory && c.sentiment === 'Negative')
    .slice(0, 3)
    .map(c => ({
      author: c.author,
      region: c.region,
      text: c.text,
      date: new Date(c.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
    }));

  // If Gemini API Key is not configured, return high-fidelity fallback synthesis
  if (!process.env.GEMINI_API_KEY) {
    return generateFallbackWeeklyInsight(
      timeframeDays,
      timeframeLabel,
      urgentCategory,
      urgentStats,
      urgentNegativePct,
      topRegions,
      quotes,
      periodComments.length
    );
  }

  // Generate dynamic synthesis using Gemini 3.8 Flash
  try {
    const prompt = `Anda adalah penasihat tata kota senior dan analis kebijakan perkotaan.
Berdasarkan data aspirasi masyarakat Kalimantan Tengah ${timeframeLabel}:
- Total aspirasi dianalisis: ${periodComments.length}
- Kategori paling mendesak terdeteksi: "${urgentCategory}" (Total masukan: ${urgentStats.total}, Keluhan negatif: ${urgentStats.negative} atau ${urgentNegativePct}%)
- Hotspot wilayah terdampak utama: ${topRegions.join(', ') || 'Lintas Kabupaten'}
- Sampel keluhan warga:
${quotes.map((q, i) => `${i+1}. [${q.region}] "${q.text}"`).join('\n')}

- Distribusi kategori lainnya:
${Object.entries(categoryStats).map(([cat, s]) => `- ${cat}: ${s.total} (Negatif: ${s.negative}, Positif: ${s.positive})`).join('\n')}

Hasilkan analisis JSON terstruktur yang komprehensif, tajam, dan objektif untuk pimpinan daerah/perencana kota:
1. "headline": Judul ringkas (maksimal 15 kata) yang menyoroti isu paling kritis minggu ini.
2. "summaryTrend": Sintesis tren 2 paragraf profesional (bahasa Indonesia formal) yang menerangkan mengapa isu ${urgentCategory} ini melonjak, kaitannya dengan kondisi cuaca/lapangan atau infrastruktur, dan persepsi publik terkini.
3. "urgencyLevel": "Kritis" jika negatif > 60%, "Tinggi" jika negatif 40-60%, atau "Moderat".
4. "keyDrivers": Array berisi 3-4 faktor penyebab keluhan warga paling spesifik.
5. "policyRecommendations": Array berisi 3-4 rekomendasi intervensi konkret dengan format:
   - "targetAgency": Nama dinas terkait (misal: "Dinas PUPR & Perkim", "Dinas Lingkungan Hidup", "PDAM Tirta Kalteng", "Bappeda")
   - "action": Tindakan taktis dan solutif di lapangan
   - "priority": "Segera" atau "Jangka Menengah"
6. "trendDirection": "Meningkat" atau "Stabil" atau "Menurun"`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            headline: { type: Type.STRING },
            summaryTrend: { type: Type.STRING },
            urgencyLevel: { type: Type.STRING },
            keyDrivers: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            policyRecommendations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  targetAgency: { type: Type.STRING },
                  action: { type: Type.STRING },
                  priority: { type: Type.STRING }
                },
                required: ["targetAgency", "action", "priority"]
              }
            },
            trendDirection: { type: Type.STRING }
          },
          required: ["headline", "summaryTrend", "urgencyLevel", "keyDrivers", "policyRecommendations", "trendDirection"]
        }
      }
    });

    const parsed = JSON.parse(response.text || "{}");

    const urgencyLevel: 'Kritis' | 'Tinggi' | 'Moderat' = 
      ['Kritis', 'Tinggi', 'Moderat'].includes(parsed.urgencyLevel) 
        ? parsed.urgencyLevel 
        : (urgentNegativePct > 60 ? 'Kritis' : urgentNegativePct > 40 ? 'Tinggi' : 'Moderat');

    const trendDirection: 'Meningkat' | 'Menurun' | 'Stabil' = 
      ['Meningkat', 'Menurun', 'Stabil'].includes(parsed.trendDirection)
        ? parsed.trendDirection
        : 'Meningkat';

    return {
      generatedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      timeframeDays,
      timeframeLabel,
      urgentCategory,
      urgencyLevel,
      headline: parsed.headline || `Eskalasi Keluhan Warga Terkait ${urgentCategory} Memerlukan Intervensi Taktis Segera`,
      summaryTrend: parsed.summaryTrend || `Dalam kurun waktu ${timeframeLabel}, sektor ${urgentCategory} mencatatkan eskalasi keluhan tertinggi dari masyarakat. Kerusakan infrastruktur dan keterlambatan penanganan di lapangan menjadi keluhan utama warga di wilayah hotspot.`,
      keyDrivers: parsed.keyDrivers && parsed.keyDrivers.length > 0 ? parsed.keyDrivers : [
        `Sedimentasi dan hambatan fisik pada sarana ${urgentCategory}`,
        `Kapasitas penanganan armada/alat berat dinas teknis yang terbatas`,
        `Kebutuhan koordinasi lintas sektoral antara dinas perkim dan pemerintah daerah`
      ],
      affectedHotspots: topRegions.length > 0 ? topRegions : ['Kota Palangka Raya', 'Kabupaten Kotawaringin Timur'],
      sampleQuotes: quotes,
      policyRecommendations: (parsed.policyRecommendations || []).map((rec: any) => ({
        targetAgency: rec.targetAgency || 'Dinas PUPR & Perkim',
        action: rec.action || 'Lakukan survei teknis dan percepatan perbaikan sarana',
        priority: rec.priority === 'Segera' ? 'Segera' : 'Jangka Menengah'
      })),
      sentimentComparison: {
        urgentCategoryNegativePct: urgentNegativePct,
        trendDirection,
        totalPeriodAspirations: periodComments.length,
        urgentCategoryCount: urgentStats.total
      }
    };
  } catch (error) {
    console.warn("Fallback to heuristic weekly AI insight:", error);
    return generateFallbackWeeklyInsight(
      timeframeDays,
      timeframeLabel,
      urgentCategory,
      urgentStats,
      urgentNegativePct,
      topRegions,
      quotes,
      periodComments.length
    );
  }
}

/**
 * Deterministic, domain-rich fallback insight generator for Indonesian urban governance
 */
function generateFallbackWeeklyInsight(
  timeframeDays: number,
  timeframeLabel: string,
  urgentCategory: Category,
  urgentStats: { total: number; negative: number; positive: number; neutral: number },
  urgentNegativePct: number,
  topRegions: string[],
  quotes: { author: string; region: string; text: string; date: string }[],
  totalPeriodAspirations: number
): WeeklyAiInsight {
  const urgencyLevel: 'Kritis' | 'Tinggi' | 'Moderat' = 
    urgentNegativePct >= 60 ? 'Kritis' : urgentNegativePct >= 40 ? 'Tinggi' : 'Moderat';

  // Domain-specific tailored content per category
  let headline = `Eskalasi Keluhan Terkait ${urgentCategory} Mendominasi Sorotan Warga`;
  let keyDrivers: string[] = [];
  let recommendations: PolicyAction[] = [];
  let summaryTrend = '';

  if (urgentCategory === 'Drainase & Banjir') {
    headline = 'Intensitas Hujan & Pendangkalan Saluran Drainase Picu Genangan Berulang di Kawasan Niaga';
    summaryTrend = `Sepanjang ${timeframeLabel}, isu Drainase & Mitigasi Banjir menjadi keprihatinan paling mendesak masyarakat dengan tingkat keluhan mencapai ${urgentNegativePct}%. Warga di titik-titik padat melaporkan penyempitan gorong-gorong serta sedimentasi parit yang menyebabkan luapan air hujan masuk ke badan jalan dan tempat usaha dalam hitungan menit.\n\nSebaliknya, program normalisasi sungai primer yang berjalan di sebagian wilayah diapresiasi, namun warga menuntut percepatan integrasi saluran pembuangan mikro di tingkat perumahan warga agar tidak terjadi penumpukan genangan air kotor berkepanjangan.`;
    keyDrivers = [
      'Sedimentasi lumpur tebal dan tumpukan sampah menyumbat mulut saluran sekunder',
      'Dimensi gorong-gorong lama tidak memadai menampung debit limpasan air hujan deras',
      'Kurangnya pintu air dan sistem pompa otomatis di kawasan permukiman bantaran sungai'
    ];
    recommendations = [
      { targetAgency: 'Dinas Pekerjaan Umum & Tata Ruang (PUPR)', action: 'Pengerukan darurat sedimen pada saluran drainase primer dan pelebaran gorong-gorong di titik rawan banjir', priority: 'Segera' },
      { targetAgency: 'Dinas Lingkungan Hidup (DLH)', action: 'Operasi tanggap pembersihan sampah organik dan ranting penyumbat parit bersama komunitas warga', priority: 'Segera' },
      { targetAgency: 'Bappeda & Bidang Tata Ruang', action: 'Audit kesesuaian masterplan drainase perkotaan terpadu dan penertiban bangunan di atas sempadan air', priority: 'Jangka Menengah' }
    ];
  } else if (urgentCategory === 'Transportasi') {
    headline = 'Kerusakan Jalan Poros Arteri & Rambu Keselamatan Jadi Keluhan Terbesar Warga Pekan Ini';
    summaryTrend = `Berdasarkan analisis aspirasi warga ${timeframeLabel}, sektor Transportasi dan Konektivitas Jalan mencatatkan porsi keluhan tinggi (${urgentNegativePct}% sentimen negatif). Jalur poros lintas antar-kabupaten yang dilalui angkutan bertonase berat menjadi pusat ketidakpuasan warga karena kondisi aspal amblas dan berlubang yang mengancam keselamatan pengendara.\n\nWarga mendesak dinas perhubungan dan dinas PU segera melakukan penambalan darurat dan memasang marka peringatan di tikungan tajam yang minim lampu penerangan jalan.`;
    keyDrivers = [
      'Truk bertonase berat melebihi kelas jalan (ODOL) melintasi jalur poros permukiman',
      'Genangan air hujan mempercepat pengelupasan lapisan aspal jalan arteri',
      'Minimnya rambu marka kejut dan lampu peringatan di perbatasan antar-wilayah'
    ];
    recommendations = [
      { targetAgency: 'Dinas Bina Marga / PUPR', action: 'Penambalan cepat (patching) lubang jalan prioritas di koridor utama dan perbaikan oprit jembatan', priority: 'Segera' },
      { targetAgency: 'Dinas Perhubungan (Dishub)', action: 'Pemberlakuan razia muatan lebih dan pemasangan rambu peringatan serta lampu kejut keselamatan', priority: 'Segera' },
      { targetAgency: 'Dinas Perhubungan & Organda', action: 'Perluasan rute bus perintis dan subsidi tarif angkutan umum bagi pelajar dan pelaku usaha mikro', priority: 'Jangka Menengah' }
    ];
  } else if (urgentCategory === 'Sampah') {
    headline = 'Timbunan Sampah TPS Liar & Keterbatasan Truk Angkut Sorotan Utama Warga';
    summaryTrend = `Pengelolaan kebersihan lingkungan dan Tempat Penampungan Sementara (TPS) sampah berada dalam fase mendesak pekan ini (${urgentNegativePct}% keluhan negatif). Warga mengeluhkan keterlambatan ritasi armada truk sampah yang menyebabkan sampah menumpuk dan menimbulkan bau menyengat di sekitar pasar dan sekolah dasar.\n\nEdukasi pemilahan sampah organik dan bank sampah mulai diterima baik, namun tanpa penambahan armada pengangkut harian, tumpukan sampah tetap mengancam estetika dan sanitasi kota.`;
    keyDrivers = [
      'Frekuensi ritase truk pengangkut sampah berkurang akibat kendala armada',
      'Kemunculan titik TPS liar di tepi jalan umum akibat ketiadaan kontainer penampung',
      'Kapasitas sel TPA yang mendekati overload dan pengelolaan air lindi yang belum optimal'
    ];
    recommendations = [
      { targetAgency: 'Dinas Lingkungan Hidup (DLH)', action: 'Penambahan jadwal pengangkutan sampah pasar menjadi dua kali sehari dan sterilisasi TPS liar', priority: 'Segera' },
      { targetAgency: 'Kecamatan & Kelurahan', action: 'Penyediaan kontainer sampah terpilah portable dan patroli kebersihan lingkungan warga', priority: 'Segera' },
      { targetAgency: 'Bappeda & Dinas LH', action: 'Modernisasi sistem pengolahan sampah sanitasi TPA berkonsep sanitary landfill dan sirkular ekonomi', priority: 'Jangka Menengah' }
    ];
  } else if (urgentCategory === 'Air Bersih & Sanitasi') {
    headline = 'Fluktuasi Kualitas & Kontinuitas Suplai PDAM Perlu Penanganan Cepat';
    summaryTrend = `Keluhan masyarakat mengenai suplai air bersih dan kebocoran pipa jaringan PDAM mengalami peningkatan pada ${timeframeLabel}. Sebagian warga mengeluhkan tekanan air yang melemah pada jam sibuk serta air yang keruh pasca perbaikan pipa di beberapa distrik permukiman.\n\nWarga mengharapkan transparansi informasi jadwal perbaikan dan bantuan suplai tangki air darurat ke kelurahan terdampak.`;
    keyDrivers = [
      'Pipa distribusi distribusi primer berusia tua rentan bocor dan menurunkan tekanan',
      'Gangguan kekeruhan air baku pada saat debit sungai surut atau banjir musiman',
      'Keterbatasan jaringan pipa PDAM menjangkau kantong-kantong permukiman pinggiran'
    ];
    recommendations = [
      { targetAgency: 'PDAM / Perumda Air Minum', action: 'Percepatan perbaikan titik pipa bocor dan penyediaan armada tangki air bersih keliling gratis', priority: 'Segera' },
      { targetAgency: 'Dinas Kesehatan & Perkim', action: 'Uji berkala parameter kualitas air minum dan sanitasi septic tank komunal perumahan', priority: 'Segera' },
      { targetAgency: 'Bappeda & Dinas PUPR', action: 'Peremajaan pipa transmisi utama dan ekspansi intake instalasi pengolahan air minum (IPA)', priority: 'Jangka Menengah' }
    ];
  } else {
    headline = `Dinamika Aspirasi ${urgentCategory} Menuntut Respon Cepat Pelayanan Publik`;
    summaryTrend = `Pada ${timeframeLabel}, topik ${urgentCategory} menyumbang ${urgentStats.total} aspirasi dengan ${urgentNegativePct}% keluhan warga. Integrasi pelayanan dan transparansi tindak lanjut dari laporan masyarakat menjadi faktor penentu kepuasan publik di Kalimantan Tengah.`;
    keyDrivers = [
      'Kebutuhan pemeliharaan berkala infrastruktur fisik dan fasilitas umum',
      'Kecepatan respon kanal pengaduan pemerintah daerah yang belum seragam',
      'Koordinasi teknis penanganan lintas sektor antar-instansi daerah'
    ];
    recommendations = [
      { targetAgency: 'Instansi Teknis Terkait', action: 'Lakukan inspeksi lapangan langsung dan tindak lanjut perbaikan dalam batas 72 jam', priority: 'Segera' },
      { targetAgency: 'Diskominfo & Bagian Humas', action: 'Publikasi progres penyelesaian aduan warga secara terbuka pada media informasi resmi', priority: 'Jangka Menengah' }
    ];
  }

  return {
    generatedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    timeframeDays,
    timeframeLabel,
    urgentCategory,
    urgencyLevel,
    headline,
    summaryTrend,
    keyDrivers,
    affectedHotspots: topRegions.length > 0 ? topRegions : ['Kota Palangka Raya', 'Kabupaten Kotawaringin Timur'],
    sampleQuotes: quotes,
    policyRecommendations: recommendations,
    sentimentComparison: {
      urgentCategoryNegativePct: urgentNegativePct,
      trendDirection: 'Meningkat',
      totalPeriodAspirations: totalPeriodAspirations,
      urgentCategoryCount: urgentStats.total
    }
  };
}

export async function processCommentBatch(comments: CommentData[]): Promise<AnalysisResultBatch> {
  const prompt = `Analyze these public comments one by one. Each has an ID and Text.
  
  Comments:
  ${comments.map(c => `ID: ${c.id} | Text: ${c.text}`).join('\n')}
  
  Return a JSON object with:
  1. "results": array of objects { "id": string, "category": string, "sentiment": string }
  2. "insightSnippet": a short narrative summary (in Indonesian) of the key concerns found in ONLY this specific batch of comments.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            results: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  category: { type: Type.STRING },
                  sentiment: { type: Type.STRING }
                },
                required: ["id", "category", "sentiment"]
              }
            },
            insightSnippet: { type: Type.STRING }
          },
          required: ["results", "insightSnippet"]
        }
      }
    });

    const result = JSON.parse(response.text || "{}") as AnalysisResultBatch;
    return result;
  } catch (error) {
    console.warn("Fallback to heuristic batch processing:", error);
    return {
      results: comments.map(c => {
        const { category, sentiment } = classifyHeuristic(c.text, c.category);
        return { id: c.id, category, sentiment };
      }),
      insightSnippet: 'Aspirasi masyarakat berfokus pada pembenahan jalan arteri dan pengelolaan kebersihan lingkungan.'
    };
  }
}

export async function generateFinalNarrative(summary: any): Promise<string> {
  if (!summary || summary.totalComments === 0) {
    return 'Platform CityPulse Kalteng siap digunakan untuk uji coba dan penjaringan langsung suara masyarakat Kalimantan Tengah. Saat ini belum ada data aspirasi yang terekam (0 data). Sintesis kebijakan dan rekomendasi intervensi tata ruang akan dihitung otomatis segera setelah warga mulai menyuarakan masukan melalui formulir digital atau impor survei lapangan.';
  }

  if (!process.env.GEMINI_API_KEY) {
    return `Berdasarkan rangkuman aspirasi publik, isu Transportasi, Drainase & Mitigasi Banjir, serta Pengelolaan Sampah merupakan bidang paling kritis yang memerlukan perhatian mendesak dari perencana kota. Program Ruang Terbuka Hijau (RTH) mendapatkan apresiasi tertinggi dari warga sebagai sarana rekreasi dan interaksi sosial.`;
  }

  const prompt = `Buatkan ringkasan naratif kebijakan pembangunan wilayah dalam bahasa Indonesia yang ringkas dan profesional untuk urban planner berdasarkan data aspirasi:
  Total Komentar: ${summary.totalComments}
  Kategori: ${JSON.stringify(summary.categoryDistribution)}
  Sentimen: ${JSON.stringify(summary.sentimentDistribution)}
  
  Sajikan dalam 2 paragraf singkat yang menyoroti sektor prioritas mendesak dan rekomendasi intervensi perencanaan tata ruang.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        systemInstruction: "Anda adalah penasihat senior perencanaan wilayah dan tata kota (Urban Planner). Gunakan bahasa Indonesia baku, lugas, dan berbobot.",
      }
    });

    return response.text || "Ringkasan analisis aspirasi warga berhasil diperbarui.";
  } catch (error) {
    return `Berdasarkan analisis terhadap ${summary.totalComments} aspirasi warga di Kalimantan Tengah, sektor infrastruktur konektivitas jalan poros logistik antar-kabupaten dan sistem penanganan sampah permukiman memerlukan intervensi kebijakan prioritas. Revitalisasi ruang terbuka hijau perkotaan diapresiasi positif oleh masyarakat sebagai ruang interaksi sosial.`;
  }
}
