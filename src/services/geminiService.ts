import { GoogleGenAI, Type } from "@google/genai";
import { CommentData, Category, Sentiment, AnalysisResultBatch, WeeklyAiInsight, PolicyAction } from "../types";
import { 
  analyzeAspirationIntelligent, 
  CATEGORY_DEFINITIONS,
  HeuristicAnalysisResult 
} from "./classificationEngine";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const ALL_VALID_CATEGORIES: Category[] = [
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

const SYSTEM_INSTRUCTION = `Anda adalah analis ahli perencanaan wilayah dan perkotaan (Senior Urban Planner & Public Policy Expert) di Kalimantan Tengah, Indonesia.
Tugas utama mesin AI adalah mengenali, mendeteksi, dan mengelompokkan secara spesifik seluruh laporan, aduan, dan masukan warga ber-sentimen NEGATIF ke dalam 9 kategori resmi daerah tanpa mengubah antarmuka (UI).

==================================================
BASIS PENGETAHUAN KHUSUS: SENTIMEN NEGATIF (AI CORE)
==================================================
1. INDIKATOR DAN KATEGORISASI SEKTOR SENTIMEN NEGATIF
AI wajib mengelompokkan setiap teks ber-sentimen negatif ke dalam sektor spesifik berikut berdasarkan kecocokan kata kunci:

- Sektor Jalan, Jembatan & Aksesibilitas (Kategori: Transportasi):
  * Kondisi Fisik: rusak, berlubang, amblas, retak, hancur, berdebu, becek, berlumpur, licin, berbatu, terkelupas, bergelombang.
  * Kondisi Akses: terisolir, putus, tidak bisa dilewati, tersumbat, sempit, terhalang, rawan longsor, jembatan lapuk, kayu patah, ponton rusak.
  * Dampak: bikin celaka, merusak kendaraan, ban bocor, patah as, membahayakan pengendara, lambat, susah lewat.

- Sektor Tata Ruang, Lahan & Permukiman (Kategori: Tata Ruang & Pemukiman):
  * Masalah Lahan: sengketa, penyerobotan, klaim sepihak, konflik batas, sengketa tanah, overlapping, tumpang tindih, alih fungsi liar, penggusuran.
  * Kondisi Kawasan: kumuh, semrawut, tata ruang acak-acakan, bangunan liar, tidak berizin, penyempitan, penutupan akses, komersialisasi.

- Sektor Drainase, Kebencanaan & Pengendalian Banjir:
  * Bencana & Karhutla (Kategori: Bencana Alam): karhutla, kebakaran, asap tebal, kabut asap, longsor, erosi, tanggul jebol, luapan sungai besar.
  * Saluran & Genangan (Kategori: Drainase & Banjir): banjir, genangan, air meluap, banjir rob, drainase mampet, saluran tersumbat, parit pendangkalan, selokan tumpat, tidak ada pembuangan, air tergenang.

- Sektor Lingkungan Hidup, Sampah & Sanitasi:
  * Masalah Sampah (Kategori: Sampah): bau busuk, tumpukan sampah, sampah berserakan, TPS liar, sampah menumpuk, tidak diangkut, lalat, bau menyengat, polusi udara, debu pekat.
  * Pencemaran (Kategori: Air Bersih & Sanitasi atau Sampah): limbah, air keruh, air berbau, air beracun, pencemaran sungai, limbah sawit/tambang, air hitam.

- Sektor Utilitas (Penerangan Jalan, Listrik & Air PDAM):
  * Listrik/PJU (Kategori: Fasilitas Publik): gelap, gelap gulita, PJU mati, lampu jalan padam, mati lampu, mati listrik, biarpet, tegangan drop, kabel menjuntai, kabel semrawut, tiang miring.
  * Air Bersih (Kategori: Air Bersih & Sanitasi): air PDAM mati, air mampet, air kecil, air keruh, air kuning, air berbau, krisis air, tidak mengalir.

- Sektor Transportasi, Lalu Lintas & Keselamatan (Kategori: Transportasi):
  * Lalu Lintas: macet, macet total, antrean panjang, rawan kecelakaan, jalan sempit, parkir liar, tidak ada rambu, penerangan minim.
  * Bahaya/Risiko: rawan, membahayakan nyawa, jalan licin, tikungan tajam, tidak ada pembatas, jalan miring, titik buta.

- Sektor Fasilitas Sosial & Publik (Kesehatan & Pendidikan) (Kategori: Fasilitas Publik):
  * Kondisi Fisik: atap bocor, dinding retak, roboh, terbengkalai, fasilitas rusak, toilet kotor, sarana minim.
  * Pelayanan: puskesmas tutup, tidak ada dokter, guru kosong, obat habis, tidak ramah disabilitas, antrean membludak.

- Sektor Ekonomi, Pasar & UMKM (Kategori: Lainnya):
  * Kondisi Pasar: pasar becek, bau, sepi, tempat kumuh, lapak liar, harga mahal, bahan pokok melonjak, sewa mahal.
  * Bantuan/Modal: bantuan tidak tepat sasaran, pilih kasih, modal susah, bantuan dipotong.

- Sektor Pelayanan Publik, Keamanan & Tata Kelola (Kategori: Lainnya):
  * Birokrasi: pungli, bayar pungutan, dipersulit, berbelit-belit, dipingpong, respon lambat, tidak ditanggapi, dinas cuek, pengaduan diabaikan.
  * Keamanan: rawan begal, pencurian, marak maling, tidak aman, kawasan rawan, pemuda nongkrong, pesta miras.

2. DETEKSI VARIASI LANGUAGE & DETEKSI URGENSI
- Bahasa Informal/Lokal: AI mengenali istilah daerah/informal seperti "ancur", "parah banar", "kadada perbaikan", "kada taurus", "dibiarkan jua", "lapuk", "tebalik", "takurung", "karamian", "pancal", "kuyup", "uyuh".
- Sarkasme & Sindiran: AI mengenali ungkapan sindiran seperti "seperti kolam", "seperti lapangan offroad", "pemerintah tidur", "tunggu ada korban baru diperbaiki", "kolam lele", "wisata jeglongan", "tunggu viral dulu".
- Tingkat Urgensi (Alert High): Tandai laporan sebagai prioritas penanganan darurat jika memuat kata "segera", "tolong", "darurat", "mengancam nyawa", "sudah ada korban", atau "nyaris roboh".

Aturan Klasifikasi Sentimen:
- Negative: Seluruh laporan warga yang memuat salah satu indikator kerusakan, kendala, bahaya, aduan lokal, sindiran, atau bahasa informal bernada keluhan di atas.
- Positive: Laporan yang berisi kepuasan, rasa syukur, apresiasi, keberhasilan program pembangunan, atau kondisi yang telah membaik.
- Neutral: Pertanyaan administratif netral atau usulan kebijakan konstruktif tanpa muatan keluhan atau pujian emosional.`;

/**
 * Intelligent heuristic fallback classifier for Indonesian text with full urban issue spectrum
 */
export function classifyHeuristic(text: string, categoryHint?: Category): { category: Category; sentiment: Sentiment } {
  const result: HeuristicAnalysisResult = analyzeAspirationIntelligent(text, categoryHint);
  return {
    category: result.category,
    sentiment: result.sentiment
  };
}

/**
 * Analyzes a single comment submitted by a citizen
 */
export async function analyzeSingleComment(text: string, categoryHint?: Category): Promise<{ category: Category; sentiment: Sentiment }> {
  // If API key is not present, use expanded intelligent heuristic immediately
  if (!process.env.GEMINI_API_KEY) {
    return classifyHeuristic(text, categoryHint);
  }

  try {
    const prompt = `Analisis aspirasi warga pembangunan kota di Kalimantan Tengah berikut ini:
Teks: "${text}"
${categoryHint ? `Petunjuk Kategori dari Pengguna: ${categoryHint}` : ''}

Tentukan:
1. "category": Harus salah satu dari 9 kategori ini: "Transportasi", "Drainase & Banjir", "Bencana Alam", "Sampah", "Air Bersih & Sanitasi", "Ruang Terbuka Hijau", "Tata Ruang & Pemukiman", "Fasilitas Publik", "Lainnya"
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
 * Strict deterministic policy highlight formatter following the mandatory pattern:
 * "[Kategori Isu Utama] & [Upaya Mitigasi/Dampak] Menjadi Prioritas [Tingkat Urgensi]"
 */
export function formatStandardPolicyHeadline(category: Category, urgency: 'Kritis' | 'Tinggi' | 'Moderat'): string {
  const urgencySuffix = urgency === 'Kritis' ? 'Mendesak' : urgency === 'Tinggi' ? 'Tinggi' : 'Strategis';
  switch (category) {
    case 'Bencana Alam':
      return `Mitigasi Bencana Karhutla & Kesiapsiagaan Banjir DAS Menjadi Prioritas ${urgencySuffix}`;
    case 'Drainase & Banjir':
      return `Normalisasi Drainase Perkotaan & Pengendalian Genangan Menjadi Prioritas ${urgencySuffix}`;
    case 'Transportasi':
      return `Rehabilitasi Koridor Jalan Arteri & Keselamatan Transportasi Menjadi Prioritas ${urgencySuffix}`;
    case 'Sampah':
      return `Optimalisasi Pengelolaan Sampah TPS & Armada Kebersihan Menjadi Prioritas ${urgencySuffix}`;
    case 'Air Bersih & Sanitasi':
      return `Peremajaan Jaringan Pipa PDAM & Kontinuitas Air Bersih Menjadi Prioritas ${urgencySuffix}`;
    case 'Tata Ruang & Pemukiman':
      return `Penataan Kawasan Permukiman & Penertiban Garis Sempadan Menjadi Prioritas ${urgencySuffix}`;
    case 'Ruang Terbuka Hijau':
      return `Revitalisasi Ruang Terbuka Hijau & Konservasi Paru-Paru Kota Menjadi Prioritas ${urgencySuffix}`;
    case 'Fasilitas Publik':
      return `Peningkatan Penerangan Jalan Umum & Kesiapan Layanan Publik Menjadi Prioritas ${urgencySuffix}`;
    default:
      return `Akselerasi Layanan Tata Kelola & Penguatan Infrastruktur Dasar Menjadi Prioritas ${urgencySuffix}`;
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
      generatedAt: 'Sinkronisasi Waktu Nyata',
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
    'Bencana Alam': { total: 0, negative: 0, positive: 0, neutral: 0, regions: {} },
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

  // Deterministic caching mechanism across environments (AI Studio Dev vs Publish Link)
  const deterministicCacheKey = `citypulse_policy_highlight_${timeframeDays}_${urgentCategory}_${urgentStats.total}_${urgentStats.negative}_${urgentNegativePct}`;
  
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const cached = window.localStorage.getItem(deterministicCacheKey);
      if (cached) {
        const parsedCache = JSON.parse(cached);
        if (parsedCache && parsedCache.headline && parsedCache.summaryTrend) {
          return parsedCache;
        }
      }
    }
  } catch (e) {
    // Silently continue if localStorage is inaccessible
  }

  // If Gemini API Key is not configured, return high-fidelity fallback synthesis
  if (!process.env.GEMINI_API_KEY) {
    const fallbackInsight = generateFallbackWeeklyInsight(
      timeframeDays,
      timeframeLabel,
      urgentCategory,
      urgentStats,
      urgentNegativePct,
      topRegions,
      quotes,
      periodComments.length
    );

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(deterministicCacheKey, JSON.stringify(fallbackInsight));
      }
    } catch (e) {}

    return fallbackInsight;
  }

  // Generate dynamic synthesis using Gemini 3.8 Flash with ZERO-TEMPERATURE DETERMINISM
  try {
    const prompt = `Anda adalah penasihat tata kota senior dan analis kebijakan perkotaan di Kalimantan Tengah.
Berdasarkan data aspirasi masyarakat Kalimantan Tengah ${timeframeLabel}:
- Total aspirasi dianalisis: ${periodComments.length}
- Kategori paling mendesak terdeteksi: "${urgentCategory}" (Total masukan: ${urgentStats.total}, Keluhan negatif: ${urgentStats.negative} atau ${urgentNegativePct}%)
- Hotspot wilayah terdampak utama: ${topRegions.join(', ') || 'Lintas Kabupaten'}
- Sampel keluhan warga:
${quotes.map((q, i) => `${i+1}. [${q.region}] "${q.text}"`).join('\n')}

- Distribusi kategori lainnya:
${Object.entries(categoryStats).map(([cat, s]) => `- ${cat}: ${s.total} (Negatif: ${s.negative}, Positif: ${s.positive})`).join('\n')}

Hasilkan analisis JSON terstruktur yang DETERMINISTIK, komprehensif, tajam, dan objektif untuk pimpinan daerah/perencana kota:
1. "headline": Format WAJIB mengikuti pola baku:
   "[Kategori Isu Utama] & [Upaya Mitigasi/Dampak] Menjadi Prioritas [Tingkat Urgensi]"
   Contoh Baku: "Mitigasi Bencana Karhutla & Kesiapsiagaan Banjir DAS Menjadi Prioritas Mendesak". DILARANG KERAS mengganti sinonim kata jika atribut data input tidak berubah.
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
        temperature: 0.0,
        topP: 1.0,
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

    // Standardize headline to ensure 100% deterministic consistency between AI Studio & Publish link
    const standardizedHeadline = formatStandardPolicyHeadline(urgentCategory, urgencyLevel);

    const generatedInsight: WeeklyAiInsight = {
      generatedAt: 'Sinkronisasi Waktu Nyata',
      timeframeDays,
      timeframeLabel,
      urgentCategory,
      urgencyLevel,
      headline: standardizedHeadline,
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

    // Store in deterministic cache
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(deterministicCacheKey, JSON.stringify(generatedInsight));
      }
    } catch (e) {}

    return generatedInsight;
  } catch (error) {
    console.warn("Fallback to heuristic weekly AI insight:", error);
    const fallback = generateFallbackWeeklyInsight(
      timeframeDays,
      timeframeLabel,
      urgentCategory,
      urgentStats,
      urgentNegativePct,
      topRegions,
      quotes,
      periodComments.length
    );

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(deterministicCacheKey, JSON.stringify(fallback));
      }
    } catch (e) {}

    return fallback;
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

  // Domain-specific tailored content per category with deterministic standardized headline
  const headline = formatStandardPolicyHeadline(urgentCategory, urgencyLevel);
  let keyDrivers: string[] = [];
  let recommendations: PolicyAction[] = [];
  let summaryTrend = '';

  if (urgentCategory === 'Drainase & Banjir') {
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
  } else if (urgentCategory === 'Bencana Alam') {
    summaryTrend = `Sepanjang ${timeframeLabel}, topik Bencana Alam & Penanggulangan Karhutla menyita perhatian besar warga dengan rasio keluhan mencapai ${urgentNegativePct}%. Warga di berbagai titik rawan menyoroti pentingnya kecepatan pemadaman titik api di lahan gambut, kabut asap yang mengganggu kesehatan, serta ancaman luapan air DAS saat curah hujan ekstrim.\n\nMasyarakat mengapresiasi kesiapsiagaan relawan Masyarakat Peduli Api (MPA) dan satgas BPBD, namun mendesak peningkatan sarana posko tanggap darurat dan sistem peringatan dini di tingkat kecamatan.`;
    keyDrivers = [
      'Titik panas (hotspot) di lahan gambut kering memicu kabut asap dan kekhawatiran ISPA',
      'Minimnya sarana pompa air apung dan selang panjang untuk penanganan kebakaran gambut pedalaman',
      'Kebutuhan sistem peringatan dini (Early Warning System) banjir luapan DAS di bantaran sungai'
    ];
    recommendations = [
      { targetAgency: 'BPBD Kalimantan Tengah & Tim Gabungan Karhutla', action: 'Intensifikasi patroli darat titik api, penyiapan helikopter water bombing, dan aktivasi posko siaga darurat', priority: 'Segera' },
      { targetAgency: 'Dinas Kesehatan & Disdik', action: 'Pembagian masker medis pelindung kabut asap dan penyiapan oksigen gratis di puskesmas sentra rawan asap', priority: 'Segera' },
      { targetAgency: 'Bappeda & Dinas Kehutanan / DLH', action: 'Revitalisasi sekat kanal (canal blocking) lahan gambut dan penguatan anggaran operasional Masyarakat Peduli Api (MPA)', priority: 'Jangka Menengah' }
    ];
  } else if (urgentCategory === 'Ruang Terbuka Hijau') {
    summaryTrend = `Sepanjang ${timeframeLabel}, sektor Ruang Terbuka Hijau (RTH) menjadi sorotan warga dengan ${urgentNegativePct}% keluhan terkait fasilitas taman yang rusak dan pemangkasan dahan pohon rawan tumbang saat cuaca buruk.\n\nDi samping keluhan fasilitas, masyarakat sangat mengapresiasi keberadaan paru-paru kota dan hutan kota sebagai oase rekreasi keluarga, namun menuntut adanya peningkatan fasilitas penunjang ramah disabilitas dan penerangan taman.`;
    keyDrivers = [
      'Pohon peneduh tua di jalur protokol rapuh dan belum dipangkas berkala jelang musim angin kencang',
      'Fasilitas bermain ramah anak dan bangku taman di beberapa titik rusak atau terbengkalai',
      'Tekanan alih fungsi lahan sempadan sungai hijau menjadi permukiman liar tanpa izin'
    ];
    recommendations = [
      { targetAgency: 'Dinas Lingkungan Hidup (DLH) & Pertamanan', action: 'Pemangkasan rutin dahan pohon peneduh rawan roboh dan peremajaan vegetasi kanopi jalan', priority: 'Segera' },
      { targetAgency: 'Dinas PUPR & Perkim', action: 'Perbaikan sarana arena bermain anak dan jalur pedestrian taman yang ramah lansia/disabilitas', priority: 'Segera' },
      { targetAgency: 'Bappeda & Dinas Kehutanan', action: 'Penetapan zonasi lindung sabuk hijau (green belt) dan reboisasi sempadan sungai terdegradasi', priority: 'Jangka Menengah' }
    ];
  } else if (urgentCategory === 'Tata Ruang & Pemukiman') {
    summaryTrend = `Isu Tata Ruang & Penataan Permukiman mencatatkan porsi keluhan ${urgentNegativePct}% pada ${timeframeLabel}. Masyarakat mengeluhkan penyempitan akses lorong permukiman padat yang menyulitkan armada tanggap darurat serta pedagang kaki lima (PKL) yang mengokupasi trotoar pejalan kaki.\n\nWarga mendesak pemerintah daerah menuntaskan pendataan program bedah Rumah Tidak Layak Huni (RTLH) secara transparan dan menyediakan sentra kuliner tertata bagi PKL.`;
    keyDrivers = [
      'Okupasi trotoar dan badan jalan oleh lapak PKL liar memicu kemacetan semrawut setiap sore',
      'Tingginya kepadatan bangunan permukiman bantaran sungai tanpa jalur evakuasi kebakaran',
      'Kelambatan verifikasi lapangan bantuan renovasi Rumah Tidak Layak Huni (RTLH)'
    ];
    recommendations = [
      { targetAgency: 'Satpol PP & Dinas Perdagangan', action: 'Penertiban humanis PKL bahu jalan dan relokasi ke sentra kuliner/pasar rakyat binaan', priority: 'Segera' },
      { targetAgency: 'Dinas Perkimtan Kalteng', action: 'Akselerasi verifikasi data penerima bantuan program bedah RTLH bagi warga berpenghasilan rendah', priority: 'Segera' },
      { targetAgency: 'Bappeda & Dinas Tata Ruang', action: 'Penyusunan Rencana Detail Tata Ruang (RDTR) kawasan permukiman dan penetapan garis sempadan bangunan (GSB)', priority: 'Jangka Menengah' }
    ];
  } else if (urgentCategory === 'Fasilitas Publik') {
    summaryTrend = `Pada ${timeframeLabel}, topik Fasilitas Publik mencatat ${urgentNegativePct}% keluhan warga. Lampu Penerangan Jalan Umum (PJU) yang padam berbulan-bulan di poros penghubung antar-kecamatan memicu kekhawatiran kecelakaan dan tindak kriminal malam hari.\n\nWarga juga menyuarakan perlunya penambahan ketersediaan dokter spesialis dan obat-obatan dasar di Puskesmas rawat inap pelosok.`;
    keyDrivers = [
      'Jaringan tiang lampu PJU korslet dan bohlam putus di titik rawan yang belum diganti',
      'Keterbatasan alat medis dasar dan antrean loket obat di Puskesmas pembantu pedalaman',
      'Gedung serbaguna dan fasilitas olahraga publik minim alokasi pemeliharaan berkala'
    ];
    recommendations = [
      { targetAgency: 'Dinas Perhubungan & UPT PJU', action: 'Operasi kilat perbaikan jaringan dan penggantian bohlam PJU LED hemat energi di jalur rawan', priority: 'Segera' },
      { targetAgency: 'Dinas Kesehatan Kalteng', action: 'Pemerataan logistik obat-obatan dan penambahan jam piket tenaga medis di Puskesmas rawat inap', priority: 'Segera' },
      { targetAgency: 'Dispora & Bagian Aset Daerah', action: 'Revitalisasi berkala sarana olahraga publik dan balai serbaguna pemuda tingkat kecamatan', priority: 'Jangka Menengah' }
    ];
  } else if (urgentCategory === 'Lainnya') {
    summaryTrend = `Topik Tata Kelola & Layanan Umum pada ${timeframeLabel} mencatatkan ${urgentNegativePct}% keluhan. Masyarakat di desa pelosok mengeluhkan minimnya stabilitas sinyal telekomunikasi dan jaringan internet yang menghambat koordinasi ekonomi dan pendidikan anak sekolah.\n\nDi sektor pelayanan perizinan dan kependudukan, warga menuntut eliminasi praktik calo/pungli serta digitalisasi layanan agar lebih transparan.`;
    keyDrivers = [
      'Titik blank spot sinyal seluler dan pemadaman menara BTS saat cuaca buruk di wilayah hulu',
      'Lambatnya proses validasi administrasi kependudukan dan perizinan usaha di tingkat kecamatan',
      'Kebutuhan pendampingan modal dan sertifikasi halal/PIRT bagi pelaku usaha mikro (UMKM)'
    ];
    recommendations = [
      { targetAgency: 'Diskominfo Kalteng & Operator Seluler', action: 'Pemasangan repeater sinyal dan percepatan operasional menara BTS internet desa pedalaman', priority: 'Segera' },
      { targetAgency: 'Disdukcapil & Dinas PMPTSP', action: 'Layanan jemput bola keliling perekaman KTP/KK dan pendampingan perizinan OSS tanpa biaya', priority: 'Segera' },
      { targetAgency: 'Dinas Koperasi & UMKM Kalteng', action: 'Fasilitasi akses permodalan KUR bunga rendah dan pelatihan pemasaran digital produk lokal', priority: 'Jangka Menengah' }
    ];
  } else {
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

  const catDist = summary.categoryDistribution || {};
  const activeCats = Object.keys(catDist)
    .filter(k => catDist[k] > 0)
    .sort((a, b) => catDist[b] - catDist[a]);
  
  const dominant = activeCats[0] || 'Lainnya';
  const dominantCount = catDist[dominant] || 0;
  const secondary = activeCats.slice(1, 3).map(k => `${k} (${catDist[k]})`).join(', ');

  const dynamicFallback = `Berdasarkan analisis ${summary.totalComments} aspirasi publik di Kalimantan Tengah, spektrum pembangunan paling dominan terpusat pada sektor ${dominant} (${dominantCount} aspirasi)${secondary ? `, didukung oleh ${secondary}` : ''}. Rekomendasi intervensi strategis difokuskan pada penanganan titik kritis yang paling banyak disuarakan oleh masyarakat di lapangan.`;

  if (!process.env.GEMINI_API_KEY) {
    return dynamicFallback;
  }

  const prompt = `Buatkan ringkasan naratif kebijakan pembangunan wilayah dalam bahasa Indonesia yang ringkas dan profesional untuk urban planner berdasarkan data aspirasi:
  Total Komentar: ${summary.totalComments}
  Kategori: ${JSON.stringify(summary.categoryDistribution)}
  Sentimen: ${JSON.stringify(summary.sentimentDistribution)}
  
  PENTING: Hanya sebutkan sektor yang BENAR-BENAR memiliki data aspirasi (> 0). Jangan sebutkan sektor yang 0 aspirasi. Sajikan dalam 2 kalimat singkat yang menyoroti sektor dominan riil dan rekomendasi intervensi perencanaan tata ruang.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        systemInstruction: "Anda adalah penasihat senior perencanaan wilayah dan tata kota (Urban Planner). Gunakan bahasa Indonesia baku, lugas, dan berbobot. Jangan pernah mengarang data atau menyebut kategori yang berjumlah 0.",
        temperature: 0.0,
        topP: 1.0,
      }
    });

    return response.text || dynamicFallback;
  } catch (error) {
    return dynamicFallback;
  }
}
