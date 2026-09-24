import React, { useState, useEffect } from 'react';
import { 
  X, Send, Sparkles, AlertCircle, CheckCircle2, 
  MapPin, User, FileText, Tag, Loader2
} from 'lucide-react';
import { KALTENG_REGIONS, KaltengRegion } from '../data/kaltengRegions';
import { Category, CommentData, Sentiment } from '../types';
import { analyzeSingleComment } from '../services/geminiService';
import { saveNewComment } from '../services/storageService';
import { useTheme } from '../context/ThemeContext';

interface AspirationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRegion?: string | null;
  onAspirationSubmitted: (newComment: CommentData) => void;
}

const CATEGORIES: { label: string; value: Category; desc: string }[] = [
  { label: 'Transportasi & Konektivitas', value: 'Transportasi', desc: 'Jalan arteri, jembatan, angkutan, trotoar, marka jalan' },
  { label: 'Drainase & Pengendalian Banjir', value: 'Drainase & Banjir', desc: 'Saluran air tersumbat, gorong-gorong, sedimentasi parit, genangan' },
  { label: 'Pengelolaan Sampah & Kebersihan', value: 'Sampah', desc: 'TPS, TPA, timbulan sampah pasar, armada truk, daur ulang' },
  { label: 'Air Bersih & Sanitasi', value: 'Air Bersih & Sanitasi', desc: 'Jaringan pipa PDAM, suplai air bersih, MCK komunal, limbah' },
  { label: 'Ruang Terbuka Hijau & Ekologi', value: 'Ruang Terbuka Hijau', desc: 'Taman kota, kanopi pohon peneduh, hutan kota, sempadan sungai' },
  { label: 'Tata Ruang & Pemukiman', value: 'Tata Ruang & Pemukiman', desc: 'Penataan kawasan kumuh, zonasi tertib bangunan, perumahan layak' },
  { label: 'Fasilitas Sosial & Publik', value: 'Fasilitas Publik', desc: 'Penerangan Jalan Umum (PJU), puskesmas, pasar rakyat, keamanan' },
  { label: 'Lainnya / Tata Kelola', value: 'Lainnya', desc: 'Pelayanan birokrasi, perizinan publik, konektivitas digital' },
];

