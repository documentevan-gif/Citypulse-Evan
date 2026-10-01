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
  Trash2, BarChart3, Database, Lock, BookOpen, Printer,
  FileText
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
  deleteStoredComment,
  deleteSelectedStoredComments,
  loadDemoSampleData
} from './services/storageService';
import { 
  testConnection, 
  subscribeToCloudAspirations, 
  saveAspirationToCloud, 
  batchSaveAspirationsToCloud, 
  clearAllAspirationsFromCloud,
  deleteAspirationFromCloud,
  batchDeleteAspirationsFromCloud,
  fetchCloudAspirations,
  reconcileAndSyncAspirations
} from './services/firebase';
import { generateExecutivePdfReport } from './services/pdfReportService';
import { generateFinalNarrative } from './services/geminiService';
import { analyzeAspirationIntelligent } from './services/classificationEngine';
import { RegionDrillDownModal } from './components/RegionDrillDownModal';
import { AspirationFormModal } from './components/AspirationFormModal';
import { SpatialSentimentMap } from './components/SpatialSentimentMap';
import { DeveloperProfileModal } from './components/DeveloperProfileModal';
import { AiWeeklyInsightCard } from './components/AiWeeklyInsightCard';
import { HeuristicGuideModal } from './components/HeuristicGuideModal';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { RegionalFilterBar } from './components/RegionalFilterBar';
import { SecurityCodeModal, ProtectedActionType } from './components/SecurityCodeModal';
import { DataDeletionModal } from './components/DataDeletionModal';
import { SentimentTrendAnalysisChart } from './components/SentimentTrendAnalysisChart';
import { Footer } from './components/Footer';
import { motion, AnimatePresence } from 'motion/react';

// Standardized color palette for consistent sentiment and categories
const SENTIMENT_COLORS = {
  Positive: '#10B981', // Hijau
  Neutral: '#9CA3AF',  // Abu-abu netral
  Negative: '#EF4444'  // Merah
};

