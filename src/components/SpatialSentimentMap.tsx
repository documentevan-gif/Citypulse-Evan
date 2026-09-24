import React, { useState, useMemo } from 'react';
import { 
  Map, MapPin, Compass, Layers, Filter, Eye, 
  TrendingUp, AlertTriangle, ThumbsUp, MinusCircle, 
  Sparkles, ChevronRight, MessageSquarePlus, ExternalLink,
  ZoomIn, ZoomOut, RotateCcw, Building2, Flame, Droplets,
  Truck, ShieldAlert, CheckCircle2, Info
} from 'lucide-react';
import { CommentData, Category, Sentiment } from '../types';
import { KALTENG_REGIONS, KaltengRegion, KORIDOR_MAP } from '../data/kaltengRegions';
import { useTheme } from '../context/ThemeContext';

interface SpatialSentimentMapProps {
  comments: CommentData[];
  selectedRegions: KaltengRegion[];
  onToggleRegion: (region: KaltengRegion) => void;
  onOpenDrillDown: (region: string) => void;
  onOpenAddAspiration: (region: string) => void;
  categoryColors: Record<Category, string>;
}

// Spatial layout definition for Kalimantan Tengah's 14 administrative zones
export interface SpatialRegionConfig {
  name: KaltengRegion;
  shortName: string;
  capitalCity: string;
  cx: number;
  cy: number;
  corridor: string;
  polygonPoints: string; // SVG path or polygon points for schematic territory
  description: string;
}

export const KALTENG_SPATIAL_CONFIG: Record<KaltengRegion, SpatialRegionConfig> = {
  'Kabupaten Murung Raya': {
    name: 'Kabupaten Murung Raya',
    shortName: 'Murung Raya',
    capitalCity: 'Puruk Cahu',
    cx: 560,
    cy: 70,
    corridor: 'Koridor DAS Barito (Hulu)',
    polygonPoints: '480,25 640,30 670,105 600,125 510,115 470,60',
    description: 'Wilayah pegunungan hulu Sungai Barito, kaya sumber daya alam & kawasan konservasi Muller.'
  },
  'Kabupaten Barito Utara': {
    name: 'Kabupaten Barito Utara',
    shortName: 'Barito Utara',
    capitalCity: 'Muara Teweh',
    cx: 640,
    cy: 145,
    corridor: 'Koridor DAS Barito (Tengah)',
    polygonPoints: '600,125 670,105 725,140 710,195 620,185 585,145',
    description: 'Pusat perekonomian DAS Barito, poros transportasi sungai dan komoditas pertambangan.'
  },
  'Kabupaten Barito Timur': {
    name: 'Kabupaten Barito Timur',
    shortName: 'Barito Timur',
    capitalCity: 'Tamiang Layang',
    cx: 690,
    cy: 255,
    corridor: 'Koridor DAS Barito (Hilir)',
    polygonPoints: '675,200 735,210 740,295 670,305 655,225',
    description: 'Pintu gerbang perbatasan Kalimantan Selatan dengan sentra pertanian dan perkebunan karet.'
  },
  'Kabupaten Barito Selatan': {
    name: 'Kabupaten Barito Selatan',
    shortName: 'Barito Selatan',
    capitalCity: 'Buntok',
    cx: 605,
    cy: 245,
    corridor: 'Koridor DAS Barito (Hilir)',
    polygonPoints: '565,185 655,195 660,295 590,300 550,230',
    description: 'Kawasan danau & rawa basah DAS Barito hilir, simpul perikanan air tawar & konektivitas.'
  },
  'Kabupaten Gunung Mas': {
    name: 'Kabupaten Gunung Mas',
    shortName: 'Gunung Mas',
    capitalCity: 'Kuala Kurun',
    cx: 445,
    cy: 145,
    corridor: 'Koridor Tengah & Pedalaman',
    polygonPoints: '390,95 510,110 560,180 480,195 400,175 375,120',
    description: 'Daerah hulu Sungai Kahayan, perbukitan karst dan potensi agroforestri.'
  },
  'Kota Palangka Raya': {
    name: 'Kota Palangka Raya',
    shortName: 'Palangka Raya',
    capitalCity: 'Palangka Raya (Ibukota)',
    cx: 460,
    cy: 260,
    corridor: 'Koridor Tengah & Ibukota',
    polygonPoints: '415,220 505,215 520,295 430,300 405,250',
    description: 'Ibukota Provinsi, pusat pemerintahan, pendidikan, perdagangan, dan simpul budaya Kalimantan Tengah.'
  },
  'Kabupaten Pulang Pisau': {
    name: 'Kabupaten Pulang Pisau',
    shortName: 'Pulang Pisau',
    capitalCity: 'Pulang Pisau',
    cx: 505,
    cy: 355,
    corridor: 'Koridor Pesisir & Selatan',
    polygonPoints: '455,305 530,300 560,400 495,430 440,360',
    description: 'Kawasan pesisir delta Kahayan, sentra lumbung pangan Food Estate & pelabuhan laut Bahaur.'
  },
  'Kabupaten Kapuas': {
    name: 'Kabupaten Kapuas',
    shortName: 'Kapuas',
    capitalCity: 'Kuala Kapuas',
    cx: 580,
    cy: 375,
    corridor: 'Koridor Pesisir & Selatan',
    polygonPoints: '535,305 605,300 660,350 635,445 545,435',
    description: 'Daerah pertanian pasang surut terbesar di Kalteng, kota air dengan kanal drainase bersejarah.'
  },
  'Kabupaten Katingan': {
    name: 'Kabupaten Katingan',
    shortName: 'Katingan',
    capitalCity: 'Kasongan',
    cx: 350,
    cy: 220,
    corridor: 'Koridor Tengah',
    polygonPoints: '310,130 385,120 410,240 375,320 295,280 290,180',
    description: 'Daerah aliran Sungai Katingan, industri kerajinan rotan & gerbang Taman Nasional Sebangau.'
  },
  'Kabupaten Kotawaringin Timur': {
    name: 'Kabupaten Kotawaringin Timur',
    shortName: 'Kotim (Sampit)',
    capitalCity: 'Sampit',
    cx: 260,
    cy: 300,
    corridor: 'Koridor Barat (Industri)',
    polygonPoints: '220,230 310,240 330,360 250,380 205,310',
    description: 'Pusat ekonomi terbesar Kalteng, pelabuhan dagang Sungai Mentaya & industri kelapa sawit.'
  },
  'Kabupaten Seruyan': {
    name: 'Kabupaten Seruyan',
    shortName: 'Seruyan',
    capitalCity: 'Kuala Pembuang',
    cx: 200,
    cy: 365,
    corridor: 'Koridor Barat & Pesisir',
    polygonPoints: '170,260 225,250 250,380 205,445 150,420 155,330',
    description: 'Kawasan pesisir pantai selatan, Danau Sembuluh & penyangga Taman Nasional Tanjung Puting.'
  },
  'Kabupaten Kotawaringin Barat': {
    name: 'Kabupaten Kotawaringin Barat',
    shortName: 'Kobar (P. Bun)',
    capitalCity: 'Pangkalan Bun',
    cx: 130,
    cy: 310,
    corridor: 'Koridor Barat',
    polygonPoints: '85,245 170,250 175,365 115,395 70,335',
    description: 'Pusat wisata ekologi internasional orangutan, pelabuhan Samudera Kumai, dan simpul maritim barat.'
  },
  'Kabupaten Lamandau': {
    name: 'Kabupaten Lamandau',
    shortName: 'Lamandau',
    capitalCity: 'Nanga Bulik',
    cx: 85,
    cy: 205,
    corridor: 'Koridor Perbatasan Barat',
    polygonPoints: '35,135 135,160 145,240 65,245 25,185',
    description: 'Gerbang barat lintas Kalimantan Tengah menuju Kalimantan Barat, perbukitan & hutan tropis.'
  },
  'Kabupaten Sukamara': {
    name: 'Kabupaten Sukamara',
    shortName: 'Sukamara',
    capitalCity: 'Sukamara',
    cx: 75,
    cy: 385,
    corridor: 'Koridor Pesisir Barat',
    polygonPoints: '40,320 110,325 125,415 65,445 30,390',
    description: 'Bumi Gawi Barinjam, sentra budidaya udang vaname pesisir dan pelabuhan muara Jelai.'
  },
};

