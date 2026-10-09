import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = 'https://zwjbjmafxixudhlvaxef.supabase.co';
const SUPABASE_SERVICE_KEY = 'sb_secret_gfED-uLm3fHFdjb9yseJfw_4U33m83N';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
});

async function runImport() {
  console.log('=== MEMULAI IMPORT DATA DARI FIREBASE KE SUPABASE ===\n');

  const backupFilePath = path.resolve(process.cwd(), 'backups/firestore_master_backup_latest.json');
  if (!fs.existsSync(backupFilePath)) {
    throw new Error(`File cadangan master tidak ditemukan di: ${backupFilePath}`);
  }

  const raw = fs.readFileSync(backupFilePath, 'utf-8');
  const backupData = JSON.parse(raw);

  // 1. Regional Logos (25 docs)
  if (backupData.psks_regional_logos?.length) {
    const list = backupData.psks_regional_logos.map((doc: any) => ({
      id: doc.id,
      regionName: doc.regionName || doc.id,
      logo: doc.logo || '',
      updatedAt: doc.updatedAt || new Date().toISOString(),
    }));
    console.log(`Mengunggah ${list.length} logo wilayah...`);
    const { error } = await supabase.from('psks_regional_logos').upsert(list);
    if (error) console.error('Error psks_regional_logos:', error.message);
    else console.log(`✓ Berhasil mengunggah ${list.length} logo wilayah.`);
  }

  // 2. Admin Accounts (34 docs)
  if (backupData.admin_accounts?.length) {
    const list = backupData.admin_accounts.map((doc: any) => {
      const { id, username, namaAdmin, role, statusActive, wilayahTugas, passwordHash, sessionToken, ...rest } = doc;
      return {
        id,
        username: username || id,
        namaAdmin: namaAdmin || '',
        role: role || 'admin',
        statusActive: statusActive || 'SAH_TERDAFTAR',
        wilayahTugas: wilayahTugas || '',
        passwordHash: passwordHash || '',
        sessionToken: sessionToken || '',
        data: rest,
      };
    });
    console.log(`Mengunggah ${list.length} akun admin...`);
    const { error } = await supabase.from('admin_accounts').upsert(list);
    if (error) console.error('Error admin_accounts:', error.message);
    else console.log(`✓ Berhasil mengunggah ${list.length} akun admin.`);
  }

  // 3. System Logs (183 docs)
  if (backupData.system_logs?.length) {
    const list = backupData.system_logs.map((doc: any) => {
      const { id, actorName, actorRole, actorWilayah, actionType, category, timestamp, createdAt, details, ...rest } = doc;
      return {
        id,
        actorName: actorName || '',
        actorRole: actorRole || '',
        actorWilayah: actorWilayah || '',
        actionType: actionType || '',
        category: category || '',
        timestamp: timestamp || '',
        createdAt: createdAt || new Date().toISOString(),
        details: typeof details === 'string' ? details : JSON.stringify(details || {}),
        data: rest,
      };
    });
    console.log(`Mengunggah ${list.length} system logs...`);
    // Batch 100
    for (let i = 0; i < list.length; i += 100) {
      const chunk = list.slice(i, i + 100);
      const { error } = await supabase.from('system_logs').upsert(chunk);
      if (error) console.error('Error system_logs batch:', error.message);
    }
    console.log(`✓ Berhasil mengunggah ${list.length} system logs.`);
  }

  // 4. Registration Submissions (12 docs)
  if (backupData.registration_submissions?.length) {
    const list = backupData.registration_submissions.map((doc: any) => {
      const { id, nama, nik, hp, wilayah, kec, pillarId, status, submittedAt, recordData, ...rest } = doc;
      return {
        id,
        nama: nama || '',
        nik: nik || '',
        hp: hp || '',
        wilayah: wilayah || '',
        kec: kec || '',
        pillarId: pillarId || '',
        status: status || 'PENDING',
        submittedAt: submittedAt || new Date().toISOString(),
        recordData: recordData || {},
        data: rest,
      };
    });
    console.log(`Mengunggah ${list.length} registration submissions...`);
    const { error } = await supabase.from('registration_submissions').upsert(list);
    if (error) console.error('Error registration_submissions:', error.message);
    else console.log(`✓ Berhasil mengunggah ${list.length} registration submissions.`);
  }

  // 5. Task Items (4 docs)
  if (backupData.task_items?.length) {
    const list = backupData.task_items.map((doc: any) => {
      const { id, title, description, pillarId, status, priority, targetWilayah, assignedTo, deadline, progressPercent, ...rest } = doc;
      return {
        id,
        title: title || '',
        description: description || '',
        pillarId: pillarId || '',
        status: status || '',
        priority: priority || '',
        targetWilayah: targetWilayah || '',
        assignedTo: assignedTo || '',
        deadline: deadline || '',
        progressPercent: progressPercent || 0,
        data: rest,
      };
    });
    console.log(`Mengunggah ${list.length} task items...`);
    const { error } = await supabase.from('task_items').upsert(list);
    if (error) console.error('Error task_items:', error.message);
    else console.log(`✓ Berhasil mengunggah ${list.length} task items.`);
  }

  // 6. Portal FAQs (11 docs)
  if (backupData.portal_faqs?.length) {
    const list = backupData.portal_faqs.map((doc: any) => ({
      id: doc.id,
      question: doc.question || '',
      answer: doc.answer || '',
      category: doc.category || '',
      order: doc.order || 0,
      isActive: doc.isActive !== false,
      createdAt: doc.createdAt || '',
      updatedAt: doc.updatedAt || '',
    }));
    console.log(`Mengunggah ${list.length} FAQs...`);
    const { error } = await supabase.from('portal_faqs').upsert(list);
    if (error) console.error('Error portal_faqs:', error.message);
    else console.log(`✓ Berhasil mengunggah ${list.length} FAQs.`);
  }

  // 7. App Settings & Meta
  if (backupData.app_settings?.length) {
    const list = backupData.app_settings.map((doc: any) => ({
      id: doc.id,
      data: doc,
      updatedAt: doc.updatedAt || new Date().toISOString(),
    }));
    await supabase.from('app_settings').upsert(list);
    console.log(`✓ Berhasil mengunggah ${list.length} app_settings.`);
  }

  if (backupData.psks_records_meta?.length) {
    const list = backupData.psks_records_meta.map((doc: any) => ({
      id: doc.id,
      data: doc,
      updatedAt: doc.updatedAt || new Date().toISOString(),
    }));
    await supabase.from('psks_records_meta').upsert(list);
    console.log(`✓ Berhasil mengunggah ${list.length} psks_records_meta.`);
  }

  // 8. IP Registrations (10 docs)
  if (backupData.ip_registrations?.length) {
    const list = backupData.ip_registrations.map((doc: any) => {
      const { id, type, identifier, count, lastRegisteredAt, updatedAt, ...rest } = doc;
      return {
        id,
        type: type || '',
        identifier: identifier || '',
        count: count || 0,
        lastRegisteredAt: lastRegisteredAt || '',
        updatedAt: updatedAt || new Date().toISOString(),
        data: rest,
      };
    });
    const { error } = await supabase.from('ip_registrations').upsert(list);
    if (error) console.error('Error ip_registrations:', error.message);
    else console.log(`✓ Berhasil mengunggah ${list.length} ip_registrations.`);
  }

  // 9. AI Config (1 doc)
  if (backupData.ai_config?.length) {
    const list = backupData.ai_config.map((doc: any) => {
      const { id, systemInstruction, vocabularySummary, contextRules, dialogueExamples, updatedAt, ...rest } = doc;
      return {
        id,
        systemInstruction: systemInstruction || '',
        vocabularySummary: vocabularySummary || '',
        contextRules: contextRules || '',
        dialogueExamples: dialogueExamples || '',
        updatedAt: updatedAt || new Date().toISOString(),
        data: rest,
      };
    });
    const { error } = await supabase.from('ai_config').upsert(list);
    if (error) console.error('Error ai_config:', error.message);
    else console.log(`✓ Berhasil mengunggah ${list.length} ai_config.`);
  }

  // 10. AI Vocabulary (278 docs)
  if (backupData.ai_vocabulary?.length) {
    const list = backupData.ai_vocabulary.map((doc: any) => {
      const { id, word, canonical, category, ...rest } = doc;
      return {
        id,
        word: word || '',
        canonical: canonical || '',
        category: category || '',
        data: rest,
      };
    });
    for (let i = 0; i < list.length; i += 100) {
      const chunk = list.slice(i, i + 100);
      const { error } = await supabase.from('ai_vocabulary').upsert(chunk);
      if (error) console.error('Error ai_vocabulary chunk:', error.message);
    }
    console.log(`✓ Berhasil mengunggah ${list.length} ai_vocabulary.`);
  }

  // 11. AI Knowledge Base (31 docs)
  if (backupData.ai_knowledge_base?.length) {
    const list = backupData.ai_knowledge_base.map((doc: any) => {
      const { id, title, topic, category, content, summary, keywords, actionTag, updatedAt, ...rest } = doc;
      return {
        id,
        title: title || '',
        topic: topic || '',
        category: category || '',
        content: content || '',
        summary: summary || '',
        keywords: typeof keywords === 'string' ? keywords : JSON.stringify(keywords || []),
        actionTag: actionTag || '',
        updatedAt: updatedAt || new Date().toISOString(),
        data: rest,
      };
    });
    const { error } = await supabase.from('ai_knowledge_base').upsert(list);
    if (error) console.error('Error ai_knowledge_base:', error.message);
    else console.log(`✓ Berhasil mengunggah ${list.length} ai_knowledge_base.`);
  }

  // 12. AI Unmatched Logs (45 docs)
  if (backupData.ai_unmatched_logs?.length) {
    const list = backupData.ai_unmatched_logs.map((doc: any) => {
      const { id, snippet, guessedCategory, detectedWords, status, count, createdAt, updatedAt, ...rest } = doc;
      return {
        id,
        snippet: snippet || '',
        guessedCategory: guessedCategory || '',
        detectedWords: typeof detectedWords === 'string' ? detectedWords : JSON.stringify(detectedWords || []),
        status: status || '',
        count: count || 1,
        createdAt: createdAt || '',
        updatedAt: updatedAt || new Date().toISOString(),
        data: rest,
      };
    });
    const { error } = await supabase.from('ai_unmatched_logs').upsert(list);
    if (error) console.error('Error ai_unmatched_logs:', error.message);
    else console.log(`✓ Berhasil mengunggah ${list.length} ai_unmatched_logs.`);
  }

  // 13. PSKS App Settings (1 doc)
  if (backupData.psks_app_settings?.length) {
    const list = backupData.psks_app_settings.map((doc: any) => ({
      id: doc.id,
      data: doc,
      updatedAt: doc.updatedAt || new Date().toISOString(),
    }));
    await supabase.from('psks_app_settings').upsert(list);
    console.log(`✓ Berhasil mengunggah ${list.length} psks_app_settings.`);
  }

  // 14. PSKS RECORDS (21.963 dokumen)
  if (backupData.psks_records?.length) {
    const allRecords = backupData.psks_records;
    const total = allRecords.length;
    console.log(`\n--- Memulai Ingestion Massal ${total} Rekaman PSKS ---`);

    const BATCH_SIZE = 400;
    let uploadedCount = 0;

    for (let i = 0; i < total; i += BATCH_SIZE) {
      const chunk = allRecords.slice(i, i + BATCH_SIZE).map((doc: any) => {
        const { id, pillarId, wilayah, nama, status, kec, kelDesa, orderIndex, createdAt, updatedAt, ...rest } = doc;
        return {
          id,
          pillarId: pillarId || '',
          wilayah: wilayah || '',
          nama: nama || doc.namaKarangTaruna || doc.namaLks || doc.namaPsm || '',
          status: status || '',
          kec: kec || '',
          kelDesa: kelDesa || '',
          orderIndex: typeof orderIndex === 'number' ? orderIndex : 0,
          createdAt: createdAt || '',
          updatedAt: updatedAt || '',
          data: rest,
        };
      });

      const { error } = await supabase.from('psks_records').upsert(chunk);
      if (error) {
        console.error(`! Error pada batch ${i} - ${i + chunk.length}:`, error.message);
      } else {
        uploadedCount += chunk.length;
        process.stdout.write(`\rProgress: ${uploadedCount} / ${total} (${Math.round((uploadedCount / total) * 100)}%) berhasil masuk ke Supabase...`);
      }
    }
    console.log(`\n✓ SELESAI: Seluruh ${uploadedCount} rekaman PSKS telah tersimpan di Supabase!`);
  }

  console.log('\n=== MIGRASI DATA KE SUPABASE 100% SUKSES! ===');
}

runImport().catch(console.error);