export const ALL_CATEGORIES: Category[] = [
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

const CATEGORY_COLORS: Record<Category, string> = {
  'Transportasi': '#3B82F6',           // Biru
  'Drainase & Banjir': '#06B6D4',      // Cyan
  'Bencana Alam': '#EA580C',           // Oranye Kemerahan / Flame (Karhutla & Bencana)
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

  // Feature 2.5: Heuristic & Intelligent Classification Guide Modal
  const [isHeuristicGuideOpen, setIsHeuristicGuideOpen] = useState(false);

  // Security Verification Modal for Protected Administrative Features
  // Protected features: Cetak PDF, Kamus Heuristik, Impor CSV, Ekspor Data, Kosongkan Data
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [securityAction, setSecurityAction] = useState<ProtectedActionType | null>(null);
  const [pendingCsvFile, setPendingCsvFile] = useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const isImportAuthorizedRef = React.useRef<boolean>(false);

  // PDF report generation state
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Modul Manajemen Penghapusan Data (Multi-Select & Bulk Reset terproteksi Sandi)
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
  const [isDeletionModalOpen, setIsDeletionModalOpen] = useState(false);
  const [pendingDeleteIds, setPendingDeleteIds] = useState<string[]>([]);
  const selectAllCheckboxRef = React.useRef<HTMLInputElement>(null);

  // Cloud Firestore real-time integration status
  const [isCloudConnected, setIsCloudConnected] = useState(false);
  const [isManualSyncing, setIsManualSyncing] = useState(false);

  // Load dataset and subscribe to real-time Cloud Firestore across all browsers & devices
  useEffect(() => {
    // 1. Instant load from local cache to avoid empty flash
    try {
      const stored = loadStoredComments();
      if (stored && stored.length > 0) {
        setData(stored);
      }
    } catch (e) {
      console.error(e);
    }

    // 2. Direct Cloud Reconcile & Fetch to guarantee Google AI Studio & Publish are 100% in sync
    const initialStored = loadStoredComments();
    reconcileAndSyncAspirations(initialStored || []).then((syncedData) => {
      if (syncedData && syncedData.length > 0) {
        setData(syncedData);
        saveComments(syncedData);
      }
      setIsCloudConnected(true);
      setIsLoading(false);
    }).catch((err) => {
      console.warn('Initial cloud sync:', err);
      setIsLoading(false);
    });

    // 3. Test Firestore connection per system guidelines
    testConnection().then(connected => {
      setIsCloudConnected(connected);
    });

    // 4. Real-time multi-browser synchronization listener
    const unsubscribe = subscribeToCloudAspirations(
      (cloudAspirations) => {
        if (cloudAspirations && cloudAspirations.length > 0) {
          setData(cloudAspirations);
          saveComments(cloudAspirations);
        }
        setIsCloudConnected(true);
        setIsLoading(false);
      },
      (error) => {
        console.warn('Sinkronisasi cloud Firestore:', error);
      }
    );

    return () => {
      unsubscribe();
    };
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
    // 1. Dynamically map all 9 official sectors from ALL_CATEGORIES
    const categories = ALL_CATEGORIES.reduce((acc, cat) => {
      acc[cat] = 0;
      return acc;
    }, {} as Record<Category, number>);

    const categorySentiments = ALL_CATEGORIES.reduce((acc, cat) => {
      acc[cat] = { Positive: 0, Negative: 0, Neutral: 0 };
      return acc;
    }, {} as Record<Category, { Positive: number; Negative: number; Neutral: number }>);

    const sentiments: Record<Sentiment, number> = {
      Positive: 0, Negative: 0, Neutral: 0
    };
    const regions: Record<string, { total: number; sentiments: Record<Sentiment, number> }> = {};

    filteredData.forEach(d => {
      const cat = (d.category && categories[d.category] !== undefined) ? d.category : 'Lainnya';
      categories[cat]++;
      
      if (d.sentiment) {
        sentiments[d.sentiment]++;
        categorySentiments[cat][d.sentiment]++;
      }
      
      if (!regions[d.region]) {
        regions[d.region] = { total: 0, sentiments: { Positive: 0, Negative: 0, Neutral: 0 } };
      }
      regions[d.region].total++;
      if (d.sentiment) regions[d.region].sentiments[d.sentiment]++;
    });

    const total = filteredData.length;

    // 2. Comprehensive policy action catalog mapped for all 9 official sectors
    const SECTOR_POLICY_ACTIONS: Record<Category, { urgent: string; preventive: string }> = {
      'Transportasi': {
        urgent: 'Prioritaskan pengaspalan ruas jalan berlubang/amblas, perbaikan jembatan penghubung, dan penertiban truk ODOL.',
        preventive: 'Pertahankan inspeksi berkala kondisi jalan poros serta pemeliharaan struktur jembatan.'
      },
      'Drainase & Banjir': {
        urgent: 'Prioritaskan normalisasi saluran drainase perkotaan dan pengerukan sedimentasi parit guna mencegah genangan air.',
        preventive: 'Lakukan pembersihan rutin saluran got dan pemeliharaan pintu air pembuangan.'
      },
      'Bencana Alam': {
        urgent: 'Prioritaskan kesiapsiagaan posko mitigasi darurat bencana, penanganan karhutla gambut terpadu, dan sekat kanal.',
        preventive: 'Tingkatkan patroli pencegahan titik api (hotspot) dan pemeliharaan embung penampungan air.'
      },
      'Sampah': {
        urgent: 'Prioritaskan penambahan armada truk sampah dan penertiban TPS liar di bahu jalan serta pusat sentra pasar.',
        preventive: 'Pertahankan jadwal pengangkutan sampah teratur serta edukasi pemilahan sampah lingkungan.'
      },
      'Air Bersih & Sanitasi': {
        urgent: 'Prioritaskan percepatan perbaikan kebocoran pipa jaringan PDAM dan perluasan sambungan air bersih layak konsumsi.',
        preventive: 'Jaga stabilitas distribusi debit air perpipaan serta pengawasan mutu baku air bersih.'
      },
      'Ruang Terbuka Hijau': {
        urgent: 'Prioritaskan perawatan kanopi pohon peneduh yang rawan tumbang dan revitalisasi fasilitas taman kota.',
        preventive: 'Lanjutkan pemeliharaan vegetasi sabuk hijau dan penghijauan sempadan ruang publik.'
      },
      'Tata Ruang & Pemukiman': {
        urgent: 'Prioritaskan tertib perizinan bangunan gedung (PBG), penataan sempadan sungai, dan penataan permukiman kumuh.',
        preventive: 'Tegakkan pengawasan kepatuhan zonasi tata ruang wilayah (RTRW) secara konsisten.'
      },
      'Fasilitas Publik': {
        urgent: 'Prioritaskan perbaikan lampu Penerangan Jalan Umum (PJU) yang padam serta pemeliharaan fasilitas umum sosial.',
        preventive: 'Lakukan pemeriksaan rutin jaringan penerangan jalan dan ketersediaan utilitas publik.'
      },
      'Lainnya': {
        urgent: 'Prioritaskan peningkatan responsivitas aparatur birokrasi, transparansi layanan, dan tindak lanjut aduan warga.',
        preventive: 'Pertahankan standar pelayanan minimal (SPM) dan keterbukaan informasi publik.'
      }
    };

    // 3. Separate sectors into active (count > 0) and zero-count (count === 0)
    const activeCategories = ALL_CATEGORIES.filter(cat => categories[cat] > 0)
      .sort((a, b) => categories[b] - categories[a]);
    const zeroCategories = ALL_CATEGORIES.filter(cat => categories[cat] === 0);

    let narrativeSummary = '';
    let interventionRecommendation = '';

    if (total === 0) {
      // Explicitly list all 9 sectors even when count is zero to maintain consistent reporting structure
      const allZeroSectors = ALL_CATEGORIES.map(c => `${c} (0)`).join(', ');
      narrativeSummary = `Berdasarkan pemantauan seluruh 9 sektor pembangunan resmi (${allZeroSectors}) pada ${selectedRegions.length} wilayah terpilih di Kalimantan Tengah, saat ini belum ada laporan aduan warga yang terekam. Sistem pemantauan wilayah siap menerima dan memetakan masukan masyarakat secara berkala.`;
      interventionRecommendation = 'Pertahankan pemantauan berkala dan implementasi standar operasional preventif pada seluruh 9 sektor pembangunan wilayah.';
    } else {
      // 4. Structured narrative handling ALL 9 sectors dynamically
      let compText = `Berdasarkan analisis komprehensif 9 sektor pembangunan daerah terhadap ${total} aspirasi masyarakat pada ${selectedRegions.length} wilayah terpilih di Kalimantan Tengah: `;

      if (activeCategories.length === ALL_CATEGORIES.length) {
        // Seluruh 9 sektor memiliki laporan aktif
        const allList = activeCategories.map(c => `${c} (${categories[c]})`).join(', ');
        compText += `distribusi aspirasi terlaporkan merata di seluruh 9 sektor resmi: ${allList}.`;
      } else {
        // Ada sektor aktif dan sektor dengan 0 laporan
        const activeList = activeCategories.map(c => {
          const count = categories[c];
          const pct = Math.round((count / total) * 100);
          return `${c} (${count} aspirasi / ${pct}%)`;
        }).join(', ');

        const zeroList = zeroCategories.map(c => `${c} (0)`).join(', ');

        compText += `konsentrasi isu terlaporkan terpusat pada sektor ${activeList}. `;
        compText += `Sementara ${zeroCategories.length} sektor lainnya saat ini mencatatkan 0 aduan (terpantau nihil keluhan): ${zeroList}.`;
      }

      // Kategori dengan sentimen negatif/keluhan tertinggi
      const categoriesByNeg = [...activeCategories].sort(
        (a, b) => categorySentiments[b].Negative - categorySentiments[a].Negative
      );
      const topNegCat = categoriesByNeg.find(c => categorySentiments[c].Negative > 0);

      // Kategori dengan respon positif/apresiasi tertinggi
      const categoriesByPos = [...activeCategories].sort(
        (a, b) => categorySentiments[b].Positive - categorySentiments[a].Positive
      );
      const topPosCat = categoriesByPos.find(c => categorySentiments[c].Positive > 0);

      // Evaluasi Sentimen Kritis & Apresiasi
      let sentText = '';
      if (topNegCat && categorySentiments[topNegCat].Negative > 0) {
        const negCount = categorySentiments[topNegCat].Negative;
        sentText += ` Catatan keluhan dan kendala warga paling kritis tertuju pada isu ${topNegCat} (${negCount} catatan keluhan membutuhkan atensi segera).`;
      }

      if (topPosCat && categorySentiments[topPosCat].Positive > 0) {
        const posCount = categorySentiments[topPosCat].Positive;
        sentText += ` Apresiasi positif masyarakat tercatat pada bidang ${topPosCat} (${posCount} respon apresiatif).`;
      } else if (sentiments.Negative > 0 && sentiments.Positive === 0) {
        sentText += ` Seluruh laporan aktif menyoroti kebutuhan perbaikan fisik dan tindak lanjut responsif instansi terkait.`;
      }

      narrativeSummary = `${compText}${sentText}`;

      // 5. Dynamic recommendation explicitly handling active issue sector and zero-count sectors
      const targetCat = topNegCat || activeCategories[0] || 'Lainnya';
      const urgentRec = SECTOR_POLICY_ACTIONS[targetCat]?.urgent || 'Prioritaskan koordinasi terpadu terhadap isu utama yang disuarakan warga.';

      if (zeroCategories.length > 0) {
        interventionRecommendation = `${urgentRec} Untuk ${zeroCategories.length} sektor yang mencatatkan 0 aduan, pertahankan pengawasan preventif dan pemeliharaan berkala.`;
      } else {
        interventionRecommendation = urgentRec;
      }
    }

    return {
      totalComments: total,
      categoryDistribution: categories,
      sentimentDistribution: sentiments,
      regionDistribution: regions,
      narrativeSummary,
      interventionRecommendation
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

  const handleSelectOnlyRegion = (region: KaltengRegion) => {
    setSelectedRegions([region]);
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

  // Handler when new aspiration is submitted (Synced Real-Time across all browsers)
  const handleAspirationSubmitted = async (newComment: CommentData) => {
    // 1. Optimistic instant local update
    setData(prev => {
      if (prev.some(item => item.id === newComment.id)) return prev;
      return [newComment, ...prev];
    });
    setSuccessToast(`Aspirasi warga untuk ${newComment.region} berhasil dicatat & disinkronkan ke seluruh browser.`);
    setTimeout(() => setSuccessToast(null), 5000);

    // 2. Cloud Firestore real-time persistence
    try {
      await saveAspirationToCloud(newComment);
      setIsCloudConnected(true);
    } catch (e) {
      console.warn('Gagal menyinkronkan aspirasi ke cloud:', e);
    }
  };

  // Trigger protected actions (Requires Authority Passcode)
  const handleRequestHeuristicGuide = () => {
    setSecurityAction('open_heuristic');
    setIsSecurityModalOpen(true);
  };

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

  // Multi-Select and Checkbox Status Computation
  const isAllFilteredSelected = filteredData.length > 0 && filteredData.every(item => selectedRowIds.includes(item.id));
  const isSomeFilteredSelected = filteredData.some(item => selectedRowIds.includes(item.id)) && !isAllFilteredSelected;

  useEffect(() => {
    if (selectAllCheckboxRef.current) {
      selectAllCheckboxRef.current.indeterminate = isSomeFilteredSelected;
    }
  }, [isSomeFilteredSelected]);

  const handleToggleSelectRow = (id: string) => {
    setSelectedRowIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    if (isAllFilteredSelected) {
      const filteredIdSet = new Set(filteredData.map(d => d.id));
      setSelectedRowIds(prev => prev.filter(id => !filteredIdSet.has(id)));
    } else {
      const allFilteredIds = filteredData.map(d => d.id);
      setSelectedRowIds(prev => Array.from(new Set([...prev, ...allFilteredIds])));
    }
  };

  const handleClearSelection = () => {
    setSelectedRowIds([]);
  };

  // Modus 1: Hapus Selektif (Partial Delete) - Membuka Modal Autentikasi Sandi
  const handleRequestDeleteSelected = (specificIds?: string[]) => {
    const targetIds = specificIds && specificIds.length > 0 ? specificIds : selectedRowIds;
    if (targetIds.length === 0) {
      setSuccessToast('Silakan pilih minimal satu data aspirasi untuk dihapus.');
      setTimeout(() => setSuccessToast(null), 3500);
      return;
    }
    setPendingDeleteIds(targetIds);
    setIsDeletionModalOpen(true);
  };

  // Modus 2: Kosongkan Data (Dinamis: Mode A jika ada yang dicentang, Mode B jika tidak ada yang dicentang)
  const handleRequestClearAll = () => {
    if (data.length === 0) {
      setSuccessToast('Tidak ada data aspirasi untuk dikosongkan.');
      setTimeout(() => setSuccessToast(null), 3000);
      return;
    }
    if (selectedRowIds.length > 0) {
      // MODE A: Ada item yang dicentang -> Hapus Selektif
      setPendingDeleteIds(selectedRowIds);
    } else {
      // MODE B: Tidak ada item yang dicentang -> Kosongkan Total Seluruh Data Platform
      setPendingDeleteIds([]);
    }
    setIsDeletionModalOpen(true);
  };

  // Eksekusi Penghapusan yang HANYA dijalankan setelah kata sandi "EvanGantenk6f045" diverifikasi sah
  const handleExecuteDeletion = (idsToDelete: string[]) => {
    if (idsToDelete && idsToDelete.length > 0) {
      // MODE A: Eksekusi Hapus Selektif
      const count = idsToDelete.length;
      const updated = deleteSelectedStoredComments(idsToDelete);
      setData(updated);
      setSelectedRowIds(prev => prev.filter(id => !idsToDelete.includes(id)));
      setPendingDeleteIds([]);
      setSuccessToast(`✓ Berhasil menghapus ${count} data aspirasi terpilih dari basis data.`);
      setTimeout(() => setSuccessToast(null), 5000);
    } else {
      // MODE B: Eksekusi Kosongkan Total
      const empty = clearAllStoredComments();
      setData(empty);
      setSelectedRowIds([]);
      setPendingDeleteIds([]);
      setSuccessToast('✓ Seluruh data aspirasi warga berhasil dikosongkan dari sistem dan cloud.');
      setTimeout(() => setSuccessToast(null), 5000);
    }
    setIsDeletionModalOpen(false);
  };

  // Trigger Print to PDF (Protected by cryptographic authority validation)
  const handleRequestPrintPdf = () => {
    if (filteredData.length === 0) {
      setSuccessToast('Tidak ada data aspirasi yang cocok dengan filter aktif untuk dicetak.');
      setTimeout(() => setSuccessToast(null), 4000);
      return;
    }
    setSecurityAction('print_pdf');
    setIsSecurityModalOpen(true);
  };

  // Trigger manual cloud sync to guarantee Google AI Studio & Publish link data equality
  const handleManualCloudSync = async () => {
    setIsManualSyncing(true);
    setSuccessToast('Menyinkronkan data dengan basis data Cloud Firestore...');
    try {
      const synced = await reconcileAndSyncAspirations(data);
      setData(synced);
      saveComments(synced);
      setIsCloudConnected(true);
      setSuccessToast(`✓ Berhasil disinkronkan! ${synced.length} aspirasi aktif di cloud & seluruh platform.`);
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err) {
      setSuccessToast('Gagal melakukan sinkronisasi cloud. Periksa koneksi internet.');
      setTimeout(() => setSuccessToast(null), 4000);
    } finally {
      setIsManualSyncing(false);
    }
  };

  // Optional: Load sample demo dataset for previewing visualizations
  const handleLoadDemoData = () => {
    const demo = loadDemoSampleData();
    setData(demo);
    setSelectedRegions([...KALTENG_REGIONS]);
    setSuccessToast('Dataset contoh simulasi berhasil dimuat & disinkronkan ke cloud.');
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

          const rawCat = row.kategori || row.category || '';
          const rawSent = row.sentimen || row.sentiment || '';
          const author = row.nama || row.author || 'Warga Anonim';

          // Leverage expanded intelligent classification & text heuristics
          const heuristic = analyzeAspirationIntelligent(
            rawText, 
            ALL_CATEGORIES.includes(rawCat as Category) ? (rawCat as Category) : undefined
          );

          const finalCategory: Category = (rawCat && ALL_CATEGORIES.includes(rawCat as Category) && rawCat !== 'Lainnya')
            ? (rawCat as Category)
            : heuristic.category;

          const finalSentiment: Sentiment = ['Positive', 'Negative', 'Neutral'].includes(rawSent)
            ? (rawSent as Sentiment)
            : rawSent === 'Positif' ? 'Positive'
            : rawSent === 'Negatif' ? 'Negative'
            : heuristic.sentiment;

          validRows.push({
            id: `CSV-${String(i + 1).padStart(4, '0')}-${Date.now().toString(36)}`,
            author: String(author).trim() || 'Warga Anonim',
            createdAt: new Date().toISOString(),
            text: rawText,
            region: stdRegion,
            category: finalCategory,
            sentiment: finalSentiment,
            processed: true,
          });
        });

        if (validRows.length > 0) {
          const merged = [...validRows, ...data];
          saveComments(merged);
          setData(merged);
          setDroppedRowsCount(dropped);
          setSuccessToast(`${validRows.length} aspirasi baru berhasil diimpor & disinkronkan ke seluruh browser.`);
          setTimeout(() => setSuccessToast(null), 5000);

          // Sync imported dataset to Cloud Firestore
          batchSaveAspirationsToCloud(validRows).catch(err => {
            console.error('Batch sync CSV ke cloud gagal:', err);
          });
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

  // Callback executed ONLY upon successful cryptographic authorization
  const handleSecuritySuccess = () => {
    if (securityAction === 'print_pdf') {
      setIsGeneratingPdf(true);
      setSuccessToast('Menyiapkan dokumen PDF laporan eksekutif analisis regional...');
      setTimeout(async () => {
        try {
          const result = await generateExecutivePdfReport({
            filteredData,
            summary,
            selectedRegions,
            selectedCategories,
            selectedSentiments,
            totalAllData: data.length
          });
          setIsGeneratingPdf(false);
          if (result.success) {
            setSuccessToast(`✓ Laporan resmi PDF "${result.filename}" berhasil dicetak & diunduh!`);
            setTimeout(() => setSuccessToast(null), 5000);
          } else {
            setSuccessToast(`Gagal memproduksi dokumen PDF: ${result.error || 'Terjadi kesalahan sistem'}`);
            setTimeout(() => setSuccessToast(null), 5000);
          }
        } catch (err: any) {
          setIsGeneratingPdf(false);
          console.error('PDF error:', err);
          setSuccessToast('Terjadi kendala teknis saat memproduksi dokumen PDF.');
          setTimeout(() => setSuccessToast(null), 5000);
        }
      }, 100);
    } else if (securityAction === 'clear_data') {
      const empty = clearAllStoredComments();
      setData(empty);
      clearAllAspirationsFromCloud().catch(err => console.error(err));
      setSuccessToast('Semua data aspirasi telah dikosongkan di seluruh browser!');
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
    } else if (securityAction === 'open_heuristic') {
      setIsHeuristicGuideOpen(true);
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
          <div className={`relative w-80 max-w-[85vw] h-full p-5 sm:p-6 flex flex-col gap-4 sm:gap-5 z-10 shadow-2xl overflow-y-auto transition-colors ${
            isDark ? 'bg-[#141722] border-r border-[#242B3C] text-gray-200' : 'bg-white border-r border-[#E2E8F0] text-slate-800'
          }`}>
            {/* Drawer Header & Close Button */}
            <div className={`flex items-center justify-between border-b pb-4 ${isDark ? 'border-[#242B3C]' : 'border-[#E2E8F0]'}`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center border border-blue-600/20 text-[#2563EB]">
                  <Activity className="w-5 h-5 stroke-[1.75]" />
                </div>
                <div>
                  <span className={`font-bold text-base tracking-tight block leading-tight ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>
                    CityPulse Kalteng
                  </span>
                  <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-[#64748B]'}`}>
                    Intelijen Aspirasi & Tata Ruang
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className={`p-2 rounded-xl transition-colors ${
                  isDark ? 'text-gray-400 hover:text-white hover:bg-[#1E2333]' : 'text-slate-500 hover:text-[#0F172A] hover:bg-slate-100'
                }`}
                aria-label="Tutup Menu"
              >
                <X className="w-5 h-5 stroke-[1.75]" />
              </button>
            </div>

            {/* Mobile Primary Action Button: Min height 48px, solid primary, left icon */}
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                handleOpenAspirationForm(null);
              }}
              className="w-full h-12 min-h-[48px] flex items-center justify-center gap-2.5 px-4 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-sm shadow-sm transition-all active:scale-[0.99]"
            >
              <MessageSquarePlus className="w-5 h-5 stroke-[1.75]" />
              <span>Sampaikan Aspirasi Warga</span>
            </button>

            {/* Mobile Navigation Links */}
            <nav className="flex flex-col gap-1.5">
              <button 
                onClick={() => {
                  setActiveTab('dashboard');
                  setIsMobileMenuOpen(false);
                }}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
                  activeTab === 'dashboard' 
                    ? 'bg-transparent text-[#2563EB] border border-[#2563EB] shadow-xs' 
                    : isDark ? 'text-gray-400 hover:text-white hover:bg-[#1C2130] border border-transparent' : 'text-[#475569] hover:text-[#0F172A] hover:bg-slate-100 border border-transparent'
                }`}
              >
                <Activity className="w-4 h-4 stroke-[1.75]" />
                <span>Dashboard Perencanaan</span>
              </button>

              <button 
                onClick={() => {
                  setActiveTab('spatial');
                  setIsMobileMenuOpen(false);
                }}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
                  activeTab === 'spatial' 
                    ? 'bg-transparent text-[#2563EB] border border-[#2563EB] shadow-xs' 
                    : isDark ? 'text-gray-400 hover:text-white hover:bg-[#1C2130] border border-transparent' : 'text-[#475569] hover:text-[#0F172A] hover:bg-slate-100 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Map className="w-4 h-4 stroke-[1.75]" />
                  <span>Peta Spasial Sentimen</span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                  isDark ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/40' : 'bg-[#DCFCE7] text-[#15803D] border border-[#BBF7D0]'
                }`}>
                  Kalteng
                </span>
              </button>

              <button 
                onClick={() => {
                  setActiveTab('explore');
                  setIsMobileMenuOpen(false);
                }}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
                  activeTab === 'explore' 
                    ? 'bg-transparent text-[#2563EB] border border-[#2563EB] shadow-xs' 
                    : isDark ? 'text-gray-400 hover:text-white hover:bg-[#1C2130] border border-transparent' : 'text-[#475569] hover:text-[#0F172A] hover:bg-slate-100 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Layers className="w-4 h-4 stroke-[1.75]" />
                  <span>Daftar Aspirasi Warga</span>
                </div>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-mono ${
                  isDark ? 'bg-[#242A3B] text-gray-300' : 'bg-slate-100 text-slate-700'
                }`}>
                  {filteredData.length}
                </span>
              </button>
            </nav>

            {/* Cloud Real-Time Status Pill in Mobile */}
            <div className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
              isCloudConnected
                ? isDark ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : isDark ? 'bg-[#181C28] border-[#242A3B] text-gray-400' : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isCloudConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
                <span className="font-medium">Sinkronisasi Cloud Real-Time</span>
              </div>
              <span className="text-[10px] font-bold uppercase">{isCloudConnected ? 'Aktif' : 'Menghubungkan'}</span>
            </div>

            {/* Mobile Data Management (Protected by Passcode) */}
            <div className={`p-5 rounded-2xl border space-y-3 text-xs ${
              isDark ? 'bg-[#181C28] border-[#242A3B]' : 'bg-white border-[#E2E8F0] shadow-sm'
            }`}>
              <div className="text-[11px] font-bold uppercase tracking-wider flex items-center justify-between text-[#64748B]">
                <span>Manajemen Data</span>
                <span className="flex items-center gap-1 text-amber-600 text-[10px] font-semibold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                  <Lock className="w-2.5 h-2.5" /> Terkunci
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleRequestPrintPdf();
                  }}
                  disabled={filteredData.length === 0 || isGeneratingPdf}
                  title="Cetak Laporan PDF (Akses Terkunci)"
                  className={`p-2.5 rounded-xl border text-center flex items-center justify-center gap-2 font-semibold text-xs transition-all col-span-2 disabled:opacity-40 ${
                    isDark 
                      ? 'bg-purple-950/20 border-purple-500/30 text-purple-300 hover:bg-purple-900/30' 
                      : 'bg-[#F3E8FF] border-[#E9D5FF] text-[#7E22CE] hover:bg-purple-100 shadow-2xs'
                  }`}
                >
                  <Printer className="w-4 h-4 text-[#7E22CE] stroke-[1.75]" />
                  <span>{isGeneratingPdf ? 'Memproses PDF...' : 'Cetak Laporan PDF (A4)'}</span>
                  <Lock className="w-3 h-3 text-amber-500 ml-auto" />
                </button>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleRequestImport();
                  }}
                  title="Impor Berkas CSV (Akses Terkunci)"
                  className={`p-2.5 rounded-xl border text-center flex flex-col items-center gap-1.5 font-semibold text-xs transition-all ${
                    isDark ? 'bg-[#1F2433] border-[#2E364C] text-blue-400 hover:bg-[#282F42]' : 'bg-white border-[#E2E8F0] text-slate-700 hover:bg-slate-50 shadow-2xs'
                  }`}
                >
                  <Upload className="w-4 h-4 text-[#2563EB] stroke-[1.75]" />
                  <span>Impor CSV</span>
                </button>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleRequestExport();
                  }}
                  disabled={filteredData.length === 0}
                  title="Ekspor Data Aspirasi (Akses Terkunci)"
                  className={`p-2.5 rounded-xl border text-center flex flex-col items-center gap-1.5 font-semibold text-xs transition-all disabled:opacity-40 ${
                    isDark ? 'bg-[#1F2433] border-[#2E364C] text-emerald-400 hover:bg-[#282F42]' : 'bg-white border-[#E2E8F0] text-slate-700 hover:bg-slate-50 shadow-2xs'
                  }`}
                >
                  <Download className="w-4 h-4 text-emerald-600 stroke-[1.75]" />
                  <span>Ekspor Data</span>
                </button>
              </div>
            </div>

            {/* Mobile Theme Toggle */}
            <div className={`p-4 rounded-xl border flex items-center justify-between ${
              isDark ? 'bg-[#181C28] border-[#242A3B]' : 'bg-slate-50 border-[#E2E8F0]'
            }`}>
              <div className="flex items-center gap-2">
                {isDark ? <Moon className="w-4 h-4 text-blue-400 stroke-[1.75]" /> : <Sun className="w-4 h-4 text-amber-500 stroke-[1.75]" />}
                <span className="text-xs font-semibold">{isDark ? 'Mode Gelap' : 'Mode Terang'}</span>
              </div>
              <button
                onClick={toggleTheme}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isDark 
                    ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' 
                    : 'bg-[#2563EB] text-white shadow-xs'
                }`}
              >
                {isDark ? 'Ganti Terang' : 'Ganti Gelap'}
              </button>
            </div>

            {/* Mobile Developer Profile Card */}
            <div className={`mt-auto p-5 rounded-2xl border space-y-3 ${
              isDark ? 'bg-gradient-to-b from-[#181C28] to-[#12151F] border-[#262E44]' : 'bg-white border-[#E2E8F0] shadow-sm'
            }`}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-emerald-500 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                  E
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-bold text-[#2563EB] uppercase tracking-wider">Inisiator & Pengembang</div>
                  <div className={`text-xs font-bold truncate ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>Evan</div>
                  <div className="text-[10px] text-emerald-600 truncate font-medium">Ahli Muda PWK (Jenjang 7 LPJK/BNSP)</div>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsDeveloperModalOpen(true);
                }}
                className={`w-full py-2 px-3 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-2 ${
                  isDark ? 'bg-[#1D2232] hover:bg-[#252C40] text-blue-300 border-blue-500/20' : 'bg-slate-50 hover:bg-slate-100 text-[#2563EB] border-[#E2E8F0]'
                }`}
              >
                <span>Profil & Kredensial Evan</span>
                <ExternalLink className="w-3.5 h-3.5 stroke-[1.75]" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DESKTOP SIDEBAR NAVIGATION */}
      <aside className={`hidden lg:flex flex-col w-72 border-r p-5 gap-5 shrink-0 select-none overflow-y-auto scrollbar-thin transition-colors ${
        isDark ? 'bg-[#141722] border-[#242B3C]' : 'bg-white border-[#E2E8F0] shadow-sm'
      }`}>
        {/* Brand & Purpose */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center border border-blue-600/20 text-[#2563EB]">
            <Activity className="w-5 h-5 stroke-[1.75]" />
          </div>
          <div>
            <span className={`font-bold text-base tracking-tight block leading-tight ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>
              CityPulse Kalteng
            </span>
            <span className={`text-xs font-normal ${isDark ? 'text-gray-400' : 'text-[#64748B]'}`}>
              Intelijen Aspirasi & Tata Ruang
            </span>
          </div>
        </div>

        {/* PRIMARY CTA: Sampaikan Aspirasi Warga (Min height 48px, solid primary, left icon) */}
        <button
          onClick={() => handleOpenAspirationForm(null)}
          className="w-full h-12 min-h-[48px] flex items-center justify-center gap-2.5 px-4 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-sm shadow-sm transition-all active:scale-[0.99]"
        >
          <MessageSquarePlus className="w-5 h-5 stroke-[1.75]" />
          <span>Sampaikan Aspirasi Warga</span>
        </button>

        {/* Navigation Tabs (Secondary: Outlined / Ghost format) */}
        <nav className="flex flex-col gap-1.5">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
              activeTab === 'dashboard' 
                ? 'bg-transparent text-[#2563EB] border border-[#2563EB] shadow-xs' 
                : isDark ? 'text-gray-400 hover:text-white hover:bg-[#1C2130] border border-transparent' : 'text-[#475569] hover:text-[#0F172A] hover:bg-slate-100 border border-transparent'
            }`}
          >
            <Activity className="w-4 h-4 stroke-[1.75]" />
            <span>Dashboard Perencanaan</span>
          </button>

          <button 
            onClick={() => setActiveTab('spatial')}
            className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
              activeTab === 'spatial' 
                ? 'bg-transparent text-[#2563EB] border border-[#2563EB] shadow-xs' 
                : isDark ? 'text-gray-400 hover:text-white hover:bg-[#1C2130] border border-transparent' : 'text-[#475569] hover:text-[#0F172A] hover:bg-slate-100 border border-transparent'
            }`}
          >
            <div className="flex items-center gap-3">
              <Map className="w-4 h-4 stroke-[1.75]" />
              <span>Peta Spasial Sentimen</span>
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
              isDark ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/40' : 'bg-[#DCFCE7] text-[#15803D] border border-[#BBF7D0]'
            }`}>
              Kalteng
            </span>
          </button>

          <button 
            onClick={() => setActiveTab('explore')}
            className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
              activeTab === 'explore' 
                ? 'bg-transparent text-[#2563EB] border border-[#2563EB] shadow-xs' 
                : isDark ? 'text-gray-400 hover:text-white hover:bg-[#1C2130] border border-transparent' : 'text-[#475569] hover:text-[#0F172A] hover:bg-slate-100 border border-transparent'
            }`}
          >
            <div className="flex items-center gap-3">
              <Layers className="w-4 h-4 stroke-[1.75]" />
              <span>Daftar Aspirasi Warga</span>
            </div>
            <span className={`text-[11px] px-2 py-0.5 rounded-full font-mono ${
              isDark ? 'bg-[#242A3B] text-gray-300' : 'bg-slate-100 text-slate-700'
            }`}>
              {filteredData.length}
            </span>
          </button>
        </nav>

        {/* KAMUS & MANAJEMEN DATA (DILINDUNGI OTORISASI SISTEM) */}
        <div className={`p-5 rounded-2xl border flex flex-col gap-3 transition-all ${
          isDark ? 'bg-[#181C28]/90 border-[#242A3B]' : 'bg-white border-[#E2E8F0] shadow-sm'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-[#64748B]'}`}>
              Kamus & Manajemen Data
            </span>
            <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
              <Lock className="w-2.5 h-2.5" /> Terkunci
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {/* Kamus Heuristik - Akses Terkunci */}
            <button
              onClick={handleRequestHeuristicGuide}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-xs font-medium transition-all group ${
                isDark 
                  ? 'bg-[#1E2333] hover:bg-[#252C40] border-[#2C344A] text-indigo-300' 
                  : 'bg-white hover:bg-slate-50 border-[#E2E8F0] text-slate-700 shadow-2xs'
              }`}
              title="Buka Kamus & Aturan Heuristik Klasifikasi Cerdas 9 Sektor (Akses Terkunci)"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <BookOpen className="w-4 h-4 text-indigo-500 stroke-[1.75] shrink-0" />
                <span className="truncate">Kamus Heuristik</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                  isDark ? 'bg-purple-950/40 text-purple-300' : 'bg-[#F3E8FF] text-[#7E22CE] border border-[#E9D5FF]'
                }`}>9 Sektor</span>
                <Lock className="w-3 h-3 text-amber-500 shrink-0" />
              </div>
            </button>

            {/* Impor CSV - Akses Terkunci */}
            <button
              onClick={handleRequestImport}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-xs font-medium transition-all group ${
                isDark 
                  ? 'bg-[#1E2333] hover:bg-[#252C40] border-[#2C344A] text-blue-300' 
                  : 'bg-white hover:bg-slate-50 border-[#E2E8F0] text-slate-700 shadow-2xs'
              }`}
              title="Impor Berkas CSV (Akses Terkunci)"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Upload className="w-4 h-4 text-[#2563EB] stroke-[1.75] shrink-0" />
                <span className="truncate">Impor CSV</span>
              </div>
              <Lock className="w-3 h-3 text-amber-500 shrink-0" />
            </button>

            {/* Ekspor Data - Akses Terkunci */}
            <button
              onClick={handleRequestExport}
              disabled={filteredData.length === 0}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-xs font-medium transition-all group disabled:opacity-40 disabled:cursor-not-allowed ${
                isDark 
                  ? 'bg-[#1E2333] hover:bg-[#252C40] border-[#2C344A] text-emerald-300' 
                  : 'bg-white hover:bg-slate-50 border-[#E2E8F0] text-slate-700 shadow-2xs'
              }`}
              title="Unduh Data Aspirasi Terfilter (Akses Terkunci)"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Download className="w-4 h-4 text-emerald-600 stroke-[1.75] shrink-0" />
                <span className="truncate">Ekspor Data</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[11px] font-mono text-slate-500">({filteredData.length})</span>
                <Lock className="w-3 h-3 text-amber-500 shrink-0" />
              </div>
            </button>

            {/* Cetak Laporan PDF - Akses Terkunci */}
            <button
              onClick={handleRequestPrintPdf}
              disabled={filteredData.length === 0 || isGeneratingPdf}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-xs font-semibold transition-all group disabled:opacity-40 disabled:cursor-not-allowed ${
                isDark 
                  ? 'bg-purple-950/20 hover:bg-purple-900/30 border-purple-500/30 text-purple-300' 
                  : 'bg-[#F3E8FF] hover:bg-purple-100 border-[#E9D5FF] text-[#7E22CE] shadow-2xs'
              }`}
              title="Cetak Laporan Eksekutif Resmi Format PDF (Akses Terkunci)"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Printer className="w-4 h-4 text-[#7E22CE] stroke-[1.75] shrink-0" />
                <span className="truncate">{isGeneratingPdf ? 'Memproses PDF...' : 'Cetak Laporan PDF'}</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/15 text-[#7E22CE] font-semibold">A4</span>
                <Lock className="w-3 h-3 text-amber-500 shrink-0" />
              </div>
            </button>
          </div>
        </div>

        {/* Hidden CSV File Input */}
        <input 
          ref={fileInputRef} 
          type="file" 
          accept=".csv" 
          className="hidden" 
          onChange={handleFileUpload} 
        />

        {/* Regional Scope Summary Card */}
        <div className={`p-5 rounded-2xl border text-xs space-y-2.5 ${
          isDark ? 'bg-[#191D2A] border-[#242A3B]' : 'bg-white border-[#E2E8F0] shadow-sm'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>
              <MapPin className="w-4 h-4 text-[#2563EB] stroke-[1.75]" />
              <span>Cakupan Wilayah</span>
            </span>
            <span className="font-mono text-[#2563EB] font-bold text-xs bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
              {selectedRegions.length} / 14
            </span>
          </div>
          <p className={`text-xs leading-relaxed ${isDark ? 'text-gray-400' : 'text-[#64748B]'}`}>
            Mencakup 13 Kabupaten & 1 Kota di Provinsi Kalimantan Tengah.
          </p>
          <div className={`pt-2.5 border-t flex items-center justify-between text-xs ${
            isDark ? 'border-[#242A3B]' : 'border-[#E2E8F0]'
          }`}>
            <button 
              onClick={handleSelectAllRegions}
              className="text-[#2563EB] hover:underline font-medium text-xs"
            >
              Pilih Semua (14)
            </button>
            <button 
              onClick={() => setSelectedRegions(['Kota Palangka Raya'])}
              className={isDark ? 'text-gray-400 hover:text-white' : 'text-[#64748B] hover:text-[#0F172A]'}
            >
              Fokus Ibukota
            </button>
          </div>
        </div>

        {/* Developer & Platform Initiator Profile Card (Evan) */}
        <div className={`mt-auto pt-3 border-t space-y-2.5 ${isDark ? 'border-[#242A3B]' : 'border-[#E2E8F0]'}`}>
          <div className={`p-5 rounded-2xl border space-y-3 ${
            isDark ? 'bg-gradient-to-b from-[#181C28] to-[#12151F] border-[#262E44]' : 'bg-white border-[#E2E8F0] shadow-sm'
          }`}>
            <div className="flex items-center gap-3">
              <div className="relative shrink-0">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-emerald-500 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                  E
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-bold text-[#2563EB] uppercase tracking-wider">Inisiator & Pengembang</div>
                <div className={`text-sm font-bold truncate ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>Evan</div>
                <div className="text-[11px] text-emerald-600 truncate font-medium">Ahli Muda PWK (LPJK/BNSP)</div>
              </div>
            </div>
            <p className={`text-xs leading-relaxed ${isDark ? 'text-gray-400' : 'text-[#64748B]'}`}>
              Perencana Wilayah & Kota tersertifikasi. Pemodelan GIS, big data analytics, dan strategic spatial planning Kalimantan Tengah.
            </p>
            <button
              onClick={() => setIsDeveloperModalOpen(true)}
              className={`w-full py-2 px-3 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-2 ${
                isDark ? 'bg-[#1D2232] hover:bg-[#252C40] text-blue-300 border-blue-500/20' : 'bg-slate-50 hover:bg-slate-100 text-[#2563EB] border-[#E2E8F0]'
              }`}
            >
              <span>Profil & Kredensial Evan</span>
              <ExternalLink className="w-3.5 h-3.5 stroke-[1.75]" />
            </button>
          </div>

          <div className={`text-[11px] text-center leading-tight ${isDark ? 'text-gray-500' : 'text-[#64748B]'}`}>
            CityPulse Kalteng © 2026 • Evan
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT WORKSPACE */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-5 lg:p-6 pb-24 scroll-smooth flex flex-col gap-4 sm:gap-5">
        {/* COMPACT DYNAMIC HEADER BAR */}
        <header className={`flex flex-col md:flex-row md:items-center justify-between gap-3 border-b pb-3.5 transition-colors ${
          isDark ? 'border-[#242B3C]' : 'border-[#E2E8F0]'
        }`}>
          <div className="flex items-center gap-3">
            {/* Hamburger Button for Mobile & Tablet */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className={`lg:hidden p-1.5 rounded-xl border transition-colors ${
                isDark ? 'bg-[#181C28] border-[#262E44] text-gray-300 hover:text-white' : 'bg-white border-[#E2E8F0] text-slate-700 hover:bg-slate-50 shadow-xs'
              }`}
              aria-label="Buka Menu"
            >
              <Menu className="w-5 h-5 stroke-[1.75]" />
            </button>

            <div>
              <div className="flex flex-wrap items-center gap-1.5 mb-1">
                <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  isDark ? 'bg-blue-950/40 text-blue-300 border border-blue-800/40' : 'bg-blue-50 text-[#1D4ED8] border border-blue-200'
                }`}>
                  <MapPin className="w-3 h-3 text-[#2563EB] stroke-[1.75]" />
                  Provinsi Kalimantan Tengah
                </span>
                <span className={`text-[11px] ${isDark ? 'text-gray-400' : 'text-[#64748B]'}`}>
                  • CityPulse Kalteng
                </span>
              </div>
              <h1 className={`text-lg sm:text-xl font-bold tracking-tight transition-all duration-200 ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>
                {activeTab === 'dashboard' && 'Dashboard Aspirasi & Perencanaan Spasial'}
                {activeTab === 'spatial' && 'Peta Spasial Sentimen'}
                {activeTab === 'explore' && 'Log & Manajemen Aspirasi Warga'}
              </h1>
              <p className={`text-xs mt-0.5 leading-snug transition-all duration-200 ${isDark ? 'text-gray-400' : 'text-[#475569]'}`}>
                {activeTab === 'dashboard' && 'Ringkasan indikator kunci dan analisis sentimen publik Kalimantan Tengah.'}
                {activeTab === 'spatial' && 'Eksplorasi geospasial interaktif isu wilayah per kabupaten/kota.'}
                {activeTab === 'explore' && 'Arsip masukan masyarakat terstruktur sebagai pertimbangan perencanaan tata ruang.'}
              </p>
            </div>
          </div>

          {/* Action Bar (Bersih & Fokus: Cloud Sync, Theme, Profil Pengembang) */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Cloud Real-Time Sync Indicator & Manual Trigger */}
            <button
              onClick={handleManualCloudSync}
              disabled={isManualSyncing}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                isCloudConnected 
                  ? isDark 
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20' 
                    : 'bg-[#DCFCE7] border-[#BBF7D0] text-[#15803D] hover:bg-emerald-100 shadow-2xs'
                  : isDark
                    ? 'bg-[#1A1E2C] border-[#2B344C] text-gray-400 hover:bg-[#22283A]'
                    : 'bg-white border-[#E2E8F0] text-slate-600 hover:bg-slate-50 shadow-2xs'
              }`}
              title="Sinkronisasi otomatis aktif antar-sesi pengguna (Klik untuk sinkronisasi ulang)"
            >
              <span className={`w-2 h-2 rounded-full ${isManualSyncing ? 'bg-blue-500 animate-spin' : isCloudConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
              <span className="hidden sm:inline">{isManualSyncing ? 'Sinkronisasi...' : isCloudConnected ? 'Cloud Sync Aktif' : 'Hubungkan Cloud'}</span>
              <RefreshCw className={`w-3.5 h-3.5 opacity-70 stroke-[1.75] ${isManualSyncing ? 'animate-spin' : ''}`} />
            </button>

            {/* THEME TOGGLE BUTTON (LIGHT / DARK) */}
            <button
              onClick={toggleTheme}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                isDark 
                  ? 'bg-[#1A1E2C] border-[#2B344C] text-amber-300 hover:bg-[#22283A]' 
                  : 'bg-white border-[#E2E8F0] text-slate-700 hover:bg-slate-50 shadow-xs'
              }`}
              title={isDark ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
              aria-label="Ganti Tema Tampilan"
            >
              {isDark ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400 stroke-[1.75]" />
                  <span className="hidden sm:inline text-gray-200">Mode Terang</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-slate-600 stroke-[1.75]" />
                  <span className="hidden sm:inline text-slate-700">Mode Gelap</span>
                </>
              )}
            </button>

            {/* Developer Attribution Button (Evan) */}
            <button
              onClick={() => setIsDeveloperModalOpen(true)}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-left group transition-all ${
                isDark 
                  ? 'bg-[#1A1E2C] border-[#2B344C] hover:border-blue-500/50 hover:bg-[#22283A]' 
                  : 'bg-white border-[#E2E8F0] hover:border-blue-300 hover:bg-slate-50 shadow-xs'
              }`}
              title="Lihat Profil Inisiator & Pengembang Platform (Evan - Ahli Muda PWK)"
            >
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-600 via-indigo-600 to-emerald-500 flex items-center justify-center text-white font-bold text-[11px] shadow-xs">
                E
              </div>
              <div className="flex flex-col pr-0.5">
                <span className={`text-[9px] leading-tight ${isDark ? 'text-gray-400' : 'text-[#64748B]'}`}>Inisiator</span>
                <span className={`text-[11px] font-bold group-hover:text-[#2563EB] transition-colors flex items-center gap-1 ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>
                  Evan
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                </span>
              </div>
            </button>
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

        {/* TABS CONTAINER WRAPPED WITH FRAMER MOTION TRANSITIONS */}
        <AnimatePresence mode="wait">
          {/* TAB 1: DASHBOARD PERENCANAAN */}
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -12, filter: "blur(4px)" }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="space-y-6"
            >
              {/* EXECUTIVE KPI SUMMARY CARDS (HANYA MUNCUL DI TAB DASHBOARD PERENCANAAN) */}
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
                          Proporsi 9 bidang isu pembangunan wilayah akan dihitung otomatis secara proporsional.
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

            {/* ANALISIS TREN SENTIMEN 7 HARI TERAKHIR & DETEKSI DINI LONJAKAN KRITIS */}
            <SentimentTrendAnalysisChart 
              comments={data}
              isDark={isDark}
              onOpenDrillDown={handleOpenDrillDown}
              onRequestExportPdf={handleRequestPrintPdf}
              onNavigateToExplore={(regionOrQuery) => {
                if (regionOrQuery) {
                  setSearchQuery(regionOrQuery);
                }
                setActiveTab('explore');
                window.scrollTo({ top: 300, behavior: 'smooth' });
              }}
              categoryColors={CATEGORY_COLORS}
            />

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
                  <span className={`leading-relaxed ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
                    <strong className={isDark ? 'text-blue-400 font-semibold' : 'text-blue-600 font-semibold'}>
                      Rekomendasi Intervensi:
                    </strong>{' '}
                    {summary.interventionRecommendation || 'Prioritaskan koordinasi lintas instansi terhadap isu utama warga.'}
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
          </motion.div>
        )}

        {/* TAB 2: DAFTAR ASPIRASI & LOG EKSPLORASI */}
        {activeTab === 'explore' && (
          <motion.div
            key="explore"
            initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -12, filter: "blur(4px)" }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className={`p-5 rounded-2xl border space-y-4 transition-all ${
              isDark ? 'bg-[#151822] border-[#242A3B]' : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
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
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-full sm:w-64">
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
                  className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs"
                >
                  <MessageSquarePlus className="w-3.5 h-3.5" />
                  <span>+ Aspirasi</span>
                </button>

                {/* Modus 2: Tombol Kosongkan Semua Data (Danger Theme #E11D48) */}
                <button
                  onClick={handleRequestClearAll}
                  disabled={data.length === 0}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Kosongkan seluruh data aspirasi (Diproteksi Sandi: EvanGantenk6f045)"
                >
                  <Trash2 className="w-3.5 h-3.5 stroke-[2]" />
                  <span className="hidden sm:inline">Kosongkan Semua Data</span>
                  <span className="sm:hidden">Reset Data</span>
                </button>
              </div>
            </div>

            {/* Comments Table with Multi-Select Checkboxes */}
            <div className="overflow-x-auto max-h-[550px]">
              <table className="w-full text-left text-xs border-collapse">
                <thead className={`sticky top-0 z-10 border-b ${
                  isDark ? 'bg-[#191D2A] border-[#242A3B] text-gray-400' : 'bg-slate-100 border-slate-200 text-slate-600'
                }`}>
                  <tr>
                    {/* Header Checkbox (Pilih Semua / Indeterminate) */}
                    <th className="p-3 w-10 text-center">
                      <input 
                        type="checkbox"
                        ref={selectAllCheckboxRef}
                        checked={isAllFilteredSelected}
                        onChange={handleToggleSelectAll}
                        disabled={filteredData.length === 0}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                        title={isAllFilteredSelected ? "Batalkan pilihan semua" : "Pilih semua data terfilter"}
                        aria-label="Pilih semua baris data"
                      />
                    </th>
                    <th className="p-3 font-semibold">Wilayah</th>
                    <th className="p-3 font-semibold">Pengirim & Waktu</th>
                    <th className="p-3 font-semibold">Kategori</th>
                    <th className="p-3 font-semibold">Sentimen</th>
                    <th className="p-3 font-semibold">Isi Aspirasi Warga</th>
                    <th className="p-3 font-semibold text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-[#242A3B]' : 'divide-slate-200'}`}>
                  {filteredData.slice(0, 100).map((row) => {
                    const isSelected = selectedRowIds.includes(row.id);
                    return (
                      <tr 
                        key={row.id} 
                        className={`transition-colors ${
                          isSelected 
                            ? isDark 
                              ? 'bg-rose-950/25 hover:bg-rose-950/35 border-l-2 border-l-rose-500' 
                              : 'bg-rose-50/80 hover:bg-rose-100/70 border-l-2 border-l-rose-500'
                            : isDark ? 'hover:bg-[#1A1E2B]' : 'hover:bg-slate-50'
                        }`}
                      >
                        {/* Row Checkbox (Pilih Individu) */}
                        <td className="p-3 w-10 text-center">
                          <input 
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectRow(row.id)}
                            className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 cursor-pointer accent-rose-600"
                            title="Pilih data ini"
                            aria-label={`Pilih aspirasi dari ${row.author}`}
                          />
                        </td>
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
                          <div className="flex items-center justify-end gap-1.5">
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
                            <button
                              onClick={() => handleRequestDeleteSelected([row.id])}
                              className={`p-1.5 rounded-lg text-[11px] font-medium transition-colors ${
                                isDark 
                                  ? 'hover:bg-rose-500/20 text-gray-400 hover:text-rose-400' 
                                  : 'hover:bg-rose-100 text-slate-400 hover:text-rose-600'
                              }`}
                              title="Hapus entri aspirasi ini (Diproteksi Sandi)"
                              aria-label="Hapus entri"
                            >
                              <Trash2 className="w-3.5 h-3.5 stroke-[1.75]" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
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

            {/* FLOATING CONTEXTUAL ACTION BAR FOR SELECTIVE DELETION */}
            {selectedRowIds.length > 0 && (
              <div className="sticky bottom-4 z-30 w-full bg-slate-900/95 text-white p-3.5 sm:p-4 rounded-2xl shadow-2xl border border-slate-700/80 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 animate-slide-up">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-xs border border-rose-500/30 shrink-0">
                    {selectedRowIds.length}
                  </div>
                  <div>
                    <span className="text-xs font-bold block leading-tight">
                      {selectedRowIds.length} Data Aspirasi Terpilih
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Tersaring dari total {data.length} rekaman di sistem
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleClearSelection}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    Batalkan Pilihan
                  </button>

                  <button
                    onClick={() => handleRequestDeleteSelected()}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-all shadow-md shadow-rose-600/30 flex items-center gap-1.5"
                    title="Hapus data yang dipilih (Wajib Kata Sandi)"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Terpilih ({selectedRowIds.length} Data)</span>
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* TAB 3 / SPATIAL: PETA SPASIAL SENTIMEN WILAYAH KALIMANTAN TENGAH */}
        {activeTab === 'spatial' && (
          <motion.div
            key="spatial"
            initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -12, filter: "blur(4px)" }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="space-y-4"
          >
            <SpatialSentimentMap
              comments={data}
              selectedRegions={selectedRegions}
              onToggleRegion={handleToggleRegion}
              onSelectOnlyRegion={handleSelectOnlyRegion}
              onSelectAllRegions={handleSelectAllRegions}
              onOpenDrillDown={handleOpenDrillDown}
              onOpenAddAspiration={handleOpenAspirationForm}
              categoryColors={CATEGORY_COLORS}
            />
          </motion.div>
        )}
      </AnimatePresence>
      </main>

      {/* OFFICIAL EXECUTIVE STICKY / FIXED BOTTOM FOOTER (GLASSMORPHISM) */}
      <Footer onOpenDeveloperModal={() => setIsDeveloperModalOpen(true)} />

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
        onOpenHeuristicGuide={handleRequestHeuristicGuide}
      />

      {/* FITUR 2.5: KAMUS & HEURISTIK TEKS KLASIFIKASI CERDAS 9 SEKTOR */}
      <HeuristicGuideModal
        isOpen={isHeuristicGuideOpen}
        onClose={() => setIsHeuristicGuideOpen(false)}
      />

      {/* FITUR 3: PROFIL PENGEMBANG & INISIATOR PLATFORM MODAL (DERMA EVAN) */}
      <DeveloperProfileModal
        isOpen={isDeveloperModalOpen}
        onClose={() => setIsDeveloperModalOpen(false)}
      />

      {/* FITUR 4: MODAL OTORISASI AKSES KHUSUS */}
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

      {/* FITUR 5: MODAL MANAJEMEN PENGHAPUSAN DATA DINAMIS (DIPROTEKSI KATA SANDI) */}
      <DataDeletionModal
        isOpen={isDeletionModalOpen}
        selectedIds={pendingDeleteIds}
        selectedItems={data.filter(item => pendingDeleteIds.includes(item.id))}
        totalRecordsCount={data.length}
        onClose={() => {
          setIsDeletionModalOpen(false);
          setPendingDeleteIds([]);
        }}
        onConfirmSuccess={handleExecuteDeletion}
        isDark={isDark}
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