export const SpatialSentimentMap: React.FC<SpatialSentimentMapProps> = ({
  comments,
  selectedRegions,
  onToggleRegion,
  onOpenDrillDown,
  onOpenAddAspiration,
  categoryColors
}) => {
  const { isDark } = useTheme();

  // Active viewing mode
  const [viewMode, setViewMode] = useState<'map' | 'cards'>('map');
  const [selectedMapRegion, setSelectedMapRegion] = useState<KaltengRegion>('Kota Palangka Raya');
  const [hoveredRegion, setHoveredRegion] = useState<KaltengRegion | null>(null);
  
  // Layer mode for coloring regions
  const [layerMode, setLayerMode] = useState<'sentiment' | 'urgency' | 'topIssue' | 'volume'>('sentiment');
  
  // Visual toggles
  const [showRoads, setShowRoads] = useState<boolean>(true);
  const [showRivers, setShowRivers] = useState<boolean>(true);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // Compute spatial metrics per region from comments
  const regionStats = useMemo(() => {
    const stats: Record<KaltengRegion, {
      total: number;
      positive: number;
      negative: number;
      neutral: number;
      positivePct: number;
      negativePct: number;
      neutralPct: number;
      categoryCounts: Record<Category, number>;
      topCategory: Category;
      topCategoryCount: number;
      recentQuotes: { author: string; text: string; category: Category; sentiment: Sentiment }[];
      sentimentClimate: 'Puas' | 'Netral' | 'Rawan Keluhan';
    }> = {} as any;

    KALTENG_REGIONS.forEach(reg => {
      const regComments = comments.filter(c => c.region === reg);
      const total = regComments.length;
      let positive = 0;
      let negative = 0;
      let neutral = 0;

      const catCounts: Record<Category, number> = {
        'Transportasi': 0,
        'Drainase & Banjir': 0,
        'Sampah': 0,
        'Air Bersih & Sanitasi': 0,
        'Ruang Terbuka Hijau': 0,
        'Tata Ruang & Pemukiman': 0,
        'Fasilitas Publik': 0,
        'Lainnya': 0
      };

      regComments.forEach(c => {
        if (c.sentiment === 'Positive') positive++;
        else if (c.sentiment === 'Negative') negative++;
        else neutral++;

        if (catCounts[c.category] !== undefined) {
          catCounts[c.category]++;
        }
      });

      // Determine top category
      let topCat: Category = 'Transportasi';
      let maxCount = -1;
      Object.entries(catCounts).forEach(([cat, count]) => {
        if (count > maxCount) {
          maxCount = count;
          topCat = cat as Category;
        }
      });

      const positivePct = total > 0 ? Math.round((positive / total) * 100) : 0;
      const negativePct = total > 0 ? Math.round((negative / total) * 100) : 0;
      const neutralPct = total > 0 ? 100 - positivePct - negativePct : 0;

      let sentimentClimate: 'Puas' | 'Netral' | 'Rawan Keluhan' = 'Netral';
      if (negativePct >= 50) sentimentClimate = 'Rawan Keluhan';
      else if (positivePct >= 50) sentimentClimate = 'Puas';
      else sentimentClimate = 'Netral';

      stats[reg] = {
        total,
        positive,
        negative,
        neutral,
        positivePct,
        negativePct,
        neutralPct,
        categoryCounts: catCounts,
        topCategory: topCat,
        topCategoryCount: maxCount,
        recentQuotes: regComments.slice(0, 3).map(c => ({
          author: c.author,
          text: c.text,
          category: c.category,
          sentiment: c.sentiment
        })),
        sentimentClimate
      };
    });

    return stats;
  }, [comments]);

  // Executive high-level spatial insights
  const spatialHighlights = useMemo(() => {
    let highestSatisfactionRegion: KaltengRegion = KALTENG_REGIONS[0];
    let maxPosPct = -1;

    let highestComplaintRegion: KaltengRegion = KALTENG_REGIONS[0];
    let maxNegPct = -1;

    let mostActiveRegion: KaltengRegion = KALTENG_REGIONS[0];
    let maxTotal = -1;

    KALTENG_REGIONS.forEach(reg => {
      const s = regionStats[reg];
      if (s.positivePct > maxPosPct) {
        maxPosPct = s.positivePct;
        highestSatisfactionRegion = reg;
      }
      if (s.negativePct > maxNegPct) {
        maxNegPct = s.negativePct;
        highestComplaintRegion = reg;
      }
      if (s.total > maxTotal) {
        maxTotal = s.total;
        mostActiveRegion = reg;
      }
    });

    return {
      highestSatisfactionRegion,
      maxPosPct,
      highestComplaintRegion,
      maxNegPct,
      mostActiveRegion,
      maxTotal
    };
  }, [regionStats]);

  // Color generator for each region based on selected layer
  const getRegionFill = (region: KaltengRegion, isHovered: boolean, isSelected: boolean) => {
    const stat = regionStats[region];
    if (!stat || stat.total === 0) return isDark ? '#1A1E2B' : '#E2E8F0';

    let baseColor = isDark ? '#252D3F' : '#CBD5E1';

    if (layerMode === 'sentiment') {
      if (stat.sentimentClimate === 'Puas') {
        baseColor = '#10B981'; // Emerald
      } else if (stat.sentimentClimate === 'Rawan Keluhan') {
        baseColor = '#EF4444'; // Rose
      } else {
        baseColor = '#F59E0B'; // Amber
      }
    } else if (layerMode === 'urgency') {
      // Heatmap of negative complaint percentage
      if (stat.negativePct > 65) baseColor = '#DC2626'; // Deep red
      else if (stat.negativePct > 45) baseColor = '#F87171'; // Coral red
      else if (stat.negativePct > 30) baseColor = '#FBBF24'; // Amber
      else baseColor = '#34D399'; // Emerald
    } else if (layerMode === 'topIssue') {
      baseColor = categoryColors[stat.topCategory] || '#3B82F6';
    } else if (layerMode === 'volume') {
      // Density by comments count
      if (stat.total >= 30) baseColor = '#3B82F6';
      else if (stat.total >= 20) baseColor = '#60A5FA';
      else if (stat.total >= 15) baseColor = '#93C5FD';
      else baseColor = isDark ? '#334155' : '#CBD5E1';
    }

    return baseColor;
  };

  const activeStat = regionStats[selectedMapRegion];
  const activeConfig = KALTENG_SPATIAL_CONFIG[selectedMapRegion];

  return (
    <div className="space-y-6">
      {/* HEADER & LAYER CONTROLS */}
      <div className={`p-5 rounded-2xl border flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-all ${
        isDark ? 'bg-[#151824] border-[#262D42]' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 uppercase tracking-wide">
              <Compass className="w-3.5 h-3.5" />
              <span>Peta Spasial Geografis Sentimen Warga</span>
            </span>
            <span className={`text-[11px] ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
              13 Kabupaten & 1 Kota di Kalimantan Tengah
            </span>
          </div>
          <h2 className={`text-lg sm:text-xl font-bold tracking-tight flex items-center gap-2 ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}>
            <span>Pemetaan Persepsi & Sebaran Masukan Pembangunan</span>
          </h2>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
            Visualisasi geospasial intuitif untuk masyarakat umum dan perencana wilayah guna memantau iklim sentimen serta isu prioritas di setiap kabupaten/kota.
          </p>
        </div>

        {/* CONTROLS: LAYER SELECTOR & VIEW MODE */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {/* Layer Selection Pill Box */}
          <div className={`flex items-center p-1 rounded-xl border ${
            isDark ? 'bg-[#11131B] border-[#242A3B]' : 'bg-slate-100 border-slate-200'
          }`}>
            <button
              onClick={() => setLayerMode('sentiment')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                layerMode === 'sentiment'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : isDark ? 'text-gray-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ThumbsUp className="w-3 h-3" />
              <span>Iklim Sentimen</span>
            </button>
            <button
              onClick={() => setLayerMode('topIssue')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                layerMode === 'topIssue'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : isDark ? 'text-gray-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>Isu Teratas</span>
            </button>
            <button
              onClick={() => setLayerMode('urgency')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                layerMode === 'urgency'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : isDark ? 'text-gray-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Flame className="w-3 h-3" />
              <span>Titik Keluhan</span>
            </button>
          </div>

          {/* View Mode Toggle (Map vs Grid Cards) */}
          <div className={`flex items-center p-1 rounded-xl border ${
            isDark ? 'bg-[#11131B] border-[#242A3B]' : 'bg-slate-100 border-slate-200'
          }`}>
            <button
              onClick={() => setViewMode('map')}
              className={`p-1.5 px-2.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                viewMode === 'map' 
                  ? 'bg-blue-600 text-white' 
                  : isDark ? 'text-gray-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Map className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Peta Spasial</span>
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 px-2.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                viewMode === 'cards' 
                  ? 'bg-blue-600 text-white' 
                  : isDark ? 'text-gray-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">14 Wilayah</span>
            </button>
          </div>
        </div>
      </div>

      {/* QUICK SPATIAL EXECUTIVE STRIP (MUDAH DIPAHAMI WARGA AWAM) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Wilayah Paling Puas */}
        <div className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all ${
          isDark ? 'bg-[#161925] border-emerald-500/25' : 'bg-white border-emerald-200 shadow-sm'
        }`}>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <ThumbsUp className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">
              Sentimen Positif Tertinggi
            </div>
            <div className={`text-xs font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {spatialHighlights.highestSatisfactionRegion.replace('Kabupaten ', 'Kab. ')}
            </div>
            <div className={`text-[11px] ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
              {spatialHighlights.maxPosPct}% aspirasi apresiatif
            </div>
          </div>
        </div>

        {/* Wilayah Paling Rawan Keluhan */}
        <div className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all ${
          isDark ? 'bg-[#161925] border-rose-500/25' : 'bg-white border-rose-200 shadow-sm'
        }`}>
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] text-rose-500 font-bold uppercase tracking-wider">
              Perlu Atensi & Tindak Lanjut
            </div>
            <div className={`text-xs font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {spatialHighlights.highestComplaintRegion.replace('Kabupaten ', 'Kab. ')}
            </div>
            <div className={`text-[11px] ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
              {spatialHighlights.maxNegPct}% keluhan warga
            </div>
          </div>
        </div>

        {/* Partisipasi Suara Terbanyak */}
        <div className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all ${
          isDark ? 'bg-[#161925] border-blue-500/25' : 'bg-white border-blue-200 shadow-sm'
        }`}>
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
            <MapPin className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] text-blue-500 font-bold uppercase tracking-wider">
              Partisipasi Suara Terbanyak
            </div>
            <div className={`text-xs font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {spatialHighlights.mostActiveRegion.replace('Kabupaten ', 'Kab. ')}
            </div>
            <div className={`text-[11px] ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
              {spatialHighlights.maxTotal} masukan warga terdata
            </div>
          </div>
        </div>

        {/* Ibukota Provinsi */}
        <div className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all ${
          isDark ? 'bg-[#161925] border-purple-500/25' : 'bg-white border-purple-200 shadow-sm'
        }`}>
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] text-purple-500 font-bold uppercase tracking-wider">
              Ibukota Provinsi Kalteng
            </div>
            <div className={`text-xs font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Kota Palangka Raya
            </div>
            <div className={`text-[11px] ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
              Pusat koordinasi 14 wilayah
            </div>
          </div>
        </div>
      </div>

      {/* MAIN SPATIAL INTERACTIVE CANVAS VIEW */}
      {viewMode === 'map' ? (
        <div className="grid grid-cols-1 lg:grid-cols-[1.9fr_1.1fr] gap-6">
          {/* SPATIAL SVG MAP CANVAS */}
          <div className={`rounded-2xl border p-4 sm:p-5 flex flex-col relative overflow-hidden shadow-xl transition-all ${
            isDark ? 'bg-[#151824] border-[#242A3B]' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            {/* Top map toolbar */}
            <div className={`flex flex-wrap items-center justify-between gap-3 mb-3 pb-3 border-b z-10 ${
              isDark ? 'border-[#242A3B]' : 'border-slate-200'
            }`}>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  <Map className="w-3.5 h-3.5 text-blue-400" />
                  <span>Skematik Wilayah Kalimantan Tengah</span>
                </span>
                <span className={`text-[10px] hidden sm:inline ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                  (Klik kabupaten/kota untuk melihat detail komprehensif)
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Visual Layer Toggles */}
                <button
                  onClick={() => setShowRoads(prev => !prev)}
                  className={`px-2 py-1 rounded text-[10px] font-semibold border transition-all ${
                    showRoads 
                      ? 'bg-blue-600/20 text-blue-300 border-blue-500/40' 
                      : isDark ? 'bg-[#181B26] text-gray-400 border-[#242A3B]' : 'bg-slate-100 text-slate-500 border-slate-200'
                  }`}
                  title="Tampilkan jalur arteri jalan poros antar-kabupaten"
                >
                  Jalan Poros
                </button>
                <button
                  onClick={() => setShowRivers(prev => !prev)}
                  className={`px-2 py-1 rounded text-[10px] font-semibold border transition-all ${
                    showRivers 
                      ? 'bg-cyan-600/20 text-cyan-300 border-cyan-500/40' 
                      : isDark ? 'bg-[#181B26] text-gray-400 border-[#242A3B]' : 'bg-slate-100 text-slate-500 border-slate-200'
                  }`}
                  title="Tampilkan aliran sungai utama khas Kalteng (Barito, Kahayan, Mentaya)"
                >
                  Sungai Utama
                </button>

                {/* Zoom controls */}
                <div className={`flex items-center border rounded-lg p-0.5 ml-1 ${
                  isDark ? 'bg-[#11131B] border-[#242A3B]' : 'bg-slate-100 border-slate-200'
                }`}>
                  <button
                    onClick={() => setZoomLevel(prev => Math.min(prev + 0.15, 1.45))}
                    className={`p-1 rounded ${isDark ? 'hover:bg-[#202534] text-gray-400 hover:text-white' : 'hover:bg-slate-200 text-slate-600 hover:text-slate-900'}`}
                    title="Perbesar"
                  >
                    <ZoomIn className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => setZoomLevel(prev => Math.max(prev - 0.15, 0.85))}
                    className={`p-1 rounded ${isDark ? 'hover:bg-[#202534] text-gray-400 hover:text-white' : 'hover:bg-slate-200 text-slate-600 hover:text-slate-900'}`}
                    title="Perkecil"
                  >
                    <ZoomOut className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => setZoomLevel(1)}
                    className={`p-1 rounded ${isDark ? 'hover:bg-[#202534] text-gray-400 hover:text-white' : 'hover:bg-slate-200 text-slate-600 hover:text-slate-900'}`}
                    title="Reset Ukuran"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* SVG VIEWPORT */}
            <div className={`w-full h-[470px] rounded-xl border relative overflow-hidden flex items-center justify-center select-none transition-all ${
              isDark ? 'bg-[#0E1017] border-[#1E2333]' : 'bg-slate-50 border-slate-200'
            }`}>
              {/* Subtle background grid pattern */}
              <div 
                className="absolute inset-0 opacity-15 pointer-events-none"
                style={{
                  backgroundImage: 'radial-gradient(#3B82F6 1px, transparent 1px)',
                  backgroundSize: '24px 24px'
                }}
              />

              <svg
                viewBox="0 0 780 470"
                className="w-full h-full transition-transform duration-200"
                style={{ transform: `scale(${zoomLevel})` }}
              >
                <defs>
                  {/* Glowing filters */}
                  <filter id="spatialGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="4" result="glow" />
                    <feComposite in="SourceGraphic" in2="glow" operator="over" />
                  </filter>

                  {/* Gradient for major rivers */}
                  <linearGradient id="riverGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#0284C7" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.4" />
                  </linearGradient>
                </defs>

                {/* LAYER 1: NATURAL RIVERS (SUNGAI BESAR KALIMANTAN TENGAH) */}
                {showRivers && (
                  <g className="transition-opacity duration-300 pointer-events-none">
                    {/* Sungai Barito (Timur) */}
                    <path
                      d="M 570 30 Q 640 100 640 170 T 605 240 T 630 360 T 610 460"
                      fill="none"
                      stroke="url(#riverGrad)"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      opacity="0.6"
                    />
                    <text x="645" y="210" fill="#38BDF8" opacity="0.5" fontSize="8" fontStyle="italic">
                      S. Barito
                    </text>

                    {/* Sungai Kahayan (Tengah - Palangka Raya) */}
                    <path
                      d="M 445 100 Q 450 170 455 240 T 465 290 T 500 440"
                      fill="none"
                      stroke="url(#riverGrad)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      opacity="0.5"
                    />
                    <text x="470" y="320" fill="#38BDF8" opacity="0.5" fontSize="8" fontStyle="italic">
                      S. Kahayan
                    </text>

                    {/* Sungai Mentaya (Sampit - Kotim) */}
                    <path
                      d="M 280 200 Q 270 260 265 310 T 235 430"
                      fill="none"
                      stroke="url(#riverGrad)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      opacity="0.5"
                    />
                    <text x="270" y="360" fill="#38BDF8" opacity="0.5" fontSize="8" fontStyle="italic">
                      S. Mentaya
                    </text>

                    {/* Sungai Arut & Kumai (Kobar) */}
                    <path
                      d="M 125 210 Q 130 270 135 325 T 120 420"
                      fill="none"
                      stroke="url(#riverGrad)"
                      strokeWidth="2"
                      strokeLinecap="round"
                      opacity="0.4"
                    />
                  </g>
                )}

                {/* LAYER 2: LOGISTICS ARTERIES & ROADS (POROS TRANS KALIMANTAN) */}
                {showRoads && (
                  <g className="transition-opacity duration-300 pointer-events-none opacity-40">
                    {/* Trans Kalimantan Poros Selatan (Lamandau - Kobar - Kotim - Katingan - Palangka - Pulang Pisau - Kapuas - Barsel) */}
                    <path
                      d="M 85 205 L 130 310 L 260 300 L 350 220 L 460 260 L 505 355 L 580 375 L 605 245 L 690 255"
                      fill="none"
                      stroke="#FBBF24"
                      strokeWidth="1.8"
                      strokeDasharray="4,4"
                    />
                    {/* Poros Barito Utara & Murung Raya */}
                    <path
                      d="M 605 245 L 640 145 L 560 70"
                      fill="none"
                      stroke="#FBBF24"
                      strokeWidth="1.8"
                      strokeDasharray="4,4"
                    />
                    {/* Poros Palangka Raya ke Gunung Mas */}
                    <path
                      d="M 460 260 L 445 145"
                      fill="none"
                      stroke="#FBBF24"
                      strokeWidth="1.8"
                      strokeDasharray="4,4"
                    />
                  </g>
                )}

                {/* LAYER 3: REGIONAL ADMINISTRATIVE DISTRICT POLICIES (14 WILAYAH) */}
                {KALTENG_REGIONS.map(reg => {
                  const cfg = KALTENG_SPATIAL_CONFIG[reg];
                  const stat = regionStats[reg];
                  const isSelected = selectedMapRegion === reg;
                  const isHovered = hoveredRegion === reg;
                  const fillHex = getRegionFill(reg, isHovered, isSelected);

                  return (
                    <g 
                      key={reg}
                      className="cursor-pointer transition-all duration-200"
                      onClick={() => setSelectedMapRegion(reg)}
                      onMouseEnter={() => setHoveredRegion(reg)}
                      onMouseLeave={() => setHoveredRegion(null)}
                    >
                      {/* Regional territory polygon */}
                      <polygon
                        points={cfg.polygonPoints}
                        fill={fillHex}
                        fillOpacity={isSelected ? 0.88 : isHovered ? 0.72 : 0.45}
                        stroke={isSelected ? '#FFFFFF' : isHovered ? '#60A5FA' : '#2D374D'}
                        strokeWidth={isSelected ? 2.5 : isHovered ? 1.8 : 1}
                        className="transition-all duration-150"
                        filter={isSelected ? 'url(#spatialGlow)' : undefined}
                      />

                      {/* Centroid Region Node Pin */}
                      <circle
                        cx={cfg.cx}
                        cy={cfg.cy}
                        r={isSelected ? 8 : isHovered ? 7 : 5.5}
                        fill={isSelected ? '#FFFFFF' : fillHex}
                        stroke={isSelected ? '#3B82F6' : '#151824'}
                        strokeWidth="2"
                        className="transition-all duration-150"
                      />

                      {/* Capital City Icon Marker (Kota Palangka Raya) */}
                      {reg === 'Kota Palangka Raya' && (
                        <circle
                          cx={cfg.cx}
                          cy={cfg.cy}
                          r="12"
                          fill="none"
                          stroke="#34D399"
                          strokeWidth="1.5"
                          strokeDasharray="2,2"
                          className="animate-spin"
                          style={{ animationDuration: '8s' }}
                        />
                      )}

                      {/* Regional Label */}
                      <text
                        x={cfg.cx}
                        y={cfg.cy - 12}
                        textAnchor="middle"
                        className={`text-[9.5px] font-bold select-none pointer-events-none transition-all duration-150 ${
                          isSelected 
                            ? 'fill-white text-[11px] font-extrabold' 
                            : isHovered 
                            ? 'fill-blue-200' 
                            : 'fill-gray-300'
                        }`}
                      >
                        {cfg.shortName}
                      </text>

                      {/* Percentage pill below label */}
                      <text
                        x={cfg.cx}
                        y={cfg.cy + 18}
                        textAnchor="middle"
                        className="text-[8.5px] select-none pointer-events-none fill-gray-400 font-mono"
                      >
                        {layerMode === 'sentiment' ? (
                          `${stat.positivePct}%+ / ${stat.negativePct}%-`
                        ) : layerMode === 'urgency' ? (
                          `${stat.negativePct}% keluhan`
                        ) : (
                          `${stat.total} data`
                        )}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* FLOATING HOVER TOOLTIP */}
              {hoveredRegion && (
                <div className="absolute top-4 left-4 bg-[#141722]/95 backdrop-blur-md border border-[#2E364E] p-3 rounded-xl shadow-2xl max-w-xs pointer-events-none z-20 animate-fade-in">
                  <div className="flex items-center justify-between gap-2 border-b border-[#242A3B] pb-1.5 mb-1.5">
                    <span className="text-xs font-bold text-white">{hoveredRegion}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-semibold">
                      {KALTENG_SPATIAL_CONFIG[hoveredRegion].capitalCity}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-300">
                    <div>
                      <span className="text-gray-400 block">Total Aspirasi:</span>
                      <span className="font-bold text-white">{regionStats[hoveredRegion].total} masukan</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Isu Terbanyak:</span>
                      <span className="font-bold text-blue-400">{regionStats[hoveredRegion].topCategory}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Kepuasan (Positif):</span>
                      <span className="font-bold text-emerald-400">{regionStats[hoveredRegion].positivePct}%</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Keluhan (Negatif):</span>
                      <span className="font-bold text-rose-400">{regionStats[hoveredRegion].negativePct}%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* MAP LEGEND FOOTER */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#242A3B] mt-3 text-xs text-gray-400">
              <div className="flex flex-wrap items-center gap-4">
                {layerMode === 'sentiment' && (
                  <>
                    <span className="flex items-center gap-1.5 text-[11px]">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span className="text-emerald-300 font-medium">Mayoritas Puas / Apresiatif</span>
                    </span>
                    <span className="flex items-center gap-1.5 text-[11px]">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      <span className="text-amber-300 font-medium">Masukan Berimbang / Netral</span>
                    </span>
                    <span className="flex items-center gap-1.5 text-[11px]">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                      <span className="text-rose-300 font-medium">Tinggi Keluhan / Perlu Solusi</span>
                    </span>
                  </>
                )}

                {layerMode === 'urgency' && (
                  <>
                    <span className="flex items-center gap-1.5 text-[11px]">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
                      <span className="text-rose-400 font-medium">Kritis ({'>'} 65% Keluhan)</span>
                    </span>
                    <span className="flex items-center gap-1.5 text-[11px]">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                      <span className="text-amber-300 font-medium">Moderat (30-65%)</span>
                    </span>
                    <span className="flex items-center gap-1.5 text-[11px]">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                      <span className="text-emerald-300 font-medium">Terkendali ({'<'} 30%)</span>
                    </span>
                  </>
                )}

                {layerMode === 'topIssue' && (
                  <span className="text-[11px] text-gray-300">
                    Warna wilayah menunjukkan kategori masalah yang paling mendominasi di wilayah tersebut.
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-[11px] text-blue-400 font-medium">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Klik wilayah untuk melihat rincian suara warga</span>
              </div>
            </div>
          </div>

          {/* REGIONAL SPATIAL INTELLIGENCE DETAIL PANEL */}
          <div className={`rounded-2xl border p-5 flex flex-col justify-between space-y-4 shadow-xl transition-all ${
            isDark ? 'bg-[#151824] border-[#242A3B]' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            {/* Header info */}
            <div>
              <div className={`flex items-start justify-between gap-3 border-b pb-3 mb-4 ${
                isDark ? 'border-[#242A3B]' : 'border-slate-200'
              }`}>
                <div>
                  <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider block mb-0.5">
                    {activeConfig.corridor}
                  </span>
                  <h3 className={`text-lg font-bold flex items-center gap-2 ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}>
                    <MapPin className="w-4 h-4 text-blue-500" />
                    <span>{selectedMapRegion}</span>
                  </h3>
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                    Pusat Pemerintahan: <strong className={isDark ? 'text-white' : 'text-slate-900'}>{activeConfig.capitalCity}</strong>
                  </p>
                </div>

                <div className="text-right">
                  <span className={`text-xl font-bold block ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {activeStat.total}
                  </span>
                  <span className={`text-[10px] ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Aspirasi Terdata</span>
                </div>
              </div>

              {/* Regional Geographic Note */}
              <p className={`text-xs leading-relaxed p-3 rounded-xl border mb-4 ${
                isDark ? 'bg-[#191D2A] border-[#252B3C] text-gray-300' : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}>
                {activeConfig.description}
              </p>

              {/* SENTIMENT CLIMATE METER / EMPTY STATE */}
              {activeStat.total === 0 ? (
                <div className={`p-4 rounded-xl border text-center space-y-3 mb-4 ${
                  isDark ? 'bg-[#181B26] border-[#252B3C]' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="w-10 h-10 mx-auto rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center border border-blue-500/20">
                    <MessageSquarePlus className="w-5 h-5" />
                  </div>
                  <div>
                    <div className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      Belum Ada Aspirasi di {activeConfig.shortName}
                    </div>
                    <p className={`text-[11px] mt-1 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                      Platform siap untuk uji coba langsung. Jadilah yang pertama menyuarakan masukan pembangunan di wilayah ini.
                    </p>
                  </div>
                  <button
                    onClick={() => onOpenAddAspiration(selectedMapRegion)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-all"
                  >
                    <MessageSquarePlus className="w-3.5 h-3.5" />
                    <span>+ Tulis Aspirasi {activeConfig.shortName}</span>
                  </button>
                </div>
              ) : (
                <>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className={isDark ? 'text-white' : 'text-slate-900'}>Iklim Sentimen Warga</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        activeStat.sentimentClimate === 'Puas'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : activeStat.sentimentClimate === 'Rawan Keluhan'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}>
                        Status: {activeStat.sentimentClimate}
                      </span>
                    </div>

                    {/* Progress bar split */}
                    <div className="w-full h-3 bg-[#1D212E] rounded-full overflow-hidden flex">
                      <div 
                        style={{ width: `${activeStat.positivePct}%` }} 
                        className="bg-emerald-500 h-full" 
                        title={`Positif: ${activeStat.positivePct}%`} 
                      />
                      <div 
                        style={{ width: `${activeStat.neutralPct}%` }} 
                        className="bg-amber-500 h-full" 
                        title={`Netral: ${activeStat.neutralPct}%`} 
                      />
                      <div 
                        style={{ width: `${activeStat.negativePct}%` }} 
                        className="bg-rose-500 h-full" 
                        title={`Negatif: ${activeStat.negativePct}%`} 
                      />
                    </div>

                    {/* Split details */}
                    <div className="grid grid-cols-3 gap-2 text-[11px] text-center pt-1">
                      <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        <span className="block font-bold">{activeStat.positivePct}%</span>
                        <span className={`text-[9px] ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Positif ({activeStat.positive})</span>
                      </div>
                      <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
                        <span className="block font-bold">{activeStat.neutralPct}%</span>
                        <span className={`text-[9px] ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Netral ({activeStat.neutral})</span>
                      </div>
                      <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500 border border-rose-500/20">
                        <span className="block font-bold">{activeStat.negativePct}%</span>
                        <span className={`text-[9px] ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Negatif ({activeStat.negative})</span>
                      </div>
                    </div>
                  </div>

                  {/* TOP ISSUES IN THIS REGION */}
                  <div className="space-y-2 mb-4">
                    <span className={`text-xs font-bold uppercase tracking-wider block ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      Isu Paling Sering Disuarakan di {activeConfig.shortName}
                    </span>
                    <div className="space-y-1.5">
                      {(Object.entries(activeStat.categoryCounts) as [Category, number][])
                        .filter(([_, count]) => count > 0)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 4)
                        .map(([cat, count]) => {
                          const pct = Math.round((count / activeStat.total) * 100);
                          return (
                            <div key={cat} className="space-y-1">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className={`font-medium flex items-center gap-1.5 ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
                                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: categoryColors[cat] }} />
                                  <span>{cat}</span>
                                </span>
                                <span className={`font-mono ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>{count} masukan ({pct}%)</span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-200/50 dark:bg-[#1C202C] rounded-full overflow-hidden">
                                <div 
                                  className="h-full rounded-full transition-all"
                                  style={{ width: `${pct}%`, backgroundColor: categoryColors[cat] }}
                                />
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </>
              )}

              {/* CITIZEN RECENT VOICES */}
              {activeStat.recentQuotes.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-[#242A3B]">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                    Suara Warga Terbaru ({activeConfig.shortName})
                  </span>
                  <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                    {activeStat.recentQuotes.map((q, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-[#181B26] border border-[#242A3B] text-[11px] space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-white">{q.author}</span>
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                            q.sentiment === 'Positive' ? 'text-emerald-400' :
                            q.sentiment === 'Negative' ? 'text-rose-400' : 'text-gray-400'
                          }`}>
                            {q.sentiment}
                          </span>
                        </div>
                        <p className="text-gray-300 leading-snug line-clamp-2 italic">
                          "{q.text}"
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ACTION BUTTONS FOR CITIZENS & PLANNERS */}
            <div className="pt-3 border-t border-[#242A3B] space-y-2">
              <button
                onClick={() => onOpenDrillDown(selectedMapRegion)}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all shadow-md shadow-blue-600/20"
              >
                <span>Lihat Seluruh Aspirasi {activeConfig.shortName}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => onOpenAddAspiration(selectedMapRegion)}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-[#1D2232] hover:bg-[#252C40] text-gray-300 hover:text-white border border-[#2B344C] font-semibold text-xs transition-all"
              >
                <MessageSquarePlus className="w-3.5 h-3.5 text-blue-400" />
                <span>Kirim Aspirasi untuk Wilayah Ini</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* MODE KARTU GRID SPASIAL (14 KABUPATEN & 1 KOTA LENGKAP) */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {KALTENG_REGIONS.map(reg => {
            const cfg = KALTENG_SPATIAL_CONFIG[reg];
            const stat = regionStats[reg];
            const isPalangka = reg === 'Kota Palangka Raya';

            return (
              <div 
                key={reg}
                className={`p-4 rounded-2xl border transition-all hover:border-blue-500/50 flex flex-col justify-between space-y-3 ${
                  isDark ? 'bg-[#151824]' : 'bg-white shadow-sm'
                } ${
                  isPalangka ? 'border-emerald-500/40 shadow-lg shadow-emerald-500/5' : isDark ? 'border-[#242A3B]' : 'border-slate-200'
                }`}
              >
                <div>
                  {/* Card top */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider block ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                        {cfg.capitalCity}
                      </span>
                      <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {cfg.shortName}
                      </h4>
                    </div>

                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      stat.sentimentClimate === 'Puas'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : stat.sentimentClimate === 'Rawan Keluhan'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}>
                      {stat.sentimentClimate}
                    </span>
                  </div>

                  {/* Sentiment breakdown bar */}
                  <div className="space-y-1.5 my-2.5">
                    <div className="w-full h-2 rounded-full bg-[#1F2433] overflow-hidden flex">
                      <div style={{ width: `${stat.positivePct}%` }} className="bg-emerald-500 h-full" />
                      <div style={{ width: `${stat.neutralPct}%` }} className="bg-amber-500 h-full" />
                      <div style={{ width: `${stat.negativePct}%` }} className="bg-rose-500 h-full" />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-gray-400">
                      <span className="text-emerald-400 font-bold">{stat.positivePct}% Positif</span>
                      <span className="text-rose-400 font-bold">{stat.negativePct}% Negatif</span>
                    </div>
                  </div>

                  {/* Top issue */}
                  <div className="p-2 rounded-lg bg-[#181C28] border border-[#222738] text-[11px] flex items-center justify-between">
                    <span className="text-gray-400">Isu Terbanyak:</span>
                    <span className="font-semibold text-white flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: categoryColors[stat.topCategory] }} />
                      <span>{stat.topCategory}</span>
                    </span>
                  </div>
                </div>

                {/* Card footer actions */}
                <div className="pt-2 border-t border-[#242A3B] flex items-center justify-between gap-2">
                  <span className="text-[11px] text-gray-400 font-mono">
                    {stat.total} Masukan
                  </span>

                  <button
                    onClick={() => onOpenDrillDown(reg)}
                    className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
                  >
                    <span>Detail Wilayah</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
