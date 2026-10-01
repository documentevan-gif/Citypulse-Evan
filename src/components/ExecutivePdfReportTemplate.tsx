import React from 'react';
import { 
  CommentData, 
  AnalysisSummary, 
  Category, 
  Sentiment,
  ALL_CATEGORIES,
  CATEGORY_COLORS
} from '../types';

export interface ExecutivePdfReportTemplateProps {
  filteredData: CommentData[];
  summary: AnalysisSummary;
  selectedRegions: string[];
  selectedCategories: Category[];
  selectedSentiments: Sentiment[];
  totalAllData: number;
  docRef?: string;
  generatedDate?: string;
  initiatorName?: string;
}

/**
 * ExecutivePdfReportTemplate
 * Pure HTML/CSS Print-ready component for CityPulse Kalteng Executive Reports.
 * Features:
 * - A4 Precision dimensions with 14mm margins
 * - Strict page-break-inside: avoid on cards, narrative blocks, and table rows
 * - Fixed column widths preventing date '2026-09-27' from wrapping (white-space: nowrap)
 * - Three new strategic planning analytical sections:
 *   1. Sintesis Naratif Tren Perencanaan Kota (7 Hari Terakhir)
 *   2. Faktor Pemicu Utama (Key Drivers with circular badges)
 *   3. Matriks Tindak Lanjut Instansi (3-card grid with urgency badges)
 */
