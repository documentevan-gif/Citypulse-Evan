import React from 'react';
import { 
  X, User, Mail, ShieldCheck, MapPin, Award, 
  ExternalLink, Sparkles, Compass, CheckCircle2, 
  Layers, Code2, Globe, HeartHandshake, BookOpen, TreePine
} from 'lucide-react';

interface DeveloperProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeveloperProfileModal: React.FC<DeveloperProfileModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-[#151824] border border-[#2B3245] rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl text-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER HERO BANNER */}
        <div className="relative p-6 bg-gradient-to-r from-blue-900/40 via-[#1A2238] to-[#121622] border-b border-[#242A3B] overflow-hidden">
          <div className="absolute -right-8 -top-8 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-start justify-between relative z-10">
            <div className="flex items-center gap-4">
              {/* Avatar Initial */}
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-emerald-500 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-blue-500/20 border-2 border-white/20">
                  E
                </div>
                <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-emerald-500 text-white shadow" title="Inisiator & Perencana Tersertifikasi">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    <ShieldCheck className="w-3 h-3 text-blue-400" />
                    <span>Inisiator & Pengembang Platform</span>
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    <Award className="w-3 h-3 text-emerald-400" />
                    <span>Jenjang 7 LPJK / BNSP</span>
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-white tracking-tight">
                  Evan
                </h2>
                <p className="text-xs text-blue-300 font-medium mt-0.5">
                  Ahli Muda Perencana Tata Ruang Wilayah dan Kota
                </p>
                <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 text-emerald-400" />
                  <span>Kalimantan Tengah, Indonesia</span>
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-[#1D2232] border border-[#2E364E] text-gray-400 hover:text-white hover:bg-[#252C40] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* PROFILE BODY */}
        <div className="p-6 space-y-5">
          {/* Official Elaboration Statement (Authentic Credentials) */}
          <div className="p-4 rounded-xl bg-[#1A1E2C] border border-[#262D40] space-y-2.5">
            <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Profil Profesional & Visi Perencanaan</span>
            </h3>
            <p className="text-xs text-gray-200 leading-relaxed font-normal">
              Perencana Wilayah dan Kota tersertifikasi (Ahli Muda Perencana Tata Ruang Wilayah dan Kota, Jenjang 7 LPJK/ BNSP) dengan keahlian di bidang GIS, pemodelan spasial, dan big data analytics untuk mendukung <em>strategic spatial planning</em>.
            </p>
            <p className="text-xs text-gray-200 leading-relaxed font-normal">
              Berpengalaman dalam perencanaan spasial berbasis budaya dan pembangunan wilayah berkelanjutan, dengan pendekatan <em>data-driven decision making</em> yang mendorong pertumbuhan inklusif berbasis masyarakat sekaligus melestarikan kearifan lokal dan keberlanjutan lingkungan.
            </p>
          </div>

          {/* Technical and Domain Focus Pillars */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              <span>Pilar Keahlian & Spesialisasi Spasial</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-3 rounded-xl bg-[#1A1E2C] border border-[#242A3B] flex items-start gap-2.5">
                <Compass className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-white">GIS & Pemodelan Spasial</div>
                  <div className="text-[11px] text-gray-400 mt-0.5 leading-snug">
                    Analisis spasial georeferensi, pemodelan koridor wilayah, dan integrasi data geospasial Kalteng.
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#1A1E2C] border border-[#242A3B] flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-white">Big Data & Strategic Planning</div>
                  <div className="text-[11px] text-gray-400 mt-0.5 leading-snug">
                    Pengolahan big data aspirasi warga untuk perencanaan strategis tata ruang wilayah terukur.
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#1A1E2C] border border-[#242A3B] flex items-start gap-2.5">
                <TreePine className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-white">Perencanaan Berbasis Budaya</div>
                  <div className="text-[11px] text-gray-400 mt-0.5 leading-snug">
                    Pembangunan berkelanjutan dengan menjunjung tinggi kearifan lokal dan ekologi lingkungan.
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#1A1E2C] border border-[#242A3B] flex items-start gap-2.5">
                <HeartHandshake className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-white">Data-Driven & Partisipatif</div>
                  <div className="text-[11px] text-gray-400 mt-0.5 leading-snug">
                    Pengambilan keputusan inklusif berbasis suara dan kebutuhan nyata masyarakat akar rumput.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact & Collaboration Section (Komprehensif: Email, LinkedIn, Instagram) */}
          <div className="p-4 rounded-xl bg-[#171B26] border border-[#262E44] space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#242C40] pb-2.5">
              <div>
                <div className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">
                  Kontak & Kolaborasi Perencanaan
                </div>
                <div className="text-[11px] text-gray-400 mt-0.5">
                  Terbuka untuk diskusi tata ruang, kemitraan riset GIS, dan pemodelan kebijakan publik.
                </div>
              </div>

              {/* Main Action Button */}
              <a
                href="mailto:dermanevan@gmail.com?subject=Kolaborasi%20Perencanaan%20Wilayah%20CityPulse%20Kalteng"
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all shadow-md shadow-blue-600/20 shrink-0 cursor-pointer"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Hubungi Evan</span>
                <ExternalLink className="w-3 h-3 opacity-80" />
              </a>
            </div>

            {/* Social & Professional Communication Channels Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Channel 1: Email */}
              <a
                href="mailto:dermanevan@gmail.com"
                className="p-2.5 rounded-lg bg-[#1E2333] hover:bg-[#252C40] border border-[#2B344C] hover:border-blue-500/40 transition-all flex items-center gap-2.5 group cursor-pointer"
                title="Kirim Email ke dermanevan@gmail.com"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] text-gray-400 block font-medium">Email Resmi</span>
                  <span className="text-xs font-bold text-gray-200 group-hover:text-blue-400 transition-colors truncate block">
                    dermanevan@gmail.com
                  </span>
                </div>
              </a>

              {/* Channel 2: LinkedIn */}
              <a
                href="https://linkedin.com/in/evan-derman"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-lg bg-[#1E2333] hover:bg-[#252C40] border border-[#2B344C] hover:border-sky-500/40 transition-all flex items-center gap-2.5 group cursor-pointer"
                title="Buka Profil LinkedIn Evan Derman"
              >
                <div className="w-8 h-8 rounded-lg bg-sky-500/15 text-sky-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9h2.79v8.37H6.46v-8.37M7.86 6.78a1.62 1.62 0 1 0 0 3.24 1.62 1.62 0 0 0 0-3.24" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] text-gray-400 block font-medium">LinkedIn</span>
                  <span className="text-xs font-bold text-gray-200 group-hover:text-sky-400 transition-colors truncate flex items-center gap-1">
                    <span>evan-derman</span>
                    <ExternalLink className="w-2.5 h-2.5 opacity-60 shrink-0" />
                  </span>
                </div>
              </a>

              {/* Channel 3: Instagram */}
              <a
                href="https://www.instagram.com/vandermaps_/"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-lg bg-[#1E2333] hover:bg-[#252C40] border border-[#2B344C] hover:border-pink-500/40 transition-all flex items-center gap-2.5 group cursor-pointer"
                title="Kunjungi Instagram @vandermaps_"
              >
                <div className="w-8 h-8 rounded-lg bg-pink-500/15 text-pink-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] text-gray-400 block font-medium">Instagram</span>
                  <span className="text-xs font-bold text-gray-200 group-hover:text-pink-400 transition-colors truncate flex items-center gap-1">
                    <span>@vandermaps_</span>
                    <ExternalLink className="w-2.5 h-2.5 opacity-60 shrink-0" />
                  </span>
                </div>
              </a>
            </div>
          </div>

          <div className="text-[10px] text-center text-gray-400 pt-2 border-t border-[#242A3B]">
            CityPulse Kalteng • Inisiator & Pengembang: <strong>Evan</strong> (Ahli Muda Perencana Tata Ruang Wilayah dan Kota, Jenjang 7 LPJK/BNSP) • Hak Cipta Terpelihara © 2026.
          </div>
        </div>
      </div>
    </div>
  );
};