export const AspirationFormModal: React.FC<AspirationFormModalProps> = ({
  isOpen,
  onClose,
  defaultRegion,
  onAspirationSubmitted,
}) => {
  const { isDark } = useTheme();
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [authorName, setAuthorName] = useState<string>('');
  const [category, setCategory] = useState<Category>('Transportasi');
  const [commentText, setCommentText] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{ sentiment: Sentiment; comment: CommentData } | null>(null);

  // Set initial default region if passed
  useEffect(() => {
    if (isOpen) {
      setSelectedRegion(defaultRegion || KALTENG_REGIONS[0]);
      setCommentText('');
      setErrorMessage(null);
      setSuccessInfo(null);
      setIsSubmitting(false);
    }
  }, [isOpen, defaultRegion]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const charCount = commentText.length;
  const minChars = 10;
  const maxChars = 500;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    if (!selectedRegion) {
      setErrorMessage('Silakan pilih Kabupaten atau Kota di Kalimantan Tengah.');
      return;
    }

    const trimmed = commentText.trim();
    if (!trimmed) {
      setErrorMessage('Isi aspirasi/komentar tidak boleh kosong.');
      return;
    }

    if (trimmed.length < minChars) {
      setErrorMessage(`Aspirasi terlalu singkat (minimal ${minChars} karakter) agar maksud Anda jelas bagi perencana kota.`);
      return;
    }

    if (trimmed.length > maxChars) {
      setErrorMessage(`Aspirasi melebihi batas maksimal ${maxChars} karakter.`);
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Run automatic sentiment analysis (Gemini with intelligent NLP heuristic fallback)
      const analysis = await analyzeSingleComment(trimmed, category);

      // 2. Prepare persistent data model
      const finalAuthor = authorName.trim() ? authorName.trim() : 'Warga Anonim';
      const newComment: CommentData = {
        id: `KALTENG-W-${Date.now().toString().slice(-6)}`,
        author: finalAuthor,
        createdAt: new Date().toISOString(),
        text: trimmed,
        region: selectedRegion,
        category: analysis.category,
        sentiment: analysis.sentiment,
        processed: true,
      };

      // 3. Save to database / persistent storage
      saveNewComment(newComment);

      // 4. Notify parent app state to refresh UI real-time
      onAspirationSubmitted(newComment);

      // 5. Display success state
      setSuccessInfo({
        sentiment: analysis.sentiment,
        comment: newComment,
      });

      // Auto close after brief celebration or allow user to close
    } catch (err: any) {
      console.error(err);
      setErrorMessage('Terjadi kendala saat memproses aspirasi. Silakan coba kembali.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="aspiration-modal-title"
    >
      <div className={`w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-scale-up transition-all border ${
        isDark ? 'bg-[#161820] border-[#2D313E] text-gray-200' : 'bg-white border-slate-200 text-slate-800'
      }`}>
        {/* HEADER */}
        <div className={`p-5 sm:p-6 border-b flex items-center justify-between shrink-0 transition-colors ${
          isDark ? 'bg-[#1A1D27] border-[#2D313E]' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 id="aspiration-modal-title" className={`text-lg font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Sampaikan Aspirasi Pembangunan
              </h2>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                Suara dan pengalaman Anda langsung membantu perencanaan kota yang lebih inklusif.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className={`p-2 rounded-lg border transition-colors disabled:opacity-50 ${
              isDark ? 'bg-[#252836] border-[#31374A] text-gray-400 hover:text-white' : 'bg-white border-slate-200 text-slate-500 hover:text-slate-900 shadow-xs'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CONTENT */}
        <div className="p-5 sm:p-6 overflow-y-auto max-h-[75vh]">
          {successInfo ? (
            /* SUCCESS STATE */
            <div className="py-6 text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center border border-emerald-500/30">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Aspirasi Berhasil Disampaikan!</h3>
                <p className={`text-xs mt-1 max-w-md mx-auto ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                  Aspirasi Anda telah tersimpan secara permanen dan otomatis diintegrasikan ke dalam analisis perencana tata kota.
                </p>
              </div>

              {/* Classification result preview */}
              <div className={`p-4 rounded-xl border text-left text-xs space-y-2 max-w-md mx-auto ${
                isDark ? 'bg-[#1A1D27] border-[#2D313E]' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between">
                  <span className={isDark ? 'text-gray-400 font-medium' : 'text-slate-500 font-medium'}>Wilayah:</span>
                  <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{successInfo.comment.region}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={isDark ? 'text-gray-400 font-medium' : 'text-slate-500 font-medium'}>Kategori Isu:</span>
                  <span className="font-semibold text-blue-500">{successInfo.comment.category}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={isDark ? 'text-gray-400 font-medium' : 'text-slate-500 font-medium'}>Analisis Sentimen:</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    successInfo.sentiment === 'Positive' 
                      ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'
                      : successInfo.sentiment === 'Negative'
                      ? 'bg-rose-500/20 text-rose-500 border border-rose-500/30'
                      : 'bg-zinc-700/30 text-zinc-400 border border-zinc-600/40'
                  }`}>
                    {successInfo.sentiment === 'Positive' ? 'Positif (Apresiasi)' : 
                     successInfo.sentiment === 'Negative' ? 'Negatif (Keluhan)' : 'Netral (Masukan)'}
                  </span>
                </div>
                <div className={`pt-2 border-t italic ${isDark ? 'border-[#2D313E] text-gray-400' : 'border-slate-200 text-slate-600'}`}>
                  "{successInfo.comment.text}"
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => {
                    setSuccessInfo(null);
                    setCommentText('');
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    isDark ? 'bg-[#252836] border-[#31374A] text-gray-200 hover:bg-[#2F3446]' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Tulis Aspirasi Lain
                </button>
                <button
                  onClick={onClose}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-all"
                >
                  Selesai & Lihat di Dashboard
                </button>
              </div>
            </div>
          ) : (
            /* FORM INPUT */
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Wilayah Dropdown */}
              <div>
                <label className={`block text-xs font-semibold mb-1.5 flex items-center gap-1.5 ${isDark ? 'text-gray-200' : 'text-slate-800'}`}>
                  <MapPin className="w-3.5 h-3.5 text-blue-500" />
                  <span>Kabupaten / Kota Terkait</span>
                  <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className={`w-full border rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all ${
                    isDark ? 'bg-[#12141B] border-[#2D313E] text-white' : 'bg-white border-slate-200 text-slate-900 shadow-2xs'
                  }`}
                >
                  {KALTENG_REGIONS.map((reg) => (
                    <option key={reg} value={reg}>
                      {reg}
                    </option>
                  ))}
                </select>
                <p className={`text-[11px] mt-1 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                  Pilih wilayah tempat Anda tinggal atau wilayah yang menjadi fokus masukan.
                </p>
              </div>

              {/* Nama Pengguna (Opsional) */}
              <div>
                <label className={`block text-xs font-semibold mb-1.5 flex items-center gap-1.5 ${isDark ? 'text-gray-200' : 'text-slate-800'}`}>
                  <User className="w-3.5 h-3.5 text-blue-500" />
                  <span>Nama Lengkap / Panggilan</span>
                  <span className={`text-[10px] font-normal ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>(Opsional)</span>
                </label>
                <input
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="Contoh: Budi Santoso (Kosongkan jika ingin Anonim)"
                  maxLength={50}
                  className={`w-full border rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all ${
                    isDark ? 'bg-[#12141B] border-[#2D313E] text-white placeholder:text-gray-500' : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 shadow-2xs'
                  }`}
                />
              </div>

              {/* Kategori Isu */}
              <div>
                <label className={`block text-xs font-semibold mb-1.5 flex items-center gap-1.5 ${isDark ? 'text-gray-200' : 'text-slate-800'}`}>
                  <Tag className="w-3.5 h-3.5 text-blue-500" />
                  <span>Kategori Topik Pembangunan</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      type="button"
                      key={cat.value}
                      onClick={() => setCategory(cat.value)}
                      className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                        category === cat.value
                          ? isDark 
                            ? 'bg-blue-600/15 border-blue-500/60 text-blue-300' 
                            : 'bg-blue-50 border-blue-500 text-blue-700 font-medium'
                          : isDark 
                            ? 'bg-[#12141B] border-[#2D313E] text-gray-400 hover:text-white hover:border-[#3E4456]' 
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <div className={`font-semibold ${category === cat.value ? (isDark ? 'text-white' : 'text-blue-700') : (isDark ? 'text-gray-200' : 'text-slate-800')}`}>{cat.label}</div>
                      <div className={`text-[10px] mt-0.5 line-clamp-1 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>{cat.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Isi Komentar / Aspirasi */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className={`text-xs font-semibold flex items-center gap-1.5 ${isDark ? 'text-gray-200' : 'text-slate-800'}`}>
                    <span>Isi Aspirasi atau Komentar</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <span className={`text-[11px] font-mono ${charCount > maxChars ? 'text-rose-500' : (isDark ? 'text-gray-400' : 'text-slate-500')}`}>
                    {charCount} / {maxChars} karakter
                  </span>
                </div>
                <textarea
                  rows={4}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Ceritakan kondisi nyata yang Anda rasakan di lapangan. Misalnya: kondisi jalan berlubang di jalan utama, perlunya penambahan armada sampah pasar, atau apresiasi atas taman kota yang rapi..."
                  className={`w-full border rounded-xl p-3 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none leading-relaxed ${
                    isDark ? 'bg-[#12141B] border-[#2D313E] text-white placeholder:text-gray-500' : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 shadow-2xs'
                  }`}
                />
                <div className={`flex items-center justify-between text-[11px] mt-1 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                  <span>Minimal {minChars} karakter</span>
                  <span className="flex items-center gap-1 text-blue-500">
                    <Sparkles className="w-3 h-3" />
                    Analisis sentimen otomatis
                  </span>
                </div>
              </div>

              {/* SUBMIT BUTTON */}
              <div className={`pt-2 flex items-center justify-end gap-3 border-t ${isDark ? 'border-[#2D313E]' : 'border-slate-200'}`}>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className={`px-4 py-2 rounded-xl text-xs font-medium border transition-colors ${
                    isDark ? 'bg-[#252836] border-[#31374A] text-gray-300 hover:bg-[#2F3446]' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || charCount < minChars || charCount > maxChars}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800/40 text-white text-xs font-semibold shadow-md shadow-blue-600/20 disabled:opacity-50 transition-all"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Menganalisis & Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Kirim Aspirasi</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