export const ExecutivePdfReportTemplate: React.FC<ExecutivePdfReportTemplateProps> = ({
  filteredData,
  summary,
  selectedRegions,
  selectedCategories,
  selectedSentiments,
  totalAllData,
  docRef = 'CP-KTG/202609/9830',
  generatedDate = 'Minggu, 27 September 2026',
  initiatorName = 'Evan (Ahli Muda PWK - Jenjang 7 LPJK/BNSP)'
}) => {
  const totalCount = filteredData.length;
  const posCount = summary.sentimentDistribution.Positive || 0;
  const neuCount = summary.sentimentDistribution.Neutral || 0;
  const negCount = summary.sentimentDistribution.Negative || 0;

  const posPct = totalCount > 0 ? Math.round((posCount / totalCount) * 100) : 0;
  const neuPct = totalCount > 0 ? Math.round((neuCount / totalCount) * 100) : 0;
  const negPct = totalCount > 0 ? Math.round((negCount / totalCount) * 100) : 0;

  const regionSummaryText = selectedRegions.length === 14 
    ? 'Seluruh 14 Wilayah Resmi (13 Kabupaten & 1 Kota Palangka Raya)' 
    : `${selectedRegions.length} Wilayah Terpilih (${selectedRegions.slice(0, 4).join(', ')}${selectedRegions.length > 4 ? ` + ${selectedRegions.length - 4} lainnya` : ''})`;

  const catSummaryText = selectedCategories.length === ALL_CATEGORIES.length
    ? 'Seluruh 9 Sektor Pembangunan Daerah Lengkap'
    : `${selectedCategories.length} Sektor (${selectedCategories.join(', ')})`;

  const sentSummaryText = selectedSentiments
    .map(s => s === 'Positive' ? 'Positif' : s === 'Negative' ? 'Negatif' : 'Netral')
    .join(', ');

  // Sector breakdown sorted
  const sectorStats = ALL_CATEGORIES.map(cat => {
    const count = summary.categoryDistribution[cat] || 0;
    const pct = totalCount > 0 ? ((count / totalCount) * 100).toFixed(1) : '0.0';
    return { cat, count, pct: parseFloat(pct) };
  }).sort((a, b) => b.count - a.count);

  const maxSectorCount = Math.max(...sectorStats.map(s => s.count), 1);

  // Regional breakdown sorted
  const regionCounts: Record<string, number> = {};
  filteredData.forEach(d => {
    regionCounts[d.region] = (regionCounts[d.region] || 0) + 1;
  });
  const sortedRegions = Object.entries(regionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  return (
    <div className="pdf-document bg-white text-slate-800 font-sans p-6 sm:p-10 max-w-[210mm] mx-auto text-xs leading-normal">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: A4 portrait;
            margin: 14mm;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .page-break-before {
            page-break-before: always !important;
            break-before: page !important;
          }
          .avoid-break {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}} />

      {/* TOP DECORATIVE HEADER STRIPE */}
      <div className="h-1.5 w-full bg-slate-900 mb-1" />
      <div className="h-0.5 w-full bg-sky-500 mb-4" />

      {/* 1. INSTITUTIONAL HEADER */}
      <header className="flex items-center justify-between border-b border-slate-200 pb-3 mb-5">
        <div>
          <h2 className="text-[11px] font-bold tracking-tight text-slate-900 uppercase">
            Pemerintah Provinsi Kalimantan Tengah
          </h2>
          <p className="text-[9px] text-slate-500 uppercase tracking-wider">
            Sistem Intelijen Perencanaan Wilayah & Aspirasi Masyarakat (CityPulse Kalteng)
          </p>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-mono font-bold text-slate-800">
            No. Dokumen: {docRef}
          </span>
        </div>
      </header>

      {/* 2. EXECUTIVE REPORT TITLE BLOCK */}
      <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 border-l-4 border-l-sky-500 mb-6 avoid-break">
        <h1 className="text-base font-extrabold text-slate-900 tracking-tight">
          LAPORAN EKSEKUTIF ANALISIS REGIONAL ASPIRASI WARGA
        </h1>
        <p className="text-xs text-slate-600 mt-1">
          Pemetaan Spasial, Leksikon Sentimen & Rekomendasi Kebijakan 9 Sektor Pembangunan Wilayah
        </p>
        <div className="text-[10px] text-slate-400 mt-2 flex flex-wrap items-center gap-2">
          <span>Waktu Cetak: {generatedDate}</span>
          <span>•</span>
          <span>Inisiator: <strong>{initiatorName}</strong></span>
        </div>
      </div>

      {/* 3. FILTER PARAMETERS TABLE (BAB 1) */}
      <section className="mb-6 avoid-break">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
          1. Parameter Cakupan Filter Analisis
        </h3>
        <table className="w-full border-collapse border border-slate-200 text-[11px]">
          <tbody>
            <tr className="border-b border-slate-200">
              <td className="w-48 bg-slate-100 font-semibold p-2 border-r border-slate-200 text-slate-700">Sistem Sumber Data</td>
              <td className="p-2 text-slate-800 font-medium">CityPulse Kalteng (Tersinkronisasi Real-Time)</td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="bg-slate-100 font-semibold p-2 border-r border-slate-200 text-slate-700">Cakupan Wilayah</td>
              <td className="p-2 text-slate-800">{regionSummaryText}</td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="bg-slate-100 font-semibold p-2 border-r border-slate-200 text-slate-700">Sektor Pembangunan</td>
              <td className="p-2 text-slate-800">{catSummaryText}</td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="bg-slate-100 font-semibold p-2 border-r border-slate-200 text-slate-700">Filter Sentimen</td>
              <td className="p-2 text-slate-800">{sentSummaryText}</td>
            </tr>
            <tr>
              <td className="bg-slate-100 font-semibold p-2 border-r border-slate-200 text-slate-700">Ukuran Sampel Terfilter</td>
              <td className="p-2 text-slate-800 font-bold text-sky-700">
                {filteredData.length} Aspirasi Warga (dari total {totalAllData} rekaman basis data)
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* 4. EXECUTIVE SUMMARY NARRATIVE (BAB 2) */}
      <section className="mb-6 avoid-break space-y-3">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
          2. Ringkasan Eksekutif & Rekomendasi Kebijakan
        </h3>
        
        {/* Situational Narrative with border-left 4px solid #0EA5E9 */}
        <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 border-l-4 border-l-sky-500">
          <h4 className="text-[11px] font-bold text-slate-900 mb-1">
            A. Narasi Sintesis Situasional:
          </h4>
          <p className="text-[11px] text-slate-700 leading-relaxed">
            {summary.narrativeSummary || 'Data aspirasi sedang diakumulasi dan dianalisis secara berkala melalui sistem intelijen CityPulse Kalteng.'}
          </p>
        </div>

        {/* Policy Recommendation Box */}
        <div className="rounded-lg bg-emerald-50/70 border border-emerald-200 p-4 border-l-4 border-l-emerald-500">
          <h4 className="text-[11px] font-bold text-emerald-900 mb-1">
            B. Tindakan Intervensi Wilayah yang Direkomendasikan:
          </h4>
          <p className="text-[11px] text-emerald-800 leading-relaxed">
            {summary.interventionRecommendation || 'Pertahankan standar pelayanan publik, intensifikasi inspeksi infrastruktur fisik di sentra permukiman, dan optimalkan mitigasi tanggap darurat daerah.'}
          </p>
        </div>
      </section>

      {/* 5. MODERN KPI GRID CARDS (BAB 3) */}
      <section className="mb-6 avoid-break">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5">
          3. Indikator Kunci Sentimen Publik (KPI)
        </h3>
        <div className="grid grid-cols-4 gap-3">
          {/* Total */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 relative overflow-hidden">
            <div className="h-1 bg-sky-500 absolute top-0 left-0 right-0" />
            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Total Aspirasi</div>
            <div className="text-xl font-extrabold text-slate-900 mt-1">{totalCount}</div>
            <div className="text-[9px] text-slate-400 mt-0.5">{selectedRegions.length} Wilayah Aktif</div>
          </div>
          {/* Positif */}
          <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3 relative overflow-hidden">
            <div className="h-1 bg-emerald-500 absolute top-0 left-0 right-0" />
            <div className="text-[9px] font-bold text-emerald-700 uppercase tracking-wider">Sentimen Positif</div>
            <div className="text-xl font-extrabold text-emerald-600 mt-1">{posPct}%</div>
            <div className="text-[9px] text-emerald-600/80 mt-0.5">{posCount} Masukan Apresiatif</div>
          </div>
          {/* Netral */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 relative overflow-hidden">
            <div className="h-1 bg-slate-400 absolute top-0 left-0 right-0" />
            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Sentimen Netral</div>
            <div className="text-xl font-extrabold text-slate-700 mt-1">{neuPct}%</div>
            <div className="text-[9px] text-slate-500 mt-0.5">{neuCount} Saran / Pertanyaan</div>
          </div>
          {/* Negatif */}
          <div className="rounded-lg border border-rose-200 bg-rose-50/60 p-3 relative overflow-hidden">
            <div className="h-1 bg-rose-500 absolute top-0 left-0 right-0" />
            <div className="text-[9px] font-bold text-rose-700 uppercase tracking-wider">Sentimen Negatif</div>
            <div className="text-xl font-extrabold text-rose-600 mt-1">{negPct}%</div>
            <div className="text-[9px] text-rose-600/80 mt-0.5">{negCount} Isu Prioritas</div>
          </div>
        </div>
      </section>

      {/* PAGE BREAK TO PAGE 2 */}
      <div className="page-break-before pt-4">
        {/* 6. DISTRIBUSI SEKTOR & SEBARAN REGIONAL (BAB 4) */}
        <section className="mb-6 avoid-break">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
            4. Distribusi Sektor Pembangunan & Sebaran Regional
          </h3>
          
          <div className="space-y-4">
            <div>
              <h4 className="text-[11px] font-bold text-slate-700 mb-2">
                A. Distribusi Aspirasi Berdasarkan 9 Sektor Pembangunan Daerah
              </h4>
              <div className="space-y-2">
                {sectorStats.map((s, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-[11px]">
                    <span className="w-40 font-semibold text-slate-800 truncate">{s.cat}</span>
                    <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${(s.count / maxSectorCount) * 100}%`,
                          backgroundColor: CATEGORY_COLORS[s.cat] || '#3B82F6'
                        }}
                      />
                    </div>
                    <span className="w-20 text-right font-mono font-bold text-slate-700">
                      {s.count} ({s.pct}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <h4 className="text-[11px] font-bold text-slate-700 mb-2">
                B. Sebaran Wilayah dengan Konsentrasi Aspirasi Tertinggi
              </h4>
              <table className="w-full border-collapse border border-slate-200 text-[11px]">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold text-left">
                    <th className="p-2 w-12 text-center">No</th>
                    <th className="p-2">Kabupaten / Kota</th>
                    <th className="p-2 w-32 text-center">Volume Aspirasi</th>
                    <th className="p-2 w-28 text-center">Persentase</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedRegions.map(([reg, count], idx) => (
                    <tr key={idx} className={idx % 2 === 1 ? 'bg-slate-50' : 'bg-white'}>
                      <td className="p-2 text-center border-t border-slate-200 font-semibold">{idx + 1}</td>
                      <td className="p-2 border-t border-slate-200 font-bold text-slate-800">{reg}</td>
                      <td className="p-2 text-center border-t border-slate-200">{count} Aspirasi</td>
                      <td className="p-2 text-center border-t border-slate-200 font-semibold">
                        {totalCount > 0 ? ((count / totalCount) * 100).toFixed(1) : 0}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>

      {/* PAGE BREAK TO PAGE 3 */}
      <div className="page-break-before pt-4">
        {/* 7. STRATEGIC PLANNING SYNTHESIS & AGENCY MATRIX (BAB 5 - NEW SECTIONS) */}
        <section className="mb-6 avoid-break space-y-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2">
            5. Sintesis Strategis Perencanaan & Matriks Tindak Lanjut Instansi
          </h3>

          {/* NEW SECTION 1: Sintesis Naratif Tren Perencanaan Kota (2 Paragraf) */}
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 border-l-4 border-l-sky-500 avoid-break">
            <h4 className="text-[11px] font-bold text-slate-900 mb-2">
              A. Sintesis Naratif Tren Perencanaan Kota (Analisis Evaluasi 7 Hari Terakhir)
            </h4>
            <p className="text-[11px] text-slate-700 leading-relaxed mb-2.5">
              Eskalasi aspirasi dan keluhan warga dalam 7 hari terakhir didominasi secara signifikan oleh dinamika sektor Lingkungan Hidup dan Penanggulangan Bencana Alam, khususnya ancaman kebakaran hutan dan lahan (karhutla) pada kantong-kantong lahan gambut kering serta kerentanan luapan debit air di sepanjang Daerah Aliran Sungai (DAS) Barito dan Kahayan.
            </p>
            <p className="text-[11px] text-slate-700 leading-relaxed">
              Kondisi ini memicu sentimen ketidakpuasan publik terhadap kesiapsiagaan infrastruktur darurat di tingkat kecamatan. Warga mendesak percepatan modernisasi logistik pemadaman, ketersediaan selang suplai air berdaya jangkau luas, serta penguatan sistem peringatan dini (EWS) hidrometeorologi guna memitigasi risiko kesehatan masyarakat (ISPA) dan stagnasi perputaran logistik antardaerah.
            </p>
          </div>

          {/* NEW SECTION 2: Faktor Pemicu Utama (Key Drivers with Circular Badges) */}
          <div className="space-y-2.5 avoid-break">
            <h4 className="text-[11px] font-bold text-slate-900">
              B. Faktor Pemicu Utama (Key Drivers) Masalah Wilayah
            </h4>
            <div className="space-y-2">
              <div className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 bg-white">
                <span className="w-6 h-6 rounded-full bg-amber-100 border border-amber-400 text-amber-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  <h5 className="font-bold text-slate-900 text-[11px]">
                    Titik Panas (Hotspot) Lahan Gambut Kering & Kabut Asap ISPA
                  </h5>
                  <p className="text-[10px] text-slate-600 mt-0.5 leading-relaxed">
                    Penurunan muka air tanah gambut mempercepat penyebaran titik api di perbatasan Kotawaringin Timur, Pulang Pisau, dan Palangka Raya yang berisiko menurunkan indeks kualitas udara (ISPU).
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 bg-white">
                <span className="w-6 h-6 rounded-full bg-amber-100 border border-amber-400 text-amber-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  <h5 className="font-bold text-slate-900 text-[11px]">
                    Minimnya Sarana Pompa Air Apung & Selang Panjang di Pedalaman
                  </h5>
                  <p className="text-[10px] text-slate-600 mt-0.5 leading-relaxed">
                    Keterbatasan armada pompa bertekanan tinggi dan selang portabel berjarak jangkau &gt;200 meter memperlambat respon pemadaman api darat di lokasi perladangan jauh dari kanal.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 bg-white">
                <span className="w-6 h-6 rounded-full bg-amber-100 border border-amber-400 text-amber-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  3
                </span>
                <div>
                  <h5 className="font-bold text-slate-900 text-[11px]">
                    Kebutuhan Sistem Peringatan Dini (EWS) Banjir Luapan DAS
                  </h5>
                  <p className="text-[10px] text-slate-600 mt-0.5 leading-relaxed">
                    Fluktuasi cuaca ekstrem memicu luapan berkala di DAS Barito dan Murung Raya, menuntut sensor telemetri otomatis untuk mitigasi evakuasi permukiman bantaran sungai.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* NEW SECTION 3: Matriks Tindak Lanjut & Rekomendasi Instansi (3-Column Grid) */}
          <div className="space-y-2.5 avoid-break">
            <h4 className="text-[11px] font-bold text-slate-900">
              C. Matriks Tindak Lanjut & Rekomendasi Instansi Teknis Daerah
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span className="font-bold text-[11px] text-slate-900 leading-tight">
                      BPBD Kalteng & Tim Gabungan Karhutla
                    </span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-rose-100 text-rose-700 border border-rose-300">
                      Segera
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-600 leading-relaxed">
                    Intensifikasi patroli darat terpadu, penyiapan helikopter water bombing di zona kritis gambut, aktivasi posko siaga 24 jam di seluruh kecamatan berstatus rawan tinggi.
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span className="font-bold text-[11px] text-slate-900 leading-tight">
                      Dinas Kesehatan & Disdik Kalteng
                    </span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-rose-100 text-rose-700 border border-rose-300">
                      Segera
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-600 leading-relaxed">
                    Distribusi massal masker medis/N95 ke sekolah dan permukiman sentra asap, penyediaan tabung oksigen gratis di puskesmas, serta skema pembelajaran jarak jauh adaptif jika ISPU memburuk.
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span className="font-bold text-[11px] text-slate-900 leading-tight">
                      Bappeda & Dinas Kehutanan / DLH Kalteng
                    </span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-sky-100 text-sky-800 border border-sky-300">
                      Jangka Menengah
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-600 leading-relaxed">
                    Revitalisasi sekat kanal (canal blocking) di area hidrologis gambut, pengalokasian anggaran operasional Masyarakat Peduli Api (MPA), dan digitalisasi telemetri pemantau DAS Barito.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* PAGE BREAK TO PAGE 4 */}
      <div className="page-break-before pt-4">
        {/* 8. DETAIL TABEL ASPIRASI (BAB 6) */}
        <section className="mb-6">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
            6. Tabel Rekapitulasi Detail Aspirasi Masyarakat
          </h3>
          <p className="text-[10px] text-slate-500 mb-3">
            Daftar lengkap teks aspirasi, identitas pelapor, wilayah administratif, sektor pembangunan, dan klasifikasi sentimen:
          </p>

          <table className="w-full border-collapse border border-slate-200 text-[10px]">
            <thead>
              <tr className="bg-slate-900 text-white font-bold text-center">
                <th className="p-2 border border-slate-300" style={{ width: '5%', minWidth: '35px' }}>No</th>
                <th className="p-2 border border-slate-300" style={{ width: '12%', minWidth: '95px', whiteSpace: 'nowrap' }}>Tanggal</th>
                <th className="p-2 border border-slate-300 text-left" style={{ width: '15%' }}>Wilayah</th>
                <th className="p-2 border border-slate-300 text-left" style={{ width: '13%' }}>Sektor</th>
                <th className="p-2 border border-slate-300" style={{ width: '10%' }}>Sentimen</th>
                <th className="p-2 border border-slate-300 text-left" style={{ width: '35%' }}>Isi Aspirasi Warga</th>
                <th className="p-2 border border-slate-300 text-left" style={{ width: '10%' }}>Pelapor</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item, idx) => {
                const dateStr = item.createdAt ? item.createdAt.slice(0, 10) : '-';
                const isPos = item.sentiment === 'Positive';
                const isNeg = item.sentiment === 'Negative';
                const sentLabel = isPos ? 'Positif' : isNeg ? 'Negatif' : 'Netral';

                return (
                  <tr key={item.id || idx} className={`avoid-break ${idx % 2 === 1 ? 'bg-slate-50' : 'bg-white'}`}>
                    <td className="p-2 border border-slate-200 text-center font-mono">{idx + 1}</td>
                    <td className="p-2 border border-slate-200 text-center font-mono" style={{ whiteSpace: 'nowrap' }}>
                      {dateStr}
                    </td>
                    <td className="p-2 border border-slate-200 font-medium text-slate-800">{item.region}</td>
                    <td className="p-2 border border-slate-200">{item.category}</td>
                    <td className="p-2 border border-slate-200 text-center">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                        isPos 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : isNeg 
                          ? 'bg-rose-100 text-rose-800' 
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {sentLabel}
                      </span>
                    </td>
                    <td className="p-2 border border-slate-200 leading-relaxed break-words" style={{ wordBreak: 'break-word' }}>
                      {item.text}
                    </td>
                    <td className="p-2 border border-slate-200 text-slate-600">{item.author || 'Anonim'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        {/* FOOTER */}
        <footer className="border-t border-slate-200 pt-3 mt-6 flex items-center justify-between text-[10px] text-slate-400">
          <span>CityPulse Kalteng • Inisiator: {initiatorName}</span>
          <span>Dokumen Resmi Perencanaan Wilayah Kalimantan Tengah</span>
        </footer>
      </div>
    </div>
  );
};

export default ExecutivePdfReportTemplate;
