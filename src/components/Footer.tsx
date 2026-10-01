import React from 'react';
import { ShieldCheck } from 'lucide-react';

interface FooterProps {
  onOpenDeveloperModal?: () => void;
  className?: string;
}

export const Footer: React.FC<FooterProps> = ({ onOpenDeveloperModal, className = '' }) => {
  return (
    <footer
      className={`fixed bottom-0 left-0 right-0 z-50 bg-slate-950/90 backdrop-blur-md border-t border-slate-800/80 px-6 py-3 text-xs text-slate-400 transition-colors ${className}`}
    >
      <div className="w-full flex flex-col md:flex-row items-center justify-between gap-2">
        {/* Sisi Kiri: Branding & Informasi Sistem */}
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 text-center md:text-left">
          <span className="font-semibold text-slate-100 tracking-tight">CityPulse Kalteng</span>
          <span className="text-slate-600 hidden sm:inline">•</span>
          <span className="text-slate-400">
            Platform Intelijen Spasial & Aspirasi Warga (13 Kabupaten & 1 Kota)
          </span>
        </div>

        {/* Sisi Kanan: Atribusi Inisiator & Kontak */}
        <div className="flex items-center gap-2 text-[11px] sm:text-xs">
          <span className="text-slate-400">Inisiator & Pengembang:</span>
          {onOpenDeveloperModal ? (
            <button
              onClick={onOpenDeveloperModal}
              className="font-semibold text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1 transition-colors cursor-pointer"
              title="Buka profil pengembang & inisiator platform (Evan)"
            >
              <span>Evan</span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 inline shrink-0" aria-label="Terverifikasi" />
            </button>
          ) : (
            <span className="font-semibold text-blue-400 flex items-center gap-1">
              <span>Evan</span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 inline shrink-0" aria-label="Terverifikasi" />
            </span>
          )}
          <span className="text-slate-700">|</span>
          <a
            href="mailto:dermanevan@gmail.com"
            className="text-slate-300 hover:text-white transition-colors"
            title="Kirim email ke dermanevan@gmail.com"
          >
            dermanevan@gmail.com
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
