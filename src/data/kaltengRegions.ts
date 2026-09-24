export const KALTENG_REGIONS = [
  'Kota Palangka Raya',
  'Kabupaten Barito Selatan',
  'Kabupaten Barito Timur',
  'Kabupaten Barito Utara',
  'Kabupaten Gunung Mas',
  'Kabupaten Kapuas',
  'Kabupaten Katingan',
  'Kabupaten Kotawaringin Barat',
  'Kabupaten Kotawaringin Timur',
  'Kabupaten Lamandau',
  'Kabupaten Murung Raya',
  'Kabupaten Pulang Pisau',
  'Kabupaten Sukamara',
  'Kabupaten Seruyan',
] as const;

export type KaltengRegion = typeof KALTENG_REGIONS[number];

export const KORIDOR_MAP: Record<string, KaltengRegion[]> = {
  'Koridor Tengah & Ibukota': [
    'Kota Palangka Raya',
    'Kabupaten Katingan',
    'Kabupaten Gunung Mas',
    'Kabupaten Pulang Pisau',
  ],
  'Koridor Pesisir & Selatan': [
    'Kabupaten Kapuas',
    'Kabupaten Pulang Pisau',
    'Kabupaten Seruyan',
  ],
  'Koridor Barat (Industri & Pelabuhan)': [
    'Kabupaten Kotawaringin Barat',
    'Kabupaten Kotawaringin Timur',
    'Kabupaten Lamandau',
    'Kabupaten Sukamara',
    'Kabupaten Seruyan',
  ],
  'Koridor DAS Barito': [
    'Kabupaten Murung Raya',
    'Kabupaten Barito Utara',
    'Kabupaten Barito Selatan',
    'Kabupaten Barito Timur',
  ],
};

// Normalized aliases dictionary for data cleaning
export const REGION_SYNONYMS: Record<string, KaltengRegion> = {
  'palangkaraya': 'Kota Palangka Raya',
  'palangka raya': 'Kota Palangka Raya',
  'kota palangka raya': 'Kota Palangka Raya',
  'barsel': 'Kabupaten Barito Selatan',
  'barito selatan': 'Kabupaten Barito Selatan',
  'buntok': 'Kabupaten Barito Selatan',
  'bartim': 'Kabupaten Barito Timur',
  'barito timur': 'Kabupaten Barito Timur',
  'tamiang layang': 'Kabupaten Barito Timur',
  'barut': 'Kabupaten Barito Utara',
  'barito utara': 'Kabupaten Barito Utara',
  'muara teweh': 'Kabupaten Barito Utara',
  'gumas': 'Kabupaten Gunung Mas',
  'gunung mas': 'Kabupaten Gunung Mas',
  'kuala kurun': 'Kabupaten Gunung Mas',
  'kapuas': 'Kabupaten Kapuas',
  'kuala kapuas': 'Kabupaten Kapuas',
  'katingan': 'Kabupaten Katingan',
  'kasongan': 'Kabupaten Katingan',
  'kobar': 'Kabupaten Kotawaringin Barat',
  'kotawaringin barat': 'Kabupaten Kotawaringin Barat',
  'pangkalan bun': 'Kabupaten Kotawaringin Barat',
  'kotim': 'Kabupaten Kotawaringin Timur',
  'kotawaringin timur': 'Kabupaten Kotawaringin Timur',
  'sampit': 'Kabupaten Kotawaringin Timur',
  'lamandau': 'Kabupaten Lamandau',
  'nanga bulik': 'Kabupaten Lamandau',
  'mura': 'Kabupaten Murung Raya',
  'murung raya': 'Kabupaten Murung Raya',
  'puruk cahu': 'Kabupaten Murung Raya',
  'pulpis': 'Kabupaten Pulang Pisau',
  'pulang pisau': 'Kabupaten Pulang Pisau',
  'sukamara': 'Kabupaten Sukamara',
  'seruyan': 'Kabupaten Seruyan',
  'kuala pembuang': 'Kabupaten Seruyan',
};

// Standardize any input string to official Kalteng Region or empty string
export function standardizeRegion(raw: string): KaltengRegion | '' {
  if (!raw || typeof raw !== 'string') return '';
  const cleaned = raw.toLowerCase().trim();
  const simplified = cleaned.replace(/^(kabupaten|kab\.|kota)\s+/, '').trim();

  if (REGION_SYNONYMS[cleaned]) return REGION_SYNONYMS[cleaned];
  if (REGION_SYNONYMS[simplified]) return REGION_SYNONYMS[simplified];

  for (const official of KALTENG_REGIONS) {
    const offClean = official.toLowerCase().replace(/^(kabupaten|kota)\s+/, '');
    if (cleaned.includes(offClean) || offClean.includes(cleaned)) {
      return official;
    }
  }
  return '';
}

