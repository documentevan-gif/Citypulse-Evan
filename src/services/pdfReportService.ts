/**
 * Executive Regional Analysis PDF Report Generator
 * Generates official, publication-ready PDF reports for Central Kalimantan Regional Planning.
 * Standard: Modern Executive Design, A4, Deep Navy (#0F172A), Soft Cyan (#0EA5E9), Pill Badges & Clean Corporate Table.
 */
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  CommentData, 
  Category, 
  Sentiment, 
  AnalysisSummary,
  ALL_CATEGORIES, 
  CATEGORY_COLORS 
} from '../types';

export interface PdfReportOptions {
  filteredData: CommentData[];
  summary: AnalysisSummary;
  selectedRegions: string[];
  selectedCategories: Category[];
  selectedSentiments: Sentiment[];
  totalAllData: number;
}

export interface PdfGenerationResult {
  success: boolean;
  filename: string;
  error?: string;
}

/**
 * Generates an executive regional planning report in A4 format.
 */
export async function generateExecutivePdfReport(options: PdfReportOptions): Promise<PdfGenerationResult> {
  const {
    filteredData,
    summary,
    selectedRegions,
    selectedCategories,
    selectedSentiments,
    totalAllData
  } = options;

  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    const contentWidth = pageWidth - margin * 2;
    let currentY = margin;

    // Date and reference string
    const now = new Date();
    const dateFormatted = now.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    const timeFormatted = now.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    
    // Official Document Reference (Standard CP-KTG/YYYYMM/XXXX format)
    const docRef = `CP-KTG/${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}/9830`;
    const filename = `Laporan_Eksekutif_CityPulse_Kalteng_${now.toISOString().slice(0, 10)}.pdf`;

    // Palette: Deep Navy / Slate Blue, Teal/Cyan Accent, Cool Gray
    const NAVY = [15, 23, 42];        // #0F172A - Deep Navy
    const SLATE_DARK = [30, 41, 59];  // #1E293B
    const TEAL_ACCENT = [14, 165, 233]; // #0EA5E9 - Soft Cyan / Teal
    const TEXT_MUTED = [100, 116, 139]; // Slate 500

    // Helper: Add Decorative Executive Header Band
    const drawTopBanner = () => {
      // Primary Deep Navy band
      doc.setFillColor(NAVY[0], NAVY[1], NAVY[2]);
      doc.rect(0, 0, pageWidth, 5.5, 'F');
      // Secondary Teal accent stripe
      doc.setFillColor(TEAL_ACCENT[0], TEAL_ACCENT[1], TEAL_ACCENT[2]);
      doc.rect(0, 5.5, pageWidth, 1.5, 'F');
    };

    drawTopBanner();
    currentY = 14;

    // --- 1. OFFICIAL INSTITUTIONAL HEADER ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
    doc.text('PEMERINTAH PROVINSI KALIMANTAN TENGAH', margin, currentY);

    currentY += 4.2;
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
    doc.text('SISTEM INTELIJEN PERENCANAAN WILAYAH & ASPIRASI MASYARAKAT (CITYPULSE KALTENG)', margin, currentY);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(SLATE_DARK[0], SLATE_DARK[1], SLATE_DARK[2]);
    doc.text(`No. Dokumen: ${docRef}`, pageWidth - margin, currentY, { align: 'right' });

    currentY += 5;
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.6);
    doc.line(margin, currentY, pageWidth - margin, currentY);

    currentY += 7;

    // --- 2. EXECUTIVE REPORT TITLE BLOCK ---
    doc.setFillColor(248, 250, 252); // Cool Gray (#F8FAFC)
    doc.roundedRect(margin, currentY, contentWidth, 23, 2.5, 2.5, 'F');
    doc.setDrawColor(203, 213, 225); // slate-300
    doc.setLineWidth(0.4);
    doc.roundedRect(margin, currentY, contentWidth, 23, 2.5, 2.5, 'S');

    // Left accent bar inside title block
    doc.setFillColor(TEAL_ACCENT[0], TEAL_ACCENT[1], TEAL_ACCENT[2]);
    doc.roundedRect(margin + 0.5, currentY + 0.5, 2.5, 22, 1, 1, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
    doc.text('LAPORAN EKSEKUTIF ANALISIS REGIONAL ASPIRASI WARGA', margin + 6, currentY + 7.5);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('Pemetaan Spasial, Leksikon Sentimen & Rekomendasi Kebijakan 9 Sektor Pembangunan Wilayah', margin + 6, currentY + 13.5);

    doc.setFontSize(7.5);
    doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
    doc.text(`Waktu Cetak: ${dateFormatted}, ${timeFormatted} WIB  |  Inisiator: Evan (Ahli Muda PWK - Jenjang 7 LPJK/BNSP)`, margin + 6, currentY + 18.5);

    currentY += 28;

    // --- 3. FILTER PARAMETERS TABLE (BAB 1) ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
    doc.text('1. PARAMETER CAKUPAN FILTER ANALISIS', margin, currentY);
    currentY += 3.5;

    const regionSummaryText = selectedRegions.length === 14 
      ? 'Seluruh 14 Wilayah Resmi (13 Kabupaten & 1 Kota Palangka Raya)' 
      : `${selectedRegions.length} Wilayah Terpilih (${selectedRegions.slice(0, 4).join(', ')}${selectedRegions.length > 4 ? ` + ${selectedRegions.length - 4} lainnya` : ''})`;

    const catSummaryText = selectedCategories.length === ALL_CATEGORIES.length
      ? 'Seluruh 9 Sektor Pembangunan Daerah Lengkap'
      : `${selectedCategories.length} Sektor (${selectedCategories.join(', ')})`;

    const sentSummaryText = selectedSentiments.map(s => s === 'Positive' ? 'Positif' : s === 'Negative' ? 'Negatif' : 'Netral').join(', ');

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      theme: 'grid',
      styles: { 
        fontSize: 7.5, 
        cellPadding: 2.2, 
        textColor: [30, 41, 59], 
        lineColor: [226, 232, 240],
        lineWidth: 0.2
      },
      headStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold' },
      body: [
        ['Sistem Sumber Data', 'CityPulse Kalteng (Tersinkronisasi Real-Time)'],
        ['Cakupan Wilayah', regionSummaryText],
        ['Sektor Pembangunan', catSummaryText],
        ['Filter Sentimen', sentSummaryText],
        ['Ukuran Sampel Terfilter', `${filteredData.length} Aspirasi Warga (dari total ${totalAllData} rekaman basis data)`]
      ],
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 42, fillColor: [248, 250, 252] },
        1: { cellWidth: contentWidth - 42 }
      }
    });

    currentY = (doc as any).lastAutoTable.finalY + 7;

    // --- 4. EXECUTIVE SUMMARY & STRATEGIC PLANNING SYNTHESIS (BAB 2) ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
    doc.text('2. RINGKASAN EKSEKUTIF & SINTESIS STRATEGIS PERENCANAAN', margin, currentY);
    currentY += 4.5;

    // Narrative Box with refined padding, border-left 4px solid #0EA5E9, and light gray background
    const narrativeText = summary.narrativeSummary || 'Data aspirasi sedang diakumulasi dan dianalisis secara berkala melalui sistem intelijen CityPulse Kalteng.';
    const narrativeLines = doc.splitTextToSize(narrativeText, contentWidth - 12);
    const narrativeHeight = Math.max(narrativeLines.length * 3.8 + 14, 26);

    doc.setFillColor(248, 250, 252); // bg-slate-50 (#F8FAFC)
    doc.setDrawColor(226, 232, 240); // border slate-200
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, currentY, contentWidth, narrativeHeight, 2, 2, 'FD');

    // Accent line on left: 4px solid #0EA5E9 (Teal/Cyan)
    doc.setFillColor(TEAL_ACCENT[0], TEAL_ACCENT[1], TEAL_ACCENT[2]);
    doc.rect(margin, currentY, 1.8, narrativeHeight, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
    doc.text('A. Narasi Sintesis Situasional & Tren Perencanaan Kota:', margin + 6, currentY + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.3);
    doc.setTextColor(51, 65, 85);
    doc.text(narrativeLines, margin + 6, currentY + 11);

    currentY += narrativeHeight + 5;

    // Policy Recommendation Box
    const policyText = summary.interventionRecommendation || 'Pertahankan standar pelayanan publik, intensifikasi inspeksi infrastruktur fisik di sentra permukiman, dan optimalkan mitigasi tanggap darurat daerah.';
    const policyLines = doc.splitTextToSize(policyText, contentWidth - 12);
    const policyHeight = Math.max(policyLines.length * 3.8 + 12, 20);

    doc.setFillColor(240, 253, 250); // Mint / Emerald soft
    doc.setDrawColor(153, 246, 228); // Teal-200
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, currentY, contentWidth, policyHeight, 2, 2, 'FD');

    // Accent line on left (Emerald-500)
    doc.setFillColor(16, 185, 129);
    doc.rect(margin, currentY, 1.8, policyHeight, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 118, 110); // Teal-800
    doc.text('B. Tindakan Intervensi Wilayah yang Direkomendasikan:', margin + 6, currentY + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.3);
    doc.setTextColor(19, 78, 74);
    doc.text(policyLines, margin + 6, currentY + 10.5);

    currentY += policyHeight + 7;

    // --- 5. MODERN KPI GRID CARDS (BAB 3) ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
    doc.text('3. INDIKATOR KUNCI SENTIMEN PUBLIK (KPI)', margin, currentY);
    currentY += 4.5;

    const totalCount = filteredData.length;
    const posCount = summary.sentimentDistribution.Positive || 0;
    const neuCount = summary.sentimentDistribution.Neutral || 0;
    const negCount = summary.sentimentDistribution.Negative || 0;

    const posPct = totalCount > 0 ? Math.round((posCount / totalCount) * 100) : 0;
    const neuPct = totalCount > 0 ? Math.round((neuCount / totalCount) * 100) : 0;
    const negPct = totalCount > 0 ? Math.round((negCount / totalCount) * 100) : 0;

    const cardWidth = (contentWidth - 9) / 4;
    const cardHeight = 18;

    const kpiCards = [
      { 
        label: 'TOTAL ASPIRASI', 
        val: `${totalCount}`, 
        sub: `${selectedRegions.length} Wilayah Aktif`, 
        bg: [248, 250, 252], 
        border: [203, 213, 225], 
        topAccent: [14, 165, 233], // Teal/Cyan
        valColor: [15, 23, 42] 
      },
      { 
        label: 'SENTIMEN POSITIF', 
        val: `${posPct}%`, 
        sub: `${posCount} Masukan Apresiatif`, 
        bg: [236, 253, 245], 
        border: [167, 243, 208], 
        topAccent: [16, 185, 129], // Emerald
        valColor: [5, 150, 105] 
      },
      { 
        label: 'SENTIMEN NETRAL', 
        val: `${neuPct}%`, 
        sub: `${neuCount} Saran / Pertanyaan`, 
        bg: [248, 250, 252], 
        border: [226, 232, 240], 
        topAccent: [100, 116, 139], // Slate
        valColor: [71, 85, 105] 
      },
      { 
        label: 'SENTIMEN NEGATIF', 
        val: `${negPct}%`, 
        sub: `${negCount} Isu Prioritas`, 
        bg: [254, 242, 242], 
        border: [254, 202, 202], 
        topAccent: [239, 68, 68], // Red
        valColor: [220, 38, 38] 
      }
    ];

    kpiCards.forEach((c, idx) => {
      const cx = margin + idx * (cardWidth + 3);
      // Card Background & Border
      doc.setFillColor(c.bg[0], c.bg[1], c.bg[2]);
      doc.setDrawColor(c.border[0], c.border[1], c.border[2]);
      doc.setLineWidth(0.3);
      doc.roundedRect(cx, currentY, cardWidth, cardHeight, 2, 2, 'FD');

      // Top color indicator bar
      doc.setFillColor(c.topAccent[0], c.topAccent[1], c.topAccent[2]);
      doc.roundedRect(cx + 0.5, currentY + 0.5, cardWidth - 1, 1.8, 1, 1, 'F');

      // Card Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.2);
      doc.setTextColor(100, 116, 139);
      doc.text(c.label, cx + 3, currentY + 5.8);

      // Card Value
      doc.setFontSize(12);
      doc.setTextColor(c.valColor[0], c.valColor[1], c.valColor[2]);
      doc.text(c.val, cx + 3, currentY + 11.5);

      // Card Subtitle
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.2);
      doc.setTextColor(100, 116, 139);
      doc.text(c.sub, cx + 3, currentY + 15.5);
    });

    currentY += cardHeight + 8;

    // --- 6. STATISTICAL VISUALIZATIONS & REGIONAL SPREAD (BAB 4 - PAGE 2) ---
    doc.addPage();
    drawTopBanner();
    currentY = 16;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
    doc.text('4. DISTRIBUSI SEKTOR PEMBANGUNAN & SEBARAN REGIONAL', margin, currentY);
    currentY += 4.5;

    // Section 4A: 9 Official Sectors Breakdown Table & Progress Bars
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(SLATE_DARK[0], SLATE_DARK[1], SLATE_DARK[2]);
    doc.text('A. Distribusi Aspirasi Berdasarkan 9 Sektor Pembangunan Daerah', margin, currentY);
    currentY += 3.5;

    // Build sector data rows sorted descending
    const sectorStats = ALL_CATEGORIES.map(cat => {
      const count = summary.categoryDistribution[cat] || 0;
      const pct = totalCount > 0 ? ((count / totalCount) * 100).toFixed(1) : '0.0';
      return { cat, count, pct: parseFloat(pct) };
    }).sort((a, b) => b.count - a.count);

    const maxSectorCount = Math.max(...sectorStats.map(s => s.count), 1);

    // Draw high-resolution sector horizontal progress bars
    const sectorBarHeight = 5.4;
    const barMaxWidth = 84;

    sectorStats.forEach((s) => {
      // Label Sektor
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.2);
      doc.setTextColor(30, 41, 59);
      doc.text(s.cat, margin + 2, currentY + 3.8);

      // Background Track (Minimalist Cool Gray)
      const barX = margin + 46;
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(barX, currentY + 0.8, barMaxWidth, 3.8, 1, 1, 'F');

      // Value Fill Progress Bar
      const fillWidth = (s.count / maxSectorCount) * barMaxWidth;
      if (fillWidth > 0) {
        const hex = CATEGORY_COLORS[s.cat] || '#3B82F6';
        const r = parseInt(hex.slice(1, 3), 16) || 59;
        const g = parseInt(hex.slice(3, 5), 16) || 130;
        const b = parseInt(hex.slice(5, 7), 16) || 246;
        doc.setFillColor(r, g, b);
        doc.roundedRect(barX, currentY + 0.8, Math.max(fillWidth, 2.5), 3.8, 1, 1, 'F');
      }

      // Numbers & Percentage Pill
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(15, 23, 42);
      doc.text(`${s.count} (${s.pct}%)`, barX + barMaxWidth + 4, currentY + 3.8);

      currentY += sectorBarHeight;
    });

    currentY += 6.5;

    // Section 4B: Regional Distribution
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(SLATE_DARK[0], SLATE_DARK[1], SLATE_DARK[2]);
    doc.text('B. Sebaran Wilayah dengan Konsentrasi Aspirasi Tertinggi', margin, currentY);
    currentY += 3.5;

    // Compute regional counts
    const regionCounts: Record<string, number> = {};
    filteredData.forEach(d => {
      regionCounts[d.region] = (regionCounts[d.region] || 0) + 1;
    });

    const sortedRegions = Object.entries(regionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);

    const regionTableBody = sortedRegions.map(([reg, count], idx) => {
      const pct = totalCount > 0 ? ((count / totalCount) * 100).toFixed(1) : '0.0';
      return [`${idx + 1}`, reg, `${count} Aspirasi`, `${pct}%`];
    });

    if (regionTableBody.length === 0) {
      regionTableBody.push(['-', 'Belum ada data wilayah yang terekam', '0', '0%']);
    }

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      theme: 'striped',
      styles: { 
        fontSize: 7.2, 
        cellPadding: 2, 
        textColor: [30, 41, 59],
        lineColor: [226, 232, 240],
        lineWidth: 0.2
      },
      headStyles: { 
        fillColor: [15, 23, 42], // Deep Navy
        textColor: [255, 255, 255], 
        fontStyle: 'bold' 
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252] // Cool Gray zebra striping
      },
      head: [['No', 'Kabupaten / Kota', 'Volume Aspirasi', 'Persentase']],
      body: regionTableBody,
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 90, fontStyle: 'bold' },
        2: { cellWidth: 40, halign: 'center' },
        3: { cellWidth: 42, halign: 'center' }
      }
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;

    // --- 5. SINTESIS STRATEGIS PERENCANAAN WILAYAH & REKOMENDASI KEBIJAKAN (BAB 5) ---
    // Tambahkan seksi analitis baru: Sintesis Naratif Tren Kota, Faktor Pemicu Utama (Key Drivers), dan Matriks Tindak Lanjut Instansi
    doc.addPage();
    drawTopBanner();
    currentY = 16;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
    doc.text('5. SINTESIS STRATEGIS PERENCANAAN & MATRIKS TINDAK LANJUT INSTANSI', margin, currentY);
    currentY += 4.5;

    // SEKSI 1: SINTESIS NARATIF TREN PERENCANAAN KOTA
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(SLATE_DARK[0], SLATE_DARK[1], SLATE_DARK[2]);
    doc.text('A. Sintesis Naratif Tren Perencanaan Kota (Analisis Evaluasi 7 Hari Terakhir)', margin, currentY);
    currentY += 3.5;

    const narrativeTrendP1 = "Eskalasi aspirasi dan keluhan warga dalam 7 hari terakhir didominasi secara signifikan oleh dinamika sektor Lingkungan Hidup dan Penanggulangan Bencana Alam, khususnya ancaman kebakaran hutan dan lahan (karhutla) pada kantong-kantong lahan gambut kering serta kerentanan luapan debit air di sepanjang Daerah Aliran Sungai (DAS) Barito dan Kahayan.";
    const narrativeTrendP2 = "Kondisi ini memicu sentimen ketidakpuasan publik terhadap kesiapsiagaan infrastruktur darurat di tingkat kecamatan. Warga mendesak percepatan modernisasi logistik pemadaman, ketersediaan selang suplai air berdaya jangkau luas, serta penguatan sistem peringatan dini (EWS) hidrometeorologi guna memitigasi risiko kesehatan masyarakat (ISPA) dan stagnasi perputaran logistik antardaerah.";

    const p1Lines = doc.splitTextToSize(narrativeTrendP1, contentWidth - 10);
    const p2Lines = doc.splitTextToSize(narrativeTrendP2, contentWidth - 10);
    const trendBoxHeight = (p1Lines.length + p2Lines.length) * 3.6 + 12;

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, currentY, contentWidth, trendBoxHeight, 2, 2, 'FD');

    // Accent line left (Teal-500)
    doc.setFillColor(TEAL_ACCENT[0], TEAL_ACCENT[1], TEAL_ACCENT[2]);
    doc.rect(margin, currentY, 1.8, trendBoxHeight, 'F');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(51, 65, 85);
    doc.text(p1Lines, margin + 5, currentY + 5);
    doc.text(p2Lines, margin + 5, currentY + 5 + (p1Lines.length * 3.6) + 2.5);

    currentY += trendBoxHeight + 6;

    // SEKSI 2: FAKTOR PEMICU UTAMA (KEY DRIVERS)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(SLATE_DARK[0], SLATE_DARK[1], SLATE_DARK[2]);
    doc.text('B. Faktor Pemicu Utama (Key Drivers) Masalah Wilayah', margin, currentY);
    currentY += 3.5;

    const keyDrivers = [
      { num: '1', title: 'Titik Panas (Hotspot) Lahan Gambut Kering & Kabut Asap ISPA', desc: 'Penurunan muka air tanah gambut mempercepat penyebaran titik api di perbatasan Kotawaringin Timur, Pulang Pisau, dan Palangka Raya yang berisiko menurunkan indeks kualitas udara (ISPU).' },
      { num: '2', title: 'Minimnya Sarana Pompa Air Apung & Selang Panjang di Pedalaman', desc: 'Keterbatasan armada pompa bertekanan tinggi dan selang portabel berjarak jangkau >200 meter memperlambat respon pemadaman api darat di lokasi perladangan jauh dari kanal.' },
      { num: '3', title: 'Kebutuhan Sistem Peringatan Dini (EWS) Banjir Luapan DAS', desc: 'Fluktuasi cuaca ekstrem memicu luapan berkala di DAS Barito dan Murung Raya, menuntut sensor telemetri otomatis untuk mitigasi evakuasi permukiman bantaran sungai.' }
    ];

    const driverBoxWidth = contentWidth;
    keyDrivers.forEach((kd) => {
      const kdTitleLines = doc.splitTextToSize(kd.title, driverBoxWidth - 16);
      const kdDescLines = doc.splitTextToSize(kd.desc, driverBoxWidth - 16);
      const kdHeight = Math.max((kdTitleLines.length + kdDescLines.length) * 3.4 + 6, 13);

      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.2);
      doc.roundedRect(margin, currentY, driverBoxWidth, kdHeight, 1.5, 1.5, 'FD');

      // Number badge (circular filled badge)
      doc.setFillColor(254, 243, 199); // Amber-100
      doc.circle(margin + 6, currentY + 6, 3.2, 'F');
      doc.setDrawColor(245, 158, 11); // Amber-500
      doc.circle(margin + 6, currentY + 6, 3.2, 'S');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(180, 83, 9); // Amber-700
      doc.text(kd.num, margin + 6, currentY + 7.2, { align: 'center' });

      // Title & Desc
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.2);
      doc.setTextColor(15, 23, 42);
      doc.text(kdTitleLines, margin + 12, currentY + 4.8);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.8);
      doc.setTextColor(71, 85, 105);
      doc.text(kdDescLines, margin + 12, currentY + 4.8 + (kdTitleLines.length * 3.4));

      currentY += kdHeight + 2.5;
    });

    currentY += 4;

    // SEKSI 3: MATRIKS TINDAK LANJUT & REKOMENDASI INSTANSI
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(SLATE_DARK[0], SLATE_DARK[1], SLATE_DARK[2]);
    doc.text('C. Matriks Tindak Lanjut & Rekomendasi Instansi Teknis Daerah', margin, currentY);
    currentY += 3.5;

    const agencyMatrix = [
      {
        agency: 'BPBD Kalteng & Tim Gabungan Karhutla',
        priority: 'Segera',
        priorityBg: [254, 226, 226],
        priorityText: [185, 28, 28],
        action: 'Intensifikasi patroli darat terpadu, penyiapan helikopter water bombing di zona kritis gambut, aktivasi posko siaga 24 jam di seluruh kecamatan berstatus rawan tinggi.'
      },
      {
        agency: 'Dinas Kesehatan & Disdik Kalteng',
        priority: 'Segera',
        priorityBg: [254, 226, 226],
        priorityText: [185, 28, 28],
        action: 'Distribusi massal masker medis/N95 ke sekolah dan permukiman sentra asap, penyediaan tabung oksigen gratis di puskesmas, serta skema pembelajaran jarak jauh adaptif jika ISPU memburuk.'
      },
      {
        agency: 'Bappeda & Dinas Kehutanan / DLH Kalteng',
        priority: 'Jangka Menengah',
        priorityBg: [224, 242, 254],
        priorityText: [3, 105, 161],
        action: 'Revitalisasi sekat kanal (canal blocking) di area hidrologis gambut, pengalokasian anggaran operasional Masyarakat Peduli Api (MPA), dan digitalisasi telemetri pemantau DAS Barito.'
      }
    ];

    const cardGap = 3;
    const matrixCardWidth = (contentWidth - (cardGap * 2)) / 3;
    const matrixCardHeight = 36;

    agencyMatrix.forEach((item, idx) => {
      const cardX = margin + idx * (matrixCardWidth + cardGap);

      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.roundedRect(cardX, currentY, matrixCardWidth, matrixCardHeight, 2, 2, 'FD');

      // Top Header of card: Agency name
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.2);
      doc.setTextColor(15, 23, 42);
      const agencyLines = doc.splitTextToSize(item.agency, matrixCardWidth - 6);
      doc.text(agencyLines, cardX + 3, currentY + 5);

      // Priority Badge
      const badgeY = currentY + 5 + (agencyLines.length * 3.4);
      doc.setFillColor(item.priorityBg[0], item.priorityBg[1], item.priorityBg[2]);
      doc.roundedRect(cardX + 3, badgeY, item.priority === 'Segera' ? 14 : 24, 3.8, 1, 1, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.2);
      doc.setTextColor(item.priorityText[0], item.priorityText[1], item.priorityText[2]);
      doc.text(item.priority, cardX + 4.5, badgeY + 2.8);

      // Action description
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(71, 85, 105);
      const actionLines = doc.splitTextToSize(item.action, matrixCardWidth - 6);
      doc.text(actionLines, cardX + 3, badgeY + 6.5);
    });

    currentY += matrixCardHeight + 8;

    // --- 6. CLEAN CORPORATE TABLE: DETAILED CITIZEN ASPIRATIONS (BAB 6) ---
    doc.addPage();
    drawTopBanner();
    currentY = 16;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
    doc.text('6. TABEL REKAPITULASI DETAIL ASPIRASI MASYARAKAT', margin, currentY);
    currentY += 3;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
    doc.text('Daftar lengkap teks aspirasi, identitas pelapor, wilayah administratif, sektor pembangunan, dan klasifikasi sentimen:', margin, currentY);
    currentY += 4.5;

    // Map ALL data rows preserving 100% integrity
    const dataRows = filteredData.map((item, idx) => {
      const dateStr = item.createdAt ? item.createdAt.slice(0, 10) : '-';
      const cleanText = item.text.replace(/[\n\r]+/g, ' ').trim();
      const sentLabel = item.sentiment === 'Positive' ? 'Positif' : item.sentiment === 'Negative' ? 'Negatif' : 'Netral';

      return [
        (idx + 1).toString(),
        dateStr,
        item.region,
        item.category,
        sentLabel,
        cleanText,
        item.author || 'Anonim'
      ];
    });

    // Precision column widths to ensure NO text wraps awkwardly on Date (white-space nowrap behavior)
    // Total contentWidth = 182mm (A4 210mm - 2*14mm margins)
    // No: 9mm (~5%), Tanggal: 22mm (~12%, fits '2026-09-27' without wrap), Wilayah: 27mm (~15%), Sektor: 24mm (~13%), Sentimen: 18mm (~10%), Isi: 64mm (~35%), Pelapor: 18mm (~10%)
    // Sum = 9 + 22 + 27 + 24 + 18 + 64 + 18 = 182mm (100% exact width)
    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      theme: 'grid',
      styles: {
        fontSize: 6.8,
        cellPadding: 2.4, // Luas agar teks panjang tidak sesak
        textColor: [30, 41, 59],
        overflow: 'linebreak',
        lineColor: [226, 232, 240], // Garis batas halus
        lineWidth: 0.2
      },
      headStyles: {
        fillColor: [15, 23, 42], // Deep Navy
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center',
        cellPadding: 2.8
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252] // Cool Gray (#F8FAFC)
      },
      head: [['No', 'Tanggal', 'Wilayah', 'Sektor', 'Sentimen', 'Isi Aspirasi Warga', 'Pelapor']],
      body: dataRows.length > 0 ? dataRows : [['-', '-', '-', '-', '-', 'Belum ada data aspirasi sesuai filter yang dipilih', '-']],
      columnStyles: {
        0: { cellWidth: 9, halign: 'center' }, // No (5%)
        1: { cellWidth: 22, halign: 'center', fontStyle: 'normal' }, // Tanggal (12%, min 95px equiv - ensures nowrap)
        2: { cellWidth: 27 }, // Wilayah (15%)
        3: { cellWidth: 24 }, // Sektor (13%)
        4: { cellWidth: 18, halign: 'center' }, // Sentimen (10%)
        5: { cellWidth: 64, cellPadding: 2.4 }, // Isi Aspirasi (35%)
        6: { cellWidth: 18 }  // Pelapor (10%)
      },
      // Pill badge styling for Sentiment Status
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 4) {
          const val = data.cell.raw;
          if (val === 'Positif') {
            data.cell.styles.textColor = [21, 128, 61]; // Emerald-700
            data.cell.styles.fillColor = [220, 252, 231]; // Emerald-100
            data.cell.styles.fontStyle = 'bold';
          } else if (val === 'Negatif') {
            data.cell.styles.textColor = [185, 28, 28]; // Red-700
            data.cell.styles.fillColor = [254, 226, 226]; // Red-100
            data.cell.styles.fontStyle = 'bold';
          } else if (val === 'Netral') {
            data.cell.styles.textColor = [71, 85, 105]; // Slate-600
            data.cell.styles.fillColor = [241, 245, 249]; // Slate-100
            data.cell.styles.fontStyle = 'bold';
          }
        }
      },
      pageBreak: 'auto',
      rowPageBreak: 'avoid'
    });

    // --- 8. FOOTER WITH PAGE NUMBERS ON ALL PAGES ---
    const totalPages = doc.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(margin, pageHeight - 9, pageWidth - margin, pageHeight - 9);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.8);
      doc.setTextColor(148, 163, 184);
      doc.text('CityPulse Kalteng  |  Inisiator: Evan (Ahli Muda PWK)', margin, pageHeight - 5.5);
      doc.text(`Halaman ${p} dari ${totalPages}`, pageWidth - margin, pageHeight - 5.5, { align: 'right' });
    }

    // Trigger download in browser
    doc.save(filename);

    return {
      success: true,
      filename
    };
  } catch (err: any) {
    console.error('Gagal membuat dokumen PDF:', err);
    return {
      success: false,
      filename: '',
      error: err?.message || 'Terjadi kesalahan saat memproduksi dokumen PDF.'
    };
  }
}

