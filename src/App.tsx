/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import Papa from 'papaparse';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { 
  Activity, AlertCircle, CheckCircle2,
  Download, Filter, Layers, Search, MapPin, 
  Sparkles, RefreshCw, MessageSquarePlus, 
  ExternalLink, Calendar, User, ThumbsUp, 
  MinusCircle, AlertTriangle, ArrowRight, Share2, Upload,
  Map, ShieldCheck, Compass, Sun, Moon, Menu, X,
  Trash2, BarChart3, Database, Lock
} from 'lucide-react';
import { CommentData, AnalysisSummary, Category, Sentiment } from './types';
import { 
  KALTENG_REGIONS, 
  KORIDOR_MAP, 
  KaltengRegion, 
  standardizeRegion, 
  BASE_SNA_METRICS 
} from './data/kaltengRegions';
import { 
  loadStoredComments, 
  saveComments, 
  resetStoredComments,
  clearAllStoredComments,
  loadDemoSampleData
} from './services/storageService';
import { generateFinalNarrative } from './services/geminiService';
import { RegionDrillDownModal } from './components/RegionDrillDownModal';
import { AspirationFormModal } from './components/AspirationFormModal';
import { SpatialSentimentMap } from './components/SpatialSentimentMap';
import { DeveloperProfileModal } from './components/DeveloperProfileModal';
import { AiWeeklyInsightCard } from './components/AiWeeklyInsightCard';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { RegionalFilterBar } from './components/RegionalFilterBar';
import { SecurityCodeModal, ProtectedActionType, AUTH_PASSCODE } from './components/SecurityCodeModal';

// Standardized color palette for consistent sentiment and categories
const SENTIMENT_COLORS = {
  Positive: '#10B981', // Hijau
  Neutral: '#9CA3AF',  // Abu-abu netral
  Negative: '#EF4444'  // Merah
};

export const ALL_CATEGORIES: Category[] = [
  'Transportasi',
  'Drainase & Banjir',
  'Sampah',
  'Air Bersih & Sanitasi',
  'Ruang Terbuka Hijau',
  'Tata Ruang & Pemukiman',
  'Fasilitas Publik',
  'Lainnya'
];

const CATEGORY_COLORS: Record<Category, string> = {
  'Transportasi': '#3B82F6',           // Biru
  'Drainase & Banjir': '#06B6D4',      // Cyan
  'Sampah': '#F59E0B',                 // Amber
  'Air Bersih & Sanitasi': '#0284C7',  // Sky Blue
  'Ruang Terbuka Hijau': '#10B981',    // Emerald
  'Tata Ruang & Pemukiman': '#EC4899', // Pink
  'Fasilitas Publik': '#8B5CF6',       // Purple
  'Lainnya': '#64748B'                 // Slate
};

