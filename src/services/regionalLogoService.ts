import { db } from '../lib/firebase';
import { supabase } from '../lib/supabase';
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

// IndexedDB Configuration for Unlimited Local Storage (Immune to 5MB LocalStorage Limit)
const IDB_NAME = 'psks_portal_db';
const IDB_STORE = 'regional_logos_store';
const IDB_VERSION = 1;

// Global In-Memory Cache (0ms Instant Reactivity)
let memoryCacheLogos: Record<string, string> = {};

function openLogoDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = indexedDB.open(IDB_NAME, IDB_VERSION);
    request.onupgradeneeded = () => {
      const dbInstance = request.result;
      if (!dbInstance.objectStoreNames.contains(IDB_STORE)) {
        dbInstance.createObjectStore(IDB_STORE, { keyPath: 'regionName' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveLogoToIndexedDb(regionName: string, logo: string): Promise<void> {
  try {
    const dbInstance = await openLogoDb();
    const tx = dbInstance.transaction(IDB_STORE, 'readwrite');
    const store = tx.objectStore(IDB_STORE);
    store.put({ regionName, logo, updatedAt: new Date().toISOString() });
    return new Promise((res, rej) => {
      tx.oncomplete = () => res();
      tx.onerror = () => rej(tx.error);
    });
  } catch (err) {
    console.warn('IndexedDB write warning:', err);
  }
}

export async function getAllLogosFromIndexedDb(): Promise<Record<string, string>> {
  try {
    const dbInstance = await openLogoDb();
    const tx = dbInstance.transaction(IDB_STORE, 'readonly');
    const store = tx.objectStore(IDB_STORE);
    const request = store.getAll();
    return new Promise((res) => {
      request.onsuccess = () => {
        const records = request.result || [];
        const result: Record<string, string> = {};
        records.forEach((r: { regionName: string; logo: string }) => {
          if (r.regionName && r.logo) {
            result[r.regionName] = r.logo;
          }
        });
        res(result);
      };
      request.onerror = () => res({});
    });
  } catch {
    return {};
  }
}

// Helper: Ubah nama wilayah menjadi ID dokumen yang valid dan aman di Firestore
export function getRegionDocId(regionName: string): string {
  return regionName
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

// Helper: Kompresi gambar logo secara instan di sisi klien via HTML5 Canvas
// Resolusi retina optimal: 180x180 px untuk plang logo (sangat tajam & berbobot mikro ~6KB - 12KB)
// Menghasilkan ukuran 7x lebih ramping dibanding sebelumnya, anti-mentok kuota
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
        const maxDim = 180; // 180px retina sempurna untuk plang ukuran 56px-96px

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

        // Pertahankan transparansi murni
        ctx.clearRect(0, 0, width, height);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Utamakan WebP resolusi tinggi dengan bobot ~6KB-10KB
        try {
          const webpData = canvas.toDataURL('image/webp', 0.88);
          if (webpData && webpData.startsWith('data:image/webp')) {
            resolve(webpData);
            return;
          }
        } catch {}

        // Fallback PNG murni ~12KB
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
  if (Object.keys(memoryCacheLogos).length > 0) {
    return memoryCacheLogos;
  }
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') {
        memoryCacheLogos = parsed;
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Gagal membaca cache lokal logo wilayah:', err);
  }
  return {};
}

// Simpan ke cache lokal dengan penanganan aman (anti-QuotaExceeded crash)
export function setLocalCachedRegionalLogos(logos: Record<string, string>): void {
  memoryCacheLogos = { ...logos };
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(logos));
  } catch (err) {
    console.warn('LocalStorage penuh, mengandalkan IndexedDB & Memory Cache:', err);
  }
}

// Langganan pembaruan realtime dari Supabase & sinkronisasi IndexedDB
export function subscribeToRegionalLogos(
  callback: (logos: Record<string, string>) => void
): () => void {
  // Panggil callback langsung dengan cache lokal agar instan 0 ms
  const initialCache = getLocalCachedRegionalLogos();
  callback(initialCache);

  // Ambil data dari IndexedDB di latar belakang dan gabungkan
  getAllLogosFromIndexedDb().then((idbLogos) => {
    if (Object.keys(idbLogos).length > 0) {
      const current = getLocalCachedRegionalLogos();
      const merged = { ...current, ...idbLogos };
      setLocalCachedRegionalLogos(merged);
      callback(merged);
    }
  });

  // 1. Ambil data logo lengkap dari Supabase
  const loadInitialLogos = async () => {
    try {
      const { data, error } = await supabase
        .from('psks_regional_logos')
        .select('regionName, logo');

      if (!error && data && data.length > 0) {
        const fromSupabase: Record<string, string> = {};
        data.forEach((row) => {
          if (row.regionName && row.logo) {
            fromSupabase[row.regionName] = row.logo;
            saveLogoToIndexedDb(row.regionName, row.logo);
          }
        });
        const cached = getLocalCachedRegionalLogos();
        const merged = { ...cached, ...fromSupabase };
        setLocalCachedRegionalLogos(merged);
        callback(merged);
      }
    } catch (err) {
      console.warn('Supabase fetch regional_logos notice:', err);
    }
  };
  loadInitialLogos();

  // 2. Realtime listener via Supabase Channels
  const channelName = `sub_regional_logos_${Date.now()}`;
  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'psks_regional_logos' },
      (payload) => {
        if (payload.eventType === 'DELETE') {
          const oldName = (payload.old as any)?.regionName;
          if (oldName) {
            delete memoryCacheLogos[oldName];
            const current = getLocalCachedRegionalLogos();
            const updated = { ...current };
            delete updated[oldName];
            setLocalCachedRegionalLogos(updated);
            callback(updated);
          }
        } else if (payload.new) {
          const newDoc = payload.new as any;
          if (newDoc.regionName && newDoc.logo) {
            memoryCacheLogos[newDoc.regionName] = newDoc.logo;
            saveLogoToIndexedDb(newDoc.regionName, newDoc.logo);
            const current = getLocalCachedRegionalLogos();
            const updated = { ...current, [newDoc.regionName]: newDoc.logo };
            setLocalCachedRegionalLogos(updated);
            callback(updated);
          }
        }
      }
    )
    .subscribe();

  return () => {
    channel.unsubscribe();
  };
}

