import React, { useState, useMemo } from 'react';
import { 
  X, Sparkles, BookOpen, Search, CheckCircle2, 
  AlertTriangle, ShieldCheck, Tag, Info, ArrowRight, 
  Layers, Compass, Sliders, ChevronRight
} from 'lucide-react';
import { Category, Sentiment } from '../types';
import { 
  CATEGORY_DEFINITIONS, 
  analyzeAspirationIntelligent, 
  HeuristicAnalysisResult 
} from '../services/classificationEngine';
import { useTheme } from '../context/ThemeContext';

interface HeuristicGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCategory?: Category | null;
}

export const HeuristicGuideModal: React.FC<HeuristicGuideModalProps> = ({
  isOpen,
  onClose,
  initialCategory
}) => {
  const { isDark } = useTheme();
  const [activeCategory, setActiveCategory] = useState<Category>(initialCategory || 'Transportasi');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Interactive Live Tester state
  const [testText, setTestText] = useState<string>(
    'Titik api karhutla di lahan gambut mulai memicu kabut asap tebal dan warga butuh bantuan posko BPBD'
  );

  const testAnalysis: HeuristicAnalysisResult = useMemo(() => {
    if (!testText.trim()) {
      return analyzeAspirationIntelligent('Uji coba teks aspirasi pembangunan');
    }
    return analyzeAspirationIntelligent(testText);
  }, [testText]);

  if (!isOpen) return null;

  const allCategories = Object.keys(CATEGORY_DEFINITIONS) as Category[];
  const activeDef = CATEGORY_DEFINITIONS[activeCategory];

  // Filter categories by search
  const filteredCategories = allCategories.filter(cat => {
    const def = CATEGORY_DEFINITIONS[cat];
    const matchName = def.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchScope = def.scope.toLowerCase().includes(searchQuery.toLowerCase());
    const matchKw = [...def.anchorPhrases, ...def.primaryKeywords].some(k => 
      k.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return matchName || matchScope || matchKw;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div 
        className={`relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-2xl shadow-2xl border transition-all overflow-hidden ${
          isDark ? 'bg-[#121520] border-[#2B3347] text-gray-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* MODAL HEADER */}
        <div className={`p-5 sm:p-6 border-b flex items-center justify-between shrink-0 ${
          isDark ? 'border-[#22293C] bg-[#161A28]' : 'border-slate-100 bg-slate-50'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold tracking-tight">
                  Kamus & Heuristik Klasifikasi Cerdas
                </h2>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  9 Sektor Pembangunan
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Spesifikasi taksonomi, bobot kata kunci, heuristik sentimen, dan aturan disorientasi semantik untuk Kalimantan Tengah.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-xl border transition-colors ${
              isDark ? 'border-[#2B3347] text-gray-400 hover:text-white bg-[#1C2235]' : 'border-slate-200 text-slate-500 hover:text-slate-900 bg-white'
            }`}
            aria-label="Tutup Kamus"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* SECTION 1: INTERACTIVE LIVE TESTER */}
          <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
            isDark ? 'bg-[#181D2E]/80 border-blue-500/20' : 'bg-blue-50/50 border-blue-200/60'
          }`}>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-400" />
                <span className="text-xs sm:text-sm font-bold tracking-tight">
                  Simulator Live Heuristik Engine & Deteksi Sentimen
                </span>
              </div>
              <span className="text-[11px] text-gray-400">Ketik kalimat untuk menguji afinitas mesin</span>
            </div>

            {/* Input tester */}
            <div className="relative">
              <input
                type="text"
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                placeholder="Ketik contoh aspirasi warga di sini (misal: 'Jalan poros rusak parah dan tergenang banjir')..."
                className={`w-full px-4 py-2.5 pr-10 rounded-xl text-xs sm:text-sm border outline-none transition-all ${
                  isDark 
                    ? 'bg-[#121520] border-[#2B3347] text-white focus:border-blue-500' 
                    : 'bg-white border-slate-300 text-slate-900 focus:border-blue-500'
                }`}
              />
            </div>

            {/* Live Result Pills */}
            <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Category Result */}
              <div className={`p-3 rounded-xl border flex items-center justify-between ${
                isDark ? 'bg-[#121520] border-[#252C3F]' : 'bg-white border-slate-200'
              }`}>
                <div>
                  <span className="text-[10px] text-gray-400 block font-semibold uppercase">Kategori Terdeteksi</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span 
                      className="w-2.5 h-2.5 rounded-full" 
                      style={{ backgroundColor: CATEGORY_DEFINITIONS[testAnalysis.category]?.color || '#3B82F6' }}
                    />
                    <span className="text-xs sm:text-sm font-bold text-white">
                      {testAnalysis.category}
                    </span>
                  </div>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-bold border border-blue-500/30">
                  {testAnalysis.confidence}% Akurasi
                </span>
              </div>

              {/* Sentiment Result */}
              <div className={`p-3 rounded-xl border flex items-center justify-between ${
                isDark ? 'bg-[#121520] border-[#252C3F]' : 'bg-white border-slate-200'
              }`}>
                <div>
                  <span className="text-[10px] text-gray-400 block font-semibold uppercase">Sentimen Heuristik</span>
                  <span className={`text-xs sm:text-sm font-bold mt-1 block ${
                    testAnalysis.sentiment === 'Positive' ? 'text-emerald-400' :
                    testAnalysis.sentiment === 'Negative' ? 'text-rose-400' : 'text-gray-300'
                  }`}>
                    {testAnalysis.sentiment === 'Positive' ? 'Positif (Apresiasi)' :
                     testAnalysis.sentiment === 'Negative' ? 'Negatif (Keluhan)' : 'Netral (Informatif)'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-gray-400">
                  <span className="text-emerald-400">+{testAnalysis.sentimentScores.positive}</span>
                  <span>/</span>
                  <span className="text-rose-400">-{testAnalysis.sentimentScores.negative}</span>
                </div>
              </div>

              {/* Matched Keywords */}
              <div className={`p-3 rounded-xl border flex flex-col justify-between ${
                isDark ? 'bg-[#121520] border-[#252C3F]' : 'bg-white border-slate-200'
              }`}>
                <span className="text-[10px] text-gray-400 block font-semibold uppercase">Kata Kunci Terpicu</span>
                <div className="flex flex-wrap gap-1 mt-1 overflow-hidden max-h-12">
                  {testAnalysis.matchedKeywords.length > 0 ? (
                    testAnalysis.matchedKeywords.slice(0, 3).map((kw, i) => (
                      <span key={i} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 truncate max-w-[130px]">
                        {kw}
                      </span>
                    ))
                  ) : (
                    <span className="text-[11px] text-gray-500 italic">Pencocokan semantik umum</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: 9 CATEGORIES EXPLORER */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left Column: Category Selector Pills & Search */}
            <div className="lg:col-span-4 space-y-2">
              <div className="relative mb-3">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari sektor / kata kunci..."
                  className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs border outline-none transition-all ${
                    isDark ? 'bg-[#181D2E] border-[#2B3347] text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              <div className="space-y-1.5 max-h-[460px] overflow-y-auto pr-1">
                {filteredCategories.map((cat) => {
                  const def = CATEGORY_DEFINITIONS[cat];
                  const isSelected = activeCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between ${
                        isSelected 
                          ? `${def.bgLight} border-l-4 shadow-sm` 
                          : isDark 
                            ? 'bg-[#161926] border-[#22293C] text-gray-300 hover:bg-[#1C2235]' 
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                      style={{ borderLeftColor: def.color }}
                    >
                      <div className="truncate pr-2">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: def.color }} />
                          <span className="text-xs font-bold truncate">{cat}</span>
                        </div>
                        <span className="text-[10px] text-gray-400 block truncate mt-0.5">
                          {def.shortDesc}
                        </span>
                      </div>
                      <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-transform ${isSelected ? 'rotate-90 text-white' : 'text-gray-500'}`} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Detailed Taxonomy Sheet of Selected Category */}
            <div className={`lg:col-span-8 p-5 sm:p-6 rounded-2xl border flex flex-col space-y-5 ${
              isDark ? 'bg-[#161926] border-[#242C3F]' : 'bg-white border-slate-200'
            }`}>
              {/* Category Header */}
              <div className="border-b pb-4 border-[#242C3F]">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-3.5 h-3.5 rounded-full shadow-sm" 
                      style={{ backgroundColor: activeDef.color }}
                    />
                    <h3 className="text-base sm:text-lg font-bold text-white">
                      {activeDef.title}
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider" style={{
                    backgroundColor: `${activeDef.color}20`,
                    color: activeDef.color,
                    border: `1px solid ${activeDef.color}40`
                  }}>
                    Kategori #{allCategories.indexOf(activeCategory) + 1}
                  </span>
                </div>
                <p className="text-xs text-gray-300 mt-2 leading-relaxed">
                  {activeDef.scope}
                </p>
              </div>

              {/* Anchor Phrases (High Weight: 5) */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Tag className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                    Frasa Jangkar Utama (Anchor Phrases • Bobot Heuristik: 5x)
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {activeDef.anchorPhrases.map((phrase, idx) => (
                    <span 
                      key={idx}
                      className={`text-[11px] font-mono px-2 py-1 rounded-lg border ${
                        isDark ? 'bg-[#1C2235] border-[#2C364D] text-gray-200' : 'bg-slate-100 border-slate-300 text-slate-800'
                      }`}
                    >
                      {phrase}
                    </span>
                  ))}
                </div>
              </div>

              {/* Primary & Contextual Keywords (Bobot: 3x & 1.5x) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-2">
                    Kata Kunci Domain (Bobot: 3x)
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {activeDef.primaryKeywords.map((kw, idx) => (
                      <span 
                        key={idx}
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                          isDark ? 'bg-[#1F2538] border-[#2D364E] text-blue-300' : 'bg-blue-50 border-blue-200 text-blue-700'
                        }`}
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-2">
                    Konteks Terkait (Bobot: 1.5x)
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {activeDef.secondaryKeywords.map((kw, idx) => (
                      <span 
                        key={idx}
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                          isDark ? 'bg-[#1A1E2B] border-[#252B3D] text-gray-400' : 'bg-slate-100 border-slate-200 text-slate-600'
                        }`}
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Target Agencies */}
              <div className={`p-3.5 rounded-xl border mt-auto ${
                isDark ? 'bg-[#181D2E] border-[#252C3F]' : 'bg-slate-50 border-slate-200'
              }`}>
                <span className="text-[10px] text-gray-400 block font-semibold uppercase mb-1.5">
                  Organisasi Perangkat Daerah (OPD) Sasaran Kebijakan di Kalteng:
                </span>
                <div className="flex flex-wrap gap-2">
                  {activeDef.targetAgencies.map((agency, i) => (
                    <span 
                      key={i} 
                      className="text-[11px] font-semibold text-gray-200 flex items-center gap-1.5"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                      <span>{agency}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className={`p-4 sm:p-5 border-t flex items-center justify-between shrink-0 ${
          isDark ? 'border-[#22293C] bg-[#161A28]' : 'border-slate-100 bg-slate-50'
        }`}>
          <div className="text-xs text-gray-400 flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-400" />
            <span>Terintegrasi langsung dengan Gemini 3.8 Flash & Fallback Heuristik Lokal</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors shadow-md"
          >
            Tutup Panduan
          </button>
        </div>
      </div>
    </div>
  );
};
