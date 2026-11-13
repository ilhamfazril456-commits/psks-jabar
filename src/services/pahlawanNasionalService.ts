import {
  collection,
  deleteDoc,
  doc,
  getDocFromServer,
  onSnapshot,
  setDoc,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { PahlawanNasionalItem } from '../types';

export const TOTAL_PAHLAWAN_SLOTS = 18;
const COLLECTION_NAME = 'pahlawan_nasional';
const LOCAL_CACHE_KEY = 'psks_pahlawan_nasional_cache_v1';

let inMemoryCache: PahlawanNasionalItem[] = [];
let hasVerifiedServerConnection = false;

export interface HeroPortraitCompressionResult {
  base64: string;
  sizeKb: number;
  originalSizeKb: number;
  width: number;
  height: number;
  format: 'webp' | 'jpeg';
}

export function getPahlawanDocId(slotNumber: number): string {
  const safeSlot = Math.min(TOTAL_PAHLAWAN_SLOTS, Math.max(1, Math.trunc(slotNumber)));
  return `slot_${safeSlot}`;
}

export function getCachedPahlawanNasional(): PahlawanNasionalItem[] {
  if (inMemoryCache.length > 0) {
    return inMemoryCache;
  }
  try {
    const raw = localStorage.getItem(LOCAL_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        inMemoryCache = sortHeroesBySlot(parsed);
        return inMemoryCache;
      }
    }
  } catch {
    // Abaikan jika storage tidak tersedia
  }
  return [];
}

function setCachedPahlawanNasional(items: PahlawanNasionalItem[]): void {
  const sorted = sortHeroesBySlot(items);
  inMemoryCache = sorted;
  try {
    localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(sorted));
  } catch {
    // Abaikan jika localStorage penuh; Firestore cache tetap berjalan normal
  }
}

function sortHeroesBySlot(items: PahlawanNasionalItem[]): PahlawanNasionalItem[] {
  return [...items]
    .filter((item) => item && Number(item.slotNumber) >= 1 && Number(item.slotNumber) <= TOTAL_PAHLAWAN_SLOTS)
    .sort((a, b) => Number(a.slotNumber) - Number(b.slotNumber));
}

function estimateBase64Bytes(dataUrl: string): number {
  const commaIndex = dataUrl.indexOf(',');
  const raw = commaIndex >= 0 ? dataUrl.slice(commaIndex + 1) : dataUrl;
  return Math.round((raw.length * 3) / 4);
}

/**
 * Kompresi foto potret pahlawan di sisi klien menggunakan HTML5 Canvas.
 * Menggunakan resampling berkualitas tinggi dan WebP (atau JPEG) adaptif
 * agar hasil foto tetap sangat jernih sekaligus hemat ukuran untuk Firestore realtime.
 */
export async function compressHeroPortraitImage(
  file: File
): Promise<HeroPortraitCompressionResult> {
  return new Promise((resolve, reject) => {
    const originalSizeKb = Math.max(1, Math.round(file.size / 1024));
    const reader = new FileReader();

    reader.onerror = () => reject(new Error('Gagal membaca berkas foto yang dipilih.'));
    reader.onload = (ev) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Format gambar tidak valid atau file rusak.'));
      img.onload = () => {
        const renderWithBounds = (
          maxWidth: number,
          maxHeight: number,
          quality: number
        ): { dataUrl: string; width: number; height: number; format: 'webp' | 'jpeg' } => {
          let width = img.naturalWidth || img.width;
          let height = img.naturalHeight || img.height;

          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.max(1, Math.round(width * ratio));
            height = Math.max(1, Math.round(height * ratio));
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            throw new Error('Browser tidak mendukung pemrosesan gambar Canvas.');
          }

          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          let format: 'webp' | 'jpeg' = 'webp';
          let dataUrl = canvas.toDataURL('image/webp', quality);
          if (!dataUrl.startsWith('data:image/webp')) {
            format = 'jpeg';
            dataUrl = canvas.toDataURL('image/jpeg', quality);
          }
          return { dataUrl, width, height, format };
        };

        try {
          // Tahap 1: Resolusi potret jernih 640x800 (2x retina) kualitas tinggi 0.88
          const targetMaxBytes = 200 * 1024; // ~200 KB biner (<= ~275 KB string base64)
          const qualitySteps = [0.88, 0.84, 0.80, 0.76, 0.72];

          let best = renderWithBounds(640, 800, qualitySteps[0]);
          for (const q of qualitySteps) {
            best = renderWithBounds(640, 800, q);
            if (estimateBase64Bytes(best.dataUrl) <= targetMaxBytes) {
              break;
            }
          }

          // Tahap 2: Jika foto sangat kompleks & masih di atas 220 KB, turunkan dimensi secara halus ke 520x650
          if (estimateBase64Bytes(best.dataUrl) > 220 * 1024) {
            for (const q of [0.80, 0.74, 0.68]) {
              best = renderWithBounds(520, 650, q);
              if (estimateBase64Bytes(best.dataUrl) <= targetMaxBytes) {
                break;
              }
            }
          }

          if (best.dataUrl.length > 440000) {
            best = renderWithBounds(440, 550, 0.66);
          }

          const finalBytes = estimateBase64Bytes(best.dataUrl);
          const sizeKb = Math.max(1, Math.round(finalBytes / 1024));
          resolve({
            base64: best.dataUrl,
            sizeKb,
            originalSizeKb,
            width: best.width,
            height: best.height,
            format: best.format,
          });
        } catch (err) {
          reject(err);
        }
      };

      img.src = String(ev.target?.result || '');
    };

    reader.readAsDataURL(file);
  });
}

