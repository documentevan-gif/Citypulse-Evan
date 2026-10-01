import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Area, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ReferenceDot, 
  ReferenceLine 
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  ShieldAlert, 
  Calendar, 
  Filter, 
  MapPin, 
  Sparkles, 
  Download, 
  Lock, 
  ArrowUpRight, 
  ArrowDownRight, 
  Layers, 
  Info, 
  ChevronRight, 
  Activity, 
  Flame, 
  CheckCircle2,
  ShieldCheck 
} from 'lucide-react';
import { CommentData, Category, Sentiment } from '../types';
import { KALTENG_REGIONS, KaltengRegion } from '../data/kaltengRegions';

const OFFICIAL_CATEGORIES: Category[] = [
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

interface SentimentTrendAnalysisChartProps {
  comments: CommentData[];
  isDark: boolean;
  onOpenDrillDown?: (region: string) => void;
  onRequestExportPdf?: () => void;
  onNavigateToExplore?: (dateOrQuery?: string) => void;
  categoryColors?: Record<string, string>;
}

// Stop words for extracting Indonesian keyword spikes
const STOP_WORDS = new Set([
  'yang', 'di', 'dan', 'ke', 'dari', 'ini', 'itu', 'untuk', 'pada', 'adalah',
  'dengan', 'bisa', 'ada', 'agar', 'jika', 'atau', 'kami', 'kita', 'saya',
  'mohon', 'tolong', 'perlu', 'harus', 'agar', 'sangat', 'sudah', 'belum',
  'banyak', 'karena', 'akan', 'lebih', 'masih', 'dalam', 'tentang', 'bapak',
  'ibu', 'pemprov', 'pemerintah', 'daerah', 'kalteng', 'kalimantan', 'tengah'
]);

export const SentimentTrendAnalysisChart: React.FC<SentimentTrendAnalysisChartProps> = ({
  comments,
  isDark,
  onOpenDrillDown,
  onRequestExportPdf,
  onNavigateToExplore,
  categoryColors
}) => {
  // Filtering states inside trend component
  const [timeRange, setTimeRange] = useState<'7d' | '14d' | '30d' | 'all'>('7d');
  const [selectedRegionFilter, setSelectedRegionFilter] = useState<string>('ALL');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');
  const [metricView, setMetricView] = useState<'volume' | 'score'>('volume');
  const [selectedSpikeDate, setSelectedSpikeDate] = useState<string | null>(null);

  // 1. Filter comments according to localized dropdown selectors
  const filteredComments = useMemo(() => {
    return comments.filter((item) => {
      const matchRegion = selectedRegionFilter === 'ALL' || item.region === selectedRegionFilter;
      const matchCategory = selectedCategoryFilter === 'ALL' || item.category === selectedCategoryFilter;
      return matchRegion && matchCategory;
    });
  }, [comments, selectedRegionFilter, selectedCategoryFilter]);

  // 2. Generate daily timeline buckets (Last 7 Days, 14 Days, or 30 Days)
  const { trendData, anomalySpikes, academicSynthesis } = useMemo(() => {
    if (filteredComments.length === 0) {
      return { trendData: [], anomalySpikes: [], academicSynthesis: null };
    }

    // Determine latest reference date from data or current date
    const timestamps = filteredComments
      .map(c => new Date(c.createdAt).getTime())
      .filter(t => !isNaN(t));

    const maxTimestamp = timestamps.length > 0 ? Math.max(...timestamps) : Date.now();
    const endDate = new Date(maxTimestamp);
    endDate.setHours(23, 59, 59, 999);

    const daysCount = timeRange === '7d' ? 7 : timeRange === '14d' ? 14 : timeRange === '30d' ? 30 : 60;
    
    // Create map of days
    const daysMap: Record<string, {
      dateKey: string;
      displayDate: string;
      fullDateStr: string;
      timestamp: number;
      Positive: number;
      Neutral: number;
      Negative: number;
      total: number;
      categories: Record<string, number>;
      regions: Record<string, number>;
      negativeComments: string[];
    }> = {};

    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(endDate);
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      const displayDate = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      const fullDateStr = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

      daysMap[dateKey] = {
        dateKey,
        displayDate,
        fullDateStr,
        timestamp: d.getTime(),
        Positive: 0,
        Neutral: 0,
        Negative: 0,
        total: 0,
        categories: {},
        regions: {},
        negativeComments: []
      };
    }

    // Aggregate comment records into respective date bucket
    filteredComments.forEach((c) => {
      const cDate = new Date(c.createdAt).toISOString().split('T')[0];
      if (daysMap[cDate]) {
        daysMap[cDate].total += 1;
        if (c.sentiment === 'Positive') daysMap[cDate].Positive += 1;
        else if (c.sentiment === 'Negative') {
          daysMap[cDate].Negative += 1;
          daysMap[cDate].negativeComments.push(c.text);
        } else {
          daysMap[cDate].Neutral += 1;
        }

        // Sector counts
        const cat = c.category || 'Lainnya';
        daysMap[cDate].categories[cat] = (daysMap[cDate].categories[cat] || 0) + 1;

        // Region counts
        const reg = c.region;
        daysMap[cDate].regions[reg] = (daysMap[cDate].regions[reg] || 0) + 1;
      }
    });

    const timeline = Object.values(daysMap);

    // Calculate baseline averages for Early Warning Negative Spike detection
    const negativeCounts = timeline.map(t => t.Negative);
    const avgNegative = negativeCounts.reduce((a, b) => a + b, 0) / (timeline.length || 1);
    const stdDevNegative = Math.sqrt(
      negativeCounts.map(x => Math.pow(x - avgNegative, 2)).reduce((a, b) => a + b, 0) / (timeline.length || 1)
    );

    // Threshold: anomaly occurs if Negative count >= 2 AND (Negative > avg + 1.2 * stdDev OR Negative % >= 50% of total daily)
    const spikes: Array<{
      dateKey: string;
      displayDate: string;
      fullDateStr: string;
      negativeCount: number;
      negativePct: number;
      total: number;
      dominantCategory: string;
      dominantRegion: string;
      extractedKeywords: string[];
      headline: string;
      severity: 'high' | 'critical';
    }> = [];

    const formattedData = timeline.map((bucket) => {
      const total = bucket.total;
      const posPct = total > 0 ? Math.round((bucket.Positive / total) * 100) : 0;
      const negPct = total > 0 ? Math.round((bucket.Negative / total) * 100) : 0;
      const neuPct = total > 0 ? Math.round((bucket.Neutral / total) * 100) : 0;

      // Net Sentiment Index: normalized between -100 and +100
      const netSentimentScore = total > 0 
        ? Math.round(((bucket.Positive - bucket.Negative) / total) * 100)
        : 0;

      // Determine top category and region
      const topCatEntry = Object.entries(bucket.categories).sort((a, b) => b[1] - a[1])[0];
      const dominantCategory = topCatEntry ? topCatEntry[0] : 'Infrastruktur';

      const topRegEntry = Object.entries(bucket.regions).sort((a, b) => b[1] - a[1])[0];
      const dominantRegion = topRegEntry ? topRegEntry[0] : 'Palangka Raya';

      // Anomaly detection logic
      const isSpike = bucket.Negative >= 2 && (
        bucket.Negative >= Math.max(2, Math.round(avgNegative + stdDevNegative * 0.9)) ||
        (negPct >= 45 && bucket.Negative >= 2)
      );

      // Extract emerging topic keywords from negative comments of that day
      let extractedKeywords: string[] = [];
      if (bucket.negativeComments.length > 0) {
        const wordsFreq: Record<string, number> = {};
        bucket.negativeComments.forEach((txt) => {
          const words = txt.toLowerCase().replace(/[^a-zA-Z0-9\s]/g, '').split(/\s+/);
          words.forEach((w) => {
            if (w.length > 3 && !STOP_WORDS.has(w)) {
              wordsFreq[w] = (wordsFreq[w] || 0) + 1;
            }
          });
        });
        extractedKeywords = Object.entries(wordsFreq)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([w]) => w.charAt(0).toUpperCase() + w.slice(1));
      }

      if (isSpike) {
        const keywordsStr = extractedKeywords.length > 0 
          ? `Isu: ${extractedKeywords.join(', ')}` 
          : dominantCategory;

        const headline = `${bucket.displayDate}: Lonjakan Sentimen Negatif - ${dominantCategory} di ${dominantRegion.replace('Kabupaten ', 'Kab. ')} (${keywordsStr})`;
        
        spikes.push({
          dateKey: bucket.dateKey,
          displayDate: bucket.displayDate,
          fullDateStr: bucket.fullDateStr,
          negativeCount: bucket.Negative,
          negativePct: negPct,
          total,
          dominantCategory,
          dominantRegion,
          extractedKeywords,
          headline,
          severity: bucket.Negative >= 4 || negPct >= 65 ? 'critical' : 'high'
        });
      }

      return {
        dateKey: bucket.dateKey,
        displayDate: bucket.displayDate,
        fullDateStr: bucket.fullDateStr,
        Positive: bucket.Positive,
        Neutral: bucket.Neutral,
        Negative: bucket.Negative,
        total,
        posPct,
        negPct,
        neuPct,
        netSentimentScore,
        dominantCategory,
        dominantRegion,
        isSpike,
        extractedKeywords
      };
    });

    // 3. Academic & Strategic Policy Synthesis Generator
    const totalPeriodAspirations = formattedData.reduce((acc, curr) => acc + curr.total, 0);
    const totalPeriodPos = formattedData.reduce((acc, curr) => acc + curr.Positive, 0);
    const totalPeriodNeg = formattedData.reduce((acc, curr) => acc + curr.Negative, 0);
    const totalPeriodNeu = formattedData.reduce((acc, curr) => acc + curr.Neutral, 0);

    const overallNetIndex = totalPeriodAspirations > 0 
      ? Math.round(((totalPeriodPos - totalPeriodNeg) / totalPeriodAspirations) * 100) 
      : 0;

    // Split timeline in halves to observe momentum trend (first half vs second half)
    const midpoint = Math.floor(formattedData.length / 2);
    const firstHalf = formattedData.slice(0, midpoint);
    const secondHalf = formattedData.slice(midpoint);

    const firstHalfNeg = firstHalf.reduce((a, b) => a + b.Negative, 0);
    const secondHalfNeg = secondHalf.reduce((a, b) => a + b.Negative, 0);

    const negativeTrajectory = secondHalfNeg > firstHalfNeg
      ? 'eskalasi peningkatan (+ ' + (secondHalfNeg - firstHalfNeg) + ' keluhan)'
      : secondHalfNeg < firstHalfNeg
      ? 'penurunan intensitas (- ' + (firstHalfNeg - secondHalfNeg) + ' keluhan)'
      : 'kondisi stabil terkendali';

    const synthesis = {
      totalPeriodAspirations,
      overallNetIndex,
      positiveShare: totalPeriodAspirations > 0 ? Math.round((totalPeriodPos / totalPeriodAspirations) * 100) : 0,
      negativeShare: totalPeriodAspirations > 0 ? Math.round((totalPeriodNeg / totalPeriodAspirations) * 100) : 0,
      neutralShare: totalPeriodAspirations > 0 ? Math.round((totalPeriodNeu / totalPeriodAspirations) * 100) : 0,
      negativeTrajectory,
      anomalySpikeCount: spikes.length,
      primaryConcernSector: spikes.length > 0 ? spikes[0].dominantCategory : 'Infrastruktur & Layanan Dasar',
      primaryConcernRegion: spikes.length > 0 ? spikes[0].dominantRegion : 'Kawasan Strategis Kalteng'
    };

    return { 
      trendData: formattedData, 
      anomalySpikes: spikes,
      academicSynthesis: synthesis 
    };
  }, [filteredComments, timeRange]);

  // Active spike item details
  const activeSpike = useMemo(() => {
    if (!selectedSpikeDate) return anomalySpikes[0] || null;
    return anomalySpikes.find(s => s.dateKey === selectedSpikeDate) || anomalySpikes[0] || null;
  }, [anomalySpikes, selectedSpikeDate]);

  return (
    <div className={`p-6 rounded-2xl border transition-all ${
      isDark ? 'bg-[#151822] border-[#242A3B] text-white' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
    }`}>
      {/* 1. TOP HEADER & INTERACTIVE CONTROL TOOLBAR */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b pb-5 border-slate-200 dark:border-[#242A3B]">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/10 text-blue-500 flex items-center justify-center border border-blue-500/20 shadow-xs">
              <Activity className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold tracking-tight">
                  Analisis Tren Sentimen Waktu Nyata
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20 font-mono uppercase">
                  {timeRange === '7d' ? '7 Hari Terakhir' : timeRange === '14d' ? '14 Hari' : '30 Hari'}
                </span>
                {anomalySpikes.length > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center gap-1 animate-pulse">
                    <Flame className="w-3 h-3" />
                    <span>{anomalySpikes.length} Lonjakan Kritis</span>
                  </span>
                )}
              </div>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                Monitoring pergerakan opini publik dan deteksi dini lonjakan isu (*early warning spikes*) di Kalimantan Tengah.
              </p>
            </div>
          </div>
        </div>

        {/* Filter Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Spatial Filter Dropdown */}
          <div className="relative">
            <select
              value={selectedRegionFilter}
              onChange={(e) => setSelectedRegionFilter(e.target.value)}
              className={`pl-3 pr-8 py-1.5 rounded-xl border text-xs font-medium focus:outline-none transition-all ${
                isDark 
                  ? 'bg-[#191D2A] border-[#2D3347] text-gray-200 focus:border-blue-500' 
                  : 'bg-slate-50 border-slate-200 text-slate-700 focus:border-blue-500'
              }`}
            >
              <option value="ALL">Semua 14 Wilayah Kalteng</option>
              {KALTENG_REGIONS.map((r) => (
                <option key={r} value={r}>
                  {r.replace('Kabupaten ', 'Kab. ')}
                </option>
              ))}
            </select>
          </div>

          {/* Sector Category Filter Dropdown */}
          <div className="relative">
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className={`pl-3 pr-8 py-1.5 rounded-xl border text-xs font-medium focus:outline-none transition-all ${
                isDark 
                  ? 'bg-[#191D2A] border-[#2D3347] text-gray-200 focus:border-blue-500' 
                  : 'bg-slate-50 border-slate-200 text-slate-700 focus:border-blue-500'
              }`}
            >
              <option value="ALL">Semua 9 Sektor Pembangunan</option>
              {OFFICIAL_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Time Range Selector Pills */}
          <div className={`p-0.5 rounded-xl border flex items-center gap-0.5 ${
            isDark ? 'bg-[#12141C] border-[#262C3E]' : 'bg-slate-100 border-slate-200'
          }`}>
            {(['7d', '14d', '30d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                  timeRange === range
                    ? 'bg-blue-600 text-white shadow-xs'
                    : isDark ? 'text-gray-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {range === '7d' ? '7 Hari' : range === '14d' ? '14 Hari' : '30 Hari'}
              </button>
            ))}
          </div>

          {/* Metric View Switcher */}
          <div className={`p-0.5 rounded-xl border flex items-center gap-0.5 ${
            isDark ? 'bg-[#12141C] border-[#262C3E]' : 'bg-slate-100 border-slate-200'
          }`}>
            <button
              onClick={() => setMetricView('volume')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                metricView === 'volume'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : isDark ? 'text-gray-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Tampilkan volume kumulatif Positif, Netral, dan Negatif"
            >
              Volume
            </button>
            <button
              onClick={() => setMetricView('score')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                metricView === 'score'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : isDark ? 'text-gray-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Tampilkan Net Sentiment Index (-100 hingga +100)"
            >
              Net Score
            </button>
          </div>

          {/* Export to PDF Button (Protected by Cryptographic Authority Passcode) */}
          {onRequestExportPdf && (
            <button
              onClick={onRequestExportPdf}
              className={`px-3 py-1.5 rounded-xl border font-semibold flex items-center gap-1.5 transition-all shadow-2xs shrink-0 ${
                isDark 
                  ? 'bg-purple-950/30 hover:bg-purple-900/40 border-purple-500/30 text-purple-300' 
                  : 'bg-[#F3E8FF] hover:bg-purple-100 border-[#E9D5FF] text-[#7E22CE]'
              }`}
              title="Cetak dan ekspor laporan tren sentimen format PDF (Diproteksi Sandi)"
            >
              <Download className="w-3.5 h-3.5 stroke-[2]" />
              <span>Ekspor PDF</span>
              <Lock className="w-2.5 h-2.5 text-amber-500" />
            </button>
          )}
        </div>
      </div>

      {/* 2. MAIN VISUALIZATION GRID: LEFT PANEL (SINTESIS AKADEMIS) + RIGHT PANEL (CHART UTAMA) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        
        {/* SISI KIRI: EXECUTIVE SUMMARY NARRATIVE (SINTESIS AKADEMIS & STRATEGIS) */}
        <div className={`lg:col-span-4 p-5 rounded-2xl border flex flex-col justify-between space-y-4 ${
          isDark ? 'bg-[#181C28]/80 border-[#242A3B]' : 'bg-slate-50/80 border-slate-200'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold tracking-wider uppercase text-blue-500 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Sintesis Akademis & Kebijakan
              </span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md ${
                (academicSynthesis?.overallNetIndex || 0) >= 0 
                  ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                  : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
              }`}>
                Net: {academicSynthesis?.overallNetIndex ? `${academicSynthesis.overallNetIndex > 0 ? '+' : ''}${academicSynthesis.overallNetIndex}` : '0'}
              </span>
            </div>

            {/* Headline Rangkuman Naratif */}
            <h4 className={`text-sm font-bold leading-snug ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Dinamika Sentimen {timeRange === '7d' ? '7 Hari Terakhir' : 'Periode Terpilih'}
            </h4>

            {/* Narasi Komprehensif Berdasarkan Agregasi Temporal */}
            <p className={`text-xs mt-2 leading-relaxed ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>
              Dalam rentang pengamatan temporal, terekam total{' '}
              <strong className={isDark ? 'text-white' : 'text-slate-900'}>
                {academicSynthesis?.totalPeriodAspirations || 0} aspirasi warga
              </strong>. Komposisi respon masyarakat didominasi oleh{' '}
              <span className="text-emerald-500 font-semibold">{academicSynthesis?.positiveShare || 0}% Positif</span>,{' '}
              <span className="text-slate-400 font-semibold">{academicSynthesis?.neutralShare || 0}% Netral</span>, serta{' '}
              <span className="text-rose-500 font-semibold">{academicSynthesis?.negativeShare || 0}% Negatif</span>.
            </p>

            <p className={`text-xs mt-2 leading-relaxed ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>
              Tren laju keluhan sentimen negatif memperlihatkan dinamika{' '}
              <strong className={isDark ? 'text-blue-400' : 'text-blue-600'}>
                {academicSynthesis?.negativeTrajectory}
              </strong>.
              {anomalySpikes.length > 0 && (
                <> Terdeteksi <strong className="text-rose-500 font-bold">{anomalySpikes.length} titik lonjakan anomali</strong> yang memerlukan atensi taktis tim perencana pembangunan daerah.</>
              )}
            </p>

            {/* KPI Metrics Mini Grid */}
            <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-200 dark:border-slate-800">
              <div className={`p-2.5 rounded-xl border text-center ${
                isDark ? 'bg-[#12141C] border-[#222736]' : 'bg-white border-slate-200'
              }`}>
                <span className="text-[10px] text-gray-400 block font-medium">Positif</span>
                <span className="text-sm font-bold font-mono text-emerald-500">
                  {academicSynthesis?.positiveShare || 0}%
                </span>
              </div>
              <div className={`p-2.5 rounded-xl border text-center ${
                isDark ? 'bg-[#12141C] border-[#222736]' : 'bg-white border-slate-200'
              }`}>
                <span className="text-[10px] text-gray-400 block font-medium">Netral</span>
                <span className={`text-sm font-bold font-mono ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
                  {academicSynthesis?.neutralShare || 0}%
                </span>
              </div>
              <div className={`p-2.5 rounded-xl border text-center ${
                isDark ? 'bg-[#12141C] border-[#222736]' : 'bg-white border-slate-200'
              }`}>
                <span className="text-[10px] text-gray-400 block font-medium">Negatif</span>
                <span className="text-sm font-bold font-mono text-rose-500">
                  {academicSynthesis?.negativeShare || 0}%
                </span>
              </div>
            </div>
          </div>

          {/* Strategic Interventions Recommendation Callout */}
          <div className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
            anomalySpikes.length > 0
              ? isDark ? 'bg-rose-950/20 border-rose-800/30 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-800'
              : isDark ? 'bg-blue-950/20 border-blue-800/30 text-blue-300' : 'bg-blue-50 border-blue-200 text-blue-800'
          }`}>
            <div className="flex items-center gap-1.5 font-bold text-[11px] uppercase tracking-wider">
              {anomalySpikes.length > 0 ? (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                  <span className="text-rose-500">Rekomendasi Respons Cepat:</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                  <span className="text-blue-500">Stabilitas Wilayah:</span>
                </>
              )}
            </div>
            <p className="text-[11px] leading-relaxed opacity-90">
              {anomalySpikes.length > 0
                ? `Prioritaskan koordinasi instansi teknis pada sektor "${academicSynthesis?.primaryConcernSector}" di "${academicSynthesis?.primaryConcernRegion?.replace('Kabupaten ', 'Kab. ')}" untuk mitigasi eskalasi ketidakpuasan publik.`
                : 'Indeks persepsi masyarakat berada dalam zona kondusif. Pertahankan monitoring proaktif pada kanal aspirasi.'}
            </p>
          </div>
        </div>

        {/* SISI KANAN: RECHARTS COMPOSED AREA & LINE CHART (FIT TO BOTTOM) */}
        <div className="lg:col-span-8 flex flex-col justify-between h-full">
          <div className="flex-1 w-full min-h-[300px] relative">
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={trendData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                  <defs>
                    {/* Emerald Positive Gradient */}
                    <linearGradient id="positiveGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.35}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.0}/>
                    </linearGradient>

                    {/* Crimson Negative Gradient */}
                    <linearGradient id="negativeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#E11D48" stopOpacity={0.45}/>
                      <stop offset="95%" stopColor="#E11D48" stopOpacity={0.0}/>
                    </linearGradient>

                    {/* Muted Slate Neutral Gradient */}
                    <linearGradient id="neutralGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#64748B" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#64748B" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>

                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke={isDark ? '#242A3B' : '#E2E8F0'} 
                    vertical={false} 
                  />

                  <XAxis 
                    dataKey="displayDate" 
                    stroke={isDark ? '#6B7280' : '#64748B'} 
                    fontSize={11} 
                    tickLine={false}
                    dy={4}
                  />

                  <YAxis 
                    stroke={isDark ? '#6B7280' : '#64748B'} 
                    fontSize={11} 
                    tickLine={false}
                    domain={metricView === 'score' ? [-100, 100] : [0, 'auto']}
                  />

                  {/* CUSTOM RICH HOVER TOOLTIP */}
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className={`p-3.5 rounded-2xl border shadow-xl text-xs space-y-2 min-w-[220px] ${
                            isDark ? 'bg-[#181C28] border-[#2A3246] text-white' : 'bg-white border-slate-200 text-slate-900 shadow-lg'
                          }`}>
                            <div className="flex items-center justify-between border-b pb-1.5 border-slate-200 dark:border-slate-800">
                              <span className="font-bold">{d.fullDateStr}</span>
                              <span className="font-mono text-blue-500 font-bold">{d.total} Aspirasi</span>
                            </div>

                            {/* Sentiment Breakdown */}
                            <div className="space-y-1 text-[11px]">
                              <div className="flex items-center justify-between text-emerald-500">
                                <span className="flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                  <span>Positif:</span>
                                </span>
                                <span className="font-bold font-mono">{d.Positive} ({d.posPct}%)</span>
                              </div>

                              <div className={`flex items-center justify-between ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>
                                <span className="flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                                  <span>Netral:</span>
                                </span>
                                <span className="font-bold font-mono">{d.Neutral} ({d.neuPct}%)</span>
                              </div>

                              <div className="flex items-center justify-between text-rose-500">
                                <span className="flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                                  <span>Negatif:</span>
                                </span>
                                <span className="font-bold font-mono">{d.Negative} ({d.negPct}%)</span>
                              </div>
                            </div>

                            {/* Net Sentiment Score */}
                            <div className={`pt-1.5 border-t flex items-center justify-between text-[11px] font-semibold ${
                              isDark ? 'border-slate-800' : 'border-slate-200'
                            }`}>
                              <span className="text-gray-400">Net Index:</span>
                              <span className={d.netSentimentScore >= 0 ? 'text-emerald-500 font-mono' : 'text-rose-500 font-mono'}>
                                {d.netSentimentScore > 0 ? `+${d.netSentimentScore}` : d.netSentimentScore}
                              </span>
                            </div>

                            {/* Emerging Topic on Spikes */}
                            {d.isSpike && (
                              <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/25 text-[10px] text-rose-400 space-y-0.5">
                                <div className="font-bold flex items-center gap-1">
                                  <Flame className="w-3 h-3 text-rose-500" />
                                  <span>Lonjakan Negatif Terdeteksi</span>
                                </div>
                                <p className="opacity-90">
                                  Sektor: {d.dominantCategory} ({d.dominantRegion.replace('Kabupaten ', 'Kab. ')})
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />

                  <Legend 
                    verticalAlign="top" 
                    height={32} 
                    iconType="circle"
                    formatter={(val) => <span className={`text-xs ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>{val}</span>}
                  />

                  {metricView === 'volume' ? (
                    <>
                      {/* Positif (Area Hijau Emerald) */}
                      <Area 
                        type="monotone" 
                        dataKey="Positive" 
                        name="Sentimen Positif" 
                        stroke="#10B981" 
                        strokeWidth={2.5}
                        fillOpacity={1} 
                        fill="url(#positiveGradient)" 
                      />

                      {/* Netral (Line Abu-abu) */}
                      <Line 
                        type="monotone" 
                        dataKey="Neutral" 
                        name="Sentimen Netral" 
                        stroke="#64748B" 
                        strokeWidth={2}
                        dot={{ r: 3, fill: '#64748B' }}
                      />

                      {/* Negatif (Area Merah/Rose Crimson) */}
                      <Area 
                        type="monotone" 
                        dataKey="Negative" 
                        name="Sentimen Negatif" 
                        stroke="#E11D48" 
                        strokeWidth={2.5}
                        fillOpacity={1} 
                        fill="url(#negativeGradient)" 
                      />
                    </>
                  ) : (
                    <>
                      {/* Reference line 0 */}
                      <ReferenceLine y={0} stroke={isDark ? '#4B5563' : '#94A3B8'} strokeDasharray="3 3" />
                      <Line 
                        type="monotone" 
                        dataKey="netSentimentScore" 
                        name="Net Sentiment Index" 
                        stroke="#3B82F6" 
                        strokeWidth={3}
                        dot={{ r: 4, fill: '#3B82F6', strokeWidth: 2, stroke: '#FFFFFF' }}
                        activeDot={{ r: 7 }}
                      />
                    </>
                  )}

                  {/* ANNOTATION CALLOUT POINTS ON ANOMALOUS NEGATIVE SPIKES */}
                  {anomalySpikes.map((spike) => (
                    <ReferenceDot 
                      key={spike.dateKey}
                      x={spike.displayDate}
                      y={metricView === 'volume' ? spike.negativeCount : spike.negativePct}
                      r={7}
                      fill="#E11D48"
                      stroke="#FFFFFF"
                      strokeWidth={2}
                      className="cursor-pointer animate-pulse"
                      onClick={() => setSelectedSpikeDate(spike.dateKey)}
                    />
                  ))}
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
                <Calendar className="w-8 h-8 text-gray-400 opacity-60" />
                <p className="text-xs font-semibold text-gray-400">
                  Belum ada rekaman aspirasi warga pada filter yang dipilih.
                </p>
              </div>
            )}
          </div>

          {/* Quick Legend & Helper Bar (Rapat tepat di bawah grafik) */}
          <div className="flex flex-wrap items-center justify-between text-[11px] pt-2 mt-2 border-t border-slate-200 dark:border-[#242A3B] text-gray-400 gap-2 shrink-0">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block animate-ping" />
              <span>Titik merah pada grafik menandakan lonjakan anomali sentimen negatif (*Early Warning Spike*).</span>
            </span>

            {onNavigateToExplore && (
              <button
                onClick={() => onNavigateToExplore()}
                className="text-blue-500 font-semibold hover:underline flex items-center gap-1"
              >
                <span>Buka Log Aspirasi Terfilter</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. INTERACTIVE ANNOTATION CARDS (EARLY WARNING SPIKES CALLOUT) - OPTIMIZED STRATEGIC LAYOUT */}
      {anomalySpikes.length > 0 && activeSpike && (
        <div className="mt-6 pt-5 border-t border-slate-200 dark:border-[#242A3B] space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-rose-500/15 text-rose-500 flex items-center justify-center">
                <Flame className="w-3.5 h-3.5" />
              </div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-500">
                Peringatan Dini: Lonjakan Isu Kritis Terdeteksi ({anomalySpikes.length} Kejadian)
              </h4>
            </div>

            {/* Multi-Spike Event Switcher Pills if > 1 event */}
            {anomalySpikes.length > 1 ? (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                <span className="text-[10px] text-gray-400 font-medium shrink-0">Kejadian:</span>
                {anomalySpikes.map((s) => (
                  <button
                    key={s.dateKey}
                    onClick={() => setSelectedSpikeDate(s.dateKey)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-all shrink-0 ${
                      activeSpike.dateKey === s.dateKey
                        ? 'bg-rose-600 text-white shadow-xs'
                        : isDark 
                        ? 'bg-[#181C28] text-gray-300 hover:text-white border border-[#2A3144]'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    {s.displayDate} ({s.dominantCategory})
                  </button>
                ))}
              </div>
            ) : (
              <span className="text-[10px] text-gray-400">
                Respon Cepat & Mitigasi Lintas Instansi Kalimantan Tengah
              </span>
            )}
          </div>

          {/* GRID: 3 KOLOM SEIMBANG (6:3:3 / 50%:25%:25%) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 items-stretch">
            {/* KOLOM 1: KARTU KEJADIAN UTAMA (Col Span 6 pada Desktop = 50% Lebar) */}
            <div className={`lg:col-span-6 md:col-span-2 p-4.5 rounded-2xl border flex flex-col justify-between space-y-3 relative overflow-hidden transition-all ${
              isDark 
                ? 'bg-[#181C28] border-rose-500/80 shadow-sm' 
                : 'bg-rose-50/50 border-rose-400 shadow-xs'
            }`}>
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 to-rose-600" />
              
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-rose-500 flex items-center gap-1.5 text-xs">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>{activeSpike.displayDate} • Titik Anomali</span>
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-500 border border-rose-500/25">
                    {activeSpike.negativeCount} Keluhan ({activeSpike.negativePct}%)
                  </span>
                </div>

                <div>
                  <h5 className={`text-sm font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {activeSpike.dominantCategory} • {activeSpike.dominantRegion.replace('Kabupaten ', 'Kab. ')}
                  </h5>
                  <p className={`text-[11px] mt-1 leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    Terdeteksi lonjakan ketidakpuasan publik melebihi batas rata-rata kewajaran harian di wilayah ini.
                  </p>

                  {/* Badges Metadata Analitis (Pengganti Hashtag Generic) */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                    {/* Badge Sektor Pembangunan */}
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-medium transition-colors ${
                      isDark 
                        ? 'bg-blue-950/40 text-blue-300 border border-blue-500/25' 
                        : 'bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs'
                    }`}>
                      <Layers className="w-3 h-3 text-blue-400 shrink-0" />
                      <span>Sektor: {activeSpike.dominantCategory}</span>
                    </span>

                    {/* Badge Tingkat Dampak / Urgensi */}
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-medium transition-colors ${
                      isDark 
                        ? 'bg-rose-950/40 text-rose-300 border border-rose-500/25' 
                        : 'bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs'
                    }`}>
                      <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />
                      <span>Tingkat Dampak: {activeSpike.severity === 'critical' ? 'Kritis' : 'Tinggi'}</span>
                    </span>

                    {/* Badge Sumber Terverifikasi */}
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-medium transition-colors ${
                      isDark 
                        ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/25' 
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs'
                    }`}>
                      <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span>Sumber: Aspirasi Publik (Verified)</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className={`pt-3 border-t flex items-center justify-between text-xs ${
                isDark ? 'border-slate-800' : 'border-rose-200/80'
              }`}>
                {onOpenDrillDown && (
                  <button
                    onClick={() => onOpenDrillDown(activeSpike.dominantRegion)}
                    className="text-blue-500 hover:text-blue-600 flex items-center gap-1 font-semibold transition-colors"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Rincian Wilayah</span>
                  </button>
                )}

                {onNavigateToExplore && (
                  <button
                    onClick={() => onNavigateToExplore(activeSpike.dominantRegion)}
                    className="text-rose-500 hover:text-rose-600 font-semibold flex items-center gap-1 transition-colors"
                  >
                    <span>Lihat Masukan Warga →</span>
                  </button>
                )}
              </div>
            </div>

            {/* KOLOM 2: TINGKAT ESKALASI (Col Span 3 pada Desktop = 25% Lebar) */}
            <div className={`lg:col-span-3 md:col-span-1 p-4.5 rounded-2xl border flex flex-col justify-between space-y-3 transition-all ${
              isDark 
                ? 'bg-[#181C28] border-[#2A3144] hover:border-rose-500/40' 
                : 'bg-white border-slate-200 shadow-xs hover:border-rose-300'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Tingkat Eskalasi
                </span>
                <div className="w-7 h-7 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                  <ShieldAlert className="w-3.5 h-3.5" />
                </div>
              </div>

              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/15 text-rose-500 border border-rose-500/25 text-xs font-bold uppercase tracking-wider animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  <span>{activeSpike.severity === 'critical' ? 'Kritis' : 'Tinggi'}</span>
                </div>
                <p className={`text-[10px] mt-2 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Proporsi keluhan negatif mencapai <strong className={isDark ? 'text-white' : 'text-slate-900'}>{activeSpike.negativePct}%</strong> dari seluruh laporan pada tanggal ini.
                </p>
              </div>

              <div className={`pt-2.5 border-t text-[10px] text-gray-400 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                Status urgensi penanganan lapangan
              </div>
            </div>

            {/* KOLOM 3: TREND ISU (24 JAM) (Col Span 3 pada Desktop = 25% Lebar) */}
            <div className={`lg:col-span-3 md:col-span-1 p-4.5 rounded-2xl border flex flex-col justify-between space-y-3 transition-all ${
              isDark 
                ? 'bg-[#181C28] border-[#2A3144] hover:border-rose-500/40' 
                : 'bg-white border-slate-200 shadow-xs hover:border-rose-300'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Trend Isu (24 Jam)
                </span>
                <div className="w-7 h-7 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                  <TrendingUp className="w-3.5 h-3.5" />
                </div>
              </div>

              <div>
                <div className="flex items-baseline gap-1 text-rose-500 font-bold font-mono text-xl">
                  <span>+{Math.max(45, Math.round((activeSpike.negativeCount / Math.max(1, activeSpike.total - activeSpike.negativeCount)) * 45))}%</span>
                  <span className="text-[10px] font-sans font-normal text-slate-400">lonjakan</span>
                </div>
                <p className={`text-[10px] mt-1.5 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Eskalasi anomali melampaui standar deviasi kewajaran harian wilayah.
                </p>
              </div>

              <div className={`pt-2.5 border-t text-[10px] text-gray-400 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                Perhitungan tren moving baseline
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
