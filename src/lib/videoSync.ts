import { doc, getDoc, setDoc, onSnapshot, collection, getDocs, writeBatch, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';

const CHUNK_SIZE = 400 * 1024; // 400 KB per chunk (safely below Firestore's 1MB limit)
const METADATA_DOC_ID = 'bg_video_meta';
const CHUNKS_COLLECTION = 'system_video_chunks';

export interface VideoMetadata {
  totalChunks: number;
  totalSize: number;
  mimeType: string;
  updatedAt: number;
  fileName?: string;
}

/**
 * Uploads a video file or base64 string to Firestore by chunking it
 */
export async function uploadVideoChunksToFirestore(
  fileOrBase64: File | string,
  onProgress?: (percent: number) => void
): Promise<void> {
  let base64String = '';
  let mimeType = 'video/mp4';
  let fileName = 'custom_bg_video.mp4';

  if (typeof fileOrBase64 === 'string') {
    base64String = fileOrBase64;
    const match = fileOrBase64.match(/^data:(video\/[a-zA-Z0-9.-]+);base64,/);
    if (match) {
      mimeType = match[1];
    }
  } else {
    fileName = fileOrBase64.name;
    mimeType = fileOrBase64.type || 'video/mp4';
    base64String = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(fileOrBase64);
    });
  }

  // Calculate chunks
  const totalLength = base64String.length;
  const totalChunks = Math.ceil(totalLength / CHUNK_SIZE);

  if (totalChunks > 35) {
    throw new Error('Ukuran video terlalu besar untuk penyimpanan realtime Firestore (Maksimal ~12MB). Silakan gunakan video yang telah dikompresi.');
  }

  // 1. Delete old chunks if any
  try {
    const existingSnap = await getDocs(collection(db, CHUNKS_COLLECTION));
    const deleteBatch = writeBatch(db);
    existingSnap.forEach((d) => {
      deleteBatch.delete(d.ref);
    });
    await deleteBatch.commit();
  } catch (e) {
    console.warn('Could not clean old video chunks', e);
  }

  // 2. Upload chunks in batch
  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, totalLength);
    const chunkData = base64String.substring(start, end);

    const chunkDocRef = doc(db, CHUNKS_COLLECTION, `chunk_${i}`);
    await setDoc(chunkDocRef, {
      index: i,
      data: chunkData,
      updatedAt: Date.now(),
    });

    if (onProgress) {
      onProgress(Math.round(((i + 1) / totalChunks) * 90));
    }
  }

  // 3. Write metadata doc to trigger realtime updates across all connected clients
  const metaDocRef = doc(db, 'app_settings', METADATA_DOC_ID);
  const metadata: VideoMetadata = {
    totalChunks,
    totalSize: totalLength,
    mimeType,
    updatedAt: Date.now(),
    fileName,
  };

  await setDoc(metaDocRef, metadata);
  if (onProgress) {
    onProgress(100);
  }
}

/**
 * Subscribes to realtime video updates from Firestore and reconstructs the blob URL
 */
export function subscribeToRealtimeVideo(
  onVideoLoaded: (videoBlobUrl: string) => void
): () => void {
  const metaDocRef = doc(db, 'app_settings', METADATA_DOC_ID);

  return onSnapshot(
    metaDocRef,
    async (snapshot) => {
      if (!snapshot.exists()) return;
      const meta = snapshot.data() as VideoMetadata;
      if (!meta || !meta.totalChunks || meta.totalChunks <= 0) return;

      try {
        // Fetch all chunks
        const chunksSnap = await getDocs(collection(db, CHUNKS_COLLECTION));
        const chunkMap = new Map<number, string>();
        chunksSnap.forEach((docSnap) => {
          const d = docSnap.data();
          if (typeof d.index === 'number' && typeof d.data === 'string') {
            chunkMap.set(d.index, d.data);
          }
        });

        if (chunkMap.size < meta.totalChunks) {
          console.warn(`Video chunks incomplete: received ${chunkMap.size}/${meta.totalChunks}`);
          return;
        }

        // Combine chunks
        const parts: string[] = [];
        for (let i = 0; i < meta.totalChunks; i++) {
          const part = chunkMap.get(i);
          if (!part) {
            console.warn(`Missing chunk ${i}`);
            return;
          }
          parts.push(part);
        }

        const fullBase64 = parts.join('');
        // Cache to local storage for instant loading on future refreshes
        try {
          localStorage.setItem('dinsos_bg_video_url', fullBase64);
          localStorage.setItem('dinsos_bg_mode', 'video');
        } catch {
          // Ignore localStorage quota exceeded
        }

        onVideoLoaded(fullBase64);
      } catch (err) {
        console.error('Failed to reconstruct realtime video chunks:', err);
      }
    },
    (err) => {
      console.warn('Firestore video sync error:', err);
    }
  );
}
