import { db } from '../lib/firebase';
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  onSnapshot,
} from 'firebase/firestore';
import { KAB_KOTA_ONLY } from '../data/initialData';

export const OFFICIAL_REGIONS_28 = [
  'Provinsi Jawa Barat',
  ...KAB_KOTA_ONLY,
] as const;

export type OfficialRegionName = (typeof OFFICIAL_REGIONS_28)[number];

const LOCAL_STORAGE_KEY = 'psks_regional_logos';
const REGIONAL_LOGOS_COLLECTION = 'psks_regional_logos';

// Helper: Ubah nama wilayah menjadi ID dokumen yang valid dan aman di Firestore
export function getRegionDocId(regionName: string): string {
  return regionName
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

// Helper: Kompresi gambar logo secara instan di sisi klien via HTML5 Canvas
// Resolusi retina optimal: 256x256 px untuk plang logo (kristal jernih di HP & laptop, bobot super ringan ~15KB - 25KB)
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
        const maxDim = 256; // 256px retina resolusi tepat untuk plang ukuran 56px - 96px

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

        // Pastikan latar belakang transparan (alpha channel tetap terjaga utuh)
        ctx.clearRect(0, 0, width, height);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Ekspor ke format PNG murni dengan alpha channel (~15KB - 25KB)
        const compressedPng = canvas.toDataURL('image/png');
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
// Menggunakan koleksi terdistribusi 'psks_regional_logos' (1 dokumen per wilayah, bebas batas 1MB Firestore)
export function subscribeToRegionalLogos(
  callback: (logos: Record<string, string>) => void
): () => void {
  // Panggil callback langsung dengan cache lokal agar instan 0 ms
  const initialCache = getLocalCachedRegionalLogos();
  callback(initialCache);

  try {
    // 1. Dengarkan koleksi terdistribusi psks_regional_logos
    const colRef = collection(db, REGIONAL_LOGOS_COLLECTION);
    const unsubscribeCol = onSnapshot(
      colRef,
      (snapshot) => {
        const fromFirestore: Record<string, string> = {};
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data?.regionName && data?.logo) {
            fromFirestore[data.regionName] = data.logo;
          }
        });

        // Gabungkan dengan cache lokal yang ada
        const cached = getLocalCachedRegionalLogos();
        const merged = { ...cached, ...fromFirestore };

        setLocalCachedRegionalLogos(merged);
        callback(merged);
      },
      (error) => {
        console.warn('Firestore onSnapshot error untuk psks_regional_logos:', error);
      }
    );

    // 2. Baca dokumen lama psks_app_settings/regional_logos sekali untuk migrasi 15 logo yang sudah diupload
    const legacyDocRef = doc(db, 'psks_app_settings', 'regional_logos');
    getDoc(legacyDocRef)
      .then((snap) => {
        if (snap.exists()) {
          const legacyData = snap.data();
          const legacyLogos = (legacyData?.logos as Record<string, string>) || {};
          if (Object.keys(legacyLogos).length > 0) {
            const currentCache = getLocalCachedRegionalLogos();
            const merged = { ...legacyLogos, ...currentCache };
            setLocalCachedRegionalLogos(merged);
            callback(merged);

            // Migrasi otomatis tiap logo ke dokumen terpisah di psks_regional_logos
            Object.entries(legacyLogos).forEach(async ([regName, logoBase64]) => {
              if (regName && logoBase64) {
                try {
                  const docId = getRegionDocId(regName);
                  await setDoc(
                    doc(db, REGIONAL_LOGOS_COLLECTION, docId),
                    {
                      regionName: regName,
                      logo: logoBase64,
                      updatedAt: new Date().toISOString(),
                    },
                    { merge: true }
                  );
                } catch {}
              }
            });
          }
        }
      })
      .catch((err) => {
        console.warn('Legacy logo check error:', err);
      });

    return unsubscribeCol;
  } catch (err) {
    console.warn('Gagal inisialisasi subscriber regional_logos:', err);
    return () => {};
  }
}

// Simpan atau perbarui 1 logo wilayah tertentu ke Firestore
// Disimpan di psks_regional_logos/{regionDocId} sehingga tidak akan pernah mentok batas 1MB Firestore
export async function saveRegionalLogoToFirestore(
  regionName: string,
  base64Logo: string
): Promise<void> {
  const current = getLocalCachedRegionalLogos();
  const updated = {
    ...current,
    [regionName]: base64Logo,
  };

  // 1. Simpan ke cache lokal langsung agar instan tanpa lag
  setLocalCachedRegionalLogos(updated);

  // 2. Simpan ke dokumen terpisah di Firestore (aman untuk seluruh 28 wilayah)
  try {
    const docId = getRegionDocId(regionName);
    const regionDocRef = doc(db, REGIONAL_LOGOS_COLLECTION, docId);
    await setDoc(
      regionDocRef,
      {
        regionName,
        logo: base64Logo,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
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
    const docId = getRegionDocId(regionName);
    await deleteDoc(doc(db, REGIONAL_LOGOS_COLLECTION, docId));
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

  // 2. Cek variasi nama (misal 'Kab. Purwakarta' vs 'Kabupaten Purwakarta')
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