async function verifyFirestoreServerConnectionOnce(): Promise<void> {
  if (hasVerifiedServerConnection) return;
  hasVerifiedServerConnection = true;
  try {
    await getDocFromServer(doc(db, COLLECTION_NAME, 'slot_1'));
  } catch (err) {
    if (err instanceof Error && err.message.includes('the client is offline')) {
      console.warn('[Firestore Pahlawan Nasional] Klien dalam mode offline, menggunakan cache lokal.');
    }
  }
}

/**
 * Langganan realtime langsung ke Firestore untuk seluruh 18 slot Pahlawan Nasional.
 * Terbaca seketika oleh semua role (Tamu Publik, User, Admin, Superadmin, Developer).
 */
export function subscribeToPahlawanNasional(
  onUpdate: (items: PahlawanNasionalItem[]) => void,
  onError?: (err: unknown) => void
): () => void {
  verifyFirestoreServerConnectionOnce().catch(() => {});

  const cached = getCachedPahlawanNasional();
  if (cached.length > 0) {
    onUpdate(cached);
  }

  const colRef = collection(db, COLLECTION_NAME);
  const unsubscribe = onSnapshot(
    colRef,
    (snapshot) => {
      const items: PahlawanNasionalItem[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data() as Record<string, any>;
        const slotNumber = Number(d.slotNumber);
        if (
          Number.isInteger(slotNumber) &&
          slotNumber >= 1 &&
          slotNumber <= TOTAL_PAHLAWAN_SLOTS &&
          typeof d.nama === 'string' &&
          typeof d.biografi === 'string' &&
          typeof d.fotoBase64 === 'string'
        ) {
          items.push({
            id: docSnap.id,
            slotNumber,
            nama: d.nama,
            gelar: typeof d.gelar === 'string' ? d.gelar : '',
            biografi: d.biografi,
            fotoBase64: d.fotoBase64,
            fotoSizeKb: typeof d.fotoSizeKb === 'number' ? d.fotoSizeKb : undefined,
            originalSizeKb: typeof d.originalSizeKb === 'number' ? d.originalSizeKb : undefined,
            updatedAt: typeof d.updatedAt === 'string' ? d.updatedAt : '',
            updatedBy: typeof d.updatedBy === 'string' ? d.updatedBy : '',
          });
        }
      });

      const sorted = sortHeroesBySlot(items);
      setCachedPahlawanNasional(sorted);
      onUpdate(sorted);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
      if (onError) onError(error);
    }
  );

  return unsubscribe;
}

/**
 * Simpan atau perbarui 1 slot Pahlawan Nasional (1..18) langsung ke Firestore realtime.
 */
export async function savePahlawanNasional(
  input: Omit<PahlawanNasionalItem, 'id' | 'updatedAt'> & { updatedAt?: string }
): Promise<PahlawanNasionalItem> {
  const slotNumber = Math.min(TOTAL_PAHLAWAN_SLOTS, Math.max(1, Math.trunc(input.slotNumber)));
  const docId = getPahlawanDocId(slotNumber);
  const trimmedNama = input.nama.trim().slice(0, 200);
  const trimmedBio = input.biografi.trim().slice(0, 15000);
  const trimmedGelar = (input.gelar || '').trim().slice(0, 200);
  const trimmedUpdatedBy = (input.updatedBy || '').trim().slice(0, 128);

  if (!trimmedNama) {
    throw new Error('Nama pahlawan wajib diisi.');
  }
  if (!trimmedBio) {
    throw new Error('Biografi pahlawan wajib diisi.');
  }
  if (!input.fotoBase64 || input.fotoBase64.length < 10) {
    throw new Error('Foto pahlawan wajib diunggah terlebih dahulu.');
  }
  if (input.fotoBase64.length > 450000) {
    throw new Error('Ukuran foto melebihi batas dokumen database. Silakan pilih ulang foto.');
  }

  const payload: Record<string, any> = {
    id: docId,
    slotNumber,
    nama: trimmedNama,
    biografi: trimmedBio,
    fotoBase64: input.fotoBase64,
    updatedAt: input.updatedAt || new Date().toISOString(),
  };

  if (trimmedGelar) {
    payload.gelar = trimmedGelar;
  }
  if (typeof input.fotoSizeKb === 'number' && input.fotoSizeKb >= 0) {
    payload.fotoSizeKb = Math.round(input.fotoSizeKb);
  }
  if (typeof input.originalSizeKb === 'number' && input.originalSizeKb >= 0) {
    payload.originalSizeKb = Math.round(input.originalSizeKb);
  }
  if (trimmedUpdatedBy) {
    payload.updatedBy = trimmedUpdatedBy;
  }

  try {
    await setDoc(doc(db, COLLECTION_NAME, docId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${COLLECTION_NAME}/${docId}`);
    throw new Error('Gagal menyimpan data Pahlawan Nasional ke database Firestore.');
  }

  const savedItem = payload as PahlawanNasionalItem;
  const current = getCachedPahlawanNasional().filter((item) => item.slotNumber !== slotNumber);
  setCachedPahlawanNasional([...current, savedItem]);
  return savedItem;
}

/**
 * Hapus data Pahlawan Nasional pada slot tertentu dari Firestore realtime.
 */
export async function deletePahlawanNasional(slotNumber: number): Promise<void> {
  const safeSlot = Math.min(TOTAL_PAHLAWAN_SLOTS, Math.max(1, Math.trunc(slotNumber)));
  const docId = getPahlawanDocId(safeSlot);

  try {
    await deleteDoc(doc(db, COLLECTION_NAME, docId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${COLLECTION_NAME}/${docId}`);
    throw new Error('Gagal menghapus data Pahlawan Nasional dari database Firestore.');
  }

  const remaining = getCachedPahlawanNasional().filter((item) => item.slotNumber !== safeSlot);
  setCachedPahlawanNasional(remaining);
}
