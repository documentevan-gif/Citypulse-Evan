import React, { useState, useEffect } from 'react';
import { 
  Sparkles, AlertTriangle, TrendingUp, RefreshCw, 
  MapPin, CheckCircle2, Copy, Check, ChevronRight, 
  Clock, ShieldAlert, ArrowUpRight, MessageSquare, 
  Layers, Building2, Flame
} from 'lucide-react';
import { CommentData, WeeklyAiInsight, Category } from '../types';
import { generateWeeklyAiInsight } from '../services/geminiService';

interface AiWeeklyInsightCardProps {
  comments: CommentData[];
  onFocusCategory?: (category: Category) => void;
  categoryColors: Record<Category, string>;
}

export const AiWeeklyInsightCard: React.FC<AiWeeklyInsightCardProps> = ({
  comments,
  onFocusCategory,
  categoryColors,
}) => {
  const [timeframeDays, setTimeframeDays] = useState<number>(7);
  const [insight, setInsight] = useState<WeeklyAiInsight | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  // Fetch or regenerate weekly insight
  const loadInsight = async (days: number) => {
    setIsLoading(true);
    try {
      const result = await generateWeeklyAiInsight(comments, days);
      setInsight(result);
    } catch (err) {
      console.error('Gagal menghasilkan insight mingguan:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInsight(timeframeDays);
  }, [timeframeDays, comments.length]);

  const handleCopySummary = () => {
    if (!insight) return;
    const textToCopy = `[Insight Otomatis AI CityPulse Kalteng]
Kategori Paling Mendesak: ${insight.urgentCategory} (Status: ${insight.urgencyLevel})
Periode: ${insight.timeframeLabel}
Headline: "${insight.headline}"

Ringkasan Tren:
${insight.summaryTrend}

Faktor Pemicu Utama:
${insight.keyDrivers.map(d => `• ${d}`).join('\n')}

Hotspot Wilayah: ${insight.affectedHotspots.join(', ')}

Rekomendasi Kebijakan:
${insight.policyRecommendations.map(r => `• [${r.targetAgency}] (${r.priority}): ${r.action}`).join('\n')}`;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="rounded-2xl bg-gradient-to-b from-[#171B26] to-[#13151E] border border-blue-500/30 shadow-xl overflow-hidden text-gray-200">
      {/* CARD HEADER */}
      <div className="p-5 sm:p-6 border-b border-[#242A3B] flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#1A1E2B]/80">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
              <span>Insight Otomatis AI • Gemini 3.8 Flash</span>
            </span>
            <span className="text-[11px] text-gray-400 flex items-center gap-1">
              <Clock className="w-3 h-3 text-gray-500" />
              <span>Diperbarui {insight?.generatedAt || 'Baru Saja'}</span>
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Sintesis Tren Mingguan & Isu Paling Mendesak</span>
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Ekstraksi kecerdasan buatan berbasis data aspirasi warga untuk memetakan sektor dengan risiko ketidakpuasan tertinggi dan rekomendasi aksi bagi perencana kota.
          </p>
        </div>

        {/* CONTROLS: TIMEFRAME SELECTOR & ACTIONS */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Timeframe selector pills */}
          <div className="flex items-center bg-[#11131A] p-1 rounded-xl border border-[#242A3B]">
            <button
              onClick={() => setTimeframeDays(7)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                timeframeDays === 7
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              7 Hari (Mingguan)
            </button>
            <button
              onClick={() => setTimeframeDays(14)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                timeframeDays === 14
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              14 Hari
            </button>
            <button
              onClick={() => setTimeframeDays(30)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                timeframeDays === 30
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              30 Hari
            </button>
          </div>

          {/* Action buttons */}
          <button
            onClick={() => loadInsight(timeframeDays)}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#202534] hover:bg-[#2A3144] border border-[#2D354A] text-xs font-semibold text-gray-200 transition-all disabled:opacity-50"
            title="Analisis ulang menggunakan Gemini"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Perbarui Analisis</span>
          </button>

          <button
            onClick={handleCopySummary}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#202534] hover:bg-[#2A3144] border border-[#2D354A] text-xs font-semibold text-gray-200 transition-all"
            title="Salin rangkuman analisis ke clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Tersalin!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-gray-400" />
                <span className="hidden sm:inline">Salin</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* CONTENT BODY */}
      <div className="p-5 sm:p-6 space-y-6">
        {isLoading ? (
          <div className="py-16 text-center space-y-3">
            <RefreshCw className="w-8 h-8 mx-auto text-blue-400 animate-spin" />
            <p className="text-sm font-semibold text-white">Gemini sedang menyintesis tren aspirasi warga...</p>
            <p className="text-xs text-gray-400 max-w-md mx-auto">
              Mengevaluasi sentimen keluhan, mengidentifikasi faktor pemicu utama, dan menyusun rekomendasi kebijakan intervensi.
            </p>
          </div>
        ) : insight ? (
          <>
            {/* TOP INTELLIGENCE METRIC STRIP */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Kategori Paling Mendesak */}
              <div className="p-4 rounded-xl bg-[#1A1E2B] border border-[#2B3245] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-[11px] text-gray-400 font-bold uppercase tracking-wider mb-1.5">
                    <span>Kategori Paling Mendesak</span>
                    <Flame className="w-4 h-4 text-rose-400" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span 
                      className="text-base font-bold text-white tracking-tight"
                      style={{ color: categoryColors[insight.urgentCategory] || '#3B82F6' }}
                    >
                      {insight.urgentCategory}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      insight.urgencyLevel === 'Kritis' 
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : insight.urgencyLevel === 'Tinggi'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    }`}>
                      Tingkat Urgensi: {insight.urgencyLevel}
                    </span>
                  </div>
                </div>

                {onFocusCategory && (
                  <button
                    onClick={() => onFocusCategory(insight.urgentCategory)}
                    className="mt-3 inline-flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 font-semibold"
                  >
                    <span>Filter Dashboard ke Isu Ini</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Card 2: Tingkat Keluhan Negatif */}
              <div className="p-4 rounded-xl bg-[#1A1E2B] border border-rose-500/20 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-[11px] text-rose-400 font-bold uppercase tracking-wider mb-1.5">
                    <span>Keluhan Negatif Pekan Ini</span>
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                  </div>
                  <div className="text-2xl font-bold text-rose-400 tracking-tight">
                    {insight.sentimentComparison.urgentCategoryNegativePct}%
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Dari {insight.sentimentComparison.urgentCategoryCount} aspirasi pada sektor ini
                  </p>
                </div>
                <div className="mt-2 text-[10px] text-rose-300/80 font-medium flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  <span>Tren {insight.sentimentComparison.trendDirection} dibanding pekan lalu</span>
                </div>
              </div>

              {/* Card 3: Hotspot Wilayah Terdampak */}
              <div className="p-4 rounded-xl bg-[#1A1E2B] border border-[#2B3245] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-[11px] text-gray-400 font-bold uppercase tracking-wider mb-1.5">
                    <span>Hotspot Wilayah Terdampak</span>
                    <MapPin className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="space-y-1 mt-1">
                    {insight.affectedHotspots.slice(0, 2).map((loc, idx) => (
                      <div key={idx} className="text-xs font-semibold text-white flex items-center gap-1.5 truncate">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                        <span className="truncate">{loc.replace('Kabupaten ', 'Kab. ')}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-2 text-[10px] text-gray-400">
                  Konsentrasi keluhan tertinggi di lapangan
                </div>
              </div>

              {/* Card 4: Volume Data Dievaluasi */}
              <div className="p-4 rounded-xl bg-[#1A1E2B] border border-[#2B3245] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-[11px] text-gray-400 font-bold uppercase tracking-wider mb-1.5">
                    <span>Aspirasi Teranalisis</span>
                    <Layers className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="text-2xl font-bold text-white tracking-tight">
                    {insight.sentimentComparison.totalPeriodAspirations}
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Masukan warga pada {insight.timeframeLabel.toLowerCase()}
                  </p>
                </div>
                <div className="mt-2 text-[10px] text-blue-400 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Validasi silang seluruh kabupaten/kota</span>
                </div>
              </div>
            </div>

            {/* HEADLINE BANNER */}
            <div className="p-4 sm:p-5 rounded-xl bg-gradient-to-r from-blue-900/20 via-[#1C2233] to-[#171B26] border-l-4 border-l-blue-500 border border-[#2D354A]">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400 shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-0.5">
                    Sorotan Utama Kebijakan
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-white leading-snug">
                    "{insight.headline}"
                  </h3>
                </div>
              </div>
            </div>

            {/* TWO-COLUMN DETAIL: NARRATIVE SYNTHESIS & KEY DRIVERS */}
            <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-6">
              {/* Left Column: Narrative Synthesis */}
              <div className="p-5 rounded-xl bg-[#161924] border border-[#242A3B] space-y-3.5">
                <div className="flex items-center gap-2 border-b border-[#242A3B] pb-2.5">
                  <Building2 className="w-4 h-4 text-blue-400" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Sintesis Naratif Tren Perencanaan Kota
                  </h4>
                </div>
                <div className="text-xs sm:text-sm text-gray-300 leading-relaxed space-y-2.5 whitespace-pre-line">
                  {insight.summaryTrend}
                </div>
              </div>

              {/* Right Column: Key Drivers (Faktor Pemicu Kunci) */}
              <div className="p-5 rounded-xl bg-[#161924] border border-[#242A3B] space-y-3.5">
                <div className="flex items-center gap-2 border-b border-[#242A3B] pb-2.5">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Faktor Pemicu Utama (Key Drivers)
                  </h4>
                </div>
                <div className="space-y-2.5">
                  {insight.keyDrivers.map((driver, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs text-gray-300">
                      <div className="w-5 h-5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 font-bold text-[10px] mt-0.5">
                        {i + 1}
                      </div>
                      <p className="leading-snug pt-0.5">{driver}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ACTIONABLE POLICY RECOMMENDATION MATRIX */}
            <div className="p-5 rounded-xl bg-[#161924] border border-[#242A3B] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#242A3B] pb-2.5">
                <div className="flex items-center gap-2">
                  <ArrowUpRight className="w-4 h-4 text-blue-400" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Matriks Tindak Lanjut & Rekomendasi Instansi
                  </h4>
                </div>
                <span className="text-[11px] text-gray-400">
                  Diarahkan untuk dinas teknis dan pengambil kebijakan daerah
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {insight.policyRecommendations.map((rec, idx) => (
                  <div 
                    key={idx}
                    className="p-3.5 rounded-xl bg-[#1B1F2E] border border-[#293044] hover:border-blue-500/40 transition-all flex flex-col justify-between space-y-2"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-[11px] font-bold text-blue-400">
                          {rec.targetAgency}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          rec.priority === 'Segera'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        }`}>
                          {rec.priority}
                        </span>
                      </div>
                      <p className="text-xs text-gray-300 leading-relaxed">
                        {rec.action}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CITIZEN VOICE SPOTLIGHT (KUTIPAN KELUHAN WARGA TERKAIT) */}
            {insight.sampleQuotes.length > 0 && (
              <div className="p-5 rounded-xl bg-[#161924] border border-[#242A3B] space-y-3">
                <div className="flex items-center gap-2 border-b border-[#242A3B] pb-2">
                  <MessageSquare className="w-4 h-4 text-gray-400" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Suara Warga di Lapangan ({insight.urgentCategory})
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {insight.sampleQuotes.map((quote, qIdx) => (
                    <div 
                      key={qIdx}
                      className="p-3 rounded-xl bg-[#1A1D2A] border border-[#252A3C] text-xs space-y-2 flex flex-col justify-between"
                    >
                      <p className="text-gray-300 italic leading-relaxed line-clamp-3">
                        "{quote.text}"
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-gray-400 pt-2 border-t border-[#252A3C]">
                        <span className="font-semibold text-white">{quote.author}</span>
                        <span className="text-blue-400">{quote.region.replace('Kabupaten ', 'Kab. ')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
};
