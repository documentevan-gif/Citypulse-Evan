import { CommentData } from '../types';
import { generateKaltengMockData } from '../data/mockKaltengData';

const LIVE_STORAGE_KEY = 'citypulse_kalteng_live_data_v1';
const LEGACY_KEYS = [
  'kalteng_civic_aspirasi_v3',
  'kalteng_civic_aspirasi_v2',
  'kalteng_civic_aspirasi',
  'civicpulse_comments'
];

/**
 * Loads stored comments. Defaults to an empty list ([]) for live citizen trial in Central Kalimantan.
 */
export function loadStoredComments(): CommentData[] {
  // Purge any legacy demo keys to guarantee a clean slate for the live field trial
  try {
    LEGACY_KEYS.forEach(k => localStorage.removeItem(k));
  } catch (e) {
    // Ignore in case of restricted storage
  }

  try {
    const raw = localStorage.getItem(LIVE_STORAGE_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed as CommentData[];
      }
    }
  } catch (err) {
    console.warn('Gagal memuat data dari penyimpanan lokal:', err);
  }

  // By default for live field trials: return empty array []
  saveComments([]);
  return [];
}

/**
 * Persists comments array to localStorage.
 */
export function saveComments(comments: CommentData[]): void {
  try {
    localStorage.setItem(LIVE_STORAGE_KEY, JSON.stringify(comments));
  } catch (err) {
    console.error('Gagal menyimpan komentar ke penyimpanan lokal:', err);
  }
}

/**
 * Appends a new citizen aspiration and persists to storage.
 */
export function saveNewComment(comment: CommentData): CommentData[] {
  const current = loadStoredComments();
  const updated = [comment, ...current];
  saveComments(updated);
  return updated;
}

/**
 * Clears all citizen aspiration data so the platform starts completely fresh.
 */
export function clearAllStoredComments(): CommentData[] {
  try {
    localStorage.setItem(LIVE_STORAGE_KEY, JSON.stringify([]));
    LEGACY_KEYS.forEach(k => localStorage.removeItem(k));
  } catch (e) {
    console.warn('Gagal mengosongkan data penyimpanan:', e);
  }
  return [];
}

/**
 * Optional utility to load simulated demo data if the user wants to preview visualizations.
 */
export function loadDemoSampleData(): CommentData[] {
  const demoData = generateKaltengMockData();
  saveComments(demoData);
  return demoData;
}

/**
 * Backward compatibility alias for clear
 */
export function resetStoredComments(): CommentData[] {
  return clearAllStoredComments();
}
