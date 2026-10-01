export type Sentiment = 'Positive' | 'Negative' | 'Neutral';

export const SENTIMENT_COLORS: Record<Sentiment, string> = {
  Positive: '#10B981', // Hijau
  Neutral: '#9CA3AF',  // Abu-abu netral
  Negative: '#EF4444'  // Merah
};

export type Category = 
  | 'Transportasi' 
  | 'Drainase & Banjir' 
  | 'Bencana Alam'
  | 'Sampah' 
  | 'Air Bersih & Sanitasi' 
  | 'Ruang Terbuka Hijau' 
  | 'Tata Ruang & Pemukiman' 
  | 'Fasilitas Publik' 
  | 'Lainnya';

export const ALL_CATEGORIES: Category[] = [
  'Transportasi',
  'Drainase & Banjir',
  'Bencana Alam',
  'Sampah',
  'Air Bersih & Sanitasi',
  'Ruang Terbuka Hijau',
  'Tata Ruang & Pemukiman',
  'Fasilitas Publik',
  'Lainnya'
];

export const CATEGORY_COLORS: Record<Category, string> = {
  'Transportasi': '#3B82F6',           // Biru
  'Drainase & Banjir': '#06B6D4',      // Cyan
  'Bencana Alam': '#EF4444',           // Merah
  'Sampah': '#F59E0B',                 // Amber/Oranye
  'Air Bersih & Sanitasi': '#0EA5E9',  // Sky Blue
  'Ruang Terbuka Hijau': '#10B981',    // Emerald
  'Tata Ruang & Pemukiman': '#EC4899', // Pink
  'Fasilitas Publik': '#8B5CF6',       // Purple
  'Lainnya': '#64748B'                 // Slate
};

export interface CommentData {
  id: string;
  author: string;
  createdAt: string; // ISO date string or formatted date
  text: string;
  region: string;
  category: Category;
  sentiment: Sentiment;
  processed: boolean;
}

export interface PolicyAction {
  targetAgency: string; // e.g., Dinas PUPR, DLH, PDAM, Satpol PP
  action: string;
  priority: 'Segera' | 'Jangka Menengah';
}

export interface WeeklyAiInsight {
  generatedAt: string;
  timeframeDays: number;
  timeframeLabel: string;
  urgentCategory: Category;
  urgencyLevel: 'Kritis' | 'Tinggi' | 'Moderat';
  headline: string;
  summaryTrend: string;
  keyDrivers: string[];
  affectedHotspots: string[];
  sampleQuotes: {
    author: string;
    region: string;
    text: string;
    date: string;
  }[];
  policyRecommendations: PolicyAction[];
  sentimentComparison: {
    urgentCategoryNegativePct: number;
    trendDirection: 'Meningkat' | 'Menurun' | 'Stabil';
    totalPeriodAspirations: number;
    urgentCategoryCount: number;
  };
}

export interface AnalysisSummary {
  totalComments: number;
  categoryDistribution: Record<Category, number>;
  sentimentDistribution: Record<Sentiment, number>;
  regionDistribution: Record<string, {
    total: number;
    sentiments: Record<Sentiment, number>;
  }>;
  narrativeSummary: string;
  interventionRecommendation?: string;
}

export interface AnalysisResultBatch {
  results: {
    id: string;
    category: Category;
    sentiment: Sentiment;
  }[];
  insightSnippet: string;
}

