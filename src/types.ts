export type Sentiment = 'Positive' | 'Negative' | 'Neutral';

export type Category = 
  | 'Transportasi' 
  | 'Drainase & Banjir' 
  | 'Sampah' 
  | 'Air Bersih & Sanitasi' 
  | 'Ruang Terbuka Hijau' 
  | 'Tata Ruang & Pemukiman' 
  | 'Fasilitas Publik' 
  | 'Lainnya';

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
}

export interface AnalysisResultBatch {
  results: {
    id: string;
    category: Category;
    sentiment: Sentiment;
  }[];
  insightSnippet: string;
}

