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

          {/* Contact & Collaboration */}
          <div className="p-4 rounded-xl bg-[#171B26] border border-[#262E44] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">
                Kontak & Kolaborasi Perencanaan
              </div>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-blue-400" />
                <a href="mailto:dermanevan@gmail.com" className="text-blue-400 hover:underline">
                  dermanevan@gmail.com
                </a>
              </div>
            </div>

            <a
              href="mailto:dermanevan@gmail.com?subject=Kolaborasi%20Perencanaan%20CityPulse%20Kalteng"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all shadow-md shadow-blue-600/20"
            >
              <span>Hubungi Evan</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="text-[10px] text-center text-gray-400 pt-2 border-t border-[#242A3B]">
            CityPulse Kalteng • Inisiator & Pengembang: <strong>Evan</strong> (Ahli Muda Perencana Tata Ruang Wilayah dan Kota, Jenjang 7 LPJK/BNSP) • Hak Cipta Terpelihara © 2026.
          </div>
        </div>
      </div>
    </div>
  );
};