// Simpan atau perbarui 1 logo wilayah tertentu ke Supabase & IndexedDB
// Anti-limit kuota dan instan tersimpan
export async function saveRegionalLogoToFirestore(
  regionName: string,
  base64Logo: string
): Promise<{ savedToCloud: boolean; quotaNotice?: boolean }> {
  // 1. Simpan ke memory cache seketika (langsung aktif di UI tanpa lag)
  memoryCacheLogos[regionName] = base64Logo;

  // 2. Simpan ke IndexedDB (kapasitas gigabyte, anti-kuota)
  await saveLogoToIndexedDb(regionName, base64Logo);

  // 3. Simpan ke LocalStorage secara aman
  const current = getLocalCachedRegionalLogos();
  const updated = {
    ...current,
    [regionName]: base64Logo,
  };
  setLocalCachedRegionalLogos(updated);

  // 4. Simpan ke Supabase cloud database
  const docId = getRegionDocId(regionName);
  try {
    const { error } = await supabase.from('psks_regional_logos').upsert({
      id: docId,
      regionName,
      logo: base64Logo,
      updatedAt: new Date().toISOString(),
    });

    if (error) {
      console.warn('Supabase logo write warning:', error.message);
    }

    // Passive silent backup to Firestore
    try {
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
    } catch {}

    return { savedToCloud: !error };
  } catch (err: any) {
    console.warn('Error saving logo to cloud:', err);
    return { savedToCloud: false };
  }
}

// Alias nama modern
export const saveRegionalLogoToCloud = saveRegionalLogoToFirestore;

// Hapus logo kustom wilayah tertentu (kembali ke default Pemprov)
export async function removeRegionalLogoFromFirestore(regionName: string): Promise<void> {
  delete memoryCacheLogos[regionName];
  const current = getLocalCachedRegionalLogos();
  const updated = { ...current };
  delete updated[regionName];

  setLocalCachedRegionalLogos(updated);

  const docId = getRegionDocId(regionName);
  try {
    await supabase.from('psks_regional_logos').delete().eq('id', docId);
  } catch (err) {
    console.warn('Gagal menghapus logo wilayah dari Supabase:', err);
  }

  // Passive silent delete from Firestore
  try {
    await deleteDoc(doc(db, REGIONAL_LOGOS_COLLECTION, docId));
  } catch {}
}

// Helper untuk mencocokkan nama wilayah dan mengambil logo yang tepat
export function resolveRegionLogoUrl(
  targetRegion: string | undefined | null,
  logosMap: Record<string, string> = {},
  fallbackLogoUrl: string = '/official_logo_128.webp'
): string {
  if (!targetRegion) {
    return logosMap['Provinsi Jawa Barat'] || memoryCacheLogos['Provinsi Jawa Barat'] || fallbackLogoUrl;
  }

  const clean = targetRegion.trim();

  // 1. Cek langsung nama persis
  if (logosMap[clean]) return logosMap[clean];
  if (memoryCacheLogos[clean]) return memoryCacheLogos[clean];

  // 2. Cek variasi nama (misal 'Kab. Purwakarta' vs 'Kabupaten Purwakarta')
  for (const [key, val] of Object.entries({ ...memoryCacheLogos, ...logosMap })) {
    if (!val) continue;
    const normKey = key.toLowerCase().replace(/^(kabupaten|kab\.|kab)\s+/i, '').trim();
    const normTarget = clean.toLowerCase().replace(/^(kabupaten|kab\.|kab)\s+/i, '').trim();
    if (normKey === normTarget) {
      return val;
    }
  }

  // 3. Fallback ke logo Provinsi Jawa Barat atau default
  return logosMap['Provinsi Jawa Barat'] || memoryCacheLogos['Provinsi Jawa Barat'] || fallbackLogoUrl;
}