// Coordinate mapping for SVG / Canvas graph placement (normalized X: 50..750, Y: 50..450)
export const KALTENG_COORDS: Record<KaltengRegion, { x: number; y: number; shortName: string }> = {
  'Kota Palangka Raya': { x: 440, y: 260, shortName: 'Palangka Raya' },
  'Kabupaten Pulang Pisau': { x: 490, y: 340, shortName: 'Pulang Pisau' },
  'Kabupaten Kapuas': { x: 530, y: 380, shortName: 'Kapuas' },
  'Kabupaten Katingan': { x: 350, y: 220, shortName: 'Katingan' },
  'Kabupaten Gunung Mas': { x: 430, y: 140, shortName: 'Gunung Mas' },
  'Kabupaten Kotawaringin Timur': { x: 260, y: 300, shortName: 'Kotim (Sampit)' },
  'Kabupaten Seruyan': { x: 200, y: 350, shortName: 'Seruyan' },
  'Kabupaten Kotawaringin Barat': { x: 130, y: 320, shortName: 'Kobar (P. Bun)' },
  'Kabupaten Lamandau': { x: 90, y: 220, shortName: 'Lamandau' },
  'Kabupaten Sukamara': { x: 90, y: 380, shortName: 'Sukamara' },
  'Kabupaten Barito Selatan': { x: 580, y: 230, shortName: 'Barsel (Buntok)' },
  'Kabupaten Barito Timur': { x: 670, y: 260, shortName: 'Bartim (T. Layang)' },
  'Kabupaten Barito Utara': { x: 620, y: 130, shortName: 'Barut (M. Teweh)' },
  'Kabupaten Murung Raya': { x: 540, y: 60, shortName: 'Mura (Puruk Cahu)' },
};

// Physical / Logistical Edges between Kalteng regions
export interface KaltengEdge {
  source: KaltengRegion;
  target: KaltengRegion;
  weight: number;
  label: string;
}

export const KALTENG_EDGES: KaltengEdge[] = [
  { source: 'Kota Palangka Raya', target: 'Kabupaten Pulang Pisau', weight: 95, label: 'Trans Kalimantan Selatan' },
  { source: 'Kota Palangka Raya', target: 'Kabupaten Katingan', weight: 88, label: 'Poros Tengah Barat' },
  { source: 'Kota Palangka Raya', target: 'Kabupaten Gunung Mas', weight: 82, label: 'Akses Utama Pedalaman' },
  { source: 'Kota Palangka Raya', target: 'Kabupaten Kapuas', weight: 78, label: 'Koridor Ekonomi Ibukota' },
  { source: 'Kabupaten Pulang Pisau', target: 'Kabupaten Kapuas', weight: 90, label: 'Lumbung Pangan & Pelabuhan' },
  { source: 'Kabupaten Katingan', target: 'Kabupaten Kotawaringin Timur', weight: 85, label: 'Arteri Logistik Utama' },
  { source: 'Kabupaten Kotawaringin Timur', target: 'Kabupaten Seruyan', weight: 80, label: 'Sentra Sawit & Industri' },
  { source: 'Kabupaten Kotawaringin Timur', target: 'Kabupaten Kotawaringin Barat', weight: 84, label: 'Koneksi Dua Kota Utama' },
  { source: 'Kabupaten Kotawaringin Barat', target: 'Kabupaten Lamandau', weight: 79, label: 'Koridor Perbatasan Kalbar' },
  { source: 'Kabupaten Kotawaringin Barat', target: 'Kabupaten Sukamara', weight: 75, label: 'Pesisir Barat Kalteng' },
  { source: 'Kabupaten Lamandau', target: 'Kabupaten Sukamara', weight: 65, label: 'Konektivitas Barat' },
  { source: 'Kabupaten Kapuas', target: 'Kabupaten Barito Selatan', weight: 76, label: 'Pintu Masuk DAS Barito' },
  { source: 'Kabupaten Barito Selatan', target: 'Kabupaten Barito Timur', weight: 88, label: 'Konektivitas Barito Hilir' },
  { source: 'Kabupaten Barito Selatan', target: 'Kabupaten Barito Utara', weight: 82, label: 'Poros Tambang & Sungai' },
  { source: 'Kabupaten Barito Utara', target: 'Kabupaten Murung Raya', weight: 86, label: 'Koridor Hulu Barito' },
  { source: 'Kabupaten Gunung Mas', target: 'Kabupaten Barito Utara', weight: 55, label: 'Lintas Pedalaman' },
  { source: 'Kabupaten Gunung Mas', target: 'Kabupaten Katingan', weight: 60, label: 'Batas Wilayah Hulu' },
  { source: 'Kabupaten Seruyan', target: 'Kabupaten Kotawaringin Barat', weight: 70, label: 'Penyangga TN Tanjung Puting' },
];

