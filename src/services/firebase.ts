/**
 * Firebase Firestore Cloud Integration for CivicPulse Kalteng
 * Provides real-time synchronization across all browsers and devices.
 */
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDocFromServer, 
  collection, 
  getDocs, 
  setDoc, 
  deleteDoc,
  onSnapshot, 
  writeBatch,
  query,
  orderBy
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { CommentData } from '../types';

// Initialize Firebase App and Services
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId); /* CRITICAL: Required for named database */
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  return errInfo;
}

// Test initial connection to Cloud Firestore
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Client is offline or connecting to Firestore...");
    }
    return false;
  }
}

// Direct one-shot fetch for aspirations to guarantee instant synchronization on boot
export async function fetchCloudAspirations(): Promise<CommentData[]> {
  try {
    const colRef = collection(db, 'aspirations');
    const snapshot = await getDocs(colRef);
    const results: CommentData[] = [];
    snapshot.forEach((docSnap) => {
      const item = docSnap.data() as CommentData;
      if (item && item.id && item.text && item.region) {
        results.push(item);
      }
    });
    return results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, 'aspirations');
    return [];
  }
}

// Reconciles and synchronizes local data with Cloud Firestore bi-directionally
export async function reconcileAndSyncAspirations(localData: CommentData[]): Promise<CommentData[]> {
  try {
    const cloudData = await fetchCloudAspirations();
    
    // Find any local items not yet stored in Cloud
    const missingInCloud = localData.filter(local => 
      !cloudData.some(cloud => cloud.id === local.id || (cloud.text === local.text && cloud.region === local.region))
    );

    if (missingInCloud.length > 0) {
      await batchSaveAspirationsToCloud(missingInCloud);
      const combined = [...missingInCloud, ...cloudData];
      return combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return cloudData.length > 0 ? cloudData : localData;
  } catch (err) {
    console.warn('Gagal rekonsiliasi data cloud:', err);
    return localData;
  }
}

// Real-time listener for aspirations across all browsers
export function subscribeToCloudAspirations(
  onUpdate: (comments: CommentData[]) => void,
  onError?: (error: unknown) => void
): () => void {
  const colRef = collection(db, 'aspirations');
  const q = query(colRef);

  return onSnapshot(
    q,
    (snapshot) => {
      const results: CommentData[] = [];
      snapshot.forEach((docSnap) => {
        const item = docSnap.data() as CommentData;
        if (item && item.id && item.text && item.region) {
          results.push(item);
        }
      });
      // Sort newest first
      results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onUpdate(results);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, 'aspirations');
      if (onError) onError(err);
    }
  );
}

// Save a single citizen aspiration to Cloud Firestore
export async function saveAspirationToCloud(comment: CommentData): Promise<void> {
  const docRef = doc(db, 'aspirations', comment.id);
  try {
    await setDoc(docRef, comment);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `aspirations/${comment.id}`);
    throw error;
  }
}

// Batch save multiple aspirations (e.g. from CSV import)
export async function batchSaveAspirationsToCloud(comments: CommentData[]): Promise<void> {
  if (comments.length === 0) return;

  // Firestore writeBatch has a maximum limit of 500 operations per batch
  const chunkSize = 450;
  for (let i = 0; i < comments.length; i += chunkSize) {
    const chunk = comments.slice(i, i + chunkSize);
    const batch = writeBatch(db);
    
    chunk.forEach((item) => {
      const docRef = doc(db, 'aspirations', item.id);
      batch.set(docRef, item);
    });

    try {
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'aspirations (batch)');
      throw error;
    }
  }
}

// Delete a single aspiration from Cloud Firestore
export async function deleteAspirationFromCloud(id: string): Promise<void> {
  try {
    const docRef = doc(db, 'aspirations', id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `aspirations/${id}`);
    throw error;
  }
}

// Batch delete multiple aspirations from Cloud Firestore
export async function batchDeleteAspirationsFromCloud(ids: string[]): Promise<void> {
  if (ids.length === 0) return;

  const chunkSize = 450;
  for (let i = 0; i < ids.length; i += chunkSize) {
    const chunk = ids.slice(i, i + chunkSize);
    const batch = writeBatch(db);
    chunk.forEach((id) => {
      const docRef = doc(db, 'aspirations', id);
      batch.delete(docRef);
    });

    try {
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'aspirations (batch-delete)');
      throw error;
    }
  }
}

// Clear all aspirations from Cloud Firestore
export async function clearAllAspirationsFromCloud(): Promise<void> {
  try {
    const snapshot = await getDocs(collection(db, 'aspirations'));
    if (snapshot.empty) return;

    const docs = snapshot.docs;
    const chunkSize = 450;
    for (let i = 0; i < docs.length; i += chunkSize) {
      const chunk = docs.slice(i, i + chunkSize);
      const batch = writeBatch(db);
      chunk.forEach((d) => {
        batch.delete(d.ref);
      });
      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, 'aspirations');
    throw error;
  }
}
