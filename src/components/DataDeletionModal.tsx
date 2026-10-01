import React, { useState, useEffect, useRef } from 'react';
import { 
  AlertTriangle, 
  Trash2, 
  Lock, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  X, 
  ShieldAlert, 
  FileText
} from 'lucide-react';
import { verifyPasscode } from '../services/securityService';
import { CommentData } from '../types';

interface DataDeletionModalProps {
  isOpen: boolean;
  selectedIds: string[];
  selectedItems?: CommentData[];
  totalRecordsCount: number;
  onClose: () => void;
  onConfirmSuccess: (idsToDelete: string[]) => void;
  isDark?: boolean;
}

export const DataDeletionModal: React.FC<DataDeletionModalProps> = ({
  isOpen,
  selectedIds = [],
  selectedItems = [],
  totalRecordsCount,
  onClose,
  onConfirmSuccess,
  isDark = true
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Dynamic Rule Determination based on selectedIds length:
  // MODE A: Hapus Selektif (selectedIds.length > 0)
  // MODE B: Kosongkan Total (selectedIds.length === 0)
  const isSelective = selectedIds && selectedIds.length > 0;
  const count = isSelective ? selectedIds.length : totalRecordsCount;

  // 1. Dynamic Modal Title
  const modalTitle = isSelective
    ? `Hapus ${count} Aspirasi Terpilih`
    : 'Kosongkan Seluruh Data Platform';

  // 2. Dynamic Warning Banner Text
  const warningText = isSelective
    ? `Peringatan: Sebanyak ${count} data aspirasi yang dipilih akan dihapus permanen!`
    : `Peringatan: Seluruh ${count} data aspirasi warga akan dihapus permanen!`;

  // 3. Dynamic Button Label
  const actionButtonLabel = isSelective
    ? `Hapus ${count} Data Terpilih`
    : 'Kosongkan Semua Data';

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setShowPassword(false);
      setErrorMessage(null);
      setIsVerifying(false);
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmed = password.trim();
    if (!trimmed) {
      setErrorMessage('Kata sandi otorisasi wajib diisi.');
      return;
    }

    setIsVerifying(true);

    try {
      // Verifikasi kriptografis SHA-256 kata sandi "EvanGantenk6f045"
      // Plaintext string TIDAK pernah terekspos di browser DevTools
      const isValid = await verifyPasscode(trimmed);

      if (isValid) {
        setIsVerifying(false);
        onConfirmSuccess(selectedIds);
        onClose();
      } else {
        setIsVerifying(false);
        setErrorMessage('Kata sandi tidak valid. Akses ditolak.');
        inputRef.current?.select();
      }
    } catch (err) {
      setIsVerifying(false);
      setErrorMessage('Terjadi kendala pada verifikasi keamanan sistem.');
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-xl rounded-3xl border border-[#2D1B2A] bg-[#12131C] text-white shadow-2xl overflow-hidden transition-all transform animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="p-6 pb-4 flex items-start justify-between">
          <div className="flex items-start gap-4">
            {/* Top Shield Icon with Rose Border */}
            <div className="w-13 h-13 rounded-2xl flex items-center justify-center border border-rose-800/50 bg-[#28131E] text-rose-500 shadow-sm shrink-0">
              <ShieldAlert className="w-7 h-7 stroke-[2]" />
            </div>

            <div>
              {/* Badge: TINDAKAN KRITIS (ADMIN) */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#2A121E] border border-rose-900/60 text-rose-500 text-[11px] font-bold tracking-wider uppercase">
                <Lock className="w-3.5 h-3.5" />
                <span>TINDAKAN KRITIS (ADMIN)</span>
              </div>

              {/* Dynamic Modal Heading */}
              <h3 className="text-xl sm:text-2xl font-bold text-white mt-2 leading-tight tracking-tight">
                {modalTitle}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
            aria-label="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL FORM & BODY */}
        <form onSubmit={handleSubmit} className="px-6 pb-6 pt-2 space-y-5">
          {/* DYNAMIC WARNING CARD (PERSIS SEPERTI GAMBAR) */}
          <div className="rounded-2xl border border-[#3E1624] bg-[#1D1017] p-4 flex items-start gap-3.5 text-xs text-rose-200/90 leading-relaxed">
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-rose-500 text-sm">
                {warningText}
              </p>
              <p className="text-xs text-slate-300/80 leading-normal">
                {isSelective
                  ? 'Operasi ini akan menghapus data yang dipilih di peramban lokal dan basis data Cloud Firestore. Tindakan ini tidak dapat dibatalkan.'
                  : 'Operasi ini akan membersihkan arsip di peramban lokal dan basis data Cloud Firestore secara menyeluruh. Tindakan ini tidak dapat dibatalkan.'}
              </p>
            </div>
          </div>

          {/* ITEM PREVIEW (Jika Mode A: Hapus Selektif & ada item) */}
          {isSelective && selectedItems.length > 0 && (
            <div className="p-3 rounded-xl border border-slate-800 bg-[#161824] space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 block">
                Daftar ringkas aspirasi yang akan dihapus:
              </span>
              <div className="max-h-24 overflow-y-auto space-y-1.5 pr-1 text-xs">
                {selectedItems.slice(0, 3).map((item) => (
                  <div 
                    key={item.id} 
                    className="p-1.5 rounded-lg bg-[#1D2030] flex items-center justify-between gap-2 text-slate-300"
                  >
                    <div className="truncate flex items-center gap-1.5 min-w-0">
                      <FileText className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <span className="font-semibold text-white truncate">{item.author}:</span>
                      <span className="truncate opacity-80">{item.text}</span>
                    </div>
                    <span className="shrink-0 text-[10px] font-mono text-slate-400">
                      {item.region.replace('Kabupaten ', 'Kab. ')}
                    </span>
                  </div>
                ))}
                {selectedItems.length > 3 && (
                  <div className="text-[10px] text-center text-slate-400 italic">
                    + {selectedItems.length - 3} data lainnya yang tercentang
                  </div>
                )}
              </div>
            </div>
          )}

          {/* INPUT FIELD KATA SANDI (PERSIS SEPERTI GAMBAR) */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300">
              Masukkan Kata Sandi Otorisasi:
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="••••••••••••••"
                autoComplete="off"
                className={`w-full px-4 py-3 rounded-2xl bg-slate-100 text-slate-900 font-mono tracking-widest text-base border-2 transition-all focus:outline-none ${
                  errorMessage 
                    ? 'border-rose-500 bg-rose-50 text-rose-950 focus:border-rose-600' 
                    : 'border-transparent focus:border-rose-500 focus:bg-white shadow-inner'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 transition-colors"
                title={showPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* ERROR INDICATOR */}
            {errorMessage && (
              <div className="flex items-center gap-1.5 text-xs text-rose-500 pt-1 animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="font-semibold">{errorMessage}</span>
              </div>
            )}
          </div>

          {/* TOMBOL AKSI: BATAL & EKSEKUSI DINAMIS (PERSIS SEPERTI GAMBAR) */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isVerifying}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#1C2130] hover:bg-[#252C40] text-slate-300 border border-[#2B3448] transition-all"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={isVerifying || !password.trim()}
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-[#E11D48] hover:bg-[#BE123C] transition-all shadow-lg shadow-rose-600/30 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isVerifying ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Memverifikasi...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 stroke-[2]" />
                  <span>{actionButtonLabel}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