// Pre-calculated SNA Topology Metrics
export interface SnaNodeMetrics {
  region: KaltengRegion;
  shortName: string;
  degreeCentrality: number;
  betweennessCentrality: number;
  closenessCentrality: number;
  degree: number;
  koridor: string;
}

export const BASE_SNA_METRICS: SnaNodeMetrics[] = [
  { region: 'Kota Palangka Raya', shortName: 'Palangka Raya', degreeCentrality: 0.3077, betweennessCentrality: 0.5256, closenessCentrality: 0.4483, degree: 4, koridor: 'Ibukota & Poros Tengah' },
  { region: 'Kabupaten Kotawaringin Timur', shortName: 'Kotim (Sampit)', degreeCentrality: 0.2308, betweennessCentrality: 0.4615, closenessCentrality: 0.4194, degree: 3, koridor: 'Koridor Barat' },
  { region: 'Kabupaten Katingan', shortName: 'Katingan', degreeCentrality: 0.2308, betweennessCentrality: 0.4359, closenessCentrality: 0.4333, degree: 3, koridor: 'Poros Tengah' },
  { region: 'Kabupaten Barito Selatan', shortName: 'Barsel (Buntok)', degreeCentrality: 0.2308, betweennessCentrality: 0.3846, closenessCentrality: 0.4063, degree: 3, koridor: 'DAS Barito' },
  { region: 'Kabupaten Kapuas', shortName: 'Kapuas', degreeCentrality: 0.2308, betweennessCentrality: 0.2821, closenessCentrality: 0.3824, degree: 3, koridor: 'Pesisir & Selatan' },
  { region: 'Kabupaten Barito Utara', shortName: 'Barut (M. Teweh)', degreeCentrality: 0.2308, betweennessCentrality: 0.2308, closenessCentrality: 0.3714, degree: 3, koridor: 'DAS Barito' },
  { region: 'Kabupaten Kotawaringin Barat', shortName: 'Kobar (P. Bun)', degreeCentrality: 0.3077, betweennessCentrality: 0.2179, closenessCentrality: 0.3611, degree: 4, koridor: 'Koridor Barat' },
  { region: 'Kabupaten Gunung Mas', shortName: 'Gunung Mas', degreeCentrality: 0.2308, betweennessCentrality: 0.1667, closenessCentrality: 0.4063, degree: 3, koridor: 'Pedalaman' },
  { region: 'Kabupaten Pulang Pisau', shortName: 'Pulang Pisau', degreeCentrality: 0.1538, betweennessCentrality: 0.0513, closenessCentrality: 0.3714, degree: 2, koridor: 'Pesisir & Selatan' },
  { region: 'Kabupaten Seruyan', shortName: 'Seruyan', degreeCentrality: 0.1538, betweennessCentrality: 0.0256, closenessCentrality: 0.3333, degree: 2, koridor: 'Koridor Barat' },
  { region: 'Kabupaten Lamandau', shortName: 'Lamandau', degreeCentrality: 0.1538, betweennessCentrality: 0.0128, closenessCentrality: 0.2889, degree: 2, koridor: 'Perbatasan Barat' },
  { region: 'Kabupaten Sukamara', shortName: 'Sukamara', degreeCentrality: 0.1538, betweennessCentrality: 0.0128, closenessCentrality: 0.2889, degree: 2, koridor: 'Pesisir Barat' },
  { region: 'Kabupaten Barito Timur', shortName: 'Bartim (T. Layang)', degreeCentrality: 0.0769, betweennessCentrality: 0.0000, closenessCentrality: 0.2955, degree: 1, koridor: 'DAS Barito' },
  { region: 'Kabupaten Murung Raya', shortName: 'Mura (Puruk Cahu)', degreeCentrality: 0.0769, betweennessCentrality: 0.0000, closenessCentrality: 0.2766, degree: 1, koridor: 'DAS Barito' },
];
