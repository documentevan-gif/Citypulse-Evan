import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  X, Search, MessageSquare, ThumbsUp, MinusCircle, 
  AlertTriangle, Filter, Calendar, User, PlusCircle,
  Tag, MapPin, CheckCircle
} from 'lucide-react';
import { CommentData, Sentiment, Category } from '../types';
import { useTheme } from '../context/ThemeContext';

interface RegionDrillDownModalProps {
  regionName: string | null;
  isOpen: boolean;
  onClose: () => void;
  comments: CommentData[];
  onOpenAddAspiration: (region: string) => void;
}

export const RegionDrillDownModal: React.FC<RegionDrillDownModalProps> = ({
  regionName,
  isOpen,
  onClose,
  comments,
  onOpenAddAspiration,
}) => {
  const { isDark } = useTheme();
  const [activeSentimentTab, setActiveSentimentTab] = useState<'All' | Sentiment>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);

  // Filter comments specifically belonging to this region
  const regionComments = useMemo(() => {
    if (!regionName) return [];
    return comments.filter(c => c.region === regionName);
  }, [comments, regionName]);

  // Sentiment statistics for this region
  const stats = useMemo(() => {
    const total = regionComments.length;
    const positive = regionComments.filter(c => c.sentiment === 'Positive').length;
    const neutral = regionComments.filter(c => c.sentiment === 'Neutral').length;
    const negative = regionComments.filter(c => c.sentiment === 'Negative').length;

    return {
      total,
      positive,
      neutral,
      negative,
      posPct: total > 0 ? Math.round((positive / total) * 100) : 0,
      neuPct: total > 0 ? Math.round((neutral / total) * 100) : 0,
      negPct: total > 0 ? Math.round((negative / total) * 100) : 0,
    };
  }, [regionComments]);

  // Filtered comments inside modal based on tab, category, and search
  const filteredComments = useMemo(() => {
    return regionComments.filter(comment => {
      const matchSentiment = activeSentimentTab === 'All' || comment.sentiment === activeSentimentTab;
      const matchCategory = selectedCategory === 'All' || comment.category === selectedCategory;
      const matchSearch = !searchQuery.trim() || 
        comment.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        comment.author.toLowerCase().includes(searchQuery.toLowerCase());

      return matchSentiment && matchCategory && matchSearch;
    });
  }, [regionComments, activeSentimentTab, selectedCategory, searchQuery]);

  // Reset tab/search when region changes
  useEffect(() => {
    if (isOpen) {
      setActiveSentimentTab('All');
      setSelectedCategory('All');
      setSearchQuery('');
    }
  }, [isOpen, regionName]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !regionName) return null;

  // Format date helper (Indonesian format)
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Baru saja';
    try {
      const d = new Date(dateStr);
      return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }).format(d);
    } catch {
      return dateStr;
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        // Close on clicking backdrop
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-region-title"
    >
      <div 
        ref={modalRef}
        className={`w-full max-w-4xl max-h-[90vh] border rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all ${
          isDark ? 'bg-[#151824] border-[#2D313E] text-gray-200' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* MODAL HEADER */}
        <div className={`p-5 sm:p-6 border-b flex items-start justify-between gap-4 shrink-0 ${
          isDark ? 'bg-[#1A1D27] border-[#2D313E]' : 'bg-slate-50 border-slate-200'
        }`}>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <MapPin className="w-3 h-3" />
                Kabupaten / Kota Kalimantan Tengah
              </span>
              <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                • {stats.total} Aspirasi Terdata
              </span>
            </div>
            <h2 id="modal-region-title" className={`text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2 ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              {regionName}
            </h2>
            <p className={`text-xs sm:text-sm mt-0.5 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
              Rincian aspirasi, persepsi publik, dan masukan warga untuk perencanaan tata ruang wilayah.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenAddAspiration(regionName)}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-all"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Tulis Aspirasi</span>
            </button>
            <button
              onClick={onClose}
              aria-label="Tutup jendela rincian wilayah"
              className="p-2 rounded-lg bg-[#252836] hover:bg-[#2F3446] text-text-dim hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* REGIONAL SENTIMENT SUMMARY STRIP */}
        <div className="px-5 py-4 sm:px-6 bg-[#14161F] border-b border-[#252836] shrink-0">
          <div className="text-[11px] font-bold text-text-dim uppercase tracking-wider mb-2.5">
            Komposisi Persepsi Publik Warga
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Total */}
            <div className="p-3 rounded-xl bg-[#1C1F2B] border border-[#2D313E]/80">
              <div className="text-[10px] text-text-dim uppercase font-medium">Total Masukan</div>
              <div className="text-lg font-bold text-white mt-0.5">{stats.total}</div>
              <div className="text-[10px] text-text-dim">100% data wilayah</div>
            </div>

            {/* Positif (Hijau) */}
            <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30">
              <div className="flex items-center justify-between text-[10px] text-emerald-400 font-medium">
                <span>Positif / Apresiasi</span>
                <ThumbsUp className="w-3 h-3 text-emerald-400" />
              </div>
              <div className="text-lg font-bold text-emerald-400 mt-0.5">{stats.positive}</div>
              <div className="text-[10px] text-emerald-400/80 font-medium">{stats.posPct}% dari total masukan</div>
            </div>

            {/* Netral (Abu-abu) */}
            <div className="p-3 rounded-xl bg-zinc-800/30 border border-zinc-600/40">
              <div className="flex items-center justify-between text-[10px] text-zinc-300 font-medium">
                <span>Netral / Saran</span>
                <MinusCircle className="w-3 h-3 text-zinc-400" />
              </div>
              <div className="text-lg font-bold text-zinc-200 mt-0.5">{stats.neutral}</div>
              <div className="text-[10px] text-zinc-400 font-medium">{stats.neuPct}% dari total masukan</div>
            </div>

            {/* Negatif (Merah) */}
            <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/30">
              <div className="flex items-center justify-between text-[10px] text-rose-400 font-medium">
                <span>Negatif / Keluhan</span>
                <AlertTriangle className="w-3 h-3 text-rose-400" />
              </div>
              <div className="text-lg font-bold text-rose-400 mt-0.5">{stats.negative}</div>
              <div className="text-[10px] text-rose-400/80 font-medium">{stats.negPct}% dari total masukan</div>
            </div>
          </div>
        </div>

        {/* FILTER & SEARCH TOOLBAR */}
        <div className="p-4 sm:px-6 bg-[#161820] border-b border-[#252836] flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
          {/* Sentiment Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 bg-[#12141B] p-1 rounded-xl border border-[#2D313E] w-fit">
            <button
              onClick={() => setActiveSentimentTab('All')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeSentimentTab === 'All'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-text-dim hover:text-white'
              }`}
            >
              Semua ({stats.total})
            </button>
            <button
              onClick={() => setActiveSentimentTab('Positive')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeSentimentTab === 'Positive'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-emerald-400 hover:text-emerald-300'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Positif ({stats.positive})</span>
            </button>
            <button
              onClick={() => setActiveSentimentTab('Neutral')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeSentimentTab === 'Neutral'
                  ? 'bg-zinc-600 text-white shadow-sm'
                  : 'text-zinc-300 hover:text-white'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
              <span>Netral ({stats.neutral})</span>
            </button>
            <button
              onClick={() => setActiveSentimentTab('Negative')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeSentimentTab === 'Negative'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-rose-400 hover:text-rose-300'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              <span>Negatif ({stats.negative})</span>
            </button>
          </div>

          {/* Search & Category Filter */}
          <div className="flex items-center gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-[#12141B] border border-[#2D313E] rounded-lg px-2.5 py-1.5 text-xs text-text-main focus:outline-none focus:border-blue-500"
            >
              <option value="All">Semua Kategori Isu</option>
              <option value="Transportasi">Transportasi</option>
              <option value="Drainase & Banjir">Drainase & Banjir</option>
              <option value="Bencana Alam">Mitigasi Bencana Alam & Karhutla</option>
              <option value="Sampah">Pengelolaan Sampah</option>
              <option value="Air Bersih & Sanitasi">Air Bersih & Sanitasi</option>
              <option value="Ruang Terbuka Hijau">Ruang Terbuka Hijau</option>
              <option value="Tata Ruang & Pemukiman">Tata Ruang & Pemukiman</option>
              <option value="Fasilitas Publik">Fasilitas Publik</option>
              <option value="Lainnya">Lainnya</option>
            </select>

            <div className="relative flex-1 sm:w-56">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari aspirasi..."
                className="w-full bg-[#12141B] border border-[#2D313E] rounded-lg pl-8 pr-3 py-1.5 text-xs text-text-main placeholder:text-text-dim focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* COMMENT LIST (SCROLLABLE) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5 max-h-[55vh]">
          {filteredComments.length > 0 ? (
            filteredComments.map((item) => {
              // Sentiment styling
              const isPos = item.sentiment === 'Positive';
              const isNeg = item.sentiment === 'Negative';

              return (
                <div 
                  key={item.id}
                  className="p-4 rounded-xl bg-[#191C26] border border-[#262B3A] hover:border-[#383F54] transition-all space-y-2.5"
                >
                  {/* Comment meta bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-[10px] shrink-0 border border-blue-500/30">
                        {item.author ? item.author.charAt(0).toUpperCase() : 'A'}
                      </div>
                      <span className="font-semibold text-white">
                        {item.author || 'Warga Anonim'}
                      </span>
                      <span className="text-text-dim text-[11px] flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-text-dim/70" />
                        {formatDate(item.createdAt)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Category Badge */}
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-[#252A38] text-text-dim border border-[#31374A]">
                        <Tag className="w-2.5 h-2.5" />
                        {item.category}
                      </span>

                      {/* Sentiment Badge (Hijau = Positif, Abu-abu = Netral, Merah = Negatif) */}
                      {isPos && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          Positif
                        </span>
                      )}
                      {isNeg && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                          Negatif
                        </span>
                      )}
                      {!isPos && !isNeg && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-700/30 text-zinc-300 border border-zinc-600/40">
                          <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                          Netral
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Comment Text */}
                  <p className="text-xs sm:text-sm text-gray-200 leading-relaxed pl-8">
                    {item.text}
                  </p>
                </div>
              );
            })
          ) : regionComments.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center border border-blue-500/20">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Belum Ada Aspirasi Warga di {regionName}
                </p>
                <p className={`text-xs mt-1 max-w-sm mx-auto ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                  Platform sedang dalam mode uji coba langsung ke masyarakat. Jadilah warga pertama yang menyuarakan aspirasi pembangunan di wilayah ini.
                </p>
              </div>
              <button
                onClick={() => onOpenAddAspiration(regionName)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md transition-all"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Sampaikan Aspirasi untuk {regionName}</span>
              </button>
            </div>
          ) : (
            <div className="py-16 text-center text-text-dim space-y-2">
              <MessageSquare className="w-8 h-8 mx-auto text-text-dim/40" />
              <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Tidak ada aspirasi yang cocok</p>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                Coba sesuaikan kata kunci pencarian atau ganti filter kategori dan sentimen di atas.
              </p>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 px-6 bg-[#1A1D27] border-t border-[#2D313E] flex items-center justify-between text-xs text-text-dim shrink-0">
          <span>Menampilkan {filteredComments.length} dari {regionComments.length} aspirasi</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenAddAspiration(regionName)}
              className="sm:hidden inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Tulis Aspirasi</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-[#252836] hover:bg-[#2F3446] text-white font-medium transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
