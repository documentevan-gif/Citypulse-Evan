import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Lock, Eye, EyeOff, AlertCircle, CheckCircle2, X, KeyRound } from 'lucide-react';

export const AUTH_PASSCODE = 'EvanGantenk6f045';

export type ProtectedActionType = 'import_csv' | 'export_data' | 'clear_data';

interface SecurityCodeModalProps {
  isOpen: boolean;
  actionType: ProtectedActionType | null;
  onClose: () => void;
  onSuccess: () => void;
  isDark: boolean;
  pendingFileName?: string | null;
}

const ACTION_METADATA: Record<ProtectedActionType, { title: string; desc: string; buttonText: string; iconColor: string }> = {
  import_csv: {
    title: 'Otorisasi Impor Berkas CSV',
    desc: 'Memasukkan dataset aspirasi baru ke dalam basis data sistem.',
    buttonText: 'Verifikasi & Lanjutkan Impor',
    iconColor: 'text-blue-500'
  },
  export_data: {
    title: 'Otorisasi Ekspor Data Aspirasi',
    desc: 'Mengunduh dan mengekstraksi seluruh arsip data aspirasi warga.',
    buttonText: 'Verifikasi & Unduh Data',
    iconColor: 'text-emerald-500'
  },
  clear_data: {
    title: 'Otorisasi Kosongkan Seluruh Data',
    desc: 'Menghapus seluruh rekaman aspirasi warga untuk reset mode uji coba lapangan.',
    buttonText: 'Verifikasi & Kosongkan Data',
    iconColor: 'text-rose-500'
  }
};

export const SecurityCodeModal: React.FC<SecurityCodeModalProps> = ({
  isOpen,
  actionType,
  onClose,
  onSuccess,
  isDark,
  pendingFileName
}) => {
  const [code, setCode] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setCode('');
      setErrorMsg(null);
      setIsVerifying(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen || !actionType) return null;

  const metadata = ACTION_METADATA[actionType];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmed = code.trim();
    if (!trimmed) {
      setErrorMsg('Harap masukkan kode otorisasi.');
      return;
    }

    setIsVerifying(true);

    // Exact check for the requested passcode
    if (trimmed === AUTH_PASSCODE) {
      setTimeout(() => {
        setIsVerifying(false);
        onSuccess();
        onClose();
      }, 300);
    } else {
      setTimeout(() => {
        setIsVerifying(false);
        setErrorMsg('Kode otorisasi salah! Akses ditolak.');
        inputRef.current?.select();
      }, 300);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in">
      <div 
        className={`w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden transition-all transform animate-scale-up ${
          isDark 
            ? 'bg-[#151822] border-[#2A3144] text-white' 
            : 'bg-white border-slate-200 text-slate-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className={`p-5 border-b flex items-center justify-between ${
          isDark ? 'border-[#242A3B] bg-[#191D2A]' : 'border-slate-100 bg-slate-50'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-sm ${
              actionType === 'clear_data'
                ? 'bg-rose-500/10 border-rose-500/20 text-rose-500'
                : actionType === 'export_data'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                : 'bg-blue-500/10 border-blue-500/20 text-blue-500'
            }`}>
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-blue-500 uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="w-3 h-3" />
                <span>Verifikasi Otoritas Sistem</span>
              </div>
              <h3 className={`text-base font-bold leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {metadata.title}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg border transition-colors ${
              isDark 
                ? 'border-transparent hover:border-[#2A3144] text-gray-400 hover:text-white' 
                : 'border-transparent hover:border-slate-200 text-slate-400 hover:text-slate-700'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* MODAL BODY */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className={`p-3 rounded-xl border text-xs leading-relaxed ${
            isDark ? 'bg-[#12141C] border-[#222736] text-gray-300' : 'bg-slate-50 border-slate-200 text-slate-600'
          }`}>
            <p>{metadata.desc}</p>
            {pendingFileName && (
              <p className="mt-1 font-mono text-[11px] text-blue-500 truncate">
                Berkas: <strong>{pendingFileName}</strong>
              </p>
            )}
            <p className="mt-1 text-[11px] text-amber-500/90 font-medium">
              Fitur ini memerlukan kode otorisasi pengembang/inisiator untuk dapat dijalankan.
            </p>
          </div>

          {/* PASSCODE INPUT */}
          <div className="space-y-1.5">
            <label className={`block text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
              Masukkan Kode Otorisasi:
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                ref={inputRef}
                type={showCode ? 'text' : 'password'}
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="Ketik kode di sini..."
                autoComplete="off"
                className={`w-full pl-9 pr-10 py-2.5 rounded-xl border text-sm font-mono tracking-wider focus:outline-none transition-all ${
                  errorMsg 
                    ? 'border-rose-500 bg-rose-500/5 text-rose-400 focus:border-rose-500' 
                    : isDark 
                    ? 'bg-[#10121A] border-[#2A3144] text-white focus:border-blue-500' 
                    : 'bg-white border-slate-300 text-slate-900 focus:border-blue-500 shadow-xs'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowCode(!showCode)}
                className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md transition-colors ${
                  isDark ? 'text-gray-400 hover:text-white' : 'text-slate-400 hover:text-slate-700'
                }`}
                title={showCode ? 'Sembunyikan kode' : 'Tampilkan kode'}
              >
                {showCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {errorMsg && (
              <div className="flex items-center gap-1.5 text-xs text-rose-500 pt-1 animate-shake">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>

          {/* ACTION BUTTONS */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                isDark 
                  ? 'bg-[#1B1F2C] border-[#2A3144] text-gray-300 hover:bg-[#232838] hover:text-white' 
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={isVerifying}
              className={`px-5 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-md flex items-center gap-1.5 disabled:opacity-50 ${
                actionType === 'clear_data'
                  ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/25'
                  : actionType === 'export_data'
                  ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/25'
                  : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/25'
              }`}
            >
              {isVerifying ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Memverifikasi...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{metadata.buttonText}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
