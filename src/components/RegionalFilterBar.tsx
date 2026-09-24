import React, { useState, useMemo } from 'react';
import { 
  Filter, ChevronDown, ChevronUp, Check, CheckSquare, 
  Square, RotateCcw, Search, MapPin, Layers, Building2, 
  Sparkles, X, ChevronRight
} from 'lucide-react';
import { KALTENG_REGIONS, KaltengRegion, KORIDOR_MAP } from '../data/kaltengRegions';
import { Category, Sentiment } from '../types';
import { ALL_CATEGORIES } from '../App';

interface RegionalFilterBarProps {
  selectedRegions: KaltengRegion[];
  onChangeRegions: (regions: KaltengRegion[]) => void;
  selectedCategories: Category[];
  onChangeCategories: (categories: Category[]) => void;
  selectedSentiments: Sentiment[];
  onChangeSentiments: (sentiments: Sentiment[]) => void;
  regionCommentCounts: Record<string, number>;
  categoryCommentCounts: Record<Category, number>;
  sentimentCommentCounts: Record<Sentiment, number>;
  categoryColors: Record<Category, string>;
  isDark: boolean;
}

export const RegionalFilterBar: React.FC<RegionalFilterBarProps> = ({
  selectedRegions,
  onChangeRegions,
  selectedCategories,
  onChangeCategories,
  selectedSentiments,
  onChangeSentiments,
  regionCommentCounts,
  categoryCommentCounts,
  sentimentCommentCounts,
  categoryColors,
  isDark
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeCorridorMenuOpen, setActiveCorridorMenuOpen] = useState<boolean>(false);

  // Filtered regions by search input
  const filteredRegionList = useMemo(() => {
    if (!searchTerm.trim()) return KALTENG_REGIONS;
    const term = searchTerm.toLowerCase();
    return KALTENG_REGIONS.filter(r => r.toLowerCase().includes(term));
  }, [searchTerm]);

  const allRegionsSelected = selectedRegions.length === KALTENG_REGIONS.length;
  const allCategoriesSelected = selectedCategories.length === ALL_CATEGORIES.length;

  const handleSelectAllRegions = () => {
    onChangeRegions([...KALTENG_REGIONS]);
  };

  const handleSelectCapitalOnly = () => {
    onChangeRegions(['Kota Palangka Raya']);
  };

  const handleToggleRegion = (reg: KaltengRegion) => {
    if (selectedRegions.includes(reg)) {
      if (selectedRegions.length === 1) return; // Keep at least one
      onChangeRegions(selectedRegions.filter(r => r !== reg));
    } else {
      onChangeRegions([...selectedRegions, reg]);
    }
  };

  const handleSelectCorridor = (corridorName: string) => {
    const corridorRegions = KORIDOR_MAP[corridorName];
    if (corridorRegions) {
      onChangeRegions([...corridorRegions]);
    }
    setActiveCorridorMenuOpen(false);
  };

  const handleToggleCorridor = (corridorName: string) => {
    const corridorRegions = KORIDOR_MAP[corridorName] || [];
    const allInCorridorSelected = corridorRegions.every(r => selectedRegions.includes(r));
    
    if (allInCorridorSelected) {
      // Unselect this corridor's regions (unless it would leave none selected)
      const remaining = selectedRegions.filter(r => !corridorRegions.includes(r));
      if (remaining.length > 0) {
        onChangeRegions(remaining);
      }
    } else {
      // Add missing corridor regions
      const merged = Array.from(new Set([...selectedRegions, ...corridorRegions]));
      onChangeRegions(merged);
    }
  };

  const handleToggleCategory = (cat: Category) => {
    if (selectedCategories.includes(cat)) {
      if (selectedCategories.length === 1) return;
      onChangeCategories(selectedCategories.filter(c => c !== cat));
    } else {
      onChangeCategories([...selectedCategories, cat]);
    }
  };

  const handleToggleSentiment = (sentiment: Sentiment) => {
    if (selectedSentiments.includes(sentiment)) {
      if (selectedSentiments.length === 1) return;
      onChangeSentiments(selectedSentiments.filter(s => s !== sentiment));
    } else {
      onChangeSentiments([...selectedSentiments, sentiment]);
    }
  };

  const handleResetFilters = () => {
    onChangeRegions([...KALTENG_REGIONS]);
    onChangeCategories([...ALL_CATEGORIES]);
    onChangeSentiments(['Positive', 'Negative', 'Neutral']);
    setSearchTerm('');
  };

  return (
    <div className={`rounded-2xl border transition-all ${
      isDark 
        ? 'bg-[#141722] border-[#242A3B] shadow-lg' 
        : 'bg-white border-slate-200 shadow-sm'
    }`}>
      {/* 1. COMPACT EXECUTIVE BAR (Selalu Rapi di Ponsel, Tablet, dan Desktop) */}
      <div className="p-3.5 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Summary pill badges */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <span className={`p-1.5 rounded-lg ${
              isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-600'
            }`}>
              <Filter className="w-4 h-4" />
            </span>
            <span className={`text-xs font-bold uppercase tracking-wider ${
              isDark ? 'text-white' : 'text-slate-800'
            }`}>
              Filter Wilayah & Isu
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
              isDark 
                ? 'bg-blue-500/15 text-blue-300 border-blue-500/30' 
                : 'bg-blue-50 text-blue-700 border-blue-200'
            }`}>
              {selectedRegions.length === 14 ? 'Seluruh Kalteng (14/14)' : `${selectedRegions.length} Wilayah`}
            </span>

            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
              isDark 
                ? 'bg-purple-500/15 text-purple-300 border-purple-500/30' 
                : 'bg-purple-50 text-purple-700 border-purple-200'
            }`}>
              {selectedCategories.length} Kategori
            </span>

            {selectedSentiments.length < 3 && (
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                isDark 
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' 
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                {selectedSentiments.length} Sentimen
              </span>
            )}
          </div>
        </div>

        {/* Center & Right: Quick Presets & Collapse Toggle */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Presets */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleSelectAllRegions}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all border ${
                allRegionsSelected
                  ? isDark ? 'bg-blue-600 text-white border-blue-600' : 'bg-blue-600 text-white border-blue-600'
                  : isDark ? 'bg-[#1B202E] text-gray-300 border-[#262D42] hover:text-white' : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
              }`}
            >
              Semua (14)
            </button>

            <button
              onClick={handleSelectCapitalOnly}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all border ${
                selectedRegions.length === 1 && selectedRegions[0] === 'Kota Palangka Raya'
                  ? isDark ? 'bg-blue-600 text-white border-blue-600' : 'bg-blue-600 text-white border-blue-600'
                  : isDark ? 'bg-[#1B202E] text-gray-300 border-[#262D42] hover:text-white' : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
              }`}
            >
              Ibukota
            </button>

            {/* Corridor Dropdown Menu */}
            <div className="relative">
              <button
                onClick={() => setActiveCorridorMenuOpen(prev => !prev)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all border flex items-center gap-1 ${
                  isDark 
                    ? 'bg-[#1B202E] text-gray-300 border-[#262D42] hover:text-white' 
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                }`}
              >
                <span>Pilih Koridor</span>
                <ChevronDown className="w-3 h-3" />
              </button>

              {activeCorridorMenuOpen && (
                <div className={`absolute right-0 mt-1 w-64 rounded-xl border shadow-xl z-30 p-1.5 space-y-1 ${
                  isDark ? 'bg-[#181C28] border-[#293246]' : 'bg-white border-slate-200'
                }`}>
                  <div className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 ${
                    isDark ? 'text-gray-400' : 'text-slate-400'
                  }`}>
                    Pilih Berdasarkan Koridor
                  </div>
                  {Object.keys(KORIDOR_MAP).map(koridor => {
                    const isAllSelected = KORIDOR_MAP[koridor].every(r => selectedRegions.includes(r)) &&
                                          selectedRegions.length === KORIDOR_MAP[koridor].length;
                    return (
                      <button
                        key={koridor}
                        onClick={() => handleSelectCorridor(koridor)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition-colors ${
                          isAllSelected
                            ? 'bg-blue-600 text-white'
                            : isDark ? 'hover:bg-[#202534] text-gray-200' : 'hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <span>{koridor}</span>
                        <span className="text-[10px] opacity-75">
                          ({KORIDOR_MAP[koridor].length})
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Reset button if filtered */}
          {(!allRegionsSelected || !allCategoriesSelected || selectedSentiments.length < 3) && (
            <button
              onClick={handleResetFilters}
              className={`p-1.5 rounded-lg text-[11px] font-semibold border flex items-center gap-1 ${
                isDark 
                  ? 'bg-rose-500/15 text-rose-300 border-rose-500/30 hover:bg-rose-500/25' 
                  : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
              }`}
              title="Reset seluruh filter ke kondisi awal"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}

          {/* Expand / Collapse Button */}
          <button
            onClick={() => setIsExpanded(prev => !prev)}
            className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 ${
              isExpanded 
                ? isDark ? 'bg-blue-600 text-white border-blue-600' : 'bg-blue-600 text-white border-blue-600'
                : isDark ? 'bg-[#1F2536] text-blue-300 border-blue-500/30 hover:bg-[#252D40]' : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
            }`}
          >
            <span>{isExpanded ? 'Tutup Panel' : 'Atur Detail Wilayah'}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* 2. COLLAPSIBLE HIERARCHICAL PANEL (Ketika Dibuka) */}
      {isExpanded && (
        <div className={`p-4 sm:p-5 border-t space-y-5 animate-fade-in ${
          isDark ? 'border-[#242A3B] bg-[#11141E]' : 'border-slate-200 bg-slate-50/70'
        }`}>
          {/* Quick Search inside filter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-dashed border-[#242A3B]">
            <div className="relative flex-1 max-w-sm">
              <Search className={`w-3.5 h-3.5 absolute left-3 top-2.5 ${isDark ? 'text-gray-400' : 'text-slate-400'}`} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari nama kabupaten/kota..."
                className={`w-full pl-9 pr-8 py-1.5 rounded-xl text-xs border transition-all focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                  isDark 
                    ? 'bg-[#171B26] border-[#293246] text-white placeholder-gray-500' 
                    : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                }`}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-2 text-gray-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-3 text-xs">
              <button 
                onClick={handleSelectAllRegions}
                className="text-blue-500 hover:text-blue-400 font-semibold"
              >
                Pilih Semua Wilayah (14)
              </button>
              <span className={isDark ? 'text-gray-600' : 'text-slate-300'}>|</span>
              <button 
                onClick={() => onChangeRegions(['Kota Palangka Raya'])}
                className={isDark ? 'text-gray-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}
              >
                Hanya Palangka Raya
              </button>
            </div>
          </div>

          {/* HIERARCHICAL GRID: 4 KORIDOR STRATEGIS KALIMANTAN TENGAH */}
          <div className="space-y-2">
            <span className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
              isDark ? 'text-gray-400' : 'text-slate-500'
            }`}>
              <Building2 className="w-3.5 h-3.5 text-blue-400" />
              <span>Struktur Koridor Wilayah (13 Kabupaten & 1 Kota)</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {Object.entries(KORIDOR_MAP).map(([koridorName, regions]) => {
                const allSelected = regions.every(r => selectedRegions.includes(r));
                const someSelected = regions.some(r => selectedRegions.includes(r)) && !allSelected;
                const activeCount = regions.filter(r => selectedRegions.includes(r)).length;

                return (
                  <div 
                    key={koridorName}
                    className={`p-3.5 rounded-xl border transition-all ${
                      isDark 
                        ? 'bg-[#161A26] border-[#252C3E]' 
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    {/* Corridor Header with bulk toggle */}
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-dashed border-[#242A3B]">
                      <div>
                        <h4 className={`text-xs font-bold leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {koridorName}
                        </h4>
                        <span className={`text-[10px] ${isDark ? 'text-gray-400' : 'text-slate-400'}`}>
                          {activeCount} / {regions.length} terpilih
                        </span>
                      </div>

                      <button
                        onClick={() => handleToggleCorridor(koridorName)}
                        className={`text-[10px] px-2 py-0.5 rounded font-semibold transition-all ${
                          allSelected
                            ? isDark ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-700'
                            : isDark ? 'bg-[#22283A] text-gray-400 hover:text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {allSelected ? 'Batal' : 'Pilih'}
                      </button>
                    </div>

                    {/* Regional Checkboxes */}
                    <div className="space-y-1.5">
                      {regions.map(reg => {
                        const isSelected = selectedRegions.includes(reg);
                        const count = regionCommentCounts[reg] || 0;
                        const shortName = reg.replace('Kabupaten ', 'Kab. ').replace('Kota ', '');

                        return (
                          <button
                            key={reg}
                            onClick={() => handleToggleRegion(reg)}
                            className={`w-full px-2 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition-all text-left ${
                              isSelected
                                ? isDark 
                                  ? 'bg-blue-600/20 text-blue-200 border border-blue-500/40' 
                                  : 'bg-blue-50 text-blue-800 border border-blue-200'
                                : isDark 
                                  ? 'text-gray-400 hover:bg-[#1C2130] hover:text-gray-200' 
                                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span className={`w-3.5 h-3.5 rounded flex items-center justify-center shrink-0 border ${
                                isSelected 
                                  ? 'bg-blue-600 border-blue-600 text-white' 
                                  : isDark ? 'border-gray-600' : 'border-slate-300'
                              }`}>
                                {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                              </span>
                              <span className="truncate">{shortName}</span>
                            </div>
                            <span className="text-[10px] font-mono opacity-70 shrink-0 ml-1">
                              {count}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* KATEGORI ISU PEMBANGUNAN (8 SEKTOR) */}
          <div className="pt-2 border-t border-[#242A3B] space-y-2">
            <div className="flex items-center justify-between">
              <span className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                isDark ? 'text-gray-400' : 'text-slate-500'
              }`}>
                <Layers className="w-3.5 h-3.5 text-blue-400" />
                <span>Kategori Isu Pembangunan Perkotaan ({selectedCategories.length}/8)</span>
              </span>

              <button
                onClick={() => onChangeCategories([...ALL_CATEGORIES])}
                className="text-[11px] text-blue-500 hover:text-blue-400 font-semibold"
              >
                Pilih Semua Kategori
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {ALL_CATEGORIES.map(cat => {
                const isSelected = selectedCategories.includes(cat);
                const count = categoryCommentCounts[cat] || 0;
                return (
                  <button
                    key={cat}
                    onClick={() => handleToggleCategory(cat)}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 border ${
                      isSelected
                        ? isDark 
                          ? 'bg-[#1E2436] text-white border-blue-500/50 shadow-sm' 
                          : 'bg-white text-slate-900 border-blue-300 shadow-sm'
                        : isDark 
                          ? 'bg-[#151824] text-gray-500 border-[#242A3B] opacity-60' 
                          : 'bg-slate-100 text-slate-400 border-slate-200 opacity-60'
                    }`}
                  >
                    <span 
                      className="w-2 h-2 rounded-full shrink-0" 
                      style={{ backgroundColor: categoryColors[cat] }} 
                    />
                    <span>{cat}</span>
                    <span className="text-[10px] font-mono opacity-75">
                      ({count})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SENTIMEN WARGA (POSITIF, NETRAL, NEGATIF) */}
          <div className="pt-2 border-t border-[#242A3B] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className={`text-[11px] font-bold uppercase tracking-wider ${
                isDark ? 'text-gray-400' : 'text-slate-500'
              }`}>
                Sentimen:
              </span>
              <div className="flex items-center gap-1.5">
                {(['Positive', 'Neutral', 'Negative'] as Sentiment[]).map(sent => {
                  const isSelected = selectedSentiments.includes(sent);
                  const count = sentimentCommentCounts[sent] || 0;
                  const label = sent === 'Positive' ? 'Positif' : sent === 'Negative' ? 'Negatif' : 'Netral';
                  const colorClass = sent === 'Positive' 
                    ? 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10'
                    : sent === 'Negative' 
                    ? 'text-rose-400 border-rose-500/40 bg-rose-500/10'
                    : 'text-gray-300 border-gray-500/40 bg-gray-500/10';

                  return (
                    <button
                      key={sent}
                      onClick={() => handleToggleSentiment(sent)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                        isSelected 
                          ? colorClass 
                          : isDark ? 'bg-[#161924] text-gray-500 border-[#242A3B]' : 'bg-slate-100 text-slate-400 border-slate-200'
                      }`}
                    >
                      <span>{label}</span>
                      <span className="text-[10px] font-mono">({count})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => setIsExpanded(false)}
              className="text-xs font-semibold text-blue-500 hover:text-blue-400 flex items-center gap-1"
            >
              <span>Selesai & Terapkan Filter</span>
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
