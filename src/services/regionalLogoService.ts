import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { KAB_KOTA_ONLY } from '../data/initialData';

export const OFFICIAL_REGIONS_28 = [
  'Provinsi Jawa Barat',
  ...KAB_KOTA_ONLY,
] as const;

export type OfficialRegionName = (typeof OFFICIAL_REGIONS_28)[number];

const LOCAL_STORAGE_KEY = 'psks_regional_logos';
const FIRESTORE_DOC_PATH = ['psks_app_settings', 'regional_logos'] as const;

// Helper: Kompresi gambar logo secara instan di sisi klien via HTML5 Canvas
// Merampingkan resolusi ke max 400x400 dan mempertahankan alpha channel transparan PNG
export async function compressLogoImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 400; // Resolusi retina optimal untuk lambang daerah

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        // Pastikan latar belakang transparan (alpha channel tetap terjaga)
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Ekspor ke format PNG/WebP kualitas tinggi (ukuran file menyusut ke 20KB - 50KB)
        const compressedPng = canvas.toDataURL('image/png', 0.92);
        resolve(compressedPng);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

// Ambil cache lokal instan (0 ms loading)
export function getLocalCachedRegionalLogos(): Record<string, string> {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Gagal membaca cache lokal logo wilayah:', err);
  }
  return {};
}

// Simpan ke cache lokal
export function setLocalCachedRegionalLogos(logos: Record<string, string>): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(logos));
  } catch (err) {
    console.warn('Gagal menulis cache lokal logo wilayah:', err);
  }
}

// Langganan pembaruan realtime dari Firestore
export function subscribeToRegionalLogos(
  callback: (logos: Record<string, string>) => void
): () => void {
  try {
    const docRef = doc(db, FIRESTORE_DOC_PATH[0], FIRESTORE_DOC_PATH[1]);
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          const logos = (data?.logos as Record<string, string>) || {};
          setLocalCachedRegionalLogos(logos);
          callback(logos);
        } else {
          // Fallback ke cache lokal jika dokumen belum dibuat di Firestore
          callback(getLocalCachedRegionalLogos());
        }
      },
      (error) => {
        console.warn('Firestore onSnapshot error untuk regional_logos:', error);
        callback(getLocalCachedRegionalLogos());
      }
    );
    return unsubscribe;
  } catch (err) {
    console.warn('Gagal inisialisasi subscriber regional_logos:', err);
    callback(getLocalCachedRegionalLogos());
    return () => {};
  }
}

// Simpan atau perbarui 1 logo wilayah tertentu ke Firestore
export async function saveRegionalLogoToFirestore(
  regionName: string,
  base64Logo: string
): Promise<void> {
  const current = getLocalCachedRegionalLogos();
  const updated = {
    ...current,
    [regionName]: base64Logo,
  };

  // Simpan ke cache lokal langsung agar instan
  setLocalCachedRegionalLogos(updated);

  // Simpan ke Firestore
  try {
    const docRef = doc(db, FIRESTORE_DOC_PATH[0], FIRESTORE_DOC_PATH[1]);
    await setDoc(docRef, { logos: updated, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (err) {
    console.error('Gagal menyimpan logo wilayah ke Firestore:', err);
    throw err;
  }
}

// Hapus logo kustom wilayah tertentu (kembali ke default Pemprov)
export async function removeRegionalLogoFromFirestore(regionName: string): Promise<void> {
  const current = getLocalCachedRegionalLogos();
  const updated = { ...current };
  delete updated[regionName];

  setLocalCachedRegionalLogos(updated);

  try {
    const docRef = doc(db, FIRESTORE_DOC_PATH[0], FIRESTORE_DOC_PATH[1]);
    await setDoc(docRef, { logos: updated, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (err) {
    console.error('Gagal menghapus logo wilayah dari Firestore:', err);
    throw err;
  }
}

// Helper untuk mencocokkan nama wilayah dan mengambil logo yang tepat
export function resolveRegionLogoUrl(
  targetRegion: string | undefined | null,
  logosMap: Record<string, string> = {},
  fallbackLogoUrl: string = '/official_logo_128.webp'
): string {
  if (!targetRegion) {
    return logosMap['Provinsi Jawa Barat'] || fallbackLogoUrl;
  }

  const clean = targetRegion.trim();

  // 1. Cek langsung nama persis
  if (logosMap[clean]) return logosMap[clean];

  // 2. Cek variasi nama (misal 'Kab. Bogor' vs 'Kabupaten Bogor')
  for (const [key, val] of Object.entries(logosMap)) {
    if (!val) continue;
    const normKey = key.toLowerCase().replace(/^(kabupaten|kab\.|kab)\s+/i, '').trim();
    const normTarget = clean.toLowerCase().replace(/^(kabupaten|kab\.|kab)\s+/i, '').trim();
    if (normKey === normTarget) {
      return val;
    }
  }

  // 3. Fallback ke logo Provinsi Jawa Barat atau default
  return logosMap['Provinsi Jawa Barat'] || fallbackLogoUrl;
}