function AppDashboard() {
  const { theme, isDark, toggleTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Navigation tabs for urban planners & citizens
  const [activeTab, setActiveTab] = useState<'dashboard' | 'spatial' | 'explore'>('dashboard');

  // Developer Profile Modal State (Derma Evan)
  const [isDeveloperModalOpen, setIsDeveloperModalOpen] = useState(false);

  // Master Dataset (loaded from persistent storage)
  const [data, setData] = useState<CommentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [droppedRowsCount, setDroppedRowsCount] = useState<number>(0);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Regional Filter State (Restricted to 13 Kab & 1 Kota Kalimantan Tengah)
  const [selectedRegions, setSelectedRegions] = useState<KaltengRegion[]>([...KALTENG_REGIONS]);
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([...ALL_CATEGORIES]);
  const [selectedSentiments, setSelectedSentiments] = useState<Sentiment[]>(['Positive', 'Negative', 'Neutral']);
  const [searchQuery, setSearchQuery] = useState('');

  // Feature 1: Drill-Down Modal State
  const [drillDownRegion, setDrillDownRegion] = useState<string | null>(null);
  const [isDrillDownOpen, setIsDrillDownOpen] = useState(false);

  // Feature 2: Aspiration Form Modal State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formDefaultRegion, setFormDefaultRegion] = useState<string | null>(null);

  // Security Verification Modal for Protected Features (Code: EvanGantenk6f045)
  // Protected features: Impor CSV, Ekspor Data, Kosongkan Data
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [securityAction, setSecurityAction] = useState<ProtectedActionType | null>(null);
  const [pendingCsvFile, setPendingCsvFile] = useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const isImportAuthorizedRef = React.useRef<boolean>(false);

  // Load persistent dataset on initial mount
  useEffect(() => {
    try {
      const stored = loadStoredComments();
      setData(stored);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Filtered dataset derived reactively
  const filteredData = useMemo(() => {
    return data.filter(item => {
      const regionMatch = selectedRegions.includes(item.region as KaltengRegion);
      const catMatch = selectedCategories.includes(item.category);
      const sentMatch = selectedSentiments.includes(item.sentiment);
      const searchMatch = !searchQuery || 
        item.text.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.region.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.author.toLowerCase().includes(searchQuery.toLowerCase());
      return regionMatch && catMatch && sentMatch && searchMatch;
    });
  }, [data, selectedRegions, selectedCategories, selectedSentiments, searchQuery]);

  // Comment counts per region for visualizations and leaderboard
  const regionCommentCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    KALTENG_REGIONS.forEach(r => { counts[r] = 0; });
    filteredData.forEach(d => {
      if (counts[d.region] !== undefined) {
        counts[d.region]++;
      }
    });
    return counts;
  }, [filteredData]);

  // Executive Summary & KPIs
  const summary = useMemo<AnalysisSummary>(() => {
    const categories: Record<Category, number> = {
      'Transportasi': 0,
      'Drainase & Banjir': 0,
      'Sampah': 0,
      'Air Bersih & Sanitasi': 0,
      'Ruang Terbuka Hijau': 0,
      'Tata Ruang & Pemukiman': 0,
      'Fasilitas Publik': 0,
      'Lainnya': 0
    };
    const sentiments: Record<Sentiment, number> = {
      Positive: 0, Negative: 0, Neutral: 0
    };
    const regions: Record<string, { total: number; sentiments: Record<Sentiment, number> }> = {};

    filteredData.forEach(d => {
      if (d.category && categories[d.category] !== undefined) {
        categories[d.category]++;
      } else {
        categories['Lainnya']++;
      }
      if (d.sentiment) sentiments[d.sentiment]++;
      
      if (!regions[d.region]) {
        regions[d.region] = { total: 0, sentiments: { Positive: 0, Negative: 0, Neutral: 0 } };
      }
      regions[d.region].total++;
      if (d.sentiment) regions[d.region].sentiments[d.sentiment]++;
    });

    const total = filteredData.length;
    const narrativeSummary = total > 0
      ? `Berdasarkan rangkuman ${total} aspirasi masyarakat pada ${selectedRegions.length} wilayah terpilih di Kalimantan Tengah, spektrum isu Transportasi (${categories.Transportasi}), Mitigasi Drainase & Banjir (${categories['Drainase & Banjir']}), serta Pengelolaan Sampah (${categories.Sampah}) menjadi konsentrasi aspirasi utama. Program Ruang Terbuka Hijau dan fasilitas publik di kawasan perkotaan mencatatkan apresiasi tertinggi dari warga.`
      : `Platform CityPulse Kalteng siap digunakan untuk uji coba langsung kepada masyarakat di Kalimantan Tengah. Saat ini belum ada data aspirasi tersimpan (0 data). Sintesis kebijakan dan rekomendasi intervensi tata ruang wilayah akan dihitung otomatis segera setelah masyarakat mulai menyuarakan masukan melalui formulir digital atau impor data survei lapangan.`;

    return {
      totalComments: total,
      categoryDistribution: categories,
      sentimentDistribution: sentiments,
      regionDistribution: regions,
      narrativeSummary
    };
  }, [filteredData, selectedRegions.length]);

  // Regional selection handlers
  const handleToggleRegion = (region: KaltengRegion) => {
    setSelectedRegions(prev => {
      if (prev.includes(region)) {
        if (prev.length === 1) return prev; // Keep at least one
        return prev.filter(r => r !== region);
      } else {
        return [...prev, region];
      }
    });
  };

  const handleSelectAllRegions = () => {
    setSelectedRegions([...KALTENG_REGIONS]);
  };

  const handleSelectKoridor = (koridorName: string) => {
    const regions = KORIDOR_MAP[koridorName];
    if (regions) {
      setSelectedRegions([...regions]);
    }
  };

  // Open Drill-Down Modal for a specific region
  const handleOpenDrillDown = (regionName: string) => {
    setDrillDownRegion(regionName);
    setIsDrillDownOpen(true);
  };

  // Open Aspiration Submission Modal
  const handleOpenAspirationForm = (region?: string | null) => {
    setFormDefaultRegion(region || selectedRegions[0] || 'Kota Palangka Raya');
    setIsFormModalOpen(true);
  };

  // Handler when new aspiration is submitted
  const handleAspirationSubmitted = (newComment: CommentData) => {
    setData(prev => [newComment, ...prev]);
    setSuccessToast(`Aspirasi untuk ${newComment.region} berhasil dicatat dan dianalisis secara real-time.`);
    setTimeout(() => setSuccessToast(null), 5000);
  };

  // Trigger protected actions (Requires Passcode: EvanGantenk6f045)
  const handleRequestImport = () => {
    setPendingCsvFile(null);
    setSecurityAction('import_csv');
    setIsSecurityModalOpen(true);
  };

  const handleRequestExport = () => {
    if (filteredData.length === 0) {
      setSuccessToast('Tidak ada data aspirasi untuk diekspor.');
      setTimeout(() => setSuccessToast(null), 4000);
      return;
    }
    setSecurityAction('export_data');
    setIsSecurityModalOpen(true);
  };

  const handleRequestClearAll = () => {
    setSecurityAction('clear_data');
    setIsSecurityModalOpen(true);
  };

  // Optional: Load sample demo dataset for previewing visualizations
  const handleLoadDemoData = () => {
    const demo = loadDemoSampleData();
    setData(demo);
    setSelectedRegions([...KALTENG_REGIONS]);
    setSuccessToast('Dataset contoh simulasi berhasil dimuat.');
    setTimeout(() => setSuccessToast(null), 4000);
  };

  // Backward-compatible aliases
  const handleResetData = handleRequestClearAll;
  const handleClearAllData = handleRequestClearAll;
  const handleExportData = handleRequestExport;

  // Process CSV File with schema validation & Central Kalimantan region standardization
  const processCsvFile = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsed = results.data as any[];
        if (parsed.length === 0) {
          setSuccessToast('Berkas CSV kosong.');
          setTimeout(() => setSuccessToast(null), 4000);
          return;
        }

        const first = parsed[0];
        const colKomentar = Object.keys(first).find(k => /komentar|comment|teks|aspirasi/i.test(k));
        const colWilayah = Object.keys(first).find(k => /wilayah|region|kabupaten|kota/i.test(k));

        if (!colKomentar || !colWilayah) {
          setSuccessToast('Format berkas wajib memiliki kolom "komentar" dan "wilayah"!');
          setTimeout(() => setSuccessToast(null), 5000);
          return;
        }

        let dropped = 0;
        const validRows: CommentData[] = [];

        parsed.forEach((row, i) => {
          const rawText = String(row[colKomentar] || '').trim();
          const rawRegion = String(row[colWilayah] || '').trim();

          if (!rawText || !rawRegion) {
            dropped++;
            return;
          }

          const stdRegion = standardizeRegion(rawRegion);
          if (!stdRegion) {
            dropped++;
            return;
          }

          const rawCat = row.kategori || row.category || 'Lainnya';
          const rawSent = row.sentimen || row.sentiment || 'Neutral';
          const author = row.nama || row.author || 'Warga Anonim';

          validRows.push({
            id: `CSV-${String(i + 1).padStart(4, '0')}`,
            author: String(author).trim() || 'Warga Anonim',
            createdAt: new Date().toISOString(),
            text: rawText,
            region: stdRegion,
            category: ALL_CATEGORIES.includes(rawCat as Category) ? (rawCat as Category) : 'Lainnya',
            sentiment: ['Positive', 'Negative', 'Neutral'].includes(rawSent) 
              ? rawSent 
              : (rawSent === 'Positif' ? 'Positive' : rawSent === 'Negatif' ? 'Negative' : 'Neutral'),
            processed: true,
          });
        });

        if (validRows.length > 0) {
          const merged = [...validRows, ...data];
          saveComments(merged);
          setData(merged);
          setDroppedRowsCount(dropped);
          setSuccessToast(`${validRows.length} aspirasi baru berhasil diimpor dari CSV.`);
          setTimeout(() => setSuccessToast(null), 5000);
        } else {
          setSuccessToast('Tidak ada data valid yang dapat diimpor untuk wilayah Kalimantan Tengah.');
          setTimeout(() => setSuccessToast(null), 5000);
        }
      }
    });
  };

  // CSV File Input Handler: intercepts and guarantees passcode verification
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (isImportAuthorizedRef.current) {
      isImportAuthorizedRef.current = false;
      processCsvFile(file);
    } else {
      setPendingCsvFile(file);
      setSecurityAction('import_csv');
      setIsSecurityModalOpen(true);
    }
    e.target.value = '';
  };

  // Callback executed ONLY when correct code (EvanGantenk6f045) is entered
  const handleSecuritySuccess = () => {
    if (securityAction === 'clear_data') {
      const empty = clearAllStoredComments();
      setData(empty);
      setSuccessToast('Semua data aspirasi telah dikosongkan. Platform siap untuk uji coba langsung ke masyarakat Kalimantan Tengah!');
      setTimeout(() => setSuccessToast(null), 5000);
    } else if (securityAction === 'export_data') {
      const blob = new Blob([JSON.stringify(filteredData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `aspirasi_warga_kalteng_${selectedRegions.length}_wilayah.json`;
      a.click();
      URL.revokeObjectURL(a.href);
      setSuccessToast(`Data ${filteredData.length} aspirasi warga berhasil diekspor.`);
      setTimeout(() => setSuccessToast(null), 4000);
    } else if (securityAction === 'import_csv') {
      if (pendingCsvFile) {
        processCsvFile(pendingCsvFile);
        setPendingCsvFile(null);
      } else {
        isImportAuthorizedRef.current = true;
        setTimeout(() => {
          fileInputRef.current?.click();
        }, 100);
      }
    }
  };

  // Chart datasets
  const categoryChartData = useMemo(() => {
    return (Object.entries(summary.categoryDistribution) as [Category, number][])
      .map(([name, value]) => ({ name, value }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [summary]);

  const regionChartData = useMemo(() => {
    return (Object.entries(summary.regionDistribution) as [string, { total: number, sentiments: Record<Sentiment, number> }][])
      .map(([name, stats]) => ({
        name: name.replace('Kabupaten ', 'Kab. ').replace('Kota ', ''),
        fullName: name,
        Positive: stats.sentiments.Positive,
        Neutral: stats.sentiments.Neutral,
        Negative: stats.sentiments.Negative,
        total: stats.total
      }))
      .sort((a, b) => b.total - a.total);
  }, [summary]);

  // Percentage calculations for Top Summary Cards
  const totalComments = summary.totalComments;
  const posCount = summary.sentimentDistribution.Positive;
  const neuCount = summary.sentimentDistribution.Neutral;
  const negCount = summary.sentimentDistribution.Negative;

  const posPct = totalComments > 0 ? Math.round((posCount / totalComments) * 100) : 0;
  const neuPct = totalComments > 0 ? Math.round((neuCount / totalComments) * 100) : 0;
  const negPct = totalComments > 0 ? Math.round((negCount / totalComments) * 100) : 0;

  return (
    <div className={`flex h-screen overflow-hidden font-sans transition-colors duration-200 ${
      isDark ? 'bg-[#0B0E14] text-gray-200' : 'bg-slate-50 text-slate-800'
    }`}>
      {/* MOBILE DRAWER NAVIGATION (SLIDE-OVER FOR SMARTPHONES & TABLETS) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop Overlay */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <div className={`relative w-80 max-w-[85vw] h-full p-5 flex flex-col gap-5 z-10 shadow-2xl overflow-y-auto transition-all ${
            isDark ? 'bg-[#12141D] border-r border-[#222736] text-gray-200' : 'bg-white border-r border-slate-200 text-slate-800'
          }`}>
            {/* Drawer Header & Close Button */}
            <div className="flex items-center justify-between border-b pb-4 border-[#242A3B]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-600/15 rounded-xl flex items-center justify-center border border-blue-500/30 text-blue-500 shadow-md">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <span className={`font-bold text-base tracking-tight block leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    CityPulse Kalteng
                  </span>
                  <span className={`text-[10px] ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                    Intelijen Aspirasi & Perencanaan
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className={`p-2 rounded-lg border transition-colors ${
                  isDark ? 'border-[#242A3B] text-gray-400 hover:text-white bg-[#1A1D27]' : 'border-slate-200 text-slate-500 hover:text-slate-900 bg-slate-100'
                }`}
                aria-label="Tutup Menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Action: Tulis Aspirasi */}
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                handleOpenAspirationForm(null);
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-lg shadow-blue-600/25 transition-all"
            >
              <MessageSquarePlus className="w-4 h-4" />
              <span>Sampaikan Aspirasi Warga</span>
            </button>

            {/* Mobile Nav Tabs */}
            <nav className="flex flex-col gap-1.5">
              <button 
                onClick={() => {
                  setActiveTab('dashboard');
                  setIsMobileMenuOpen(false);
                }}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
                  activeTab === 'dashboard' 
                    ? 'bg-blue-600/15 text-blue-500 border border-blue-500/30 shadow-sm' 
                    : isDark ? 'text-gray-400 hover:text-white hover:bg-[#1C2130]' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Activity className="w-4 h-4" />
                <span>Dashboard Perencanaan</span>
              </button>

              <button 
                onClick={() => {
                  setActiveTab('spatial');
                  setIsMobileMenuOpen(false);
                }}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
                  activeTab === 'spatial' 
                    ? 'bg-blue-600/15 text-blue-500 border border-blue-500/30 shadow-sm' 
                    : isDark ? 'text-gray-400 hover:text-white hover:bg-[#1C2130]' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Map className="w-4 h-4" />
                  <span>Peta Spasial Sentimen</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 font-semibold">
                  14 Wilayah
                </span>
              </button>

              <button 
                onClick={() => {
                  setActiveTab('explore');
                  setIsMobileMenuOpen(false);
                }}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
                  activeTab === 'explore' 
                    ? 'bg-blue-600/15 text-blue-500 border border-blue-500/30 shadow-sm' 
                    : isDark ? 'text-gray-400 hover:text-white hover:bg-[#1C2130]' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Layers className="w-4 h-4" />
                  <span>Daftar Aspirasi Warga</span>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                  isDark ? 'bg-[#242A3B] text-gray-300' : 'bg-slate-200 text-slate-700'
                }`}>
                  {filteredData.length}
                </span>
              </button>
            </nav>

            {/* Mobile Data Management (Protected by Passcode: EvanGantenk6f045) */}
            <div className={`p-3 rounded-xl border space-y-2 text-xs ${
              isDark ? 'bg-[#181C28] border-[#242A3B]' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between">
                <span>Manajemen Data</span>
                <span className="flex items-center gap-1 text-amber-500 text-[10px] font-semibold">
                  <Lock className="w-2.5 h-2.5" /> Dilindungi Kode
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleRequestImport();
                  }}
                  className={`p-2 rounded-lg border text-center flex flex-col items-center gap-1 font-semibold text-[11px] transition-all ${
                    isDark ? 'bg-[#1F2433] border-[#2E364C] text-blue-400 hover:bg-[#282F42]' : 'bg-white border-slate-200 text-blue-600 hover:bg-slate-100 shadow-2xs'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Impor</span>
                </button>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleRequestExport();
                  }}
                  disabled={filteredData.length === 0}
                  className={`p-2 rounded-lg border text-center flex flex-col items-center gap-1 font-semibold text-[11px] transition-all disabled:opacity-40 ${
                    isDark ? 'bg-[#1F2433] border-[#2E364C] text-emerald-400 hover:bg-[#282F42]' : 'bg-white border-slate-200 text-emerald-600 hover:bg-slate-100 shadow-2xs'
                  }`}
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Ekspor</span>
                </button>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleRequestClearAll();
                  }}
                  className={`p-2 rounded-lg border text-center flex flex-col items-center gap-1 font-semibold text-[11px] transition-all ${
                    isDark ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20' : 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100 shadow-2xs'
                  }`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Kosongkan</span>
                </button>
              </div>
            </div>

            {/* Mobile Theme Toggle */}
            <div className={`p-3 rounded-xl border flex items-center justify-between ${
              isDark ? 'bg-[#181C28] border-[#242A3B]' : 'bg-slate-100 border-slate-200'
            }`}>
              <div className="flex items-center gap-2">
                {isDark ? <Moon className="w-4 h-4 text-blue-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
                <span className="text-xs font-semibold">{isDark ? 'Mode Gelap (Dark)' : 'Mode Terang (Light)'}</span>
              </div>
              <button
                onClick={toggleTheme}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  isDark 
                    ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' 
                    : 'bg-blue-600 text-white'
                }`}
              >
                {isDark ? 'Ganti Terang' : 'Ganti Gelap'}
              </button>
            </div>

            {/* Mobile Developer Profile Card */}
            <div className={`mt-auto p-3.5 rounded-xl border space-y-2.5 ${
              isDark ? 'bg-gradient-to-b from-[#181C28] to-[#12151F] border-[#262E44]' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-emerald-500 flex items-center justify-center text-white font-black text-xs shadow-md">
                  E
                </div>
                <div className="min-w-0">
                  <div className="text-[9px] font-bold text-blue-500 uppercase tracking-wider">Inisiator & Pengembang</div>
                  <div className={`text-xs font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>Evan</div>
                  <div className="text-[9px] text-emerald-500 truncate font-medium">Ahli Muda PWK (Jenjang 7 LPJK/BNSP)</div>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsDeveloperModalOpen(true);
                }}
                className={`w-full py-1.5 px-2 rounded-lg text-[10px] font-semibold border transition-all flex items-center justify-center gap-1.5 ${
                  isDark ? 'bg-[#1D2232] hover:bg-[#252C40] text-blue-300 border-blue-500/20' : 'bg-slate-100 hover:bg-slate-200 text-blue-600 border-slate-200'
                }`}
              >
                <span>Profil & Kredensial Evan</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DESKTOP SIDEBAR NAVIGATION */}
      <aside className={`hidden lg:flex flex-col w-64 border-r p-5 gap-6 shrink-0 select-none transition-colors ${
        isDark ? 'bg-[#141721] border-[#242A3B]' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        {/* Brand & Purpose */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600/15 rounded-xl flex items-center justify-center border border-blue-500/30 text-blue-500 shadow-md">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <span className={`font-bold text-base tracking-tight block leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              CityPulse Kalteng
            </span>
            <span className={`text-[10px] font-medium ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
              Intelijen Aspirasi & Tata Ruang
            </span>
          </div>
        </div>

        {/* PRIMARY CTA: Sampaikan Aspirasi Warga */}
        <button
          onClick={() => handleOpenAspirationForm(null)}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-lg shadow-blue-600/25 transition-all transform active:scale-98"
        >
          <MessageSquarePlus className="w-4 h-4" />
          <span>Sampaikan Aspirasi Warga</span>
        </button>

        {/* Navigation Tabs */}
        <nav className="flex flex-col gap-1.5">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
              activeTab === 'dashboard' 
                ? 'bg-blue-600/15 text-blue-500 border border-blue-500/30 shadow-sm' 
                : isDark ? 'text-gray-400 hover:text-white hover:bg-[#1C2130]' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Dashboard Perencanaan</span>
          </button>

          <button 
            onClick={() => setActiveTab('spatial')}
            className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
              activeTab === 'spatial' 
                ? 'bg-blue-600/15 text-blue-500 border border-blue-500/30 shadow-sm' 
                : isDark ? 'text-gray-400 hover:text-white hover:bg-[#1C2130]' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center gap-3">
              <Map className="w-4 h-4" />
              <span>Peta Spasial Sentimen</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 font-semibold">
              Kalteng
            </span>
          </button>

          <button 
            onClick={() => setActiveTab('explore')}
            className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
              activeTab === 'explore' 
                ? 'bg-blue-600/15 text-blue-500 border border-blue-500/30 shadow-sm' 
                : isDark ? 'text-gray-400 hover:text-white hover:bg-[#1C2130]' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center gap-3">
              <Layers className="w-4 h-4" />
              <span>Daftar Aspirasi Warga</span>
            </div>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
              isDark ? 'bg-[#242A3B] text-gray-300' : 'bg-slate-200 text-slate-700'
            }`}>
              {filteredData.length}
            </span>
          </button>
        </nav>

        {/* Regional Scope Summary */}
        <div className={`p-3.5 rounded-xl border text-[11px] space-y-2 ${
          isDark ? 'bg-[#191D2A] border-[#242A3B]' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`font-semibold flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <MapPin className="w-3.5 h-3.5 text-blue-500" />
              <span>Cakupan Wilayah:</span>
            </span>
            <span className="font-mono text-blue-500 font-bold">
              {selectedRegions.length} / 14
            </span>
          </div>
          <p className={`text-[10px] leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
            Mencakup 13 Kabupaten & 1 Kota di Provinsi Kalimantan Tengah.
          </p>
          <div className={`pt-2 border-t flex items-center justify-between text-[11px] ${
            isDark ? 'border-[#242A3B]' : 'border-slate-200'
          }`}>
            <button 
              onClick={handleSelectAllRegions}
              className="text-blue-500 hover:underline font-medium"
            >
              Pilih Semua (14)
            </button>
            <button 
              onClick={() => setSelectedRegions(['Kota Palangka Raya'])}
              className={isDark ? 'text-gray-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}
            >
              Fokus Ibukota
            </button>
          </div>
        </div>

        {/* Developer & Platform Initiator Profile Card (Evan) */}
        <div className={`mt-auto pt-4 border-t space-y-2.5 ${isDark ? 'border-[#242A3B]' : 'border-slate-200'}`}>
          <div className={`p-3 rounded-xl border space-y-2 ${
            isDark ? 'bg-gradient-to-b from-[#181C28] to-[#12151F] border-[#262E44]' : 'bg-slate-50 border-slate-200 shadow-sm'
          }`}>
            <div className="flex items-center gap-2.5">
              <div className="relative shrink-0">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-emerald-500 flex items-center justify-center text-white font-black text-xs shadow-md shadow-blue-500/20">
                  E
                </div>
                <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#181C28]" />
              </div>
              <div className="min-w-0">
                <div className="text-[9px] font-bold text-blue-500 uppercase tracking-wider">Inisiator & Pengembang</div>
                <div className={`text-xs font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>Evan</div>
                <div className="text-[9px] text-emerald-500 truncate font-medium">Ahli Muda PWK (LPJK/BNSP)</div>
              </div>
            </div>
            <p className={`text-[10px] leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
              Perencana Wilayah & Kota tersertifikasi. Pemodelan GIS, big data analytics, dan strategic spatial planning Kalteng.
            </p>
            <button
              onClick={() => setIsDeveloperModalOpen(true)}
              className={`w-full py-1.5 px-2 rounded-lg text-[10px] font-semibold border transition-all flex items-center justify-center gap-1.5 ${
                isDark ? 'bg-[#1D2232] hover:bg-[#252C40] text-blue-300 border-blue-500/20' : 'bg-white hover:bg-slate-100 text-blue-600 border-slate-200 shadow-xs'
              }`}
            >
              <span>Profil & Kredensial Evan</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </button>
          </div>

          <div className={`text-[10px] text-center leading-tight ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>
            CityPulse Kalteng © 2026 • Evan
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT WORKSPACE */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-7 scroll-smooth flex flex-col gap-6">
        {/* HEADER BAR */}
        <header className={`flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5 transition-colors ${
          isDark ? 'border-[#242A3B]' : 'border-slate-200'
        }`}>
          <div className="flex items-start gap-3">
            {/* Hamburger Button for Mobile & Tablet */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className={`lg:hidden mt-0.5 p-2 rounded-xl border transition-colors ${
                isDark ? 'bg-[#181C28] border-[#262E44] text-gray-300 hover:text-white' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 shadow-sm'
              }`}
              aria-label="Buka Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20 uppercase tracking-wide">
                  <MapPin className="w-3 h-3" />
                  Provinsi Kalimantan Tengah
                </span>
                <span className={`text-[11px] font-semibold ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                  • CityPulse Kalteng
                </span>
              </div>
              <h1 className={`text-xl sm:text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Platform Penjaringan & Analisis Aspirasi Warga
              </h1>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                Dashboard intelijen persepsi masyarakat per kabupaten/kota untuk mendukung strategic spatial planning Kalimantan Tengah.
              </p>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* THEME TOGGLE BUTTON (LIGHT / DARK) */}
            <button
              onClick={toggleTheme}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all shadow-sm ${
                isDark 
                  ? 'bg-[#1A1E2C] border-[#2B344C] text-amber-300 hover:bg-[#22283A]' 
                  : 'bg-white border-slate-200 text-blue-600 hover:bg-slate-50'
              }`}
              title={isDark ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
              aria-label="Ganti Tema Tampilan"
            >
              {isDark ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span className="hidden sm:inline text-gray-200">Mode Terang</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-blue-600" />
                  <span className="hidden sm:inline text-slate-700">Mode Gelap</span>
                </>
              )}
            </button>

            {/* Developer Attribution Button (Evan) */}
            <button
              onClick={() => setIsDeveloperModalOpen(true)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-left shadow-sm group transition-all ${
                isDark 
                  ? 'bg-[#1A1E2C] border-[#2B344C] hover:border-blue-500/50 hover:bg-[#22283A]' 
                  : 'bg-white border-slate-200 hover:border-blue-400 hover:bg-slate-50'
              }`}
              title="Lihat Profil Inisiator & Pengembang Platform (Evan - Ahli Muda PWK)"
            >
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-600 via-indigo-600 to-emerald-500 flex items-center justify-center text-white font-black text-[10px] shadow-sm">
                E
              </div>
              <div className="flex flex-col pr-1">
                <span className={`text-[9px] leading-tight ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Inisiator & Pengembang</span>
                <span className={`text-[11px] font-bold group-hover:text-blue-500 transition-colors flex items-center gap-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Evan
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                </span>
              </div>
            </button>

            <button
              onClick={() => handleOpenAspirationForm(null)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition-all"
            >
              <MessageSquarePlus className="w-3.5 h-3.5" />
              <span>Tulis Aspirasi</span>
            </button>

            {/* Impor CSV - Dilindungi Kode Otorisasi */}
            <button
              onClick={handleRequestImport}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                isDark 
                  ? 'bg-[#1A1D27] border-[#242A3B] text-gray-300 hover:bg-[#232736] hover:text-white' 
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-sm'
              }`}
              title="Impor Berkas CSV (Memerlukan Kode Otorisasi EvanGantenk6f045)"
            >
              <Upload className="w-3.5 h-3.5 text-blue-500" />
              <span className="hidden sm:inline">Impor CSV</span>
              <Lock className="w-2.5 h-2.5 text-amber-500" />
            </button>
            <input 
              ref={fileInputRef} 
              type="file" 
              accept=".csv" 
              className="hidden" 
              onChange={handleFileUpload} 
            />

            {/* Ekspor Data - Dilindungi Kode Otorisasi */}
            <button
              onClick={handleRequestExport}
              disabled={filteredData.length === 0}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                isDark 
                  ? 'bg-[#1A1D27] border-[#242A3B] text-gray-300 hover:bg-[#232736] hover:text-white' 
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-sm'
              }`}
              title="Unduh data terfilter (Memerlukan Kode Otorisasi EvanGantenk6f045)"
            >
              <Download className="w-3.5 h-3.5 text-emerald-500" />
              <span className="hidden sm:inline">Ekspor Data</span>
              <Lock className="w-2.5 h-2.5 text-amber-500" />
            </button>

            {/* Clear all data button - Dilindungi Kode Otorisasi */}
            <button
              onClick={handleRequestClearAll}
              title="Kosongkan semua data aspirasi (Memerlukan Kode Otorisasi EvanGantenk6f045)"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
                isDark 
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20 hover:text-rose-300' 
                  : 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
              <span className="hidden sm:inline">Kosongkan Data</span>
              <Lock className="w-2.5 h-2.5 text-rose-400" />
            </button>

            {/* Load demo dataset button if empty */}
            {data.length === 0 && (
              <button
                onClick={handleLoadDemoData}
                title="Muat contoh dataset simulasi untuk melihat pratinjau grafis"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
                  isDark 
                    ? 'bg-[#1A1D27] border-[#242A3B] text-blue-400 hover:bg-[#232736]' 
                    : 'bg-white border-slate-200 text-blue-600 hover:bg-slate-50 shadow-sm'
                }`}
              >
                <Database className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Muat Demo</span>
              </button>
            )}
          </div>
        </header>

        {/* TOAST / NOTIFICATION BANNER */}
        {successToast && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center justify-between animate-fade-in shadow-md">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{successToast}</span>
            </div>
            <button onClick={() => setSuccessToast(null)} className="text-emerald-500 hover:underline text-[11px] font-semibold">
              Tutup
            </button>
          </div>
        )}

        {/* LIVE TRIAL MODE BANNER (Shown when data is empty for citizen testing) */}
        {totalComments === 0 && (
          <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
            isDark 
              ? 'bg-gradient-to-r from-blue-950/40 via-[#151822] to-emerald-950/20 border-blue-500/30 text-white' 
              : 'bg-gradient-to-r from-blue-50/80 via-white to-emerald-50/50 border-blue-200 text-slate-800 shadow-sm'
          }`}>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-500 flex items-center justify-center shrink-0 border border-blue-500/30 mt-0.5">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">
                      Mode Uji Coba Lapangan Aktif (Trial & Error Warga)
                    </span>
                    <span className={`text-[11px] font-mono ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                      0 Aspirasi Tersimpan
                    </span>
                  </div>
                  <h3 className={`text-base font-bold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Data Aspirasi Bersih — Siap Menjaring Suara Warga Kalimantan Tengah
                  </h3>
                  <p className={`text-xs mt-1 leading-relaxed max-w-2xl ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>
                    Seluruh data simulasi telah dihapus sehingga Anda dapat menguji coba platform ini langsung kepada masyarakat di 13 Kabupaten & 1 Kota. Setiap aspirasi yang disampaikan warga akan langsung dianalisis sentimen dan kategorisasinya secara real-time.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2.5 shrink-0 w-full md:w-auto">
                <button
                  onClick={() => handleOpenAspirationForm(null)}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/25 transition-all"
                >
                  <MessageSquarePlus className="w-4 h-4" />
                  <span>+ Sampaikan Aspirasi Warga Pertama</span>
                </button>
                <button
                  onClick={handleLoadDemoData}
                  className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-medium transition-all ${
                    isDark 
                      ? 'bg-[#1D212E] border-[#2E3547] text-gray-300 hover:bg-[#282F42] hover:text-white' 
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 shadow-2xs'
                  }`}
                  title="Jika Anda butuh melihat simulasi dengan data contoh"
                >
                  <Database className="w-3.5 h-3.5 text-blue-500" />
                  <span>Muat Data Contoh</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* DROPPED ROWS WARNING */}
        {droppedRowsCount > 0 && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
              <span>
                <strong>Pembersihan Data Otomatis:</strong> {droppedRowsCount} baris data di luar wilayah Provinsi Kalimantan Tengah telah dieliminasi agar analisis tetap akurat.
              </span>
            </div>
            <button onClick={() => setDroppedRowsCount(0)} className="text-amber-500 hover:underline text-[11px] font-semibold">
              Tutup
            </button>
          </div>
        )}

        {/* EXECUTIVE KPI SUMMARY CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {/* Total Komentar */}
          <div className={`p-4 sm:p-5 rounded-2xl border transition-all shadow-sm ${
            isDark ? 'bg-[#151822] border-[#242A3B]' : 'bg-white border-slate-200'
          }`}>
            <div className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-1.5 flex items-center justify-between">
              <span>Total Aspirasi Terdata</span>
              <Activity className="w-3.5 h-3.5 text-blue-500" />
            </div>
            <div className={`text-2xl sm:text-3xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {totalComments.toLocaleString('id-ID')}
            </div>
            <div className={`text-[11px] mt-1 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
              Dari {selectedRegions.length} Wilayah terpilih
            </div>
          </div>

          {/* Positif (Hijau) */}
          <div className={`p-4 sm:p-5 rounded-2xl border transition-all shadow-sm ${
            isDark ? 'bg-[#151822] border-emerald-500/30' : 'bg-white border-emerald-200'
          }`}>
            <div className="text-[10px] text-emerald-500 uppercase tracking-wider font-bold mb-1.5 flex items-center justify-between">
              <span>Sentimen Positif</span>
              <ThumbsUp className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-emerald-500 tracking-tight">
              {posPct}%
            </div>
            <div className="text-[11px] text-emerald-600 font-medium mt-1">
              {posCount.toLocaleString('id-ID')} masukan apresiatif
            </div>
          </div>

          {/* Netral (Abu-abu / Kuning lembut) */}
          <div className={`p-4 sm:p-5 rounded-2xl border transition-all shadow-sm ${
            isDark ? 'bg-[#151822] border-zinc-600/40' : 'bg-white border-slate-200'
          }`}>
            <div className={`text-[10px] uppercase tracking-wider font-bold mb-1.5 flex items-center justify-between ${
              isDark ? 'text-gray-300' : 'text-slate-600'
            }`}>
              <span>Sentimen Netral</span>
              <MinusCircle className="w-3.5 h-3.5 text-gray-400" />
            </div>
            <div className={`text-2xl sm:text-3xl font-bold tracking-tight ${isDark ? 'text-gray-200' : 'text-slate-800'}`}>
              {neuPct}%
            </div>
            <div className={`text-[11px] mt-1 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
              {neuCount.toLocaleString('id-ID')} saran & pertanyaan
            </div>
          </div>

          {/* Negatif (Merah) */}
          <div className={`p-4 sm:p-5 rounded-2xl border transition-all shadow-sm ${
            isDark ? 'bg-[#151822] border-rose-500/30' : 'bg-white border-rose-200'
          }`}>
            <div className="text-[10px] text-rose-500 uppercase tracking-wider font-bold mb-1.5 flex items-center justify-between">
              <span>Sentimen Negatif</span>
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-rose-500 tracking-tight">
              {negPct}%
            </div>
            <div className="text-[11px] text-rose-600 font-medium mt-1">
              {negCount.toLocaleString('id-ID')} catatan kendala warga
            </div>
          </div>
        </div>

        {/* COMPREHENSIVE REGIONAL FILTER BAR (MODERN, COLLAPSIBLE, HIERARCHICAL, RESPONSIVE) */}
        <RegionalFilterBar
          selectedRegions={selectedRegions}
          onChangeRegions={setSelectedRegions}
          selectedCategories={selectedCategories}
          onChangeCategories={setSelectedCategories}
          selectedSentiments={selectedSentiments}
          onChangeSentiments={setSelectedSentiments}
          regionCommentCounts={regionCommentCounts}
          categoryCommentCounts={summary.categoryDistribution}
          sentimentCommentCounts={summary.sentimentDistribution}
          categoryColors={CATEGORY_COLORS}
          isDark={isDark}
        />

        {/* TAB 1: DASHBOARD PERENCANAAN */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Visualizations Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-[1.9fr_1.1fr] gap-6">
              {/* FITUR 1: INTERACTIVE DRILL-DOWN SENTIMENT BAR CHART */}
              <div className={`p-5 rounded-2xl border flex flex-col justify-between transition-all ${
                isDark ? 'bg-[#151822] border-[#242A3B]' : 'bg-white border-slate-200 shadow-sm'
              }`}>
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-blue-500" />
                        <h3 className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          Distribusi Sentimen per Kabupaten / Kota
                        </h3>
                      </div>
                      <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                        Menampilkan komposisi respon warga di setiap wilayah terpilih.
                      </p>
                    </div>

                    {/* Drill-down Guide Badge */}
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold ${
                      isDark ? 'bg-blue-500/10 border border-blue-500/25 text-blue-400' : 'bg-blue-50 border border-blue-200 text-blue-700'
                    }`}>
                      <span>�� Klik bar wilayah untuk rincian (Drill-Down)</span>
                    </div>
                  </div>

                  {/* Bar Chart Container */}
                  <div className="h-72 w-full cursor-pointer">
                    {regionChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart 
                          data={regionChartData} 
                          margin={{ top: 15, right: 10, left: -20, bottom: 35 }}
                          onClick={(state: any) => {
                            if (state && state.activePayload && state.activePayload.length > 0) {
                              const clickedRegion = state.activePayload[0].payload?.fullName;
                              if (clickedRegion) {
                                handleOpenDrillDown(clickedRegion);
                              }
                            }
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#242A3B' : '#E2E8F0'} vertical={false} />
                          <XAxis 
                            dataKey="name" 
                            stroke={isDark ? '#6B7280' : '#64748B'} 
                            fontSize={10} 
                            tickLine={false} 
                            interval={0}
                            angle={-25}
                            textAnchor="end"
                          />
                          <YAxis stroke={isDark ? '#6B7280' : '#64748B'} fontSize={10} tickLine={false} />
                          <Tooltip 
                            cursor={{ fill: isDark ? 'rgba(59, 130, 246, 0.08)' : 'rgba(59, 130, 246, 0.05)' }}
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const d = payload[0].payload;
                                return (
                                  <div className={`p-3 rounded-xl border shadow-xl text-xs space-y-1.5 ${
                                    isDark ? 'bg-[#1A1D27] border-[#2D313E] text-white' : 'bg-white border-slate-200 text-slate-900 shadow-md'
                                  }`}>
                                    <div className={`font-bold border-b pb-1 flex items-center justify-between gap-4 ${
                                      isDark ? 'border-[#2D313E] text-white' : 'border-slate-200 text-slate-900'
                                    }`}>
                                      <span>{d.fullName}</span>
                                      <span className="text-blue-500 font-mono">{d.total} Aspirasi</span>
                                    </div>
                                    <div className="flex items-center justify-between text-emerald-500 gap-4">
                                      <span>Positif:</span>
                                      <span className="font-bold">{d.Positive}</span>
                                    </div>
                                    <div className={`flex items-center justify-between gap-4 ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>
                                      <span>Netral:</span>
                                      <span className="font-bold">{d.Neutral}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-rose-500 gap-4">
                                      <span>Negatif:</span>
                                      <span className="font-bold">{d.Negative}</span>
                                    </div>
                                    <div className={`pt-1 border-t text-[10px] text-blue-500 flex items-center gap-1 ${
                                      isDark ? 'border-[#2D313E]' : 'border-slate-200'
                                    }`}>
                                      <ExternalLink className="w-3 h-3" />
                                      <span>Klik untuk melihat seluruh komentar warga</span>
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          {/* Sentimen Positif (Hijau) */}
                          <Bar 
                            dataKey="Positive" 
                            name="Positif" 
                            fill={SENTIMENT_COLORS.Positive} 
                            stackId="a" 
                            className="hover:opacity-90 transition-opacity cursor-pointer"
                          />
                          {/* Sentimen Netral (Abu-abu) */}
                          <Bar 
                            dataKey="Neutral" 
                            name="Netral" 
                            fill={SENTIMENT_COLORS.Neutral} 
                            stackId="a" 
                            className="hover:opacity-90 transition-opacity cursor-pointer"
                          />
                          {/* Sentimen Negatif (Merah) */}
                          <Bar 
                            dataKey="Negative" 
                            name="Negatif" 
                            fill={SENTIMENT_COLORS.Negative} 
                            stackId="a" 
                            radius={[4, 4, 0, 0]}
                            className="hover:opacity-90 transition-opacity cursor-pointer"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center border border-blue-500/20">
                          <BarChart3 className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            Menunggu Masukan Pertama Warga
                          </h4>
                          <p className={`text-xs mt-1 max-w-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                            Grafik sebaran sentimen per kabupaten/kota akan terisi otomatis begitu masyarakat mulai menyampaikan aspirasinya.
                          </p>
                        </div>
                        <button
                          onClick={() => handleOpenAspirationForm(null)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-all"
                        >
                          <MessageSquarePlus className="w-3.5 h-3.5" />
                          <span>+ Tulis Aspirasi Pertama</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Interactive Region Chips to trigger Drill-Down easily */}
                <div className={`mt-2 pt-3 border-t flex flex-wrap items-center gap-1.5 ${
                  isDark ? 'border-[#242A3B]' : 'border-slate-200'
                }`}>
                  <span className={`text-[11px] mr-1 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Buka Rincian Wilayah:</span>
                  {regionChartData.length > 0 ? (
                    regionChartData.slice(0, 6).map((item) => (
                      <button
                        key={item.fullName}
                        onClick={() => handleOpenDrillDown(item.fullName)}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-medium border transition-all flex items-center gap-1 ${
                          isDark 
                            ? 'bg-[#1E2230] hover:bg-blue-600/20 hover:text-blue-300 text-gray-300 border-[#2D3347]' 
                            : 'bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 border-slate-200'
                        }`}
                      >
                        <span>{item.name}</span>
                        <ArrowRight className="w-2.5 h-2.5 opacity-60" />
                      </button>
                    ))
                  ) : (
                    selectedRegions.slice(0, 6).map((reg) => (
                      <button
                        key={reg}
                        onClick={() => handleOpenDrillDown(reg)}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-medium border transition-all flex items-center gap-1 ${
                          isDark 
                            ? 'bg-[#1E2230] hover:bg-blue-600/20 hover:text-blue-300 text-gray-300 border-[#2D3347]' 
                            : 'bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 border-slate-200'
                        }`}
                      >
                        <span>{reg.replace('Kabupaten ', 'Kab. ').replace('Kota ', '')}</span>
                        <ArrowRight className="w-2.5 h-2.5 opacity-60" />
                      </button>
                    ))
                  )}
                  {selectedRegions.length > 6 && (
                    <button
                      onClick={() => handleOpenDrillDown(selectedRegions[0])}
                      className="text-[11px] text-blue-500 hover:underline font-medium"
                    >
                      + {selectedRegions.length - 6} lainnya
                    </button>
                  )}
                </div>
              </div>

              {/* CATEGORY COMPOSITION DONUT CHART */}
              <div className={`p-5 rounded-2xl border flex flex-col justify-between transition-all ${
                isDark ? 'bg-[#151822] border-[#242A3B]' : 'bg-white border-slate-200 shadow-sm'
              }`}>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-4 h-4 text-blue-500" />
                    <h3 className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      Komposisi Kategori Pembangunan
                    </h3>
                  </div>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                    Proporsi bidang isu pembangunan yang dilaporkan warga.
                  </p>

                  <div className="h-56 w-full flex items-center justify-center my-2">
                    {categoryChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={categoryChartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={80}
                            paddingAngle={4}
                            dataKey="value"
                          >
                            {categoryChartData.map((entry) => (
                              <Cell key={`cell-${entry.name}`} fill={CATEGORY_COLORS[entry.name as Category] || '#9CA3AF'} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: isDark ? '#1A1D27' : '#FFFFFF', 
                              borderColor: isDark ? '#2D313E' : '#E2E8F0', 
                              borderRadius: '10px', 
                              fontSize: '11px', 
                              color: isDark ? '#E5E7EB' : '#1E293B',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }} 
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-2">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center border border-purple-500/20">
                          <Sparkles className="w-5 h-5" />
                        </div>
                        <p className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          Belum Ada Data Kategori
                        </p>
                        <p className={`text-[11px] max-w-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                          Proporsi 8 bidang isu pembangunan kota akan dihitung otomatis secara proporsional.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Legend */}
                <div className={`space-y-1.5 pt-3 border-t ${isDark ? 'border-[#242A3B]' : 'border-slate-200'}`}>
                  {categoryChartData.length > 0 ? (
                    categoryChartData.map(item => (
                      <div key={item.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[item.name as Category] }} />
                          <span className={isDark ? 'text-gray-300' : 'text-slate-600'}>{item.name}</span>
                        </div>
                        <span className={`font-bold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {item.value} ({totalComments > 0 ? Math.round((item.value / totalComments) * 100) : 0}%)
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className={`text-[11px] italic text-center py-2 ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>
                      Kategori akan muncul setelah formulir pertama diisi
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* URBAN PLANNER NARRATIVE POLICY INSIGHT & ACTION BANNER */}
            <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
              {/* Narrative Policy Insight */}
              <div className={`p-6 rounded-2xl border-l-4 border-l-blue-500 border flex flex-col justify-between transition-all ${
                isDark ? 'bg-[#151822] border-[#242A3B]' : 'bg-white border-slate-200 shadow-sm'
              }`}>
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-blue-500" />
                      <h3 className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        Rangkuman Naratif Perencanaan Wilayah
                      </h3>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20">
                      Sintesis Kebijakan
                    </span>
                  </div>
                  <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
                    {summary.narrativeSummary}
                  </p>
                </div>

                <div className={`mt-4 pt-4 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                  isDark ? 'border-[#242A3B]' : 'border-slate-200'
                }`}>
                  <span className={isDark ? 'text-gray-400' : 'text-slate-500'}>
                    Rekomendasi Intervensi: Prioritaskan pengaspalan koridor Trans-Kalimantan dan perbaikan drainase TPS di sentra pasar.
                  </span>
                  <button
                    onClick={() => setActiveTab('explore')}
                    className="text-blue-500 font-semibold hover:underline flex items-center gap-1 shrink-0"
                  >
                    Buka Log Komentar Warga →
                  </button>
                </div>
              </div>

              {/* Citizen Engagement Card */}
              <div className={`p-6 rounded-2xl border flex flex-col justify-between transition-all ${
                isDark 
                  ? 'bg-gradient-to-br from-[#182033] to-[#141722] border-blue-500/30' 
                  : 'bg-gradient-to-br from-blue-50 to-indigo-50/70 border-blue-200 shadow-sm'
              }`}>
                <div>
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-500 flex items-center justify-center mb-3 border border-blue-500/30">
                    <MessageSquarePlus className="w-5 h-5" />
                  </div>
                  <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Ada Masukan untuk Wilayah Anda?
                  </h4>
                  <p className={`text-xs mt-1.5 leading-relaxed ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>
                    Setiap suara warga Kalimantan Tengah langsung dipetakan dan dianalisis otomatis untuk perencanaan pembangunan daerah.
                  </p>
                </div>

                <button
                  onClick={() => handleOpenAspirationForm(null)}
                  className="mt-4 w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-2"
                >
                  <MessageSquarePlus className="w-4 h-4" />
                  <span>Kirim Aspirasi Sekarang</span>
                </button>
              </div>
            </div>

            {/* FITUR BARU: INSIGHT OTOMATIS AI (TREN MINGGUAN & ISU MENDESAK) */}
            <AiWeeklyInsightCard 
              comments={data}
              onFocusCategory={(cat) => {
                setSelectedCategories([cat]);
                window.scrollTo({ top: 400, behavior: 'smooth' });
              }}
              categoryColors={CATEGORY_COLORS}
            />
          </div>
        )}

        {/* TAB 2: DAFTAR ASPIRASI & LOG EKSPLORASI */}
        {activeTab === 'explore' && (
          <div className={`p-5 rounded-2xl border space-y-4 transition-all ${
            isDark ? 'bg-[#151822] border-[#242A3B]' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 ${
              isDark ? 'border-[#242A3B]' : 'border-slate-200'
            }`}>
              <div>
                <h3 className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Log Komentar & Aspirasi Warga ({filteredData.length} Data Terfilter)
                </h3>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                  Arsip masukan warga yang telah diproses dan terhubung langsung ke perencanaan tata ruang.
                </p>
              </div>

              {/* Search & Actions */}
              <div className="flex items-center gap-2">
                <div className="relative w-full sm:w-72">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Cari aspirasi, warga, wilayah..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full border rounded-xl pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-blue-500 transition-colors ${
                      isDark 
                        ? 'bg-[#12141B] border-[#242A3B] text-white placeholder:text-gray-500' 
                        : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'
                    }`}
                  />
                </div>
                <button
                  onClick={() => handleOpenAspirationForm(null)}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm"
                >
                  <MessageSquarePlus className="w-3.5 h-3.5" />
                  <span>+ Aspirasi</span>
                </button>
              </div>
            </div>

            {/* Comments Table */}
            <div className="overflow-x-auto max-h-[550px]">
              <table className="w-full text-left text-xs border-collapse">
                <thead className={`sticky top-0 border-b ${
                  isDark ? 'bg-[#191D2A] border-[#242A3B] text-gray-400' : 'bg-slate-100 border-slate-200 text-slate-600'
                }`}>
                  <tr>
                    <th className="p-3 font-semibold">Wilayah</th>
                    <th className="p-3 font-semibold">Pengirim & Waktu</th>
                    <th className="p-3 font-semibold">Kategori</th>
                    <th className="p-3 font-semibold">Sentimen</th>
                    <th className="p-3 font-semibold">Isi Aspirasi Warga</th>
                    <th className="p-3 font-semibold text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-[#242A3B]' : 'divide-slate-200'}`}>
                  {filteredData.slice(0, 100).map((row) => (
                    <tr key={row.id} className={`transition-colors ${isDark ? 'hover:bg-[#1A1E2B]' : 'hover:bg-slate-50'}`}>
                      <td className={`p-3 font-semibold whitespace-nowrap ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        <button
                          onClick={() => handleOpenDrillDown(row.region)}
                          className="hover:text-blue-500 transition-colors flex items-center gap-1"
                        >
                          <MapPin className="w-3 h-3 text-blue-500" />
                          <span>{row.region.replace('Kabupaten ', 'Kab. ')}</span>
                        </button>
                      </td>
                      <td className={`p-3 whitespace-nowrap ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>
                        <div className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{row.author}</div>
                        <div className={`text-[10px] ${isDark ? 'text-gray-400' : 'text-slate-400'}`}>
                          {new Date(row.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <span 
                          className="px-2 py-0.5 rounded text-[10px] font-semibold"
                          style={{
                            backgroundColor: `${CATEGORY_COLORS[row.category]}20`,
                            color: CATEGORY_COLORS[row.category]
                          }}
                        >
                          {row.category}
                        </span>
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          row.sentiment === 'Positive' ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30' :
                          row.sentiment === 'Negative' ? 'bg-rose-500/20 text-rose-500 border border-rose-500/30' :
                          isDark ? 'bg-zinc-700/30 text-zinc-300 border border-zinc-600/40' : 'bg-slate-100 text-slate-700 border border-slate-300'
                        }`}>
                          {row.sentiment === 'Positive' ? 'Positif' : row.sentiment === 'Negative' ? 'Negatif' : 'Netral'}
                        </span>
                      </td>
                      <td className={`p-3 leading-relaxed max-w-md ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
                        {row.text}
                      </td>
                      <td className="p-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleOpenDrillDown(row.region)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                            isDark 
                              ? 'bg-[#242A3B] hover:bg-blue-600/30 hover:text-blue-300 text-gray-300' 
                              : 'bg-slate-100 hover:bg-blue-100 hover:text-blue-700 text-slate-700'
                          }`}
                        >
                          Detail Wilayah
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {data.length === 0 ? (
                <div className={`py-16 text-center text-xs space-y-3 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center border border-blue-500/20">
                    <MessageSquarePlus className="w-6 h-6" />
                  </div>
                  <div>
                    <div className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      Belum Ada Aspirasi yang Terekam
                    </div>
                    <p className="mt-1 max-w-sm mx-auto">
                      Platform telah dikosongkan untuk uji coba langsung warga. Sampaikan masukan pertama untuk wilayah Anda di Kalimantan Tengah.
                    </p>
                  </div>
                  <button
                    onClick={() => handleOpenAspirationForm(null)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-all"
                  >
                    <MessageSquarePlus className="w-4 h-4" />
                    <span>+ Tulis Aspirasi Pertama</span>
                  </button>
                </div>
              ) : filteredData.length === 0 ? (
                <div className={`py-16 text-center text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                  Tidak ada aspirasi warga yang cocok dengan filter yang dipilih.
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* TAB 2 / SPATIAL: PETA SPASIAL SENTIMEN WILAYAH KALIMANTAN TENGAH */}
        {activeTab === 'spatial' && (
          <div className="space-y-4">
            <SpatialSentimentMap
              comments={data}
              selectedRegions={selectedRegions}
              onToggleRegion={handleToggleRegion}
              onOpenDrillDown={handleOpenDrillDown}
              onOpenAddAspiration={handleOpenAspirationForm}
              categoryColors={CATEGORY_COLORS}
            />
          </div>
        )}

        {/* OFFICIAL EXECUTIVE FOOTER (ATTRIBUTION & CREDITS) */}
        <footer className={`mt-8 pt-5 border-t flex flex-col md:flex-row items-center justify-between gap-3 text-xs transition-colors ${
          isDark ? 'border-[#242A3B] text-gray-400' : 'border-slate-200 text-slate-500'
        }`}>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>CityPulse Kalteng</span>
            <span className={isDark ? 'text-gray-600' : 'text-slate-300'}>•</span>
            <span>Platform Intelijen Spasial & Aspirasi Warga (13 Kabupaten & 1 Kota)</span>
          </div>

          <div className="flex items-center gap-2 text-[11px]">
            <span>Inisiator & Pengembang:</span>
            <button
              onClick={() => setIsDeveloperModalOpen(true)}
              className="font-bold text-blue-500 hover:underline flex items-center gap-1 transition-colors"
            >
              <span>Evan</span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            </button>
            <span className={isDark ? 'text-gray-600' : 'text-slate-300'}>|</span>
            <a 
              href="mailto:dermanevan@gmail.com" 
              className={`transition-colors ${isDark ? 'text-gray-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
              title="Kirim email ke Evan"
            >
              dermanevan@gmail.com
            </a>
          </div>
        </footer>
      </main>

      {/* FITUR 1: DRILL-DOWN MODAL */}
      <RegionDrillDownModal
        regionName={drillDownRegion}
        isOpen={isDrillDownOpen}
        onClose={() => {
          setIsDrillDownOpen(false);
          setDrillDownRegion(null);
        }}
        comments={data}
        onOpenAddAspiration={(reg) => {
          setIsDrillDownOpen(false);
          handleOpenAspirationForm(reg);
        }}
      />

      {/* FITUR 2: FORM PENGIRIMAN ASPIRASI WARGA MODAL */}
      <AspirationFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setFormDefaultRegion(null);
        }}
        defaultRegion={formDefaultRegion}
        onAspirationSubmitted={handleAspirationSubmitted}
      />

      {/* FITUR 3: PROFIL PENGEMBANG & INISIATOR PLATFORM MODAL (DERMA EVAN) */}
      <DeveloperProfileModal
        isOpen={isDeveloperModalOpen}
        onClose={() => setIsDeveloperModalOpen(false)}
      />

      {/* FITUR 4: MODAL OTORISASI AKSES KHUSUS (KODE: EvanGantenk6f045) */}
      <SecurityCodeModal
        isOpen={isSecurityModalOpen}
        actionType={securityAction}
        onClose={() => {
          setIsSecurityModalOpen(false);
          setSecurityAction(null);
          setPendingCsvFile(null);
        }}
        onSuccess={handleSecuritySuccess}
        isDark={isDark}
        pendingFileName={pendingCsvFile?.name}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppDashboard />
    </ThemeProvider>
  );
}
