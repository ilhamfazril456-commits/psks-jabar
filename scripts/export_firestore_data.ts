import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json' with { type: 'json' };
import fs from 'fs';
import path from 'path';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);

const COLLECTIONS = [
  'app_settings',
  'psks_records',
  'psks_records_meta',
  'admin_accounts',
  'admin_messages',
  'registration_submissions',
  'task_items',
  'portal_faqs',
  'portal_documents',
  'psks_regional_logos',
  'system_logs',
];

async function exportAll() {
  console.log('--- Memulai Ekspor Data Lengkap dari Cloud Firestore ---');
  const backupData: Record<string, any[]> = {};
  let totalDocs = 0;

  for (const colName of COLLECTIONS) {
    try {
      console.log(`Mengambil koleksi: ${colName}...`);
      const snap = await getDocs(collection(db, colName));
      const docs = snap.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      backupData[colName] = docs;
      totalDocs += docs.length;
      console.log(`-> ${colName}: ${docs.length} dokumen berhasil diekstrak.`);
    } catch (err: any) {
      console.warn(`! Peringatan saat mengambil ${colName}:`, err?.message || err);
      backupData[colName] = [];
    }
  }

  const backupDir = path.resolve(process.cwd(), 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFilePath = path.join(backupDir, `firestore_master_backup_${timestamp}.json`);
  fs.writeFileSync(backupFilePath, JSON.stringify(backupData, null, 2), 'utf-8');

  // Also save a latest copy for easy reference
  const latestFilePath = path.join(backupDir, 'firestore_master_backup_latest.json');
  fs.writeFileSync(latestFilePath, JSON.stringify(backupData, null, 2), 'utf-8');

  console.log(`\n=== SUKSES: Ekspor Selesai! ===`);
  console.log(`Total Dokumen Terselamatkan: ${totalDocs}`);
  console.log(`Arsip Master Tersimpan di: ${backupFilePath}`);
}

exportAll().catch(console.error);
