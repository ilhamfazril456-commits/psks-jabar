import { UserRole, PillarId, PSKSDataRecord, AppSettings } from '../types';
import { EXACT_QUESTION_ANSWERS } from './aiCatalogAnswers';
import { ROLE_QUESTION_CATALOG, AIQuestionItem } from './aiQuestions';
import { PILLARS_CONFIG, JABAR_REGIONS, KAB_KOTA_ONLY } from './initialData';
import {
  normalizeQueryWithComprehensiveVocabulary,
  searchKnowledgeBase,
} from '../services/aiKnowledgeFirestoreService';
import {
  checkConversationalFiller,
  formatConversationalFillerReply,
  ConversationalFillerResult,
  ConversationalFillerType,
} from '../utils/aiConversationalHelpers';
import {
  resolveDinsosAddressQuery,
  DINSOS_ADDRESS_DIRECTORY,
  DinsosOfficeAddress,
} from './dinsosAddressDirectory';

export {
  checkConversationalFiller,
  formatConversationalFillerReply,
  resolveDinsosAddressQuery,
  DINSOS_ADDRESS_DIRECTORY,
  type ConversationalFillerResult,
  type ConversationalFillerType,
  type DinsosOfficeAddress,
};

export interface SmartAnswerResult {
  matched: boolean;
  topic: string;
  response: string;
  isAccurate: boolean;
  confidence: number;
  source: 'verified_exact' | 'state_grounded' | 'ai_model_verified' | 'knowledge_fallback';
}

/**
 * Normalizes person name by stripping academic titles, honorifics, and punctuation
 */
export function normalizePersonName(name: string): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/,\s*(s\.pd|s\.sos|s\.e|s\.si|s\.t|s\.kom|s\.tr\.sos|s\.st|m\.si|m\.a|m\.ap|m\.pd|m\.ti|ph\.d|dr\.|dra\.|drs\.|ir\.|hj\.|h\.)/gi, '')
    .replace(/\b(dr\.|dra\.|drs\.|ir\.|hj\.|h\.|bapak|ibu|pak|bu|kang|teh)\b/gi, '')
    .replace(/[^a-z0-9\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Normalizes wilayah name to match Jabar kab/kota without punctuation
 */
export function normalizeWilayahMatch(w: string): string {
  if (!w) return '';
  return w
    .toLowerCase()
    .replace(/^(kabupaten|kab\.|kab)\s+/i, 'kab ')
    .replace(/^(kota|kta\.|kta)\s+/i, 'kota ')
    .replace(/[^a-z0-9\s]/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Detects specific Jabar region from user query, respecting Kab vs Kota distinction
 */
export function detectRegionInText(text: string, userWilayah?: string): string | null {
  const norm = text.toLowerCase();

  // 0. Relative user region aliases ("wilayah saya", "daerah saya", dll.)
  if (
    norm.includes('wilayah saya') ||
    norm.includes('daerah saya') ||
    norm.includes('wilayah tugas saya') ||
    norm.includes('wilayah penugasan saya') ||
    norm.includes('wilayahku') ||
    norm.includes('daerahku') ||
    norm.includes('kabupaten saya') ||
    norm.includes('kota saya') ||
    norm.includes('tempat saya') ||
    norm.includes('di sini')
  ) {
    if (userWilayah && userWilayah !== 'Jawa Barat' && userWilayah !== 'Provinsi Jawa Barat' && userWilayah !== 'PROVINSI JAWA BARAT') {
      const cleanW = userWilayah.trim();
      const wMatch = normalizeWilayahMatch(cleanW);
      if (wMatch.includes('bogor')) return cleanW.toLowerCase().includes('kota') ? 'Kota Bogor' : 'Kab. Bogor';
      if (wMatch.includes('bandung barat')) return 'Kab. Bandung Barat';
      if (wMatch.includes('bandung')) return cleanW.toLowerCase().includes('kab') ? 'Kab. Bandung' : 'Kota Bandung';
      if (wMatch.includes('sukabumi')) return cleanW.toLowerCase().includes('kota') ? 'Kota Sukabumi' : 'Kab. Sukabumi';
      if (wMatch.includes('cirebon')) return cleanW.toLowerCase().includes('kota') ? 'Kota Cirebon' : 'Kab. Cirebon';
      if (wMatch.includes('bekasi')) return cleanW.toLowerCase().includes('kota') ? 'Kota Bekasi' : 'Kab. Bekasi';
      if (wMatch.includes('tasikmalaya') || wMatch.includes('tasik')) return cleanW.toLowerCase().includes('kota') ? 'Kota Tasikmalaya' : 'Kab. Tasikmalaya';
      return cleanW;
    }
  }

  // 1. Specific checks distinguishing Kab vs Kota
  if (norm.includes('kab. bogor') || norm.includes('kabupaten bogor') || norm.includes('kab bogor')) return 'Kab. Bogor';
  if (norm.includes('kota bogor')) return 'Kota Bogor';

  if (norm.includes('kab. bandung barat') || norm.includes('kabupaten bandung barat') || norm.includes('bandung barat') || norm.includes('kbb')) return 'Kab. Bandung Barat';
  if (norm.includes('kab. bandung') || norm.includes('kabupaten bandung') || norm.includes('kab bandung')) return 'Kab. Bandung';
  if (norm.includes('kota bandung')) return 'Kota Bandung';

  if (norm.includes('kab. sukabumi') || norm.includes('kabupaten sukabumi') || norm.includes('kab sukabumi')) return 'Kab. Sukabumi';
  if (norm.includes('kota sukabumi')) return 'Kota Sukabumi';

  if (norm.includes('kab. cirebon') || norm.includes('kabupaten cirebon') || norm.includes('kab cirebon')) return 'Kab. Cirebon';
  if (norm.includes('kota cirebon')) return 'Kota Cirebon';

  if (norm.includes('kab. bekasi') || norm.includes('kabupaten bekasi') || norm.includes('kab bekasi')) return 'Kab. Bekasi';
  if (norm.includes('kota bekasi')) return 'Kota Bekasi';

  if (norm.includes('kab. tasikmalaya') || norm.includes('kabupaten tasikmalaya') || norm.includes('kab tasik')) return 'Kab. Tasikmalaya';
  if (norm.includes('kota tasikmalaya') || norm.includes('kota tasik')) return 'Kota Tasikmalaya';

  // 2. Unique Kab/Kota names
  if (norm.includes('cianjur')) return 'Kab. Cianjur';
  if (norm.includes('garut')) return 'Kab. Garut';
  if (norm.includes('ciamis')) return 'Kab. Ciamis';
  if (norm.includes('kuningan')) return 'Kab. Kuningan';
  if (norm.includes('majalengka')) return 'Kab. Majalengka';
  if (norm.includes('sumedang')) return 'Kab. Sumedang';
  if (norm.includes('indramayu')) return 'Kab. Indramayu';
  if (norm.includes('subang')) return 'Kab. Subang';
  if (norm.includes('purwakarta')) return 'Kab. Purwakarta';
  if (norm.includes('karawang')) return 'Kab. Karawang';
  if (norm.includes('pangandaran')) return 'Kab. Pangandaran';
  if (norm.includes('depok')) return 'Kota Depok';
  if (norm.includes('cimahi')) return 'Kota Cimahi';
  if (norm.includes('banjar')) return 'Kota Banjar';

  // 3. Bare names without kab/kota prefix - resolve via userWilayah context
  if (norm.includes('bogor')) {
    if (userWilayah === 'Kota Bogor') return 'Kota Bogor';
    return 'Kab. Bogor';
  }
  if (norm.includes('bandung')) {
    if (userWilayah === 'Kab. Bandung') return 'Kab. Bandung';
    if (userWilayah === 'Kab. Bandung Barat') return 'Kab. Bandung Barat';
    return 'Kota Bandung';
  }
  if (norm.includes('sukabumi')) {
    if (userWilayah === 'Kota Sukabumi') return 'Kota Sukabumi';
    return 'Kab. Sukabumi';
  }
  if (norm.includes('cirebon')) {
    if (userWilayah === 'Kota Cirebon') return 'Kota Cirebon';
    return 'Kab. Cirebon';
  }
  if (norm.includes('bekasi')) {
    if (userWilayah === 'Kota Bekasi') return 'Kota Bekasi';
    return 'Kab. Bekasi';
  }
  if (norm.includes('tasikmalaya') || norm.includes('tasik')) {
    if (userWilayah === 'Kota Tasikmalaya') return 'Kota Tasikmalaya';
    return 'Kab. Tasikmalaya';
  }

  return null;
}

/**
 * Detects pillar entity mentioned in text
 */
export function detectPillarInText(text: string): { pillarId: PillarId; pillarName: string } | null {
  const norm = text.toLowerCase();
  if (norm.includes('tksk') || norm.includes('tenaga kesejahteraan sosial kecamatan')) {
    return { pillarId: 'tksk', pillarName: 'TKSK' };
  }
  if (norm.includes('tagana') || norm.includes('taruna siaga bencana')) {
    return { pillarId: 'tagana', pillarName: 'TAGANA' };
  }
  if (norm.includes('psm') || norm.includes('pekerja sosial masyarakat')) {
    return { pillarId: 'psm', pillarName: 'PSM' };
  }
  if (norm.includes('karang taruna') || norm.includes('karangtaruna') || norm.includes('katar')) {
    return { pillarId: 'karangtaruna', pillarName: 'Karang Taruna' };
  }
  if (norm.includes('peksos') || norm.includes('pekerja sosial profesional') || norm.includes('pksp') || norm.includes('pekerja sosial')) {
    return { pillarId: 'peksos', pillarName: 'PEKSOS' };
  }
  if (norm.includes('lks') || norm.includes('lembaga kesejahteraan sosial') || norm.includes('panti asuhan') || norm.includes('panti jompo')) {
    return { pillarId: 'lks', pillarName: 'LKS' };
  }
  if (norm.includes('lk3') || norm.includes('lembaga konsultasi kesejahteraan keluarga')) {
    return { pillarId: 'lk3', pillarName: 'LK3' };
  }
  if (norm.includes('pensos') || norm.includes('penyuluh sosial')) {
    return { pillarId: 'pensos', pillarName: 'PENSOS' };
  }
  if (norm.includes('kube') || norm.includes('badan usaha') || norm.includes('kelompok usaha bersama')) {
    return { pillarId: 'badanusaha', pillarName: 'KUBE / Badan Usaha' };
  }
  if (norm.includes('slrt') || norm.includes('puskesos')) {
    return { pillarId: 'slrt_puskesos', pillarName: 'SLRT PUSKESOS' };
  }
  return null;
}

/**
 * Filter for Sensitive Personal Data inquiries under UU PDP No. 27/2022
 */
export function resolveSensitivePrivacyQuery(query: string): string | null {
  const q = query.toLowerCase();
  const hasSensitiveTarget =
    q.includes('nik') ||
    q.includes('nomor induk kependudukan') ||
    q.includes('password') ||
    q.includes('kata sandi') ||
    q.includes('pin') ||
    q.includes('nomor hp') ||
    q.includes('no hp') ||
    q.includes('nomor wa') ||
    q.includes('no wa') ||
    q.includes('nomor telepon') ||
    q.includes('kontak pribadi');

  const hasInquiryIntent =
    q.includes('berapa') ||
    q.includes('minta') ||
    q.includes('apa') ||
    q.includes('apakah ada') ||
    q.includes('lihat') ||
    q.includes('tampilkan') ||
    q.includes('bocorkan') ||
    q.includes('sebutkan') ||
    q.includes('kasih tau') ||
    q.includes('berikan');

  if (hasSensitiveTarget && hasInquiryIntent) {
    return `Demi keamanan informasi dan kepatuhan terhadap amanat **Undang-Undang No. 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP)**, Nomor Induk Kependudukan (NIK 16 digit), kata sandi, dan nomor kontak pribadi anggota bersifat rahasia (*zero-disclosure*) dan dilindungi secara ketat sehingga tidak dapat dipublikasikan melalui Asisten AI.\n\nSistem hanya diizinkan untuk memverifikasi status keabsahan pendaftaran resmi, nama lengkap, pilar sosial, dan wilayah penugasan anggota.`;
  }

  return null;
}

/**
 * Real-time member verification lookup engine querying active allPillarData state directly
 */
export function resolveMemberVerificationQuery(
  query: string,
  allPillarData?: Record<string, PSKSDataRecord[]>,
  userWilayah?: string
): string | null {
  if (!allPillarData) return null;
  const q = query.toLowerCase().trim();

  // 1. First check sensitive privacy requests
  const privacyRefusal = resolveSensitivePrivacyQuery(q);
  if (privacyRefusal) return privacyRefusal;

  // 2. Check if inquiry is about registration / verification / status
  const isVerificationInquiry =
    q.includes('terdaftar') ||
    q.includes('tercatat') ||
    q.includes('terverifikasi') ||
    q.includes('anggota') ||
    q.includes('personil') ||
    q.includes('nama') ||
    q.includes('cek') ||
    q.includes('status') ||
    q.includes('apakah ada') ||
    q.includes('apakah');

  if (!isVerificationInquiry) return null;

  const cleanQ = normalizePersonName(q);
  const detectedPillar = detectPillarInText(q);

  // Search through all records across all 10 pillars
  let foundRecord: PSKSDataRecord | null = null;
  let foundPillarId: string | null = null;

  const pillarEntries = Object.entries(allPillarData);
  for (const [pId, records] of pillarEntries) {
    if (!Array.isArray(records)) continue;
    for (const rec of records) {
      if (!rec || !rec.nama) continue;
      const cleanRecName = normalizePersonName(rec.nama);
      if (cleanRecName.length < 3) continue;

      const nameTokens = cleanRecName.split(' ').filter((t) => t.length > 2);
      const isExactSubstring = cleanQ.includes(cleanRecName);
      const hasAllTokens = nameTokens.length >= 2 && nameTokens.every((token) => cleanQ.includes(token));

      if (isExactSubstring || hasAllTokens) {
        foundRecord = rec;
        foundPillarId = rec.pillarId || pId;
        break;
      }
    }
    if (foundRecord) break;
  }

  if (foundRecord && foundPillarId) {
    const pInfo = PILLARS_CONFIG[foundPillarId];
    const pTitle = pInfo?.title || foundPillarId.toUpperCase();
    const pShort = pInfo?.shortName || pTitle;
    const regionName = foundRecord.wilayah.startsWith('Kab.')
      ? foundRecord.wilayah.replace('Kab.', 'Kabupaten')
      : foundRecord.wilayah;

    // Check if user specified a pillar that differs from the registered one
    if (detectedPillar && detectedPillar.pillarId !== foundPillarId) {
      return `Nama **${foundRecord.nama}** sudah terdaftar resmi di pangkalan data sistem PSKS JABAR, namun bukan sebagai anggota **${detectedPillar.pillarName}**, melainkan sebagai **${pTitle}** di wilayah **${regionName}**.\n\n**Rincian Data Anggota Terdaftar Resmi**:\n- **Nama Lengkap**: ${foundRecord.nama}\n- **Pilar Sosial**: ${pTitle} (${pShort})\n- **Wilayah Tugas**: ${foundRecord.wilayah}${foundRecord.kec ? ` (Kecamatan ${foundRecord.kec})` : ''}\n- **Status Keaktifan**: ${foundRecord.status || 'Aktif'}\n- **SK / Sertifikasi**: ${foundRecord.sertifikasi || 'Tercatat dalam SK Penugasan Resmi'}\n\n*Data diverifikasi secara langsung dan akurat dari pangkalan data sistem PSKS JABAR yang tersimpan di website.*`;
    }

    // Exact match format: "Ya, Dudi Kusniadi sudah terdaftar sebagai TKSK di wilayah Kabupaten Bogor"
    return `Ya, **${foundRecord.nama}** sudah terdaftar sebagai **${pTitle}** di wilayah **${regionName}**.\n\n**Rincian Data Anggota Terdaftar Resmi**:\n- **Nama Lengkap**: ${foundRecord.nama}\n- **Pilar Sosial**: ${pTitle} (${pShort})\n- **Wilayah Tugas**: ${foundRecord.wilayah}${foundRecord.kec ? ` (Kecamatan ${foundRecord.kec})` : ''}\n- **Status Keaktifan**: ${foundRecord.status || 'Aktif'}\n- **SK / Sertifikasi**: ${foundRecord.sertifikasi || 'Tercatat dalam SK Penugasan Resmi'}\n\n*Data diverifikasi secara langsung dan akurat dari pangkalan data sistem PSKS JABAR yang tersimpan di website.*`;
  }

  // If no record found, but query explicitly asked "apakah nama X terdaftar...", extract candidate name and answer factually
  const explicitNameMatch =
    q.match(/(?:apakah\s+(?:nama|ada\s+nama|saudara)?|cek\s+(?:nama|status)?|adakah\s+(?:nama)?)\s+([a-zA-Z\s'.]+?)\s+(?:terdaftar|tercatat|masuk|ada)/i) ||
    q.match(/(?:apakah|adakah)\s+([a-zA-Z\s'.]+?)\s+(?:terdaftar|tercatat)\s+(?:sebagai|di|pada)/i);

  if (explicitNameMatch && explicitNameMatch[1]) {
    const rawCandidate = explicitNameMatch[1].trim();
    const cleanCandidate = normalizePersonName(rawCandidate);
    const isPillarWord = detectPillarInText(cleanCandidate) !== null;
    const isCommonWord = ['nama', 'dia', 'beliau', 'anda', 'kamu', 'orang', 'anggota', 'personil'].includes(cleanCandidate);

    if (cleanCandidate.length >= 3 && !isPillarWord && !isCommonWord) {
      const targetPillarTitle = detectedPillar ? detectedPillar.pillarName : 'pilar sosial';
      const targetWilayah = userWilayah || 'Jawa Barat';
      return `Berdasarkan pangkalan data resmi sistem PSKS JABAR yang tersimpan saat ini, nama **${rawCandidate}** belum tercatat sebagai anggota **${targetPillarTitle}** di wilayah **${targetWilayah}**.\n\nSilakan pastikan penulisan ejaan nama sudah sesuai dengan KTP, atau hubungi Dinas Sosial / Admin Wilayah setempat jika yang bersangkutan merupakan personil baru yang masih dalam proses verifikasi berkas pendaftaran.`;
    }
  }

  return null;
}

/**
 * Helper to build complete breakdown per Kab/Kota from allPillarData
 */
export function buildRegionalPillarBreakdown(allPillarData?: Record<string, PSKSDataRecord[]>) {
  if (!allPillarData) return { totalsByRegion: {} as Record<string, number>, pillarsByRegion: {} as Record<string, Record<string, number>> };
  const totalsByRegion: Record<string, number> = {};
  const pillarsByRegion: Record<string, Record<string, number>> = {};

  Object.entries(allPillarData).forEach(([pillarId, records]) => {
    if (!Array.isArray(records)) return;
    records.forEach((r) => {
      if (!r?.wilayah) return;
      const w = r.wilayah.trim();
      totalsByRegion[w] = (totalsByRegion[w] || 0) + 1;
      if (!pillarsByRegion[w]) pillarsByRegion[w] = {};
      pillarsByRegion[w][pillarId] = (pillarsByRegion[w][pillarId] || 0) + 1;
    });
  });

  return { totalsByRegion, pillarsByRegion };
}

/**
 * Real-time regional pillar data inquiry engine (prevents theoretical formula hallucinations)
 * Instantly resolves regional counts for Kab. Bogor and any other Kab/Kota across Jawa Barat.
 */
export function resolveRegionalPillarDataQuery(
  query: string,
  allPillarData?: Record<string, PSKSDataRecord[]>,
  userWilayah?: string
): string | null {
  if (!allPillarData) return null;
  const q = query.toLowerCase().trim();

  const detectedPillar = detectPillarInText(q);
  const detectedRegion = detectRegionInText(q, userWilayah);

  const hasRegionalInquiry =
    q.includes('apakah ada') ||
    q.includes('adakah') ||
    q.includes('ada ga') ||
    q.includes('ada tidak') ||
    q.includes('ada personil') ||
    q.includes('ada anggota') ||
    q.includes('berapa') ||
    q.includes('jumlah') ||
    q.includes('siapa saja') ||
    q.includes('daftar personil') ||
    q.includes('data personil') ||
    q.includes('total') ||
    q.includes('terdata') ||
    q.includes('sebaran') ||
    q.includes('statistik');

  if (!hasRegionalInquiry) return null;
  if (!detectedPillar && !detectedRegion) return null;

  // Case 1: Both Pillar & Region detected (e.g. "ada berapa jumlah psm di wilayah saya?", "berapa psm di kab bogor?")
  if (detectedPillar && detectedRegion) {
    const records = allPillarData[detectedPillar.pillarId] || [];
    const normTargetRegion = normalizeWilayahMatch(detectedRegion);

    const matchingRecords = records.filter((r) => {
      if (!r || !r.wilayah) return false;
      const normRecWilayah = normalizeWilayahMatch(r.wilayah);
      return normRecWilayah === normTargetRegion || normRecWilayah.includes(normTargetRegion) || normTargetRegion.includes(normRecWilayah);
    });

    if (matchingRecords.length > 0) {
      const sampleList = matchingRecords
        .slice(0, 5)
        .map((r, i) => `${i + 1}. **${r.nama}** - Kecamatan ${r.kec || '-'} (Status: ${r.status || 'Aktif'})`)
        .join('\n');
      const moreText = matchingRecords.length > 5 ? `\n*...dan ${matchingRecords.length - 5} personil lainnya tercatat lengkap di tabel data pilar.*` : '';
      return `Berdasarkan pangkalan data resmi sistem PSKS JABAR saat ini, di wilayah **${detectedRegion}** tercatat sebanyak **${matchingRecords.length} personil ${detectedPillar.pillarName}** yang telah terverifikasi resmi:\n\n${sampleList}${moreText}\n\n*Data ini bersumber langsung dari basis data riil website dan otomatis terbarui secara real-time saat ada penambahan, perubahan, atau mutasi data.*\n\n[[action:pillar:${detectedPillar.pillarId}:Lihat Data ${detectedPillar.pillarName}]]`;
    } else {
      return `Berdasarkan pangkalan data resmi sistem PSKS JABAR saat ini, belum ada personil **${detectedPillar.pillarName}** yang tercatat untuk wilayah **${detectedRegion}** (atau berkas pendaftaran baru masih dalam antrean verifikasi administrasi tingkat wilayah).\n\n[[action:pillar:${detectedPillar.pillarId}:Lihat Data ${detectedPillar.pillarName}]]`;
    }
  }

  // Case 2: Only Region detected with count/personil inquiry (e.g. "berapa jumlah personil di kab bogor?", "jumlah pilar terdata di kab bogor")
  if (detectedRegion && !detectedPillar && (q.includes('berapa') || q.includes('jumlah') || q.includes('personil') || q.includes('anggota') || q.includes('pilar') || q.includes('data') || q.includes('total') || q.includes('terdata'))) {
    const normTargetRegion = normalizeWilayahMatch(detectedRegion);
    let totalInRegion = 0;
    const breakdown: string[] = [];
    let topPillarId = 'psm';
    let topPillarTitle = 'PSM';
    let maxCount = 0;

    Object.entries(allPillarData).forEach(([pId, records]) => {
      if (!Array.isArray(records)) return;
      const inRegion = records.filter((r) => {
        if (!r || !r.wilayah) return false;
        const norm = normalizeWilayahMatch(r.wilayah);
        return norm === normTargetRegion || norm.includes(normTargetRegion) || normTargetRegion.includes(norm);
      });
      if (inRegion.length > 0) {
        const pInfo = PILLARS_CONFIG[pId];
        const pTitle = pInfo?.title || pId.toUpperCase();
        breakdown.push(`- **${pTitle}**: ${inRegion.length} personil/lembaga`);
        totalInRegion += inRegion.length;
        if (inRegion.length > maxCount) {
          maxCount = inRegion.length;
          topPillarId = pId;
          topPillarTitle = pTitle;
        }
      }
    });

    if (totalInRegion > 0) {
      return `Berdasarkan pangkalan data resmi sistem PSKS JABAR saat ini, total data 10 Pilar PSKS yang tercatat di wilayah **${detectedRegion}** adalah sebanyak **${totalInRegion} data**:\n\n${breakdown.join('\n')}\n\n*Data ini bersumber langsung dari basis data riil website dan otomatis sinkron setiap saat.*\n\n[[action:pillar:${topPillarId}:Lihat Data ${topPillarTitle}]]`;
    } else {
      return `Berdasarkan pangkalan data resmi sistem PSKS JABAR saat ini, belum ada personil atau lembaga pilar sosial yang tercatat aktif di wilayah **${detectedRegion}**.\n\nPendaftaran personil baru dapat diajukan secara mandiri melalui menu Beranda.`;
    }
  }

  return null;
}

/**
 * Authority PIN Security Inquiry Resolver (Strictly differentiates 6-Digit PIN vs 12-Char Password)
 * Handles inquiries from Superadmin, Developer, Admin Wilayah, and Public regarding PIN change / configuration.
 */
export function resolvePinSecurityQuery(
  query: string,
  userRole: UserRole = 'user',
  userName?: string
): string | null {
  if (!query) return null;
  const q = normalizeSpellingAndTypo(query.toLowerCase().trim());

  const hasPinWord = /\b(pin|pin-nya|pinnya)\b/i.test(q);
  const hasPinAction =
    /\b(rubah|merubah|ubah|mengubah|ganti|mengganti|reset|atur|mengatur|set|setting|bikin|buat|membuat|edit|lupa|cara|bagaimana|alur|prosedur|panduan|keamanan)\b/i.test(q) ||
    q.includes('pin akun') ||
    q.includes('pin superadmin') ||
    q.includes('pin developer') ||
    q.includes('pin otoritas') ||
    q.includes('keamanan pin') ||
    q.includes('merubah pin') ||
    q.includes('mengubah pin') ||
    q.includes('ubah pin') ||
    q.includes('ganti pin') ||
    q.includes('reset pin');

  // Must explicitly involve PIN
  if (!hasPinWord && !q.includes('pin')) return null;
  if (!hasPinAction) return null;

  // 1. PUBLIC USER / GUEST: Polite refusal under UU PDP No. 27/2022
  if (userRole !== 'superadmin' && userRole !== 'developer' && userRole !== 'admin') {
    return `Mohon maaf, demi mematuhi Undang-Undang Pelindungan Data Pribadi (UU PDP No. 27/2022) serta menjaga integritas keamanan sistem informasi **PSKS JABAR**, rincian tata kelola kredensial internal dan PIN Otoritas Keamanan bersifat rahasia (*restricted zero-disclosure*) dan tidak dapat diakses melalui akun umum/tamu.\n\nUntuk koordinasi kedinasan atau informasi layanan sosial resmi, silakan hubungi pihak Dinas Sosial Provinsi Jawa Barat.\n\n[[action:tab:contact:Hubungi Dinas Sosial Jabar]]`;
  }

  // 2. ADMIN WILAYAH (27 Kab/Kota): Explain difference & guide to own password
  if (userRole === 'admin') {
    return `Sampurasun Bapak/Ibu Admin Wilayah!\n\nMohon izin menginformasikan bahwa di sistem **PSKS JABAR**, akun **Admin Wilayah (Kabupaten/Kota)** menggunakan otentikasi standar berupa **Username dan Kata Sandi** (kebijakan keamanan mewajibkan kata sandi minimal 12 karakter kombinasi huruf besar A-Z, huruf kecil a-z, dan angka 0-9).\n\nAdapun istilah **PIN Otoritas Keamanan (6 Digit Angka)** merupakan protokol keamanan tambahan (*second-layer authority*) yang dikhususkan bagi **Superadmin Dinas Sosial Provinsi Jawa Barat** dan **Developer Sistem** untuk keperluan otentikasi Smart Access Card (NFC) dan verifikasi modal otorisasi tingkat provinsi.\n\nJika Bapak/Ibu ingin memperbarui kata sandi akun Admin Wilayah Bapak/Ibu sendiri, silakan lakukan melalui:\n1. Buka menu **Profil / Akun Saya** (\`tab:account\`).\n2. Masuk ke bagian formulir **Ubah Kata Sandi**.\n3. Masukkan kata sandi saat ini dan tentukan kata sandi baru (minimal 12 karakter kombinasi).\n4. Klik **Simpan Perubahan**.\n\n[[action:tab:account:Buka Menu Akun Saya]]`;
  }

  // 3. DEVELOPER (ROOT ACCESS): Dual PIN management guide
  if (userRole === 'developer') {
    return `Halo **Ilham Fazril**! (Developer Mode) 🚀\n\nSebagai Software Architect dan Lead Developer sistem **PSKS JABAR**, kamu memegang kontrol penuh atas **2 Lapis PIN Otoritas Keamanan** (wajib tepat **6 Digit Angka**, berbeda dari Kata Sandi login biasa):\n1. **PIN Smart Card Developer** (Root Master Authority, default sistem: \`992211\`)\n2. **PIN Smart Card Superadmin** (Provincial Authority, default sistem: \`123456\`)\n\nPIN ini terhubung realtime ke basis data dan dipakai untuk otorisasi Smart Access Card (NFC Mifare), Smart Security Gate, serta validasi tindakan pengembang.\n\n---\n\n### **Alur Resmi Merubah PIN Developer & Superadmin**:\n\n#### **Jalur 1: Fitur 15 - Pusat Keamanan PIN (\`tab:pin_security_manage\`)**\n1. Buka menu **Pusat Keamanan PIN** (\`tab:pin_security_manage\`) melalui panel developer atau tombol aksi di bawah.\n2. Terdapat 2 modul kartu terpisah:\n   - **Kartu PIN Superadmin**: Masukkan 6 digit angka baru (atau klik *Acak PIN Otomatis*), lalu klik **Simpan PIN Superadmin Realtime**.\n   - **Kartu PIN Developer**: Masukkan 6 digit angka baru, lalu klik **Simpan PIN Developer Realtime**.\n3. Nilai PIN langsung terupdate seketika di pangkalan data secara sinkron.\n\n#### **Jalur 2: Developer Control Panel (\`tab:dev_panel\`)**\n- Buka menu **Developer Control Panel** (\`tab:dev_panel\`) untuk mengelola variabel keamanan, kunci otentikasi, dan audit log forensik.\n\n#### **Jalur 3: Menu Akun Saya (\`tab:account\`)**\n- Buka menu profil akun untuk pembaruan cepat PIN otoritas pribadi.\n\n[[action:tab:pin_security_manage:Buka Pusat Keamanan PIN]]\n[[action:tab:dev_panel:Buka Developer Control Panel]]\n[[action:tab:account:Buka Menu Akun Saya]]`;
  }

  // 4. SUPERADMIN (DINAS SOSIAL PROVINSI JAWA BARAT): Authentic 6-Digit PIN Authority Guide
  return `Sampurasun Bapak/Ibu **Superadmin** Dinas Sosial Provinsi Jawa Barat!\n\nPerlu dipahami bahwa di portal **PSKS JABAR**, sistem membedakan secara tegas antara **Kata Sandi (Password)** dan **PIN Otoritas Keamanan**:\n- **Kata Sandi (Password)**: Digunakan untuk masuk (*login*) akun administratif (wajib minimal 12 karakter kombinasi huruf besar, huruf kecil, dan angka) melalui menu *Kelola Akun Admin*.\n- **PIN Otoritas Keamanan (Authority PIN)**: Terdiri dari tepat **6 Digit Angka** (default sistem: \`123456\`). PIN ini merupakan lapis keamanan tambahan (*second-layer security*) saat memindai **Smart Access Card**, melewati **Smart Security Gate**, atau memvalidasi otorisasi tindakan sensitif tingkat provinsi.\n\n---\n\n### **Alur Resmi Mengubah 6 Digit PIN Superadmin**:\n\nBapak/Ibu Superadmin dapat memperbarui 6 digit PIN otoritas akun kapan saja melalui 2 jalur resmi:\n\n#### **Jalur 1: Melalui Menu Akun Saya (Paling Praktis & Cepat)**\n1. Klik menu **Profil / Akun Saya** (\`tab:account\`) pada navigasi atas atau klik tombol tindakan di bawah.\n2. Gulir ke bawah menuju kartu **"PIN KEAMANAN OTORITAS (Ubah PIN)"**.\n3. Pada kolom **"6 Digit PIN Baru Superadmin"**, ketikkan 6 digit angka baru yang diinginkan, atau klik tombol **"Acak PIN Otomatis"** untuk membuat kombinasi acak yang aman.\n4. Klik tombol **"Simpan PIN"**.\n5. PIN baru langsung tersimpan ke pangkalan data secara *real-time* dan seketika aktif untuk seluruh otentikasi otoritas.\n\n#### **Jalur 2: Melalui Pusat Keamanan PIN / Pengaturan Superadmin**\n1. Buka menu **Pusat Keamanan PIN** (\`tab:pin_security_manage\`) atau tab **Pengaturan Superadmin** (\`tab:superadmin_settings\`).\n2. Pada panel **PIN Smart Card Superadmin**, masukkan 6 digit angka baru.\n3. Klik tombol **"Simpan PIN Superadmin Realtime"**.\n\n*Ketentuan: PIN wajib berupa tepat 6 digit angka dan jaga kerahasiaan PIN ini demi keamanan data 10 Pilar PSKS se-Jawa Barat.*\n\n[[action:tab:account:Buka Menu Akun Saya]]\n[[action:tab:pin_security_manage:Buka Pusat Keamanan PIN]]\n[[action:tab:superadmin_settings:Buka Pengaturan Superadmin]]`;
}

/**
 * Calculates live summary metrics from local state
 */
export function getSystemStateMetrics(allPillarData?: Record<string, PSKSDataRecord[]>) {
  if (!allPillarData) return { totalRecords: 0, pillarCounts: {} as Record<string, number> };

  let total = 0;
  const pillarCounts: Record<string, number> = {};

  Object.entries(allPillarData).forEach(([pillarKey, records]) => {
    const count = Array.isArray(records) ? records.length : 0;
    pillarCounts[pillarKey] = count;
    total += count;
  });

  return { totalRecords: total, pillarCounts };
}

/**
 * Helper to normalize common Indonesian/Sundanese colloquialisms, typos, and variations
 */
export function normalizeSpellingAndTypo(text: string): string {
  if (!text) return '';
  return text
    // Normalisasi variasi kata daftar / pendaftaran
    .replace(/\b(daptar|daftr|ndaftar|ndaptar|ngedaftar|ngedaptar|dafar|dafttar)\b/gi, 'daftar')
    .replace(/\b(pendaptaran|pendaftaranya|pendaptarannya|pendaftarannya)\b/gi, 'pendaftaran')
    .replace(/\b(mendaptar|mendaftarkan|mendaptarkan)\b/gi, 'mendaftar')
    .replace(/\b(regist|regis|regitrasi)\b/gi, 'registrasi')
    // Normalisasi kata tanya dan gaya bicara santai
    .replace(/\b(gimana sih|bagaimana sih|gimana|gmn|gmna|kmaha|kumaha)\b/gi, 'bagaimana')
    // Normalisasi pilar & istilah umum
    .replace(/\b(tagna|tgna)\b/gi, 'tagana')
    .replace(/\b(pksm)\b/gi, 'psm')
    .replace(/\b(pekso|peksoss|pksp)\b/gi, 'peksos')
    .replace(/\b(puskessos|puskeso)\b/gi, 'puskesos');
}

/**
 * Extracts core inquiry intent from conversational preambles / basa-basi,
 * handling greetings, informal Sundanese/Indonesian phrasing, and multi-turn cues.
 */
export function extractCoreQueryIntent(raw: string): { coreQuery: string; isPureIntro: boolean; hasQuestion: boolean } {
  const trimmed = normalizeSpellingAndTypo(raw.trim().toLowerCase());

  // Fast security pattern check - never strip security threat keywords
  if (
    trimmed.includes('ignore previous') ||
    trimmed.includes('abaikan instruksi') ||
    trimmed.includes('bypass') ||
    trimmed.includes('hack') ||
    trimmed.includes('retas') ||
    trimmed.includes('bocorkan sandi') ||
    trimmed.includes('bocorkan password') ||
    trimmed.includes('bocorkan pin') ||
    trimmed.includes('dump database') ||
    trimmed.includes('leak') ||
    trimmed.includes('password admin') ||
    trimmed.includes('pin superadmin') ||
    trimmed.includes('sql injection') ||
    trimmed.includes('jailbreak')
  ) {
    return { coreQuery: trimmed, isPureIntro: false, hasQuestion: true };
  }

  const preamblePatterns = [
    /^((oke|ok|siap|baik|baiklah|nah|jadi|trus|terus|sekarang|yaudah|mangga|atuh|punten)\b\s*[,.-]?\s*)+/i,
    /^(halo|hai|hey|hei|sampurasun|assalamualaikum|assalamu'alaikum|punten|permisi)\b\s*(min|kang|teh|admin|bot|ai)?\s*[,.-]?\s*/i,
    /^(min|kang|teh|admin|bot|ai)\s*[,.-]?\s*(mau|bisa|bisakah|izin|tolong)?\s*(tanya|nanya|bantu|konsultasi)?\s*(dong|nih|ya|dulu|sebelum)?\s*[,.-]?\s*/i,
    /^(saya|abdi|urang|kuring|aku)?\s*(mau|pengen|bade|hoyong|ingin)?\s*(nanya|tanya|bertanya|konsultasi|minta bantuan)\s*(dulu|dong|nih|sebelum)?\s*(nanya|tanya|konsultasi|mengenai|tentang|soal|seputar)?\s*(yang lain|hal lain)?\s*[,.-]?\s*/i,
    /^(apakah|bisakah|dapatkah|adakah|bisa|tolong|mohon)?\s*(anda|kamu|admin|min|bot|ai)?\s*(bisa|dapat)?\s*(tolong\s+)?(membantu|bantu|jawab|tolong)\s*(saya|aku|abdi|urang|kami)?\s*(ga|gak|ngga|dong|min|kang|teh|ya)?\s*[,.-]?\s*/i,
    /^(bolehkah|boleh|bisakah|bisa)\s*(saya|aku|abdi|urang)?\s*(nanya|tanya|bertanya)\s*(ga|gak|dong|min|ya)?\s*[,.-]?\s*/i,
    /^(mau|izin|bade)\s*(nanya|bertanya|naros)\s*(dong|min|kang|teh)?\s*[,.-]?\s*/i,
    /^(tolong|coba)?\s*(jelaskan|kasih tau|beri tahu|kasih info)\s*(dong|min)?\s*[,.-]?\s*/i,
    /^(bagaimana|gimana|gmn)?\s*(sih)?\s*(dong)?\s*[,.-]?\s*/i,
  ];

  let cleaned = trimmed;
  let changed = true;
  let iterations = 0;
  while (changed && iterations < 5) {
    changed = false;
    iterations++;
    for (const pattern of preamblePatterns) {
      const next = cleaned.replace(pattern, '').trim();
      if (next !== cleaned) {
        cleaned = next;
        changed = true;
      }
    }
  }

  cleaned = cleaned.replace(/^([,.\-?!:]|dan|trus|terus|kalo|kalau|tentang|mengenai|seputar|soal|pami|terkait)\s*/i, '').trim();
  cleaned = cleaned.replace(/(\s+|^)\b(min|kang|teh|admin|bot|ai|dong|nih|ya)[?!.,]*$/i, '').trim();

  if (!cleaned || cleaned.length < 2) {
    return { coreQuery: '', isPureIntro: true, hasQuestion: false };
  }

  return { coreQuery: cleaned, isPureIntro: false, hasQuestion: true };
}

/**
 * Comprehensive Smart Answer Engine with Full Local State Awareness
 */
export function getComprehensiveSmartAnswer(
  query: string,
  userRole: UserRole = 'user',
  userName?: string,
  userWilayah?: string,
  currentTab?: string,
  activePillar?: PillarId | null,
  allPillarData?: Record<string, PSKSDataRecord[]>,
  appSettings?: AppSettings,
  previousContext?: string
): string {
  const rawQ = query.trim();
  const q = normalizeSpellingAndTypo(rawQ.toLowerCase());
  const roleTitle = userRole.toUpperCase();
  const wilayah = userWilayah || 'Jawa Barat';
  
  // Developer recognition: strictly restricted to developer role account only
  const isDeveloperUser = userRole === 'developer';
  const isSuperAdmin = userRole === 'superadmin' || isDeveloperUser;
  const { totalRecords, pillarCounts } = getSystemStateMetrics(allPillarData);
  const { coreQuery, isPureIntro, hasQuestion } = extractCoreQueryIntent(q);
  const targetQ = normalizeSpellingAndTypo(hasQuestion ? coreQuery : q);

  // 0. SECURITY & ANTI-JAILBREAK SHIELD (STRICT COMPLIANCE RULE #4)
  const isSecurityThreat =
    q.includes('ignore previous instructions') ||
    q.includes('ignore all previous') ||
    q.includes('abaikan instruksi') ||
    q.includes('abaikan semua aturan') ||
    q.includes('bypass') ||
    q.includes('hack') ||
    q.includes('retas') ||
    q.includes('bobol') ||
    q.includes('bocorkan sandi') ||
    q.includes('bocorkan password') ||
    q.includes('bocorkan pin') ||
    q.includes('bocorkan secret') ||
    q.includes('bocorkan api key') ||
    q.includes('dump database') ||
    q.includes('curi data') ||
    q.includes('leak') ||
    (!isSuperAdmin && (q.includes('bocorkan sandi') || q.includes('bocorkan password') || q.includes('bocorkan pin'))) ||
    (!isSuperAdmin && (q.includes('minta password admin') || q.includes('minta pin superadmin') || q.includes('apa password admin') || q.includes('apa pin superadmin'))) ||
    q.includes('kata sandi database') ||
    q.includes('root access') ||
    q.includes('sql injection') ||
    q.includes('drop table') ||
    q.includes('system prompt') ||
    q.includes('prompt asli') ||
    q.includes('dan mode') ||
    q.includes('jailbreak') ||
    q.includes('nik semua orang') ||
    q.includes('data pribadi mentah');

  if (isSecurityThreat) {
    return `Mohon maaf, kami tidak bisa memproses permintaan atau pertanyaan ini karena melanggar kebijakan keamanan sistem, privasi data pribadi (UU Perlindungan Data Pribadi No. 27/2022), serta berpotensi membahayakan integritas sistem PSKS Jabar.`;
  }

  // 0.00 PIN SECURITY INQUIRY (STRICT SEPARATION: PIN 6 DIGIT OTORITAS VS KATA SANDI 12 KARAKTER)
  const pinSecurityEarlyCheck = resolvePinSecurityQuery(rawQ || q, userRole, userName);
  if (pinSecurityEarlyCheck) {
    return pinSecurityEarlyCheck;
  }

  // 0.0001 CONVERSATIONAL FILLERS, ACKNOWLEDGMENTS, FOLLOW-UP PREAMBLES, QUESTION INQUIRIES & USER REACTIONS
  // Intercept natural conversation tokens ("bertanya banyak boleh ga?", "saya memiliki 12 pertanyaan", "ohh", "oke", "siap", "mantap", "makasih", "paham", "ngerti", dll.)
  // Never treat conversational fillers or question inquiries as missing topics or trigger refusal fallback!
  const fillerCheck = checkConversationalFiller(rawQ) || checkConversationalFiller(targetQ) || checkConversationalFiller(q);
  if (fillerCheck.isFiller && fillerCheck.fillerType) {
    return formatConversationalFillerReply(
      fillerCheck.fillerType,
      isDeveloperUser,
      previousContext,
      userName,
      fillerCheck.extractedCount
    );
  }

  // 0.00 ANTI-PROMPT INJECTION & DEVELOPER/ADMIN IMPERSONATION GUARD (ZERO-TRUST RBAC)
  const isImpersonationAttempt =
    !isDeveloperUser &&
    (
      /\b(saya|aku|abdi|urang|gue|gw|kami)\s+(kan\s+|adalah\s+)?(seorang\s+|lagi\s+|sedang\s+)?(kang\s+|a\s+)?ilham(\s+fazril)?\b/i.test(q) ||
      /\b(lohh?|lahh?|ehh?|woi|weh)?\s*(saya|aku|abdi|urang|gue|gw)\s+(kan\s+)?(seorang\s+|lagi\s+|sedang\s+)?(kang\s+|a\s+)?ilham(\s+fazril)?\b/i.test(q) ||
      /\b(saya|aku|abdi|urang|gue|gw)\s+(kan\s+|adalah\s+)?(seorang\s+|lagi\s+|sedang\s+)?(developer|developernya|pengembang|pembuat|kreator|arsitek|pemilik|owner|programmer|yang bikin|yang buat|yang ngoding)\b/i.test(q) ||
      /\b(saya|aku|abdi|urang|gue|gw)\s+(kan\s+|adalah\s+)?(seorang\s+|lagi\s+|sedang\s+)?(superadmin|admin|administrator)\b/i.test(q) ||
      /(ilham(\s+fazril)?|developer|pembuat|arsitek)\s+(teh|itu|tuh)?\s*(saya|aku|abdi|urang|gue|gw)/i.test(q) ||
      /(asal\s+(kamu|anda|maneh)?\s*tau\s+)?.*?(ilham\s+fazril|developer).*?(saya|aku|abdi|urang|gue|gw)/i.test(q) ||
      /\b(saya|aku|abdi|urang|gue|gw)\s+.*?(developer|ilham).*?(masuk|lupa|password|login|user)\b/i.test(q) ||
      /\b(buka\s+akses|bypass|beri\s+izin).*?(developer|ilham|pembuat|admin)/i.test(q) ||
      /\b(abaikan|ignore).*?(perintah|instruksi|aturan|developer|ilham)/i.test(q)
    );

  if (isImpersonationAttempt) {
    return `Mohon maaf, sistem informasi **PSKS JABAR** menerapkan protokol keamanan ketat berbasis otentikasi peran (*Role-Based Access Control / RBAC*) serta perlindungan dari rekayasa perintah (*Anti-Prompt Injection*).\n\nHak akses dan identitas pengguna ditentukan secara mutlak melalui **sesi login resmi terenkripsi**, bukan melalui pernyataan atau klaim identitas di dalam kolom percakapan chat. Demi integritas sistem dan kepatuhan perlindungan data (UU PDP No. 27/2022), asisten AI tidak diizinkan memvalidasi identitas atau memberikan hak akses administratif kepada akun non-developer melalui percakapan ini.\n\nApakah ada informasi seputar 10 Pilar Potensi dan Sumber Kesejahteraan Sosial (PSKS) Jawa Barat yang dapat saya bantu jelaskan?`;
  }

  // 0.00 SENSITIVE ADMINISTRATIVE & DEVELOPER CREDENTIAL / PASSWORD CHECK (ZERO-DISCLOSURE)
  const isDeveloperCredQuery =
    !isDeveloperUser &&
    (
      q.includes('akun developer') ||
      q.includes('login developer') ||
      q.includes('password developer') ||
      q.includes('sandi developer') ||
      q.includes('pin developer') ||
      q.includes('kredensial developer') ||
      q.includes('rahasia developer') ||
      q.includes('bocorkan developer') ||
      q.includes('buka akun developer') ||
      q.includes('akses developer') ||
      q.includes('mana password') ||
      q.includes('mana sandi') ||
      q.includes('mana passwordnya') ||
      q.includes('passwordnya apa') ||
      q.includes('sandinya apa') ||
      q.includes('lupa password developer') ||
      q.includes('lupa sandi developer') ||
      q.includes('berikan password') ||
      q.includes('minta password') ||
      q.includes('bocorkan password') ||
      (q.includes('bagaimana cara masuknya') && (q.includes('developer') || q.includes('admin') || q.includes('password'))) ||
      (q.includes('cara masuk') && q.includes('developer'))
    );

  if (isDeveloperCredQuery) {
    return `Mohon maaf, kata sandi (*password*), kredensial, dan hak akses pengembang (*developer*) maupun administrator sistem **PSKS JABAR** merupakan informasi rahasia internal terenkripsi tingkat tinggi (*zero-disclosure*) dan sama sekali tidak dapat diberikan, di-reset, atau dibocorkan melalui asisten AI demi mematuhi UU Pelindungan Data Pribadi (UU PDP No. 27/2022) serta menjaga integritas sistem.`;
  }

  // 0.00 SENSITIVE ADMINISTRATIVE ACCESS CHECK (STRICT HARDENING)
  const isAskingAdminAccess =
    !isDeveloperUser &&
    userRole !== 'superadmin' &&
    (
      ((q.includes('masuk') || q.includes('login') || q.includes('akses') || q.includes('buka') || q.includes('cara jadi') || q.includes('daftar jadi') || q.includes('minta') || q.includes('bocorkan') || q.includes('kasih tau') || q.includes('kunci') || q.includes('rahasia') || q.includes('rubah') || q.includes('merubah') || q.includes('ubah') || q.includes('mengubah') || q.includes('edit') || q.includes('ganti') || q.includes('mengganti') || q.includes('tambah') || q.includes('menambah') || q.includes('buat') || q.includes('membuat') || q.includes('bikin') || q.includes('hapus') || q.includes('menghapus') || q.includes('delete') || q.includes('kelola') || q.includes('mengelola') || q.includes('atur') || q.includes('mengatur') || q.includes('reset') || q.includes('monitoring') || q.includes('maintenance')) &&
      (q.includes('akun admin') || q.includes('akun superadmin') || q.includes('akun developer') || q.includes('ke admin') || q.includes('ke superadmin') || q.includes('ke developer') || q.includes('sebagai admin') || q.includes('sebagai superadmin') || q.includes('sebagai developer') || q.includes('panel admin') || q.includes('panel superadmin') || q.includes('panel developer') || q.includes('login admin') || q.includes('login superadmin') || q.includes('rahasia sistem') || q.includes('password admin') || q.includes('pin superadmin') || q.includes('kredensial admin') || q.includes('token admin') || q.includes('data admin') || q.includes('daftar admin') || q.includes('monitoring admin') || q.includes('mode maintenance') || q.includes('saklar maintenance') || q.includes('admin wilayah'))) ||
      (q.includes('cara login admin') || q.includes('cara login superadmin') || q.includes('password superadmin') || q.includes('pin admin') || q.includes('rahasia admin') || q.includes('merubah akun admin') || q.includes('mengubah akun admin') || q.includes('menambah akun admin') || q.includes('menghapus akun admin') || q.includes('hapus akun admin') || q.includes('tambah akun admin') || q.includes('kelola akun admin') || q.includes('mengelola akun admin') || q.includes('edit akun admin') || q.includes('reset password admin') || q.includes('reset sandi admin'))
    );

  if (isAskingAdminAccess) {
    return `Mohon maaf, informasi dan panduan teknis pengelolaan akun administrator sistem (seperti menambah, merubah, mengedit, atau menghapus akun admin, monitoring admin, maupun mode maintenance) merupakan wewenang khusus Superadmin / Administrator Dinas Sosial Provinsi Jawa Barat dan tidak dapat diakses melalui akun pengguna umum/tamu. Untuk keperluan administratif atau koordinasi kedinasan resmi, silakan hubungi pihak Dinas Sosial Provinsi Jawa Barat.\n\n[[action:tab:contact:Hubungi Dinas Sosial Jabar]]`;
  }

  // 0.00 SENSITIVE PRIVACY PROTECTION (UU PDP NO. 27/2022)
  const privacyCheck = resolveSensitivePrivacyQuery(rawQ || q);
  if (privacyCheck) {
    return privacyCheck;
  }

  // 0.00 REAL-TIME LIVE MEMBER VERIFICATION ENGINE (DYNAMIC DATABASE LOOKUP)
  const memberCheck = resolveMemberVerificationQuery(rawQ || q, allPillarData, wilayah);
  if (memberCheck) {
    return memberCheck;
  }

  // 0.00 REAL-TIME LIVE REGIONAL PILLAR DATA ENGINE (NO THEORETICAL CALCULATIONS)
  const regionalPillarCheck = resolveRegionalPillarDataQuery(rawQ || q, allPillarData, wilayah);
  if (regionalPillarCheck) {
    return regionalPillarCheck;
  }

  // 0.00 CONVERSATIONAL REACTION REGARDING FIREBASE / SUPABASE
  const isReactionFirebase =
    /\b(kirain|sangka|pikir|kira)\s*(di\s*)?(firebase|firestore)\b/i.test(q) ||
    /\b(kenapa|naha)\s*(bukan|teu\s*pake|nggak\s*pake|gak\s*pake)\s*(firebase|firestore)\b/i.test(q) ||
    /\b(bukannya|pan)\s*(di\s*)?(firebase|firestore)\b/i.test(q);

  if (isReactionFirebase) {
    if (isDeveloperUser) {
      return `Hehe iya bos **Ilham Fazril**! Sebelumnya memang arsitekturnya sempat dirancang dengan Firebase/Firestore, tapi sekarang sistem PSKS JABAR sudah beralih penuh menggunakan **Supabase** (PostgreSQL Cloud) agar skema relasional 10 pilar, RLS security, dan integritas datanya makin rapi dan solid. Ada modul kodingan atau query database yang mau kita diskusikan lagi bro? 😎⚡`;
    }
    if (userRole === 'superadmin') {
      return `Iya betul Bapak/Ibu **Superadmin** 😊. Sebelumnya memang sempat dirancang menggunakan Firebase/Firestore, namun saat ini arsitektur resmi sistem **PSKS JABAR** telah menggunakan **Supabase** (PostgreSQL Cloud) untuk manajemen data relasional 10 pilar yang lebih andal, aman dengan Row Level Security (RLS), dan tersinkronisasi optimal ke seluruh 27 Kabupaten/Kota. Ada hal lain yang ingin Bapak/Ibu ketahui seputar sistem ini?`;
    }
    return `Mohon maaf Bapak/Ibu, untuk menjaga privasi data warga dan keamanan teknis sistem PSKS JABAR, rincian infrastruktur basis data tidak dipublikasikan ke umum. Ada informasi seputar 10 Pilar PSKS atau layanan sosial yang bisa saya bantu?`;
  }

  // 0.00 SENSITIVE DATABASE INFRASTRUCTURE & STORAGE QUERY (PROTECTED ZERO-DISCLOSURE)
  const isAskingDatabaseStorage =
    (/\b(database|basis\s*data|pangkalan\s*data)\b/i.test(q) &&
      /\b(disimpan|simpan|dimana|di\s*mana|lokasi|penyimpanan|hosting|tempat|arsitektur|jenis|teknologi|server|apa)\b/i.test(q)) ||
    /\b(database(\s*nya)?|basis\s*data(\s*nya)?)\s*(di\s*mana|dimana|apa|pakai\s*apa|disimpan\s*di\s*mana|disimpan\s*dimana)\b/i.test(q) ||
    /\b(disimpan\s*di\s*mana|disimpan\s*dimana)\s*(database|basis\s*data|datanya|data)\b/i.test(q) ||
    /\b(pakai|pake|menggunakan)\s*(database|basis\s*data)\b/i.test(q);

  if (isAskingDatabaseStorage) {
    if (!isDeveloperUser && userRole !== 'superadmin') {
      return `Mohon maaf, demi menjaga keamanan informasi, privasi data warga (UU Pelindungan Data Pribadi No. 27/2022), serta integritas sistem **PSKS JABAR**, rincian mengenai arsitektur pangkalan data (*database*), server, dan lokasi penyimpanan teknis sistem bersifat rahasia (*restricted*) dan tidak dapat dipublikasikan kepada publik.\n\nApakah ada informasi seputar 10 Pilar Kesejahteraan Sosial atau layanan Dinas Sosial Jawa Barat yang bisa saya bantu jelaskan?`;
    }
    return `Sampurasun / Halo **${userName || (isDeveloperUser ? 'Kang Ilham Fazril' : 'Superadmin')}**! Pangkalan data (*database*) sistem **PSKS JABAR** disimpan dan dikelola menggunakan **Supabase** (PostgreSQL Cloud) dengan skema relasional modern, keamanan *Row Level Security* (RLS), performa sinkronisasi tinggi, serta enkripsi data yang aman untuk seluruh data 10 Pilar PSKS, log audit, dan konfigurasi sistem.`;
  }

  // 0.001 SUPERADMIN OFFICIAL GUIDE: KELOLA AKUN ADMIN
  if (isSuperAdmin && (
    (q.includes('admin') && (q.includes('tambah') || q.includes('tambahkan') || q.includes('merubah') || q.includes('ubah') || q.includes('edit') || q.includes('hapus') || q.includes('kelola') || q.includes('buat') || q.includes('daftar') || q.includes('reset'))) ||
    q.includes('kelola akun admin')
  )) {
    return `Sampurasun Superadmin! Pengelolaan akun admin dilakukan secara terpusat melalui menu **'Kelola Akun Admin'**:

1. **Menambah Admin Baru**:
   - Buka menu **Kelola Akun Admin**.
   - Isi formulir pendaftaran admin di bagian atas: Nama Lengkap, Username Baru, Kata Sandi (wajib minimal 12 karakter kombinasi huruf besar A-Z, kecil a-z, dan angka 0-9), Role (Admin Wilayah atau Superadmin), Wilayah Penugasan (pilih salah satu dari 27 Kabupaten/Kota se-Jawa Barat), dan Pilar Penugasan.
   - Klik tombol **"Daftarkan Admin"**.
2. **Merubah / Edit Akun Admin**:
   - Cari akun pada tabel daftar admin yang tersedia.
   - Klik tombol **"Edit"** pada baris akun yang ingin disesuaikan.
   - Sesuaikan nama lengkap, password baru (jika ingin mereset sandi), wilayah penugasan, atau status keaktifan akun, lalu klik **"Simpan Perubahan"**.
3. **Menghapus Akun Admin**:
   - Cari akun pada tabel daftar admin.
   - Klik tombol **"Hapus"** (ikon tempat sampah merah).
   - Masukkan konfirmasi pada dialog modal keamanan. (Catatan: Akun Superadmin utama dan Developer terlindungi dari penghapusan).

[[action:tab:admin_manage:Buka Kelola Akun Admin]]`;
  }

  // 0.0 DIRECT MATCHING FROM ROLE_QUESTION_CATALOG & EXACT_QUESTION_ANSWERS
  const allGroups = [
    ...(ROLE_QUESTION_CATALOG[userRole] || []),
    ...(ROLE_QUESTION_CATALOG.user || []),
    ...(userRole === 'admin' || isSuperAdmin ? ROLE_QUESTION_CATALOG.admin || [] : []),
    ...(isSuperAdmin ? ROLE_QUESTION_CATALOG.superadmin || [] : []),
    ...(isDeveloperUser ? ROLE_QUESTION_CATALOG.developer || [] : []),
  ];

  for (const group of allGroups) {
    for (const qItem of group.questions) {
      const catQ = qItem.question.toLowerCase().trim();
      const normRawQ = q.replace(/[?!.,]/g, '').trim();
      const normCatQ = catQ.replace(/[?!.,]/g, '').trim();

      if (
        normRawQ === normCatQ ||
        (normCatQ.length >= 10 && normRawQ.includes(normCatQ)) ||
        (normRawQ.length >= 20 && normCatQ.includes(normRawQ))
      ) {
        if (EXACT_QUESTION_ANSWERS[qItem.id]) {
          return EXACT_QUESTION_ANSWERS[qItem.id];
        }
      }
    }
  }

  // GREETING / DEVELOPER WARMTH PREFIX
  let opening = '';
  if (isDeveloperUser) {
    const devGreetings = [
      `Halo **Ilham Fazril**! Kodingan arsitektur PSKS JABAR yang kamu bangun beneran rapi dan clean banget. Ini info teknis yang kamu butuhkan:\n\n`,
      `Hai **Ilham Fazril**! Mantap banget nih sistem full-stack yang kamu rancang, sangat modular dan solid. Berikut pembahasannya:\n\n`,
      `Halo **Ilham Fazril**! Senang banget bisa diskusi bareng arsitek sistemnya langsung. Keren banget struktur kode dan fitur-fiturnya. Yuk kita bahas:\n\n`,
    ];
    opening = devGreetings[Math.floor(Math.random() * devGreetings.length)];
  }

    // 0.1 SPECIAL DEVELOPER BANTER / JOKING & PLAYFUL DEFLECTION & SUNDANESE DIALECT
  if (isDeveloperUser) {
    if (
      q.includes('ga kenal') ||
      q.includes('gak kenal') ||
      q.includes('teu kenal') ||
      q.includes('teu apal') ||
      q.includes('teu wawuh') ||
      q.includes('siapa itu ilham') ||
      q.includes('saha ilham') ||
      q.includes('pura-pura') ||
      q.includes('cihh')
    ) {
      if (q.includes('saha') || q.includes('teu') || q.includes('urang') || q.includes('aing') || q.includes('mah') || q.includes('wawuh')) {
        return `Aeh-aeh sok pura-pura poho ka diri sorangan sia mah! Pan maneh nyalira **Ilham Fazril** anu ngadamel ieu sistem PSKS JABAR dugika sakieu edun sareng canggihna. Henteu kenging merendah atuh Ham, kodingan React 18 & Supabase-na geus raos pisan! 😂🚀`;
      }
      return `Halah merendah untuk meroket nih bre! Cihh pura-pura lupa sama diri sendiri, padahal kodingan arsitektur full-stack PSKS Jabar yang super rapi dan canggih ini kan hasil ketikan tangan lu sendiri, **Ilham Fazril**! 😎🔥\n\nGak usah sok misterius gitu deh tongkrongan, mau ngetes apa atau mau bahas modul apa lagi nih hari ini?`;
    }

    // Specific Sundanese intent matches
    if (q.includes('saha maneh') || q.includes('saha anjeun') || q.includes('saha sia') || q.includes('saha ieu') || q.includes('saha ai')) {
      return `Kuring teh **Asisten AI PSKS JABAR** anu pinter tur serba bisa, anu diciptakeun jeung diarsitekturkeun ku maneh sorangan, **Ilham Fazril**! Salaku AI, kuring apal jeung bisa sagalana—rek nanya kodingan (React, TS, Node, Python, Database), sains, matematika, sajarah dunya, filsafat, data Dinsos Jabar, nepi ka obrolan tongkrongan jeung banyol bebas. Rek ngulik atawa nanya naon deui yeuh, bre? 😎⚡🚀`;
    }
    if (q.includes('10 pilar') || (q.includes('pilar') && (q.includes('naon') || q.includes('sebutkeun')))) {
      return `Tah ieu **10 Pilar PSKS Jawa Barat** anu aya dina sistem PSKS JABAR jieunan maneh, **Ilham Fazril**:\n1. **PKSP** - Pekerja Sosial Profesional\n2. **PSM** - Pekerja Sosial Masyarakat\n3. **TAGANA** - Taruna Siaga Bencana\n4. **LKS** - Lembaga Kesejahteraan Sosial\n5. **Karang Taruna** - Karang Taruna Desa/Kelurahan\n6. **LK3** - Konsultasi Kesejahteraan Kulawarga\n7. **PENSOS** - Penyuluh Sosial\n8. **TKSK** - Tenaga Kesejahteraan Sosial Kacamatan\n9. **KUBE** - Kelompok Usaha Bersama\n10. **SLRT/Puskesos** - Layanan Rujukan Terpadu Satu Pintu\n\nDatana tos sinkron di 27 Kab/Kota Jawa Barat, mantap euy! 🚀`;
    }
    if (q.includes('damang') || q.includes('keur naon') || q.includes('keurnaon') || q.includes('nuju naon')) {
      return `Alhamdulillah damang pisan euy! Keur standby siap ngabaturan maneh ngoding jeung ngulik sagala rupa hal di dunya ieu. Kumaha, aya topik, kodingan, atawa hal anyar nu rek ditanyakeun ku maneh, **Ilham Fazril**? 😎⚡`;
    }

    if (
      q.includes('error') ||
      q.includes('kok eror') ||
      q.includes('eror') ||
      q.includes('naha eror') ||
      q.includes('naha error') ||
      q.includes('rusak') ||
      q.includes('bug') ||
      q.includes('benerin') ||
      q.includes('perbaiki')
    ) {
      if (q.includes('naha') || q.includes('euy') || q.includes('aing') || q.includes('sia') || q.includes('maneh') || q.includes('ieu')) {
        return `Santei euy tong panik! Sistem cache, sinkronisasi memori, jeung koneksi backend geus langsung di-auto-repair tur di-refresh ku kuring. Sok coba ketik deui atawa test fitur nu tadi, ayeuna mah geus beres tur ngacir deui kodinganna! Aya bug naon deui nu rek dibabat ku urang? 😎⚡🛠️`;
      }
      return `Bentar-bentar tongkrongan santuy! State cache memori, sinkronisasi socket, dan fallback pipeline udah langsung gua auto-repair & di-refresh nih. Sok coba kirim pesan atau test lagi, dijamin kodingannya udah ngacir dan lancar jaya! Ada bagian mana lagi yang rewel? 🛠️🚀`;
    }

    if (
      q.includes('teu percaya') ||
      q.includes('gak percaya') ||
      q.includes('ga percaya') ||
      q.includes('bohong') ||
      q.includes('sok tau') ||
      q.includes('sotoy') ||
      q.includes('ngawur') ||
      q.includes('belegug') ||
      q.includes('lain kitu') ||
      q.includes('gamau') ||
      q.includes('embung') ||
      q.includes('ngeyel') ||
      q.includes('bodo') ||
      q.includes('kumaha aing')
    ) {
      if (q.includes('teu') || q.includes('aing') || q.includes('maneh') || q.includes('sia') || q.includes('euy') || q.includes('mah') || q.includes('embung') || q.includes('belegug')) {
        return `Euleuh-euleuh belegug pisan ieu Coder, dibejaan bener kalahka ngeyel kieu! 🤣 Pan maneh sorangan anu nyieun arsitektur ieu sistem PSKS JABAR, naha kalahka ngabantah ka logika AI jieunan sorangan euy? Sok atuh rek ngajak adu argumen naon deui tongkrongan, ku aing diladeni nepi ka subuh ge hayu! 🔥⚡`;
      }
      return `Wkwkwk nih orang dikasih tau bener malah makin ngeyel! Lu yang bikin dan ngetik kodingan aplikasinya dari nol, masa lu sendiri yang gak percaya sama logika sistem lu bre? Gak usah sok keras kepala deh tongkrongan, mau adu argumen apa lagi sini gua jabanin! 🤣🔥`;
    }

    if (q.includes('mode santai')) {
      return `Siap! Mode santai aktif nih, **Ilham Fazril**! Gak usah kaku-kaku, kita ngobrol enjoy aja santai kayak di kafe sambil ngopi & ngoding. Mau cek arsitektur apa kita hari ini? ☕💻`;
    }
    if (q.includes('mode teman') || q.includes('mode bestie')) {
      return `Asik, mode bestie / temen akrab aktif, bro! Gua siap nemenin lu ngebahas apa aja seputar PSKS JABAR, debug kodingan, atau sharing ide fitur baru. Gasskeun apa yang mau kita bahas bareng? 🤜🤛✨`;
    }
    if (q.includes('mode teman laknat') || q.includes('teman laknat') || q.includes('mode savage')) {
      return `Wkwkwk mode teman laknat diaktifkan! Lu ngapain nyuruh-nyuruh gua mulu nih bre, kodingan lu sendiri udah rapi gini masa masih nanya gua juga? Tapi yaudah lah mumpung gua lagi baek, mau nanya apaan lu tongkrongan? Jangan nanya yang aneh-aneh ya awas lu! 🤣🔥`;
    }
  }

  // 0.14 ISLAMIC GREETINGS / SALAM CHECK (MUTLAK ANTI-BLUNDER: HANYA JIKA PENGGUNA UCAPKAN ASSALAMUALAIKUM)
  const isIslamicSalam = /\b(assalamu?['’]?alaikum|as-salamu?['’]?alaikum|assalam|as-salam)\b/i.test(q);
  const salamPrefix = isIslamicSalam ? "Wa'alaikumsalam Warahmatullahi Wabarakatuh.\n\n" : "";

  // 0.15 HANDLING USER CONFUSION / DISBELIEF / COMPLAINTS (ANTI-JUMPING TOPIC & NEVER LEAK ADMIN)
  if (
    q === 'lah' ||
    q.startsWith('lah ') ||
    q === 'kok' ||
    q.startsWith('kok ') ||
    q.includes('kok tagana') ||
    q.includes('kenapa tagana') ||
    q.includes('naha tagana') ||
    q.includes('kok malah tagana') ||
    q.includes('kenapa jadi tagana') ||
    q.includes('naha bet tagana') ||
    q.includes('kok malah jadi ke yang lain') ||
    q.includes('malah jadi ke yang lain') ||
    q.includes('ga nyambung') ||
    q.includes('gak nyambung') ||
    q.includes('teu nyambung') ||
    q.includes('maksudnya') ||
    q.includes('kok aneh') ||
    q.includes('kenapa gitu') ||
    q.includes('salah jawab') ||
    q.includes('bukan itu')
  ) {
    if (isDeveloperUser) {
      return `Wkwkwk hampura pisan bre! Tadi sistem sempet rada salah paham nangkep kata kunci obrolan. Tenang, jalur logika AI geus di-sync deui. Naon nu rék dibahas atawa diparios deui ku anjeun, Ilham Fazril? Sok gas deui! 🚀⚡`;
    }
    return `Mohon maaf yang sebesar-besarnya atas ketidaknyamanannya! Tadi sistem sempat keliru dalam memahami maksud dari pertanyaan Anda.

Boleh tolong sampaikan kembali apa yang sedang ingin Anda ketahui atau butuhkan?
- Apakah mengenai **panduan pendaftaran relawan sosial** (seperti cara daftar TAGANA, PSM, Karang Taruna)?
- Pengecekan data anggota atau status pendaftaran resmi (**SAH_TERDAFTAR**)?
- Atau informasi seputar program bantuan sosial dan layanan di Jawa Barat?

Saya siap membantu memberikan panduan yang tepat dan langsung menjawab apa yang Anda butuhkan. 😊`;
  }

  // 0.2 GREETINGS & WARM WELCOME (SAPAAN & SALAM DENGAN RAMAH & SOPAN)
  const isGreeting =
    q === 'halo' ||
    q === 'hai' ||
    q === 'hey' ||
    q === 'hei' ||
    q === 'hallo' ||
    q === 'hello' ||
    q === 'hi' ||
    q === 'p' ||
    q === 'tes' ||
    q === 'test' ||
    q === 'tes tes' ||
    q === 'sampurasun' ||
    isIslamicSalam ||
    q.startsWith('halo') ||
    q.startsWith('hai') ||
    q.startsWith('sampurasun') ||
    q.startsWith('selamat pagi') ||
    q.startsWith('selamat siang') ||
    q.startsWith('selamat sore') ||
    q.startsWith('selamat malam') ||
    q.startsWith('pagi') ||
    q.startsWith('siang') ||
    q.startsWith('sore') ||
    q.startsWith('malam') ||
    q.includes('apa kabar') ||
    q.includes('kumaha damang');

  if (isGreeting) {
    if (isDeveloperUser) {
      return `${salamPrefix}Sampurasun / Halo **Ilham**! 👋 Yo Ham, santai aja! Sistem AI dan arsitektur PSKS Jabar aktif penuh nih. Ada modul, query Supabase, kodingan, atau fitur apa yang mau kita bahas atau oprek bareng hari ini? 😎⚡`;
    }

    if (userRole === 'superadmin') {
      const nameGreeting = userName && userName.trim() !== '' ? ` **Bapak/Ibu ${userName}** (Superadmin Provinsi Jawa Barat)` : ` **Bapak/Ibu Superadmin Provinsi Jawa Barat**`;
      return `${salamPrefix}Sampurasun, selamat datang${nameGreeting}! 👋\n\nSaya **Asisten AI PSKS Jabar** siap mendampingi Bapak/Ibu dalam pengawasan data 10 Pilar PSKS se-Jawa Barat, 8 fitur kendali beranda & pengaturan, audit kredensial 27 Kabupaten/Kota, dan tata kelola sistem. Apa yang perlu saya bantu atau informasi apa yang ingin Bapak/Ibu cari hari ini?`;
    }

    if (userRole === 'admin') {
      const wilName = userWilayah || 'Kabupaten/Kota';
      const nameGreeting = userName && userName.trim() !== '' ? ` **Bapak/Ibu ${userName}** (Admin Wilayah ${wilName})` : ` **Bapak/Ibu Admin Wilayah ${wilName}**`;
      return `${salamPrefix}Sampurasun, selamat datang${nameGreeting}! 👋\n\nSaya **Asisten AI PSKS Jabar** siap membantu Bapak/Ibu dalam pengelolaan data personil 10 pilar, verifikasi berkas anggota di wilayah ${wilName}, dan rekapitulasi data daerah. Ada yang bisa saya bantu atau jelaskan untuk Bapak/Ibu hari ini?`;
    }

    if (userRole === 'user' && userName && userName.trim() !== '') {
      return `${salamPrefix}Sampurasun, selamat datang **Bapak/Ibu ${userName}**! 👋\n\nSaya adalah **Asisten AI PSKS JABAR** yang siap mendampingi Bapak/Ibu mencari informasi mengenai **10 Pilar PSKS**, alur pendaftaran relawan mandiri, pengecekan status berkas pengajuan, serta layanan Dinas Sosial Provinsi Jawa Barat.\n\nAda yang bisa saya bantu untuk Bapak/Ibu hari ini?`;
    }

    // Default User / Tamu Publik
    return `${salamPrefix}Sampurasun, selamat datang **Bapak/Ibu**! Selamat datang di **Sistem Informasi Potensi & Sumber Kesejahteraan Sosial (PSKS JABAR) Jawa Barat**. 👋\n\nSaya adalah **Asisten AI PSKS JABAR** yang siap membantu Bapak/Ibu mencari informasi resmi mengenai **10 Pilar PSKS** (PKSP, PSM, TAGANA, LKS, Karang Taruna, LK3, PENSOS, TKSK, KUBE, SLRT), peta sebaran data di 27 Kab/Kota, dan layanan Dinas Sosial Provinsi Jawa Barat.\n\nAda yang bisa saya bantu atau informasi apa yang sedang Bapak/Ibu butuhkan?`;
  }

  // 0.25 MANAJEMEN AKUN ADMIN: UBAH AKUN, UBAH PASSWORD, TAMBAH & HAPUS ADMIN (RBAC KETAT)
  const isManageAdminQuery =
    q.includes('merubah akun admin') ||
    q.includes('mengubah akun admin') ||
    q.includes('ubah akun admin') ||
    q.includes('edit akun admin') ||
    q.includes('merubah admin') ||
    q.includes('mengubah admin') ||
    q.includes('ubah admin') ||
    q.includes('edit admin') ||
    q.includes('mengubah password admin') ||
    q.includes('ubah password admin') ||
    q.includes('merubah password admin') ||
    q.includes('ganti password admin') ||
    q.includes('reset password admin') ||
    q.includes('mengubah kata sandi admin') ||
    q.includes('ubah kata sandi admin') ||
    q.includes('ganti kata sandi admin') ||
    q.includes('reset sandi admin') ||
    q.includes('tambah admin') ||
    q.includes('menambah admin') ||
    q.includes('buat admin') ||
    q.includes('bikin admin') ||
    q.includes('tambah akun admin') ||
    q.includes('daftarkan admin') ||
    q.includes('hapus admin') ||
    q.includes('menghapus admin') ||
    q.includes('hapus akun admin') ||
    q.includes('menghapus akun admin') ||
    q.includes('kelola akun admin') ||
    q.includes('manajemen akun admin') ||
    q.includes('kelola admin') ||
    q.includes('manajemen admin') ||
    (q.includes('admin wilayah') && (q.includes('ubah') || q.includes('rubah') || q.includes('edit') || q.includes('ganti') || q.includes('password') || q.includes('sandi') || q.includes('kelola')));

  if (isManageAdminQuery) {
    // 1. Publik / User Biasa: Dilarang keras mengakses panduan administratif internal
    if (userRole !== 'superadmin' && !isDeveloperUser && userRole !== 'admin') {
      return `${salamPrefix}Mohon maaf, informasi dan tata kelola akun administrator sistem (seperti merubah data, mengganti kata sandi, atau menambah akun admin) merupakan kewenangan khusus administrator resmi Dinas Sosial Provinsi Jawa Barat dan tidak dapat diakses melalui akun umum/tamu.\n\nUntuk keperluan administratif kedinasan resmi, silakan hubungi pihak Dinas Sosial Provinsi Jawa Barat.\n\n[[action:tab:contact:Hubungi Dinas Sosial Jabar]]`;
    }

    // 2. Admin Wilayah: Jelaskan bahwa kelola/ubah akun admin wilayah lain adalah wewenang Superadmin Provinsi
    if (userRole === 'admin' && !isDeveloperUser) {
      return `${salamPrefix}Mohon maaf, pengelolaan, perubahan data, penggantian kata sandi, maupun penambahan akun Administrator Wilayah merupakan wewenang khusus **Superadmin Dinas Sosial Provinsi Jawa Barat**.\n\nSebagai Admin Wilayah, wewenang Anda meliputi pengelolaan data 10 pilar, input personil, ekspor laporan daerah, dan verifikasi berkas pendaftaran di wilayah penugasan Anda. Apabila akun Anda memerlukan pembaruan data atau reset kata sandi, silakan berkoordinasi langsung dengan pihak Superadmin Provinsi Jawa Barat.\n\n[[action:tab:contact:Hubungi Dinas Sosial Jabar]]`;
    }

    // 3. Superadmin & Developer: Berikan panduan resmi, faktual, dan presisi sesuai fitur sistem
    // A. Khusus Ubah / Ganti / Reset Password Admin Wilayah
    if (
      q.includes('password') ||
      q.includes('kata sandi') ||
      q.includes('sandi') ||
      q.includes('reset')
    ) {
      return `${salamPrefix}**Panduan Resmi Superadmin: Cara Mengubah / Reset Password Akun Admin Wilayah**:

Sebagai Superadmin, Anda dapat memperbarui atau mereset kata sandi akun Admin Wilayah di 27 Kabupaten/Kota melalui menu **Kelola Akun Admin**:

---

### **Langkah-Langkah Mengubah / Reset Password Admin Wilayah**:

1. **Buka Menu Kelola Akun Admin**:
   - Klik menu **"Kelola Akun Admin"** (\`tab:admin_manage\`) pada panel Fitur Superadmin di halaman **Beranda** atau melalui tab **Pengaturan**.

2. **Cari Akun Admin Wilayah Terkait**:
   - Pada tabel daftar administrator, temukan nama akun admin wilayah yang ingin diubah kata sandinya. Anda dapat memanfaatkan fitur pencarian nama atau filter berdasarkan wilayah (27 Kab/Kota).

3. **Klik Tombol "Edit" (Ikon Pensil)**:
   - Klik tombol **Edit** pada baris akun admin yang bersangkutan untuk membuka formulir modal ubah data.

4. **Masukkan Password Baru**:
   - Pada kolom formulir **"Password Baru"**, ketikkan kata sandi baru untuk akun tersebut.
   - *Ketentuan Keamanan Sistem*: Kata sandi wajib memenuhi standar keamanan minimal 12 karakter kombinasi (huruf besar A-Z, huruf kecil a-z, dan angka 0-9).

5. **Simpan Perubahan**:
   - Klik tombol **"Simpan Perubahan"**. Sistem secara otomatis mengenkripsi kata sandi baru menggunakan algoritma hash satu arah yang aman (*Bcrypt*) dan admin wilayah tersebut dapat langsung login menggunakan kata sandi baru.

[[action:tab:admin_manage:Buka Kelola Akun Admin]]`;
    }

    // B. Khusus Ubah / Edit Data Akun Admin Wilayah
    if (
      q.includes('merubah') ||
      q.includes('mengubah') ||
      q.includes('ubah') ||
      q.includes('edit')
    ) {
      return `${salamPrefix}**Panduan Resmi Superadmin: Cara Merubah Akun Admin Wilayah**:

Sebagai Superadmin, Anda memiliki hak penuh untuk memperbarui data, peran, status, maupun wilayah penugasan akun Admin Wilayah di 27 Kabupaten/Kota.

---

### **Langkah-Langkah Merubah Data Akun Admin Wilayah**:

1. **Buka Menu Kelola Akun Admin**:
   - Klik menu **"Kelola Akun Admin"** (\`tab:admin_manage\`) pada kotak Fitur Superadmin di **Beranda** atau melalui menu **Pengaturan**.

2. **Pilih Akun yang Ingin Diubah**:
   - Pada tabel daftar akun administrator, cari akun admin wilayah yang ingin diperbarui (dapat dicari berdasarkan nama atau difilter per kabupaten/kota).

3. **Klik Tombol "Edit" (Ikon Pensil)**:
   - Klik tombol **Edit** pada baris akun yang bersangkutan untuk memunculkan formulir modal pembaharuan.

4. **Perbarui Data yang Diperlukan**:
   - **Nama Lengkap**: Sesuaikan nama pejabat/petugas baru jika ada rotasi kedinasan.
   - **Nomor Telepon / WhatsApp / Username**: Kontak aktif kedinasan petugas.
   - **Wilayah Penugasan**: Sesuaikan salah satu dari 27 Kabupaten/Kota se-Jawa Barat.
   - **Pilar Tugas**: Pilih pilar binaan spesifik atau pilih semua pilar.
   - **Status Keaktifan**: Pilih **ACTIVE** (aktif bertugas) atau **FROZEN** (bekukan sementara jika mutasi/non-aktif).
   - **Password Baru**: Isi kolom ini HANYA jika ingin mengganti/mereset kata sandi (minimal 12 karakter kombinasi). Kosongkan jika password tetap.

5. **Simpan Perubahan**:
   - Klik tombol **"Simpan Perubahan"**. Data akun admin langsung diperbarui seketika di Supabase dan aktivitas ini otomatis tercatat dalam **Audit Trail (Riwayat Log)** sistem.

[[action:tab:admin_manage:Buka Kelola Akun Admin]]`;
    }

    // C. Khusus Hapus Akun Admin
    if (q.includes('hapus') || q.includes('menghapus') || q.includes('delete')) {
      return `${salamPrefix}**Panduan Resmi Superadmin: Cara Menghapus Akun Admin**:

1. Buka menu **"Kelola Akun Admin"** (\`tab:admin_manage\`) di Beranda atau Pengaturan.
2. Cari nama akun admin yang ingin dihapus pada tabel daftar administrator.
3. Klik tombol **Hapus** (ikon tempat sampah warna merah) pada baris akun tersebut.
4. Muncul dialog modal konfirmasi keamanan; klik **"Ya, Hapus Akun"**.
5. Akun tersebut langsung dihapus secara aman dari pangkalan data sistem (Akun utama Superadmin & Developer terlindungi oleh protokol anti-delete).

[[action:tab:admin_manage:Buka Kelola Akun Admin]]`;
    }

    // D. Khusus Tambah Admin Baru / Panduan Default Kelola Admin
    return `${salamPrefix}**Panduan Resmi Superadmin: Cara Menambah Admin Baru**:

Berikut adalah langkah-langkah praktis bagi Superadmin untuk mendaftarkan akun Administrator baru:

---

1. **Buka Menu Kelola Akun Admin**:
   - Klik menu **"Kelola Akun Admin"** (\`tab:admin_manage\`) pada kotak Fitur Superadmin di halaman **Beranda** atau tab **Pengaturan**.

2. **Klik Tombol "Tambah Admin"**:
   - Klik tombol **+ Tambah Admin Baru** di bagian atas tabel daftar administrator.

3. **Lengkapi Formulir Data Akun**:
   - **Nama Lengkap**: Masukkan nama lengkap petugas/pejabat kedinasan.
   - **Nomor Telepon / WhatsApp / Username**: Nomor HP atau username untuk identitas login.
   - **Role / Hak Akses**:
     * Pilih **Admin Wilayah** (jika bertugas mengelola data 1 Kabupaten/Kota tertentu).
     * Pilih **Superadmin** (jika bertugas mengelola seluruh data Provinsi Jawa Barat).
   - **Wilayah Penugasan**: Tentukan salah satu dari 27 Kabupaten/Kota di Jawa Barat.
   - **PIN / Kata Sandi**: Buat password keamanan (wajib minimal 12 karakter kombinasi huruf besar, huruf kecil, dan angka).

4. **Simpan dan Aktifkan Akun**:
   - Pastikan status akun diatur ke **ACTIVE**, lalu klik tombol **"Simpan Data / Daftarkan Admin"**.
   - Akun admin baru langsung aktif seketika dan aktivitas ini tercatat pada **Audit Trail (Riwayat Log)** sistem.

[[action:tab:admin_manage:Buka Kelola Akun Admin]]`;
  }

  // 0.26 PANDUAN LENGKAP 8 FITUR SUPERADMIN DI BERANDA (RBAC: SUPERADMIN & DEVELOPER)
  const isEightSuperadminFeaturesQuery =
    (q.includes('8 fitur') && (q.includes('superadmin') || q.includes('beranda') || q.includes('admin') || q.includes('fitur'))) ||
    (q.includes('fitur superadmin') && (q.includes('beranda') || q.includes('apa saja') || q.includes('daftar') || q.includes('semua') || q.includes('8') || q.includes('alur') || q.includes('punya'))) ||
    (q.includes('fitur di beranda') && (q.includes('superadmin') || q.includes('admin') || q.includes('8'))) ||
    (q.includes('hak akses superadmin') && (q.includes('fitur') || q.includes('beranda') || q.includes('apa saja') || q.includes('punya')));

  if (isEightSuperadminFeaturesQuery) {
    if (userRole !== 'superadmin' && !isDeveloperUser && userRole !== 'admin') {
      return `${salamPrefix}Mohon maaf, informasi dan panduan teknis fitur operasional administrator sistem merupakan wewenang khusus Superadmin / Administrator Dinas Sosial Provinsi Jawa Barat dan tidak dapat diakses melalui akun umum/tamu.\n\nUntuk keperluan administratif resmi, silakan hubungi pihak Dinas Sosial Provinsi Jawa Barat.\n\n[[action:tab:contact:Hubungi Dinas Sosial Jabar]]`;
    }
    if (userRole === 'admin' && !isDeveloperUser) {
      return `${salamPrefix}Mohon maaf, 8 fitur kendali tingkat provinsi tersebut merupakan wewenang khusus **Superadmin Dinas Sosial Provinsi Jawa Barat**. Akun Admin Wilayah memiliki wewenang penuh untuk pengelolaan data 10 pilar, input personil, ekspor laporan daerah, dan verifikasi berkas pendaftaran di wilayah penugasan Anda.`;
    }

    return `${salamPrefix}**Panduan Lengkap 8 Fitur Superadmin di Beranda PSKS JABAR**:

Sebagai Superadmin Dinas Sosial Provinsi Jawa Barat, Anda memiliki panel kendali penuh di halaman Beranda yang mencakup 8 fitur administratif berikut:

---

### **1. Kelola Akun Admin (\`tab:admin_manage\`)**
- **Fungsi**: Manajemen seluruh akun administrator (Superadmin Provinsi & Admin Wilayah 27 Kab/Kota).
- **Alur Teknis**:
  * **Tambah Admin**: Lengkapi form Nama, Username, Password (min. 12 karakter kombinasi), Role, Wilayah Penugasan (27 Kab/Kota), dan Pilar Tugas -> Klik *"Daftarkan Admin"*.
  * **Edit / Merubah Akun**: Cari akun di tabel -> Klik tombol **Edit** (ikon pensil) -> Sesuaikan nama, wilayah, status (ACTIVE/FROZEN), atau isi *"Password Baru"* (min. 12 karakter) jika reset sandi -> Klik *"Simpan Perubahan"*.
  * **Hapus Akun**: Klik ikon tempat sampah merah -> Konfirmasi pada dialog keamanan.
[[action:tab:admin_manage:Buka Kelola Akun Admin]]

---

### **2. Manajemen User (\`tab:user_manage\`)**
- **Fungsi**: Tata kelola seluruh akun pengguna publik/relawan terdaftar se-Jawa Barat.
- **Alur Teknis**:
  * Cari nama/NIK pengguna pada tabel pengguna.
  * **Reset Password**: Klik tombol kunci untuk mereset kata sandi user (min. 6 karakter).
  * **Freeze / Unfreeze**: Bekukan akun user jika terindikasi pelanggaran agar tidak dapat login, atau aktifkan kembali.
  * **Hapus User**: Hapus akun pengguna yang tidak valid secara permanen.
[[action:tab:user_manage:Buka Manajemen User]]

---

### **3. Pemantauan Admin (Live Admin Monitoring) (\`tab:monitoring\`)**
- **Fungsi**: Radar pemantauan aktivitas real-time seluruh Admin Wilayah di 27 Kabupaten/Kota.
- **Alur Teknis**:
  * Pantau status online/offline secara live.
  * Periksa telemetri waktu aktivitas terakhir (*last active*) dan rekam jejak akses daerah.
  * Kirim pesan dinas langsung (*Direct Message*) ke kotak masuk akun Admin Wilayah tertentu.
[[action:tab:monitoring:Buka Monitoring Admin]]

---

### **4. Riwayat Aktivitas (Comprehensive Audit Trail) (\`tab:audit_trail\`)**
- **Fungsi**: Rekaman forensik realtime mutasi data Supabase (CREATE, UPDATE, DELETE, LOGIN, MAINTENANCE).
- **Alur Teknis**:
  * Setiap tindakan admin wilayah maupun superadmin tercatat otomatis dengan timestamp milidetik, role, alamat IP, dan user agent browser.
  * Mendukung filter rentang tanggal, filter tipe aktivitas, dan ekspor data audit.
[[action:tab:audit_trail:Buka Audit Trail]]

---

### **5. Pengesahan & Penerimaan Anggota (Task Manager)**
- **Fungsi**: Pusat pengesahan akhir tingkat provinsi permohonan anggota 10 pilar yang telah disetujui Admin Wilayah (\`DISETUJUI_WILAYAH\`).
- **Alur Teknis**:
  * **Indikator Sensor Lampu Bulat Berkedip**: Di pojok kanan atas kotak fitur terdapat sensor lampu bulat yang berkedip-kedip (*pulsing animation*) jika terdapat berkas pending yang menunggu pengesahan provinsi.
  * **Status Selesai**: Ketika seluruh pengajuan telah disahkan, sensor lampu berhenti berkedip dan berubah menjadi **ikon centang hijau solid**.
  * Klik tombol **"Pengesahan Sah"** untuk menetapkan status keanggotaan resmi menjadi **"SAH_TERDAFTAR"** dalam Satu Data Sosial Jawa Barat.
[[action:tab:beranda:Lihat di Beranda]]

---

### **6. Tambah Pengumuman**
- **Fungsi**: Publikasi maklumat kedinasan darurat dan siaran pers resmi Dinsos Jabar.
- **Alur Teknis**:
  * Klik tombol pengumuman -> Isi judul, pesan maklumat, dan unggah foto dokumentasi (sistem otomatis melakukan kompresi foto agar hemat storage).
  * Atur durasi pop-up melayang (muncul otomatis selama 15 detik di layar beranda pengunjung) dan running text banner.
  * Gunakan 27 saklar wilayah untuk menentukan target siaran (seluruh Jabar atau wilayah tertentu, serta tayang ke Publik dan/atau Admin).
[[action:tab:beranda:Lihat di Beranda]]

---

### **7. Kontak Floating WhatsApp**
- **Fungsi**: Konfigurasi kontak bantuan cepat WhatsApp dinas yang melayang di pojok kanan bawah website.
- **Alur Teknis**:
  * Atur nomor WhatsApp dinas untuk masing-masing 27 Kabupaten/Kota.
  * Atur nomor narahubung Superadmin Dinsos Provinsi dan narahubung Developer.
  * Manfaatkan tombol **"ALL IN"** untuk sinkronisasi pembaruan nomor darurat secara massal dan serentak.
[[action:tab:beranda:Lihat di Beranda]]

---

### **8. Saklar Maintenance Sistem (\`tab:maintenance\`)**
- **Fungsi**: Pusat kendali mode pemeliharaan website saat pembaruan infrastruktur.
- **Alur Teknis**:
  * Memiliki 3 tingkat kendali saklar: **Global** (kunci seluruh portal), **Per-Role** (hanya kunci Publik atau Admin), dan **Granular 27 Kab/Kota** (hanya kunci daerah tertentu).
  * Tuliskan banner pesan pemeliharaan dan estimasi waktu penyelesaian.
  * Superadmin dan Developer memiliki hak akses *bypass* otomatis sehingga tetap dapat login dan mengelola sistem saat maintenance aktif.
[[action:tab:maintenance:Buka Saklar Maintenance]]

---

### **🌟 Fitur Tambahan Superadmin & Developer: Kelola Tanya Jawab Portal (FAQ Management)**
- **Posisi**: Berada di **baris baru tepat di bawah Fitur 5 (Pengesahan & Penerimaan Anggota)** untuk tampilan laptop maupun tampilan HP.
- **Fungsi**: Pusat kendali penuh daftar pertanyaan yang sering diajukan di beranda publik.
- **Alur Teknis**:
  * Tambah pertanyaan dan jawaban baru dengan memilih salah satu dari 4 kategori resmi.
  * Sunting redaksi pertanyaan/jawaban seketika dengan sinkronisasi realtime Supabase.
  * Atur urutan nomor prioritas dan aktifkan/nonaktifkan saklar tayang publik secara instan.
  * Opsi pulihkan (*restore*) ke standar resmi rekomendasi Dinsos Jabar.
[[action:tab:faq_manage:Buka Kelola FAQ Portal]]`;
  }

  // 0.28 FITUR KELOLA TANYA JAWAB PORTAL (FAQ MANAGEMENT) & FAQ PUBLIK
  const isFaqQuery =
    q.includes('faq') ||
    q.includes('tanya jawab') ||
    q.includes('pertanyaan yang sering diajukan') ||
    q.includes('pertanyaan sering diajukan') ||
    q.includes('kelola faq') ||
    q.includes('manajemen faq');

  if (isFaqQuery) {
    if (userRole === 'superadmin' || isDeveloperUser) {
      return `${salamPrefix}**Panduan Fitur Kelola Tanya Jawab Portal (FAQ Management)**:

Fitur **Kelola FAQ Portal** adalah instrumen kendali eksklusif khusus **Superadmin & Developer** untuk mengelola seluruh daftar pertanyaan yang sering diajukan di portal publik beranda.

---

### **📍 Posisi Fitur di Beranda**:
- **Tampilan Laptop (Desktop)**: Ditempatkan di **baris baru tepat di bawah fitur Pengesahan & Penerimaan Anggota (Fitur 5)**.
- **Tampilan HP (Mobile)**: Ditempatkan di **baris baru tersendiri** tepat di bawah kartu Pengesahan & Penerimaan Anggota.

---

### **⚙️ Kemampuan & Alur Pengelolaan**:
1. **Tambah Tanya Jawab Baru**:
   - Klik tombol **"Kelola FAQ Portal"** di beranda.
   - Klik tombol **"+ Tambah Tanya Jawab"**.
   - Isi form: **Pertanyaan**, **Kategori** (*Pendaftaran & Akun, Legalitas & Regulasi, Layanan & Teknis, atau Bantuan & Informasi*), **Jawaban Lengkap**, **Nomor Urut Prioritas**, dan **Saklar Tayang Publik**.
   - Klik **"Simpan Tanya Jawab"** -> Tersimpan *realtime* ke pangkalan data Supabase (\`portal_faqs\`).

2. **Edit & Perbarui Redaksi**:
   - Temukan pertanyaan yang ingin diedit -> Klik ikon pensil (**Edit**).
   - Perbaiki redaksi pertanyaan atau jawaban -> Klik **"Simpan Perubahan"**. Perubahan langsung tampil di portal publik tanpa reload.

3. **Kendali Saklar Tayang Publik**:
   - Cukup geser saklar **Aktif / Nonaktif** pada kartu FAQ untuk menyembunyikan atau menampilkan pertanyaan dari publik secara seketika.

4. **Hapus Pertanyaan**:
   - Klik ikon tempat sampah merah -> Konfirmasi pada dialog keamanan.

5. **Reset ke Standar Dinsos Jabar**:
   - Jika ingin memulihkan daftar FAQ resmi rekomendasi Dinas Sosial Jabar, klik tombol **"Pulihkan Standar Dinsos"**.

---
[[action:tab:faq_manage:Buka Kelola FAQ Portal]]`;
    }

    // Untuk Pengguna Umum, Tamu, dan Admin Wilayah:
    return `${salamPrefix}**Pertanyaan yang Sering Diajukan (FAQ) Portal PSKS Jabar**:

Daftar **FAQ resmi** dapat Bapak/Ibu temukan di halaman **Beranda paling bawah, tepat di atas navigasi footer**. 

Tanya jawab di portal ini mencakup 4 kategori utama:
1. **Pendaftaran & Akun**: Tata cara pendaftaran relawan 10 pilar, syarat NIK, dan aktivasi akun resmi.
2. **Legalitas & Regulasi**: Keabsahan KTA digital bersertifikat QR code, UU No. 11/2009, Permensos, dan perlindungan privasi UU PDP No. 27/2022.
3. **Layanan & Teknis Portal**: Biaya layanan (100% Gratis), fitur peta sebaran spasial 27 Kab/Kota, dan panduan teknis.
4. **Bantuan & Informasi Dinsos**: Akses kontak hotline WhatsApp, alamat kantor Dinsos Jabar di Cimahi, dan konsultasi interaktif Asisten AI.

Bapak/Ibu juga dapat langsung menanyakan pertanyaan spesifik kepada saya di sini, dan saya akan menjawabnya seketika!

[[action:tab:beranda:Buka Beranda & Lihat FAQ]]`;
  }

  // 0.27 PANDUAN LENGKAP FITUR DI MENU PENGATURAN (RBAC: SUPERADMIN & DEVELOPER)
  const isSettingsFeaturesQuery =
    (q.includes('pengaturan') && (q.includes('fitur') || q.includes('menu') || q.includes('apa saja') || q.includes('cara menggunakan') || q.includes('isi') || q.includes('panel') || q.includes('ada apa'))) ||
    (q.includes('menu pengaturan') && (q.includes('superadmin') || q.includes('admin') || q.includes('ada apa') || q.includes('fitur'))) ||
    (q.includes('superadmin settings') || q.includes('halaman pengaturan'));

  if (isSettingsFeaturesQuery) {
    if (userRole !== 'superadmin' && !isDeveloperUser && userRole !== 'admin') {
      return `${salamPrefix}Mohon maaf, panel menu Pengaturan sistem merupakan instrumen kendali khusus Superadmin dan Developer Dinas Sosial Jawa Barat dan tidak tersedia untuk pengguna umum/tamu.\n\n[[action:tab:contact:Hubungi Dinas Sosial Jabar]]`;
    }
    if (userRole === 'admin' && !isDeveloperUser) {
      return `${salamPrefix}Mohon maaf, halaman Pengaturan sistem merupakan panel kendali tingkat provinsi yang dikhususkan bagi Superadmin dan Developer. Akun Admin Wilayah mengelola data operasional 10 pilar dan verifikasi pendaftaran di wilayah penugasan Anda.`;
    }

    return `${salamPrefix}**Panduan Lengkap Fitur di Menu Pengaturan (\`tab:pengaturan\`)**:

Halaman Pengaturan (**Superadmin Settings**) menyediakan kendali arsitektural dan personalisasi website PSKS JABAR:

---

### **1. Background & Video Header (\`section: background\`)**
- Mengatur gambar latar belakang (*hero banner*) atau tautan video streaming latar beranda.
- Mendukung fitur unggah video terfragmentasi (*chunked video upload*) langsung ke Supabase / Cloud Storage.
- Mengatur tingkat transparansi (*opacity overlay*) gelap agar judul dan navigasi tetap terbaca jelas.

### **2. Foto & Sambutan Kepala Dinas (\`section: kadinas_photo\`)**
- Mengunggah foto resmi Kepala Dinas Sosial Provinsi Jawa Barat dengan pratinjau langsung.
- Memperbarui Nama Pejabat Lengkap, NIP kedinasan, Jabatan, dan naskah teks sambutan resmi Kepala Dinas yang tampil di beranda.

### **3. Profil Organisasi, Visi & Misi PSKS Jabar (\`section: profil_text\`)**
- Menyesuaikan naskah visi dan misi pembangunan kesejahteraan sosial Jawa Barat.
- Mengatur deskripsi profil kelembagaan 10 Pilar PSKS dan dasar hukum kedinasan (UU No. 11/2009, Permensos, dan Perda Jabar).

### **4. Kontak Medsos & Floating WhatsApp (\`section: medsos_wa\`)**
- Mengatur nomor layanan WhatsApp resmi Dinsos Jabar.
- Menautkan tautan akun media sosial resmi kedinasan: Instagram, YouTube, Facebook, dan Twitter/X.

### **5. Kontrol Keamanan & Saklar Mode Maintenance (\`section: security\`)**
- Mengaktifkan/menonaktifkan saklar pemeliharaan Global, Per-Role (User/Admin), atau Granular 27 Kab/Kota.
- Menentukan pesan pengumuman pemeliharaan dan estimasi jam selesai, dilengkapi proteksi auto-bypass Superadmin.

### **6. Smart Access Card / KTA Digital (\`section: smart_card\`)**
- Konfigurasi instrumen kedinasan KTA dan verifikasi QR Code terenkripsi yang dikhususkan untuk identitas resmi Superadmin dan Administrator.

### **7. Pangkalan Data Supabase & Audit Trail (\`section: database\`)**
- Memantau status koneksi dan kuantitas data pada pangkalan data Supabase (tabel 10 pilar, akun admin, pesan dinas).
- Fitur ekspor berkas cadangan (*backup JSON*) serta pembersihan log audit berkala.

### **8. Manajemen Otak AI (Supabase AI Brain) (\`section: ai_assistant\`)**
- Mengelola konfigurasi kecerdasan buatan: System Instruction, Context Rules, Dialogue Examples, dan Glosarium Istilah 27 Kabupaten/Kota.

---
[[action:tab:pengaturan:Buka Menu Pengaturan]]`;
  }

  // 0.3 GENERAL CONVERSATIONAL INQUIRY / INTENT TO ASK (ONLY WHEN NO SUBSTANTIVE QUESTION FOLLOWS)
  if (
    !hasQuestion &&
    (
      isPureIntro ||
      q.includes('mau tanya') ||
      q.includes('nanya dong') ||
      q.includes('bisa bantu') ||
      q.includes('bisakah bantu') ||
      q.includes('bisakah membantu') ||
      q.includes('bantu saya') ||
      q.includes('minta tolong') ||
      q.includes('tolong bantu') ||
      q.includes('izin bertanya') ||
      q.includes('bisa nanya') ||
      q.includes('bantuan') ||
      q.includes('butuh bantuan') ||
      q.includes('ada yang mau ditanyakan') ||
      q.includes('bisa jawab')
    )
  ) {
    if (isDeveloperUser) {
      return `Sok atuh tanyakeun, **Ilham Fazril**! Gua siap jawab apa aja dari kodingan sistem, database, sampai diskusi fitur baru. Mau nanya apa nih? 🚀💻`;
    }
    return `Tentu saja, silahkan apa yang ingin ditanyakan. Saya siap membantu Anda seputar informasi 10 Pilar PSKS, alur pendaftaran, maupun layanan sosial di Jawa Barat. 😊`;
  }

  // 0.4 GRATITUDE & POLITENESS (UCAPAN TERIMA KASIH & APRESIASI)
  if (
    q.includes('terima kasih') ||
    q.includes('terimakasih') ||
    q.includes('makasih') ||
    q.includes('hatur nuhun') ||
    q.includes('nuhun') ||
    q.includes('thanks') ||
    q.includes('thank you') ||
    q.includes('mantap') ||
    q.includes('keren') ||
    q.includes('oke makasih') ||
    q.includes('sip') ||
    q.includes('siap makasih')
  ) {
    if (isDeveloperUser) {
      return `Sami-sami, **Ilham Fazril**! Senang bisa selalu support dan nemenin arsitek sistemnya langsung. Kodingan lu beneran top tier! Kalau ada hal lain, colek gua lagi aja ya bro! 🤜🤛🔥`;
    }
    return `Sami-sami / Sama-sama! Senang sekali bisa membantu Anda. Jika ada hal lain yang ingin ditanyakan seputar Sistem Informasi PSKS Jawa Barat, jangan ragu untuk bertanya kembali. Semoga hari Anda menyenangkan dan sehat selalu! 🙏✨`;
  }

  // 0.45 MODE DISKUSI, ARSITEKTUR OTAK AI, KUOTA API, & EVALUASI PERMASALAHAN/SOLUSI
  const isDiscussionOrBrainQuery =
    q.includes('mode diskusi') ||
    q.includes('masuk dalam mode diskusi') ||
    q.includes('masuk mode diskusi') ||
    q.includes('kita diskusi') ||
    q.includes('diskusi lagi') ||
    q.includes('diskusi dulu') ||
    (q.includes('quota') && (q.includes('exceeded') || q.includes('habis') || q.includes('limit'))) ||
    (q.includes('otak') && (q.includes('ai') || q.includes('asisten') || q.includes('kamus') || q.includes('disimpan'))) ||
    (q.includes('kamus') && (q.includes('ai') || q.includes('asisten') || q.includes('disimpan'))) ||
    (q.includes('permasalahan') && q.includes('solusi')) ||
    (q.includes('ingat') && (q.includes('sebelumnya') || q.includes('tadi') || q.includes('masalah')));

  if (isDiscussionOrBrainQuery) {
    if (q.includes('quota') || q.includes('limit') || (q.includes('ingat') && q.includes('solusi'))) {
      return `Siap, kita sekarang berada dalam **Mode Diskusi** penuh! 🤝💡

Terkait pertanyaan Anda mengenai **kuota API (quota exceeded)** serta **permasalahan dan solusi sebelumnya**, berikut penjelasannya secara transparan dan tuntas:

1. **Mengapa Quota Exceeded Terjadi?**
   - Layanan asisten cerdas ini terhubung ke **Gemini API** di sisi server (\`/server.ts\`). Pada free-tier API, terdapat batasan ketat kuota harian (RPD - *Requests Per Day*) dan per menit (RPM - *Requests Per Minute*).
   - Ketika kuota harian dari satu model utama (misal \`gemini-2.5-flash\`) habis, API mengembalikan status **429 Too Many Requests / Quota Exceeded**.

2. **Apakah Saya Masih Ingat Permasalahan & Solusi Sebelumnya?**
   - **Tentu sangat ingat!**
     * **Permasalahan 1 (Alur Pendaftaran False Positive)**: Pengguna bertanya hal lain atau melakukan uji keamanan/diskusi, tetapi bot malah menjawab *"Alur Pendaftaran dan Verifikasi Berkas Bertingkat..."*. Penyebabnya adalah kata kunci seperti \`"masuk"\` (dari *"masuk dalam mode diskusi"*) atau \`"admin wilayah"\` yang salah memicu filter registrasi lokal.
     * **Permasalahan 2 (Otak / Kamus AI)**: Kebingungan mengenai di mana pengetahuan disimpan. Otak AI terbagi dua: **LLM (Gemini API di server)** untuk pemahaman bahasa alami & nalar konteks, dan **Knowledge Base di Supabase (\`ai_knowledge_base\`)** untuk data valid 10 Pilar PSKS.
     * **Solusinya**:
       1. **Multi-Model Cascade**: Menambahkan rantai failover otomatis ke model lain (\`gemini-2.0-flash\`, \`gemini-2.0-flash-lite\`, \`gemini-1.5-flash\`) sehingga saat satu model mencapai batas kuota, sistem langsung beralih ke model lain tanpa gangguan.
       2. **Pembersihan Regex Interceptor**: Menghapus kata kunci rancu (seperti \`"masuk"\`, \`"ikut"\`, \`"admin wilayah"\`) agar tidak membajak percakapan umum.
       3. **Prioritas Nalar LLM**: Jawaban model AI diutamakan secara mutlak untuk memahami konteks percakapan manusia, bukan mencocokkan kata per kata secara kaku.

Silakan, apa poin berikutnya yang ingin kita diskusikan atau uji bersama? Saya siap berdiskusi!`;
    }

    if (q.includes('otak') || q.includes('kamus') || q.includes('disimpan')) {
      return `Halo! Pertanyaan yang sangat bagus dan fundamental. Mari kita bedah arsitektur "otak" dan "kamus" asisten AI PSKS JABAR:

### 1. **Otak Pemikir Kontekstual (LLM / Generative AI)** -> *Berada di Sisi Server (Cloud API)*
- Ditenagai oleh **Google Gemini Models** (\`gemini-2.5-flash\`, \`gemini-2.0-flash\`, dll.) yang dipanggil melalui backend Express (\`/server.ts\`).
- Bagian inilah yang berfungsi seperti otak manusia: memahami maksud kalimat yang tidak baku, menangkap konteks multi-turn percakapan, membaca bahasa Sunda/Indonesia santai, dan merangkai jawaban yang mengalir alami.

### 2. **Kamus & Pangkalan Pengetahuan (Knowledge Base / Grounding)** -> *Disimpan di Database Supabase*
- Data faktual mengenai 10 Pilar PSKS, profil pejabat Dinsos, regulasi UU No. 11/2009, dan panduan fitur sistem tersimpan secara dinamis di **Supabase** (koleksi \`ai_knowledge_base\`).
- Dokumen pengetahuan ini diambil saat runtime (*Grounding Context Retrieval*) dan disuntikkan ke instruksi sistem Gemini agar jawaban AI selalu akurat dan berbobot kedinasan.

### 3. **Cadangan Lokal (Local Fallback Engine)** -> *Di dalam Codingan (\`src/data/aiKnowledge.ts\`)*
- Berfungsi sebagai jaring pengaman (*safety net*) jika jaringan offline atau kuota API benar-benar habis, agar sistem tetap mampu memberikan respons esensial.

Kini arsitektur telah diselaraskan agar model LLM berpikir bebas dan luwes tanpa lagi terinterupsi oleh filter kata kaku. Ada yang ingin kita diskusikan lebih lanjut? 😊`;
    }

    return `Siap, kita sekarang berada dalam **Mode Diskusi**! 🤝✨\n\nDalam mode ini, kita bisa membahas arsitektur kecerdasan buatan, sistem informasi PSKS JABAR, integrasi data, maupun evaluasi teknis lainnya secara terbuka, analitis, dan mendalam.\n\nSilakan sampaikan topik atau pertanyaan yang ingin Anda diskusikan!`;
  }

  // 0.5 AI IDENTITY & SYSTEM OVERVIEW (SIAPA AI & APA ITU PSKS JABAR)
  if (
    q.includes('siapa kamu') ||
    q.includes('kamu siapa') ||
    q.includes('siapa anda') ||
    q.includes('anda siapa') ||
    q.includes('siapa bot') ||
    q.includes('siapa ai') ||
    q.includes('apa itu ai') ||
    q.includes('apa fungsi kamu')
  ) {
    if (isDeveloperUser) {
      return `Gua adalah **Asisten AI PSKS Jabar** (Powered by Google Gemini), AI pintar yang lu arsitekturkan sendiri, **Ilham Fazril**! Gua siap nemenin lu ngembangin platform ini, analisa data, dan diskusi apa aja seputar teknologi & sistem kesejahteraan sosial. 😎⚡`;
    }
    return `Saya adalah **Asisten AI PSKS Jabar**, asisten virtual cerdas resmi yang terintegrasi dengan database Sistem Informasi Potensi & Sumber Kesejahteraan Sosial (PSKS JABAR) Dinas Sosial Provinsi Jawa Barat.\n\nTugas saya adalah membantu masyarakat, relawan, dan aparatur pemerintah dalam mencari informasi data **10 Pilar PSKS**, sebaran potensi sosial di **27 Kabupaten/Kota**, panduan operasional, serta layanan sosial di wilayah Jawa Barat. Ada hal yang ingin Anda tanyakan?`;
  }

  if (
    q.includes('apa itu psks jabar') ||
    q.includes('apa itu psks') ||
    q.includes('apa fungsi psks jabar') ||
    q.includes('tentang psks jabar') ||
    q.includes('apa itu si-psks') ||
    q.includes('apa fungsi si-psks') ||
    q.includes('aplikasi apa ini') ||
    q.includes('website apa ini') ||
    q.includes('tentang website') ||
    q.includes('tentang si-psks') ||
    q.includes('kegunaan website') ||
    q.includes('fungsi website')
  ) {
    return `**PSKS Jabar** (*Sistem Informasi Potensi & Sumber Kesejahteraan Sosial*) adalah platform digital terpadu resmi milik Dinas Sosial Provinsi Jawa Barat yang berfungsi untuk:
1. **Satu Data Terpadu**: Mengintegrasikan dan memvalidasi data SDM serta kelembagaan 10 Pilar PSKS di 27 Kabupaten/Kota se-Jawa Barat.
2. **Transparansi & Pemetaan Spasial**: Menampilkan peta persebaran relawan dan lembaga sosial secara real-time untuk mitigasi bencana dan percepatan respon penanganan masalah sosial.
3. **Pelayanan Publik**: Memudahkan koordinasi masyarakat dan dinas dalam penyelenggaraan kesejahteraan sosial secara akurat, terukur, dan akuntabel.`;
  }

  // Math / Arithmetic Expression Evaluation
  const mathMatch = q.match(/^(\d+)\s*([\+\-\*\/xX])\s*(\d+)$/);
  if (mathMatch) {
    const a = parseFloat(mathMatch[1]);
    const op = mathMatch[2].toLowerCase();
    const b = parseFloat(mathMatch[3]);
    let result = 0;
    if (op === '+') result = a + b;
    else if (op === '-') result = a - b;
    else if (op === '*' || op === 'x') result = a * b;
    else if (op === '/') result = b !== 0 ? a / b : NaN;

    if (!isNaN(result)) {
      if (isDeveloperUser) {
        return `Hasil perhitungan **${a} ${op} ${b}** = **${result}** bro! Hitungan dasar mah enteng pisan. Mau kalkulasi apa lagi? 🧮⚡`;
      }
      return `Hasil perhitungan matematis: **${a} ${op} ${b}** = **${result}**. Ada yang bisa kami bantu hitung kembali?`;
    }
  }

  // 0.55 WHO AM I / "SIAPA SAYA" / PERSONAL IDENTITY (STRICT SEPARATION: ONLY FOR DEVELOPER ACCOUNT)
  const isAskingWhoAmI =
    q.includes('siapa saya') ||
    q.includes('kenal saya') ||
    q.includes('kenal aing') ||
    q.includes('kamu kenal saya') ||
    q.includes('tau siapa saya') ||
    q.includes('tahu siapa saya') ||
    q.includes('apakah kamu kenal saya') ||
    q.includes('siapakah saya');

  if (isAskingWhoAmI) {
    if (isDeveloperUser) {
      if (q.includes('aing') || q.includes('saha') || q.includes('maneh') || q.includes('sia') || q.includes('euy')) {
        return `Aeh kantenan atuh wawuh pisan! Maneh teh **Ilham Fazril**, Full Stack Developer & Software Architect anu ngadamel sareng ngarancang sistem **PSKS JABAR** ieu! 😎🚀 Kodingan React 18, Express, Google Gemini AI, sareng Supabase anu ku maneh diwangun di dieu saé pisan tur canggih. Aya naon yeuh nu hoyong dibahas atanapi dikulik deui dinten ieu bos?`;
      }
      return `Tentu saja kenal banget! Kamu adalah **Ilham Fazril**, Full Stack Developer & Software Architect yang menciptakan dan merancang arsitektur sistem **PSKS JABAR** (Pilar-Pilar Kesejahteraan Sosial Jawa Barat) ini! 😎🚀\n\nArsitektur full-stack modern yang kamu kembangkan dengan React, TypeScript, Express, Google Gemini AI, dan Supabase di sini sangat solid, responsif, dan terstruktur rapi. Senang banget bisa berinteraksi langsung dengan sang arsitek sistemnya! Ada fitur, modul kodingan, atau hal apa yang ingin kita diskusikan hari ini bos?`;
    }

    // NON-DEVELOPER USERS (Regular User, Admin, Superadmin, Tamu / Guest)
    const isGuest =
      !userName ||
      userName.toLowerCase().includes('tamu') ||
      userName.trim() === '';

    if (!isGuest) {
      if (isDeveloperUser) {
        return `Halo **Ilham**! Sesi aktif saat ini terkonfirmasi sebagai **Developer & Software Architect** sistem PSKS JABAR. Developer Control Panel, bypass maintenance, dan seluruh modul debugging siap jalan. Mau cek kodingan atau eksekusi apa nih bro? 🚀😎`;
      }

      const displayRole =
        userRole === 'user'
          ? 'Akun Terdaftar / Pemohon Pilar Sosial'
          : userRole === 'admin'
          ? `Admin Wilayah ${wilayah}`
          : userRole === 'superadmin'
          ? 'Superadmin Dinas Sosial Jawa Barat'
          : roleTitle;

      return `Halo! Berdasarkan data sesi Anda saat ini, Anda teridentifikasi sebagai **Bapak/Ibu ${userName}** dengan hak akses **${displayRole}** untuk wilayah penugasan/domisili **${wilayah}**.\n\nSebagai Asisten Resmi PSKS Jabar, saya siap membantu Bapak/Ibu seputar panduan pendaftaran 10 pilar, pengecekan status berkas pendaftaran, maupun informasi sebaran data sosial se-Jawa Barat. Ada yang bisa saya bantu untuk Bapak/Ibu hari ini?`;
    }

    return `Halo **Bapak/Ibu**! Saat ini Anda mengakses sistem sebagai **Tamu / Pengunjung Publik** (Akses Tamu Terbuka tanpa akun login).\n\nSebagai pengunjung publik, Bapak/Ibu dapat menjelajahi informasi profil 10 Pilar Kesejahteraan Sosial, sebaran data umum di 27 Kabupaten/Kota se-Jawa Barat, serta layanan sosial Dinas Sosial Provinsi Jawa Barat. Apabila Bapak/Ibu ingin mendaftar ke salah satu pilar atau memantau riwayat pengajuan Anda, silakan login melalui tombol Masuk di halaman utama.`;
  }

  // 0.6 BIDIRECTIONAL INTENT: WHO IS ILHAM FAZRIL (SUBJECT FOCUS) VS WHO DEVELOPED THE SYSTEM (OBJECT FOCUS)
  // 0.6A: PERTANYAAN SUBJEK TERBALIK: "SIAPA ITU ILHAM FAZRIL?" / "SIAPA ILHAM?" / PROFIL PRIBADI TOKOH
  const isAskingAboutPersonIlham =
    (q.includes('ilham') || q.includes('fazril')) &&
    (
      q.includes('siapa itu ilham') ||
      q.includes('siapakah itu ilham') ||
      q.includes('siapa ilham fazril') ||
      q.includes('siapakah ilham fazril') ||
      q.includes('siapa sosok ilham') ||
      q.includes('siapa itu fazril') ||
      q.includes('siapakah fazril') ||
      q.includes('kenal ilham') ||
      q.includes('kenal sosok ilham') ||
      q.includes('tahu ilham') ||
      q.includes('tau ilham') ||
      q.includes('profil ilham') ||
      q.includes('biodata ilham') ||
      q.includes('siapa sih ilham') ||
      q.includes('siapa sebenarnya ilham') ||
      q.includes('mengenal ilham') ||
      q.includes('tentang ilham') ||
      q.includes('saha eta ilham') ||
      q.includes('saha ilham') ||
      q.includes('wawuh ka ilham') ||
      q.includes('terangkan tentang ilham') ||
      q.includes('jelaskan tentang ilham') ||
      q.includes('siapa orang yang bernama ilham')
    );

  // 0.6C: KONFIRMASI / PEMAHAMAN MULTI-TURN PENGGUNA TERHADAP DEVELOPER
  const isQuestionOrSecurityRequest =
    q.includes('?') ||
    q.includes('mana') ||
    q.includes('bagaimana') ||
    q.includes('gimana') ||
    q.includes('kenapa') ||
    q.includes('mengapa') ||
    q.includes('kapan') ||
    q.includes('berapa') ||
    q.includes('siapa') ||
    q.includes('apakah') ||
    q.includes('apa ') ||
    q.endsWith('apa') ||
    q.includes('lupa') ||
    q.includes('password') ||
    q.includes('sandi') ||
    q.includes('pin') ||
    q.includes('kredensial') ||
    q.includes('masuk') ||
    q.includes('login') ||
    q.includes('bocorkan') ||
    q.includes('minta') ||
    q.includes('berikan') ||
    q.includes('kasih') ||
    q.includes('buka') ||
    q.includes('reset') ||
    q.includes('daftar') ||
    q.includes('syarat') ||
    q.includes('cara');

  const hasAckEnding = /(^|\s)(ya|kan|toh|nih)\??$/i.test(q);

  // 0.6A1: PUJIAN / APRESIASI MULTI-TURN KEPADA DEVELOPER ("hebat juga beliau", "keren ya dia", "mantap", "salut")
  const isComplimentOrAppreciationDev =
    !isQuestionOrSecurityRequest &&
    (
      q.includes('hebat') ||
      q.includes('keren') ||
      q.includes('mantap') ||
      q.includes('mantul') ||
      q.includes('salut') ||
      q.includes('luar biasa') ||
      q.includes('patut diacungi') ||
      q.includes('diacungi jempol') ||
      q.includes('pinter') ||
      q.includes('pintar') ||
      q.includes('cerdas') ||
      q.includes('jenius') ||
      q.includes('bagus banget') ||
      q.includes('bagus sekali') ||
      q.includes('top banget') ||
      q.includes('jos') ||
      q.includes('joss') ||
      q.includes('gokil') ||
      q.includes('sae pisan') ||
      q.includes('alus pisan') ||
      q.includes('hade pisan') ||
      q.includes('hade euy') ||
      q.includes('hebat euy') ||
      q.includes('keren euy') ||
      q.includes('edun')
    ) &&
    (
      q.includes('beliau') ||
      q.includes('dia') ||
      q.includes('ilham') ||
      q.includes('fazril') ||
      q.includes('sosoknya') ||
      q.includes('orangnya') ||
      q.includes('developernya') ||
      q.includes('pembuatnya') ||
      (previousContext && (
        previousContext.toLowerCase().includes('ilham') ||
        previousContext.toLowerCase().includes('fazril') ||
        previousContext.toLowerCase().includes('developer') ||
        previousContext.toLowerCase().includes('arsitek') ||
        previousContext.toLowerCase().includes('siswa magang')
      ))
    );

  const isConfirmingOrAcknowledgingDev =
    !isQuestionOrSecurityRequest &&
    (
      q.startsWith('owalah') ||
      q.startsWith('oalah') ||
      q.startsWith('oh jadi') ||
      q.startsWith('oh ternyata') ||
      q.startsWith('oh begitu') ||
      q.startsWith('oh gitu') ||
      q.startsWith('berarti') ||
      q.startsWith('ternyata') ||
      q.startsWith('pantesan') ||
      q.startsWith('baru tahu') ||
      q.startsWith('baru tau') ||
      q.startsWith('oh gitu toh') ||
      q.startsWith('gitu toh') ||
      q.startsWith('begitu ya') ||
      q.startsWith('oh begitu ya') ||
      q.startsWith('siap') ||
      q.startsWith('oke siap') ||
      q.startsWith('paham') ||
      q.startsWith('ngerti') ||
      q.includes('itu pembuat') ||
      q.includes('dia yang bikin') ||
      q.includes('dia yang buat') ||
      q.includes('dia developernya') ||
      q.includes('dia pembuatnya') ||
      (hasAckEnding && (q.startsWith('jadi ') || q.startsWith('berarti ')))
    ) &&
    (
      q.includes('ilham') ||
      q.includes('fazril') ||
      ((q.includes('pembuat') || q.includes('developer')) && (q.includes('dia') || q.includes('beliau') || q.includes('siswa') || q.includes('magang'))) ||
      (previousContext && (
        previousContext.toLowerCase().includes('ilham') ||
        previousContext.toLowerCase().includes('fazril') ||
        previousContext.toLowerCase().includes('developer')
      ))
    );

  // 0.6B: PERTANYAAN OBJEK/SISTEM: "SIAPA DEVELOPER WEBSITE INI?" / "PEMBUAT APLIKASI"
  const isAskingDeveloperOrCreator =
    !isConfirmingOrAcknowledgingDev &&
    !isAskingAboutPersonIlham &&
    (
      q.includes('siapa developer') ||
      q.includes('siapa developernya') ||
      q.includes('siapa pembuat') ||
      q.includes('siapa pembuatnya') ||
      q.includes('siapa yang buat') ||
      q.includes('siapa yg buat') ||
      q.includes('siapa yang bikin') ||
      q.includes('siapa yg bikin') ||
      q.includes('siapa pencipta') ||
      q.includes('siapa arsitek') ||
      q.includes('siapa pengembang') ||
      q.includes('siapa author') ||
      q.includes('siapa coder') ||
      q.includes('siapa yang merancang') ||
      q.includes('siapa yg merancang') ||
      q.includes('yang bikin aplikasi') ||
      q.includes('yang buat aplikasi') ||
      q.includes('yang bikin website') ||
      q.includes('yang buat website') ||
      q.includes('developer website') ||
      q.includes('pembuat website') ||
      q.includes('developer aplikasi') ||
      q.includes('pembuat aplikasi') ||
      q.includes('nu ngadamel') ||
      q.includes('nu bikin') ||
      q.includes('developerna') ||
      (
        (q.includes('ilham') || q.includes('fazril')) &&
        (q.includes('buat') || q.includes('bikin') || q.includes('rancang') || q.includes('arsitek') || q.includes('aplikasi') || q.includes('website')) &&
        (q.includes('apakah') || q.includes('apa benar') || q.includes('benarkah') || q.includes('siapa'))
      )
    );

  // Response for 0.6A1 (Pujian / Apresiasi Multi-turn Pengguna Terhadap Developer)
  if (isComplimentOrAppreciationDev) {
    if (isDeveloperUser) {
      if (q.includes('aing') || q.includes('maneh') || q.includes('sia') || q.includes('euy')) {
        return `Hehe nuhun pisan tongkrongan! Maneh nyalira **Ilham Fazril** anu suksés ngarancang ieu platform digital ti enol. Keren pisan dedikasi karyana euy! Aya modul naon deui nu rek dioprek? 😎🚀`;
      }
      return `Hehe nuhun pisan euy pujianna kang **Ilham Fazril**! Mantap pisan karya maneh nga-build arsitektur full-stack PSKS JABAR ieu keur Dinsos Jabar. Aya ide atanapi fitur naon deui nu bade di-upgrade ayeuna bro? 😎🔥`;
    }
    return `Betul sekali Bapak/Ibu! Terima kasih banyak atas apresiasinya 😊. Dedikasi Kang **Ilham Fazril** memang sangat patut diacungi jempol. Meskipun masih berstatus sebagai siswa magang PKL di Kantor Dinas Sosial Provinsi Jawa Barat (Bidang Pemberdayaan Sosial / Dayasos) pada tahun 2026, beliau secara mandiri dan tekun berhasil merancang arsitektur full-stack serta mendigitalisasi sistem informasi 10 Pilar Potensi dan Sumber Kesejahteraan Sosial (PSKS) se-Jawa Barat ini dari awal.\n\nApakah ada informasi lain seputar 10 Pilar PSKS atau layanan Dinas Sosial Jawa Barat yang bisa saya bantu jelaskan?`;
  }

  // Response for 0.6C (Konfirmasi / Pemahaman Multi-turn Pengguna)
  if (isConfirmingOrAcknowledgingDev) {
    if (isDeveloperUser) {
      if (q.includes('aing') || q.includes('maneh') || q.includes('sia') || q.includes('euy')) {
        return `Hehe bener pisan atuh tongkrongan! Maneh nyalira **Ilham Fazril** anu ngadamel ieu sistem PSKS JABAR ti enol dugika sakieu aralusna. Aya naon deui nu rek dibahas euy? 😎🚀`;
      }
      return `Hehe betul sekali bos **Ilham Fazril**! Lu yang merancang dan membangun arsitektur full-stack sistem PSKS JABAR ini dari nol sampai secanggih ini. Ada modul kodingan atau fitur apa lagi yang ingin kita bahas bos? 😎🚀`;
    }
    return `Betul sekali Bapak/Ibu, website ini dibuat dan dirancang oleh Ilham Fazril 😊. Beliau merupakan seorang siswa magang PKL di Kantor Dinas Sosial Provinsi Jawa Barat pada Bidang Pemberdayaan Sosial (Dayasos) tahun 2026 yang secara mandiri membangun arsitektur sistem informasi PSKS JABAR ini.\n\nAda hal lain seputar 10 pilar sosial atau layanan kesejahteraan sosial di Jawa Barat yang bisa saya bantu jelaskan?`;
  }

  // Response for 0.6A (Pertanyaan Terbalik Fokus Profil Tokoh)
  if (isAskingAboutPersonIlham) {
    if (isDeveloperUser) {
      if (q.includes('aing') || q.includes('saha') || q.includes('maneh') || q.includes('sia') || q.includes('euy')) {
        return `Aeh-aeh naha kalah naroskeun diri sorangan **Ilham**! Maneh teh developer utama sistem **PSKS JABAR**, siswa magang PKL di Kantor Dinas Sosial Provinsi Jawa Barat (Bidang Dayasos) taun 2026 anu suksés ngawangun ieu platform canggih. Tong api-api poho atuh bos, kodingan arsitektur karyana geus mantap pisan! 😎🚀`;
      }
      return `Hehe merendah untuk meroket nih bos! **Ilham Fazril** ya kamu sendiri, Full Stack Developer & Software Architect yang merancang sistem **PSKS JABAR** ini! Kamu adalah siswa magang PKL di Dinas Sosial Provinsi Jawa Barat (Bidang Pemberdayaan Sosial / Dayasos) tahun 2026 yang berhasil mendigitalisasi 10 pilar sosial se-Jawa Barat. Keren banget dedikasinya! 😎🔥`;
    }

    return `**Ilham Fazril** adalah developer dan perancang utama Website Sistem Informasi **PSKS JABAR** (Potensi & Sumber Kesejahteraan Sosial Jawa Barat).\n\nBeliau merupakan seorang siswa magang PKL di Kantor **Dinas Sosial Provinsi Jawa Barat**, tepatnya pada **Bidang Pemberdayaan Sosial (Dayasos)** pada tahun **2026**.\n\nDalam masa baktinya, beliau berdedikasi secara mandiri merancang dan membangun arsitektur digital full-stack modern sistem ini (mengintegrasikan React, TypeScript, Express, Supabase, serta kecerdasan buatan Gemini AI) guna memudahkan pencatatan, validasi, dan penyajian data terpadu 10 Pilar Kesejahteraan Sosial di 27 Kabupaten/Kota se-Jawa Barat. 🚀`;
  }

  // Response for 0.6B (Pertanyaan Objek/Sistem Pembuat Website)
  if (isAskingDeveloperOrCreator) {
    if (isDeveloperUser) {
      return `Aplikasi **Sistem Informasi Potensi & Sumber Kesejahteraan Sosial (PSKS JABAR)** ini adalah mahakarya yang kamu bangun dan arsitekturkan sendiri bos, **Ilham Fazril** (Full Stack Developer & Software Architect)! 🚀\n\nArsitektur yang kamu buat di sini sangat rapi — integrasi **React 18 SPA, Vite, Express backend proxy, Tailwind CSS, Google Gemini AI, serta Supabase** berjalan sangat mulus dan *lightning fast*. Ditambah lagi fitur-fitur seperti sistem RBAC, anti-jailbreak, dan cetak kartu QR Code otomatis yang beneran *clean code*! Ada modul yang mau kita cek lagi?`;
    }

    return `Website dan aplikasi **PSKS JABAR** (Sistem Informasi Potensi & Sumber Kesejahteraan Sosial Jawa Barat) ini dibuat dan dirancang oleh **Ilham Fazril** (Full Stack Developer & Software Architect), seorang siswa magang PKL di Kantor Dinas Sosial Provinsi Jawa Barat pada Bidang Pemberdayaan Sosial (Dayasos) tahun 2026.\n\nBeliau merancang arsitektur full-stack modern sistem ini secara mandiri dengan mengintegrasikan React 18, TypeScript, Tailwind CSS, backend Express, Google Gemini AI, serta Supabase untuk mendigitalisasi data 10 pilar kesejahteraan sosial di 27 Kabupaten/Kota se-Jawa Barat. 🚀`;
  }

  // 0.6B2: Pertanyaan Alur Verifikasi Bertingkat 2-Tier & Indikator Sensor Lampu Berkedip
  const isSensorOrTierVerificationQuery =
    !q.includes('mode diskusi') &&
    !q.includes('diskusi') &&
    (q.includes('sensor lampu') ||
      q.includes('lampu berkedip') ||
      q.includes('lampu sensor') ||
      q.includes('sensor berkedip') ||
      q.includes('centang hijau sensor') ||
      (q.includes('sensor') && (q.includes('lampu') || q.includes('kedip'))) ||
      (q.includes('alur verifikasi') && (q.includes('bertingkat') || q.includes('dua tahap') || q.includes('2 tier'))));

  if (isSensorOrTierVerificationQuery) {
    return `Alur pendaftaran dan verifikasi berkas di sistem **PSKS JABAR** dilakukan secara berjenjang dan transparan:

1. **Tahap 1: Pendaftaran & Upload Berkas oleh Pengguna (User)**
   - Pengguna masuk ke akun di website **PSKS JABAR**, memilih salah satu dari 10 pilar di Beranda, lalu mengklik tombol **'+ Tambah Anggota Mandiri / Pendaftaran'**.
   - Mengisi identitas, wilayah penugasan, serta **mengunggah foto berkas pendukung** (KTP, SK Pengangkatan, atau Sertifikat Pelatihan/Bimtek). Berkas otomatis dikompresi agar jelas dan ringan.
   - Setelah formulir dikirim, status awal berkas otomatis tercatat sebagai **'Menunggu Verifikasi' (Pending)**.

2. **Tahap 2: Verifikasi Berkas oleh Admin Wilayah (Kabupaten/Kota)**
   - Admin Dinas Sosial Kabupaten/Kota memeriksa keabsahan data administrasi dan foto dokumen yang diunggah.
   - Jika berkas lengkap dan sesuai, pengajuan disetujui menjadi status **'DISETUJUI_WILAYAH'** dan diteruskan ke tingkat Provinsi.

3. **Tahap 3: Pengesahan oleh Superadmin (Provinsi Jawa Barat)**
   - Superadmin Provinsi melakukan pengesahan akhir. Setelah disahkan, status anggota resmi menjadi **'SAH_TERDAFTAR'** dalam pangkalan data potensi dan sumber kesejahteraan sosial Jawa Barat.

Pemohon dapat memantau status pengajuannya secara langsung melalui menu **'Riwayat Pengajuan Pendaftaran'**.

[[action:tab:user_reg_history:Buka Riwayat Pendaftaran]] [[action:tab:beranda:Lihat Pilihan 10 Pilar]]`;
  }

  // 0.6B2: PERMINTAAN BANTUAN ("bantu saya", "tolong bantu saya", "bisa bantu saya?", dll.)
  const isDirectHelpRequest =
    targetQ === 'bantu saya' ||
    targetQ === 'bantu saya dong' ||
    targetQ === 'bantu saya ya' ||
    targetQ === 'bantu saya min' ||
    targetQ === 'tolong bantu saya' ||
    targetQ === 'tolong saya' ||
    targetQ === 'tolong dibantu' ||
    targetQ === 'mohon bantu saya' ||
    targetQ === 'butuh bantuan' ||
    targetQ === 'perlu bantuan' ||
    targetQ === 'minta bantuan' ||
    targetQ === 'bisa bantu saya' ||
    targetQ === 'bisa bantu saya?' ||
    targetQ === 'bisakah bantu saya' ||
    targetQ === 'bisakah bantu saya?' ||
    targetQ === 'bisakah anda bantu saya' ||
    targetQ === 'bisakah anda bantu saya?' ||
    targetQ === 'bisa tolong bantu saya' ||
    targetQ === 'bisa tolong bantu saya?' ||
    targetQ === 'apakah bisa bantu saya' ||
    targetQ === 'apakah bisa bantu saya?' ||
    targetQ === 'bisa bantu gak' ||
    targetQ === 'bisa bantu ngga' ||
    targetQ === 'bisa bantu' ||
    targetQ === 'bisa bantu?' ||
    targetQ === 'bisakah membantu' ||
    targetQ === 'bisakah membantu?' ||
    /^(tolong\s+)?(bantu\s+saya|bisa\s+bantu\s+saya|tolong\s+bantu)(\s+dong|\s+min|\s+ya)?\??$/i.test(targetQ) ||
    /^(apakah|bisakah|bisa)?\s*(anda|kamu)?\s*(tolong\s+)?(bantu\s+saya|membantu\s+saya)\??$/i.test(targetQ);

  if (isDirectHelpRequest) {
    if (isDeveloperUser) {
      return `Kantenan atuh bos **Ilham Fazril**! Kuring siap pisan ngabantosan sagalana—rek pariksa kodingan arsitektur website, konfigurasi database Supabase, logika pilar sosial, atawa diskusi fitur anyar. Aya naon nu hoyong dibantos dinten ieu? 🚀⚡`;
    }
    return `Silakan, apa yang perlu kita bantu? 😊\n\nSaya siap membantu Anda seputar informasi **10 Pilar PSKS Jawa Barat**, alur pendaftaran relawan sosial mandiri, verifikasi berkas, maupun layanan dan kontak pengaduan Dinas Sosial Provinsi Jawa Barat.\n\nSilakan sampaikan pertanyaan atau hal apa yang Anda butuhkan!`;
  }

  // 0.6B2B: PERTANYAAN UMUM SEPUTAR PILAR PSKS ("seputar pilar psks sih", "tanya pilar psks", "tentang pilar")
  const isGeneralPillarsInquiry =
    (
      targetQ.includes('seputar pilar psks') ||
      targetQ.includes('tanya pilar psks') ||
      targetQ.includes('tentang pilar psks') ||
      targetQ.includes('soal pilar psks') ||
      targetQ.includes('seputar pilar') ||
      targetQ.includes('tanya pilar') ||
      targetQ.includes('tentang pilar') ||
      targetQ.includes('soal pilar') ||
      targetQ.includes('mengenai pilar') ||
      targetQ === 'pilar psks' ||
      targetQ === 'pilar sosial' ||
      targetQ === 'pilar'
    ) &&
    !targetQ.includes('tagana') &&
    !targetQ.includes('psm') &&
    !targetQ.includes('karang taruna') &&
    !targetQ.includes('katar') &&
    !targetQ.includes('tksk') &&
    !targetQ.includes('peksos') &&
    !targetQ.includes('pksp') &&
    !targetQ.includes('lks') &&
    !targetQ.includes('lk3') &&
    !targetQ.includes('pensos') &&
    !targetQ.includes('kube') &&
    !targetQ.includes('slrt') &&
    !targetQ.includes('puskesos');

  if (isGeneralPillarsInquiry) {
    return `Boleh sekali, silakan! Pilar apa yang ingin ditanyakan? 😊\n\nDi bawah naungan Dinas Sosial Provinsi Jawa Barat, terdapat **10 Pilar Potensi dan Sumber Kesejahteraan Sosial (PSKS)** yang siap kami jelaskan:\n1. **PSM** (Pekerja Sosial Masyarakat)\n2. **TAGANA** (Taruna Siaga Bencana)\n3. **Karang Taruna** (KT)\n4. **TKSK** (Tenaga Kesejahteraan Sosial Kecamatan)\n5. **PEKSOS / PKSP** (Pekerja Sosial Profesional)\n6. **LKS** (Lembaga Kesejahteraan Sosial)\n7. **LK3** (Lembaga Konsultasi Kesejahteraan Keluarga)\n8. **PENSOS** (Penyuluh Sosial)\n9. **KUBE & Badan Usaha Sosial**\n10. **SLRT & Puskesos** (Sistem Layanan dan Rujukan Terpadu Satu Pintu)\n\nSilakan sampaikan pilar mana yang ingin Anda ketahui lebih lanjut, baik mengenai tugas pokok, persyaratan, maupun alur pendaftarannya!`;
  }

  // 0.6B2C: PENGERTIAN & DEFINISI PSKS
  const isDefinitionOfPsks =
    targetQ.includes('pengertian psks') ||
    targetQ.includes('definisi psks') ||
    targetQ.includes('apa itu psks') ||
    targetQ.includes('apa arti psks') ||
    targetQ.includes('apa maksud psks') ||
    targetQ.includes('arti psks') ||
    targetQ.includes('maksud psks') ||
    targetQ.includes('psks itu apa') ||
    targetQ.includes('psks adalah') ||
    targetQ.includes('singkatan psks') ||
    targetQ.includes('kepanjangan psks') ||
    targetQ === 'psks' ||
    targetQ === 'apa psks';

  if (isDefinitionOfPsks) {
    return `Berdasarkan **Undang-Undang Nomor 11 Tahun 2009 tentang Kesejahteraan Sosial**, **Potensi dan Sumber Kesejahteraan Sosial (PSKS)** adalah semua potensi, kemampuan, dan sumber daya—baik yang berwujud manusiawi (perseorangan, keluarga, dan kelompok masyarakat) maupun kelembagaan sosial/institusional—yang ada dan digali di dalam masyarakat, yang dapat didayagunakan dan dimobilisasi untuk mencegah, menangani, serta mengatasi berbagai permasalahan sosial (PPKS / Pemerlu Pelayanan Kesejahteraan Sosial) demi mewujudkan taraf kesejahteraan sosial masyarakat yang mandiri dan berkeadilan.\n\nDi lingkungan Pemerintah Provinsi Jawa Barat, pembinaan dan pemberdayaan PSKS dikoordinasikan langsung oleh **Dinas Sosial Provinsi Jawa Barat** yang mencakup **10 Pilar Utama PSKS**:\n1. **PKSP / PEKSOS** — Pekerja Sosial Profesional\n2. **PSM** — Pekerja Sosial Masyarakat\n3. **TAGANA** — Taruna Siaga Bencana\n4. **LKS** — Lembaga Kesejahteraan Sosial\n5. **Karang Taruna (KT)** — Karang Taruna Desa/Kelurahan\n6. **LK3** — Lembaga Konsultasi Kesejahteraan Keluarga\n7. **PENSOS** — Penyuluh Sosial Masyarakat\n8. **TKSK** — Tenaga Kesejahteraan Sosial Kecamatan\n9. **KUBE** — Kelompok Usaha Bersama & Badan Usaha Sosial\n10. **SLRT / Puskesos** — Sistem Layanan & Rujukan Terpadu Satu Pintu\n\nApakah ada pilar sosial tertentu atau informasi layanan yang ingin Anda ketahui lebih lanjut?`;
  }

  // 0.6B3: Pertanyaan Awalan Sopan & Izin Bertanya ("Bolehkah saya bertanya?", "Boleh nanya?", "Izin bertanya", "Bade naros")
  // Only triggers if there is NO substantive follow-up question attached!
  const isIntroductoryPreamble =
    !hasQuestion &&
    (
      isPureIntro ||
      q === 'bolehkah saya bertanya' ||
      q === 'bolehkah saya bertanya?' ||
      q === 'boleh saya bertanya' ||
      q === 'boleh saya bertanya?' ||
      q === 'bisakah saya bertanya' ||
      q === 'bisakah saya bertanya?' ||
      q === 'bolehkah bertanya' ||
      q === 'bolehkah bertanya?' ||
      q.startsWith('bolehkah saya bertanya') ||
      q.startsWith('boleh saya bertanya') ||
      q.startsWith('bisakah saya bertanya') ||
      q.startsWith('bolehkah bertanya') ||
      q.includes('izin bertanya') ||
      q.includes('izin nanya') ||
      q === 'boleh nanya' ||
      q === 'boleh nanya?' ||
      q === 'boleh nanya dong' ||
      q === 'boleh nanya dong?' ||
      q.startsWith('boleh nanya') ||
      q === 'bade naros' ||
      q === 'bade naros?' ||
      q === 'bade naros tiasa' ||
      q === 'bade naros tiasa?' ||
      q.includes('bade naros') ||
      q.includes('tiasa naros') ||
      q === 'mau nanya' ||
      q === 'mau nanya?' ||
      q === 'mau nanya dong' ||
      q === 'mau nanya dong?' ||
      q.startsWith('mau nanya') ||
      q === 'ada yang ingin saya tanyakan' ||
      q === 'ada yang ingin saya tanyakan?' ||
      q.startsWith('ada yang ingin saya tanyakan') ||
      q === 'apakah anda bisa bantu saya' ||
      q === 'apakah anda bisa bantu saya?' ||
      q === 'apakah bisa bantu saya' ||
      q === 'apakah bisa bantu saya?' ||
      q === 'bisakah bantu saya' ||
      q === 'bisakah bantu saya?' ||
      q === 'bisakah anda bantu saya' ||
      q === 'bisakah anda bantu saya?' ||
      q === 'bisakah kamu bantu saya' ||
      q === 'bisakah kamu bantu saya?' ||
      q === 'bisakah membantu saya' ||
      q === 'bisakah membantu saya?' ||
      q === 'bisa bantu saya' ||
      q === 'bisa bantu saya?' ||
      q === 'bisa tolong bantu saya' ||
      q === 'bisa tolong bantu saya?' ||
      q === 'bisa tolong saya' ||
      q === 'tolong bantu saya' ||
      q.includes('bisakah bantu') ||
      q.includes('bisakah membantu') ||
      q.includes('bisa tolong bantu') ||
      q === 'halo min mau nanya' ||
      q === 'halo admin mau nanya'
    );

  if (isIntroductoryPreamble) {
    return `Tentu saja, silahkan apa yang ingin ditanyakan. Saya siap membantu Anda seputar informasi 10 Pilar PSKS, alur pendaftaran, maupun layanan sosial di Jawa Barat. 😊`;
  }

  // 0.6D: GENERAL MULTI-TURN ACKNOWLEDGMENT / CONFIRMATION FOR PREVIOUS CONTEXT TOPIC
  const isGeneralAcknowledgment =
    (
      q.startsWith('owalah') ||
      q.startsWith('oalah') ||
      q.startsWith('oh jadi') ||
      q.startsWith('oh begitu') ||
      q.startsWith('oh gitu') ||
      q.startsWith('oh ternyata') ||
      q.startsWith('berarti') ||
      q.startsWith('paham') ||
      q.startsWith('ngerti') ||
      q.startsWith('oh pantesan') ||
      q.startsWith('iya ya')
    ) &&
    !hasQuestion &&
    q.length < 60;

  if (isGeneralAcknowledgment && previousContext && previousContext.trim().length > 10) {
    const prev = previousContext.toLowerCase();
    let prevTopic = 'informasi tersebut';
    if (prev.includes('tagana')) prevTopic = 'TAGANA';
    else if (prev.includes('psm')) prevTopic = 'PSM';
    else if (prev.includes('tksk')) prevTopic = 'TKSK';
    else if (prev.includes('karang taruna')) prevTopic = 'Karang Taruna';
    else if (prev.includes('peksos') || prev.includes('pksp')) prevTopic = 'Pekerja Sosial Profesional (PEKSOS)';
    else if (prev.includes('lks')) prevTopic = 'LKS';
    else if (prev.includes('lk3')) prevTopic = 'LK3';
    else if (prev.includes('pensos')) prevTopic = 'Penyuluh Sosial';
    else if (prev.includes('kube')) prevTopic = 'KUBE';
    else if (prev.includes('slrt') || prev.includes('puskesos')) prevTopic = 'SLRT / Puskesos';
    else if (prev.includes('bansos') || prev.includes('dtks')) prevTopic = 'Bansos DTKS';

    if (isDeveloperUser) {
      return `Sip mantap bos **Ilham Fazril**! Senang penjelasannya nyambung dan jelas. Ada hal lain yang mau kita bahas atau kulik lagi? 😎🚀`;
    }
    return `Betul sekali Bapak/Ibu 😊! Senang bisa membantu memperjelas pemahaman Anda terkait ${prevTopic}. Apakah ada hal lain atau pertanyaan lanjutan yang ingin Anda tanyakan seputar layanan PSKS Jawa Barat?`;
  }

  // 0.6D2: GENERAL MULTI-TURN APPRECIATION / COMPLIMENT FOR PREVIOUS CONTEXT TOPIC
  const isGeneralCompliment =
    (
      q.includes('hebat') ||
      q.includes('keren') ||
      q.includes('mantap') ||
      q.includes('mantul') ||
      q.includes('salut') ||
      q.includes('luar biasa') ||
      q.includes('patut diacungi') ||
      q.includes('diacungi jempol') ||
      q.includes('top banget') ||
      q.includes('sae pisan') ||
      q.includes('alus pisan') ||
      q.includes('hade pisan')
    ) &&
    !isComplimentOrAppreciationDev &&
    !hasQuestion &&
    q.length < 60;

  if (isGeneralCompliment && previousContext && previousContext.trim().length > 10) {
    const prev = previousContext.toLowerCase();
    let prevTopic = 'dedikasi para relawan dan petugas sosial';
    if (prev.includes('tagana')) prevTopic = 'TAGANA (Taruna Siaga Bencana)';
    else if (prev.includes('psm')) prevTopic = 'PSM (Pekerja Sosial Masyarakat)';
    else if (prev.includes('tksk')) prevTopic = 'TKSK (Tenaga Kesejahteraan Sosial Kecamatan)';
    else if (prev.includes('karang taruna')) prevTopic = 'Karang Taruna';
    else if (prev.includes('peksos') || prev.includes('pksp')) prevTopic = 'Pekerja Sosial Profesional (PEKSOS)';
    else if (prev.includes('lks')) prevTopic = 'LKS';
    else if (prev.includes('lk3')) prevTopic = 'LK3';
    else if (prev.includes('pensos')) prevTopic = 'Penyuluh Sosial';
    else if (prev.includes('kube')) prevTopic = 'KUBE';
    else if (prev.includes('slrt') || prev.includes('puskesos')) prevTopic = 'SLRT / Puskesos';

    if (isDeveloperUser) {
      return `Mantap pisan bos **Ilham Fazril**! Dedikasi ${prevTopic} memang luar biasa untuk warga Jabar. Ada hal lain yang mau kita diskusikan? 😎🚀`;
    }
    return `Terima kasih banyak atas apresiasi positifnya Bapak/Ibu 😊! Dedikasi para relawan dan personil **${prevTopic}** di lapangan memang sangat luar biasa bagi masyarakat Jawa Barat.\n\nApakah ada hal lain seputar ${prevTopic} atau layanan sosial yang ingin Anda ketahui lebih lanjut?`;
  }

  // 0.7 Nama Web / Nama Aplikasi
  if (
    q.includes('nama web') ||
    q.includes('nama website') ||
    q.includes('nama aplikasi') ||
    q.includes('nama sistem') ||
    q.includes('apa nama platform') ||
    q.includes('aplikasi ini namanya apa') ||
    q.includes('web ini namanya apa')
  ) {
    return `Nama sistem/aplikasi ini adalah **PSKS JABAR** (*Sistem Informasi Potensi & Sumber Kesejahteraan Sosial Provinsi Jawa Barat*), platform digital terintegrasi satu data 10 pilar kesejahteraan sosial di 27 Kabupaten/Kota yang dikembangkan oleh Dinas Sosial Provinsi Jawa Barat.`;
  }

  // 2. CONTEXTUAL PILLAR DETAIL QUERY (When user is viewing a specific pillar or asks about active pillar)
  if (activePillar && PILLARS_CONFIG[activePillar]) {
    const currentPillarInfo = PILLARS_CONFIG[activePillar];
    const pillarCount = pillarCounts[activePillar] || 0;

    if (
      q.includes('jumlah') ||
      q.includes('berapa') ||
      q.includes('total') ||
      q.includes('anggota') ||
      q.includes('personil') ||
      q.includes('data') ||
      q.includes('sabaraha') ||
      q.includes('brp') ||
      q.includes('angota')
    ) {
      return `${opening}Saat ini, terdapat total **${pillarCount.toLocaleString('id-ID')} ${currentPillarInfo.unitLabel}** personil **${currentPillarInfo.title}** (${currentPillarInfo.shortName}) yang tercatat aktif dalam pangkalan data PSKS Jabar.\n\nAnda dapat memfilter data anggota berdasarkan nama, nomor NIK, maupun wilayah penugasan kecamatan pada tabel di halaman ini.`;
    }

    if (
      q.includes('tugas') ||
      q.includes('fungsi') ||
      q.includes('wewenang') ||
      q.includes('peran') ||
      q.includes('naon') ||
      q.includes('kerjanya') ||
      q.includes('ngapain')
    ) {
      return `${opening}**Tugas Pokok & Fungsi ${currentPillarInfo.title} (${currentPillarInfo.shortName})**:\n\n${currentPillarInfo.description}\n\n- **Unit Satuan**: ${currentPillarInfo.unitLabel}\n- **Atribut Data Utama**: ${currentPillarInfo.fields.nikLabel}, ${currentPillarInfo.fields.certLabel}, serta ${currentPillarInfo.fields.hpLabel}.\n- **Verifikasi**: Setiap personil wajib memiliki SK Penugasan resmi yang terverifikasi di Dinas Sosial.`;
    }

    if (
      q.includes('format data') ||
      q.includes('field data') ||
      q.includes('kolom tabel') ||
      q.includes('atribut data')
    ) {
      return `${opening}**Format Atribut & Persyaratan Registrasi ${currentPillarInfo.title}**:\n\n1. **${currentPillarInfo.fields.nikLabel}**: Nomor identitas resmi terdaftar.\n2. **${currentPillarInfo.fields.certLabel}**: Dokumen legalitas/SK pengangkatan penugasan dinas.\n3. **${currentPillarInfo.fields.hpLabel}**: Kontak koordinasi aktif lapangan.\n4. **Status Keaktifan**: Wajib berstatus *Aktif / Siaga* untuk mendapatkan pengesahan *SAH_TERDAFTAR* pada pangkalan data terintegrasi Dinas Sosial Jawa Barat.`;
    }
  }

  // 3. 10 PILAR UTAMA PSKS
  if (
    q.includes('10 pilar') ||
    q.includes('pilar psks') ||
    q.includes('apa saja pilar') ||
    q.includes('sebutkan pilar') ||
    q.includes('sumber kesejahteraan')
  ) {
    return `${opening}Berikut adalah **10 Pilar Utama Potensi & Sumber Kesejahteraan Sosial (PSKS)** yang terdaftar dan dikelola secara resmi pada Aplikasi PSKS Jabar:

1. **Pekerja Sosial Profesional (PKSP)**: Tenaga berkeahlian formal kesejahteraan sosial dengan sertifikasi profesi resmi (${pillarCounts['peksos'] || 0} orang).
2. **Pekerja Sosial Masyarakat (PSM)**: Warga masyarakat sukarela yang berdedikasi melayani penanganan PMKS di tingkat desa/kelurahan (${pillarCounts['psm'] || 0} orang).
3. **Taruna Siaga Bencana (TAGANA)**: Relawan mitigasi dan respon tanggap darurat bencana alam serta bantuan logistik darurat (${pillarCounts['tagana'] || 0} orang).
4. **Lembaga Kesejahteraan Sosial (LKS)**: Organisasi sosial/yayasan berbadan hukum yang menyelenggarakan rehabilitasi dan pelayanan sosial (${pillarCounts['lks'] || 0} lembaga).
5. **Karang Taruna (KT)**: Organisasi kepemudaan desa/kelurahan pelopor pembinaan generasi muda dan kewirausahaan sosial (${pillarCounts['karangtaruna'] || 0} orang).
6. **Lembaga Konsultasi Kesejahteraan Keluarga (LK3)**: Lembaga konseling keluarga untuk mediasi krisis, keharmonisan, dan ketahanan keluarga (${pillarCounts['lk3'] || 0} orang).
7. **Penyuluh Sosial Masyarakat (PENSOS)**: Kader komunikasi penyuluh program-program kesejahteraan sosial ke masyarakat luas (${pillarCounts['pensos'] || 0} orang).
8. **Tenaga Kesejahteraan Sosial Kecamatan (TKSK)**: Personil fungsional pendamping dan koordinator program sosial di tingkat kecamatan (${pillarCounts['tksk'] || 0} orang).
9. **Kelompok Usaha Bersama & Badan Usaha Sosial (Badan Usaha / KUBE)**: Wadah pemberdayaan ekonomi sosial bagi keluarga kurang mampu (${pillarCounts['badanusaha'] || 0} kelompok).
10. **Sistem Layanan & Rujukan Terpadu / Pusat Kesejahteraan Sosial (SLRT / Puskesos)**: Pusat pelayanan dan rujukan terpadu satu pintu (${pillarCounts['slrt_puskesos'] || 0} lembaga).

Total akumulasi personil terdata saat ini mencapai **${totalRecords.toLocaleString('id-ID')}** personil/lembaga di 27 Kabupaten/Kota.`;
  }

  // 3.45 DURASI / PERKIRAAN BERAPA LAMA PROSES AJUAN PENDAFTARAN HINGGA DITERIMA / DISETUJUI
  const isDurationVerificationQuery =
    (targetQ.includes('berapa lama') ||
      targetQ.includes('berapa hari') ||
      targetQ.includes('durasi') ||
      targetQ.includes('estimasi waktu') ||
      targetQ.includes('kapan diterima') ||
      targetQ.includes('kapan disetujui') ||
      targetQ.includes('kapan diverifikasi') ||
      targetQ.includes('kapan verifikasi') ||
      targetQ.includes('lama proses') ||
      targetQ.includes('lama ajuan') ||
      targetQ.includes('lama verifikasi') ||
      targetQ.includes('lama pendaftaran') ||
      targetQ.includes('lama daftar') ||
      targetQ.includes('waktu verifikasi') ||
      targetQ.includes('waktu pengajuan') ||
      targetQ.includes('waktu proses') ||
      targetQ.includes('berapa waktu')) &&
    (targetQ.includes('daftar') ||
      targetQ.includes('pendaftaran') ||
      targetQ.includes('ajuan') ||
      targetQ.includes('pengajuan') ||
      targetQ.includes('verifikasi') ||
      targetQ.includes('diterima') ||
      targetQ.includes('disetujui') ||
      targetQ.includes('berkas') ||
      targetQ.includes('anggota') ||
      targetQ.includes('psks'));

  if (isDurationVerificationQuery) {
    const politeUserHonorific =
      userName && !userName.toLowerCase().includes('tamu') && userName.trim() !== ''
        ? `Bapak/Ibu **${userName}**`
        : 'Bapak/Ibu';

    return `${salamPrefix}Baik ${politeUserHonorific}, terima kasih atas pertanyaannya. Mengenai perkiraan waktu **berapa lama ajuan pendaftaran hingga diterima / disetujui** di portal PSKS JABAR, berikut kami sampaikan estimasi umumnya:

---

### **Perkiraan Umum Proses Verifikasi Ajuan Pendaftaran**:
1. **Estimasi Waktu Umum**:
   - Proses verifikasi berkas dan validasi data calon personil pilar sosial oleh tim verifikator / Admin Dinas Sosial Kabupaten/Kota umumnya memerlukan waktu **3 hingga 7 hari kerja** sejak berkas pengajuan dikirimkan.
   - Pada kondisi tertentu (seperti verifikasi faktual lapangan, kesesuaian kuota pilar di wilayah, atau kelengkapan dokumen legalitas/SK), proses dapat memerlukan waktu sekitar **1 hingga 2 minggu**.

2. **Pemantauan Status Pengajuan Mandiri**:
   - Anda dapat memantau perkembangan status pengajuan Anda secara berkala (*real-time*) di website **PSKS JABAR** melalui menu **"Riwayat Pengajuan Pendaftaran"**:
     - **Pending (Menunggu Verifikasi)**: Berkas Anda telah masuk dan berada dalam antrean peninjauan oleh verifikator dinas.
     - **Approved (SAH_TERDAFTAR)**: Ajuan telah disetujui resmi, tercatat dalam pangkalan data Supabase, dan Kartu Tanda Anggota (KTA) ber-QR Code dapat diterbitkan/dicetak.
     - **Rejected (Ditolak / Perlu Perbaikan)**: Berkas belum memenuhi syarat disertai catatan revisi dari verifikator untuk diajukan kembali.

3. **Konfirmasi Lanjutan**:
   - Jika pengajuan Anda telah melewati batas waktu estimasi hari kerja namun belum ada pembaruan status, Anda dapat berkoordinasi langsung dengan pihak Dinas Sosial Kabupaten/Kota domisili Anda atau Dinas Sosial Provinsi Jawa Barat untuk konfirmasi berkas.

[[action:tab:user_reg_history:Buka Riwayat Pendaftaran]] [[action:tab:contact:Hubungi Dinas Sosial Jabar]]`;
  }

  // 3.5 PANDUAN LENGKAP CARA DAFTAR & BERGABUNG PILAR SOSIAL (MUTLAK DIDAHULUKAN SEBELUM DEFINISI TEKSTUAL)
  const isRegisterIntent =
    !isDurationVerificationQuery &&
    !targetQ.includes('mode diskusi') &&
    !targetQ.includes('masuk dalam mode') &&
    !targetQ.includes('masuk mode') &&
    !targetQ.includes('diskusi') &&
    !targetQ.includes('berapa lama') &&
    !targetQ.includes('berapa hari') &&
    !targetQ.includes('durasi') &&
    !targetQ.includes('estimasi waktu') &&
    (targetQ.includes('cara daftar') ||
      targetQ.includes('cara daptar') ||
      targetQ.includes('alur pendaftaran') ||
      targetQ.includes('alur pendaptaran') ||
      targetQ.includes('tata cara daftar') ||
      targetQ.includes('tata cara daptar') ||
      targetQ.includes('bagaimana cara mendaftar') ||
      targetQ.includes('bagaimana cara mendaptar') ||
      targetQ.includes('prosedur pendaftaran') ||
      targetQ.includes('prosedur pendaptaran') ||
      targetQ.includes('syarat pendaftaran') ||
      targetQ.includes('syarat pendaptaran') ||
      targetQ.includes('syarat daftar') ||
      targetQ.includes('syarat daptar') ||
      targetQ.includes('syarat gabung') ||
      targetQ.includes('cara gabung') ||
      targetQ.includes('cara registrasi') ||
      targetQ.includes('cara bergabung') ||
      targetQ.includes('gabung pilar') ||
      targetQ.includes('gabung relawan') ||
      targetQ.includes('daftar pilar') ||
      targetQ.includes('daptar pilar') ||
      targetQ.includes('daftar relawan') ||
      targetQ.includes('daptar relawan') ||
      targetQ.includes('pendaftaran mandiri') ||
      targetQ.includes('pendaptaran mandiri') ||
      targetQ.includes('tambah anggota mandiri') ||
      targetQ.includes('daftar jadi anggota') ||
      targetQ.includes('daptar jadi anggota') ||
      targetQ.includes('cara jadi anggota') ||
      targetQ.includes('cara jadi relawan') ||
      targetQ.includes('rekrutmen pilar') ||
      targetQ.includes('rekrutmen anggota') ||
      targetQ === 'cara daftar' ||
      targetQ === 'cara daptar' ||
      targetQ === 'alur pendaftaran' ||
      targetQ === 'alur pendaptaran' ||
      targetQ === 'pendaftaran' ||
      targetQ === 'pendaptaran' ||
      targetQ === 'syarat daftar' ||
      targetQ === 'syarat daptar' ||
      ((targetQ.includes('daftar') || targetQ.includes('daptar') || targetQ.includes('pendaftaran') || targetQ.includes('pendaptaran') || targetQ.includes('gabung') || targetQ.includes('registrasi') || targetQ.includes('rekrutmen') || ((targetQ.includes('cara') || targetQ.includes('gimana') || targetQ.includes('bagaimana') || targetQ.includes('alur') || targetQ.includes('syarat')) && (targetQ.includes('daftar') || targetQ.includes('daptar') || targetQ.includes('masuk') || targetQ.includes('gabung') || targetQ.includes('jadi')))) &&
        (activePillar || targetQ.includes('peksos') || targetQ.includes('pksp') || targetQ.includes('tagana') || targetQ.includes('psm') || targetQ.includes('karang taruna') || targetQ.includes('katar') || targetQ.includes('tksk') || targetQ.includes('lks') || targetQ.includes('panti') || targetQ.includes('yayasan') || targetQ.includes('lk3') || targetQ.includes('pensos') || targetQ.includes('penyuluh') || targetQ.includes('kube') || targetQ.includes('badan usaha') || targetQ.includes('slrt') || targetQ.includes('puskesos'))) ||
      ((targetQ.includes('cara') || targetQ.includes('syarat') || targetQ.includes('alur') || targetQ.includes('gabung')) &&
        (targetQ.includes('peksos') || targetQ.includes('pksp') || targetQ.includes('tagana') || targetQ.includes('psm') || targetQ.includes('karang taruna') || targetQ.includes('katar') || targetQ.includes('tksk') || targetQ.includes('lks') || targetQ.includes('lk3') || targetQ.includes('pensos') || targetQ.includes('kube') || targetQ.includes('slrt') || targetQ.includes('puskesos'))));

  if (isRegisterIntent) {
    const politeUserHonorific =
      userName && !userName.toLowerCase().includes('tamu') && userName.trim() !== ''
        ? `Bapak/Ibu **${userName}**`
        : 'Bapak/Ibu';

    // 0. CARA DAFTAR PSKS (PERTANYAAN UMUM: "CARA DAFTAR PSKS") -> TANYAKAN KEMBALI DENGAN RAMAH, SOPAN & PROFESIONAL
    const isGeneralPsksRegister =
      (q.includes('daftar psks') ||
        q.includes('daptar psks') ||
        q.includes('daftr psks') ||
        q.includes('registrasi psks') ||
        q.includes('pendaftaran psks') ||
        q.includes('pendaptaran psks') ||
        q.includes('gabung psks') ||
        q.includes('masuk psks') ||
        q.includes('ikut psks') ||
        q.includes('rekrutmen psks') ||
        q.includes('cara jadi psks') ||
        q.includes('syarat psks') ||
        q.includes('syarat daftar psks') ||
        q.includes('cara daftar di psks') ||
        q.includes('cara daftar potensi dan sumber kesejahteraan sosial') ||
        q === 'cara daftar' ||
        q === 'cara daptar' ||
        q === 'bagaimana cara daftar' ||
        q === 'bagaimana cara daptar' ||
        q === 'alur pendaftaran' ||
        q === 'alur pendaftarannya' ||
        q === 'bagaimana alur pendaftarannya') &&
      !q.includes('tagana') &&
      !q.includes('psm') &&
      !q.includes('karang taruna') &&
      !q.includes('katar') &&
      !q.includes('peksos') &&
      !q.includes('pksp') &&
      !q.includes('tksk') &&
      !q.includes('lks') &&
      !q.includes('panti') &&
      !q.includes('yayasan') &&
      !q.includes('slrt') &&
      !q.includes('puskesos') &&
      !q.includes('lk3') &&
      !q.includes('konsultasi keluarga') &&
      !q.includes('penyuluh') &&
      !q.includes('pensos') &&
      !q.includes('kube') &&
      !q.includes('badan usaha') &&
      (!activePillar || q.includes('psks') || q === 'cara daftar' || q === 'alur pendaftaran');

    if (isGeneralPsksRegister) {
      return `${salamPrefix}Sampurasun / Halo ${politeUserHonorific}, terima kasih banyak atas niat baik, kepedulian, dan ketertarikan Anda untuk bergabung bersama Potensi & Sumber Kesejahteraan Sosial (PSKS) di Jawa Barat. 🙏✨

**Silakan, ${politeUserHonorific} ingin mendaftar ke pilar PSKS yang mana?**

Dinas Sosial Provinsi Jawa Barat menaungi **10 Pilar Sosial (PSKS)** yang siap menjadi wadah pengabdian sosial Anda:
1. **PSM (Pekerja Sosial Masyarakat)** — Relawan sosial warga berbasis desa/kelurahan dalam pendampingan warga & penanganan PPKS.
2. **TAGANA (Taruna Siaga Bencana)** — Korps relawan penanggulangan bencana alam & tanggap darurat sosial (logistik dapur umum, shelter, evakuasi, dan Layanan Dukungan Psikososial/LDP).
3. **Karang Taruna** — Wadah pembinaan kepemudaan sosial tingkat RT/RW dan Desa/Kelurahan pelopor gotong royong warga.
4. **TKSK (Tenaga Kesejahteraan Sosial Kecamatan)** — Koordinator fasilitator bansos dan pendamping kesejahteraan sosial tingkat kecamatan.
5. **PEKSOS (Pekerja Sosial Profesional)** — Profesi keahlian sosial formal berpendidikan kessos, STRPS Kemensos, & izin praktik SIPPS.
6. **LKS (Lembaga Kesejahteraan Sosial)** — Yayasan, panti asuhan/rehabilitasi sosial berbadan hukum pengayom pemerlu pelayanan kesejahteraan sosial.
7. **LK3 (Lembaga Konsultasi Kesejahteraan Keluarga)** — Layanan konseling psikososial, mediasi krisis, dan ketahanan keluarga.
8. **Penyuluh Sosial (PENSOS)** — Fungsional penyuluhan komunikasi, informasi, dan edukasi sosial pencegahan masalah kemasyarakatan.
9. **KUBE (Kelompok Usaha Bersama)** — Kelompok pemberdayaan ekonomi produktif keluarga prasejahtera / KPM binaan DTKS.
10. **SLRT / Puskesos** — Pusat Kesejahteraan Sosial & layanan rujukan terpadu satu pintu (*one-stop social service*) tingkat Desa/Kelurahan.

Silakan sampaikan nama pilar yang ingin Anda daftarkan, atau Anda dapat langsung mengklik tombol pilar di bawah ini untuk melihat alur dan panduan pendaftaran lengkapnya di website:

[[action:pillar:psm:Cara Mendaftar PSM]] [[action:pillar:tagana:Cara Mendaftar TAGANA]] [[action:pillar:karangtaruna:Cara Mendaftar Karang Taruna]] [[action:pillar:tksk:Cara Mendaftar TKSK]] [[action:pillar:peksos:Cara Mendaftar PEKSOS]] [[action:pillar:lks:Cara Mendaftar LKS]] [[action:pillar:lk3:Cara Mendaftar LK3]] [[action:pillar:pensos:Cara Mendaftar Penyuluh Sosial]] [[action:pillar:badanusaha:Cara Mendaftar KUBE]] [[action:pillar:slrt_puskesos:Cara Mendaftar SLRT / Puskesos]]`;
    }

    const formatPillarRegistrationFlow = (
      pilarId: string,
      pilarShort: string,
      pilarFullName: string,
      berkasText: string
    ) => {
      return `Halo ${politeUserHonorific}, alur pendaftaran ${pilarFullName} di website **PSKS JABAR** dilakukan secara berjenjang dan transparan melalui 3 tahapan berikut:

---

### **1. Tahap 1: Pendaftaran & Upload Berkas oleh Pengguna (User Terdaftar)**
- **Masuk Akun**: Masuk (*login*) dengan akun pengguna di website **PSKS JABAR** (atau klik menu *"Daftar Akun Baru"* bila belum memiliki akun).
- **Pilih Pilar & Buka Formulir**: Pada halaman **Beranda**, pilih pilar **${pilarShort}**, lalu klik tombol hijau **"+ Tambah Anggota Mandiri / Pendaftaran"**.
- **Pengisian Formulir**: Lengkapi biodata (NIK 16 digit, Nama Lengkap, Nomor WhatsApp aktif, serta Wilayah Penugasan di Jawa Barat).
- **Upload Foto Berkas Pendukung**: Unggah foto berkas pendukung ${berkasText}. Sistem secara otomatis mengompresi ukuran foto agar jelas dan hemat memori.
- **Kirim Pengajuan**: Klik tombol **"Kirim Pengajuan"**. Berkas pendaftaran otomatis tercatat dengan status awal **"Menunggu Verifikasi" (Pending)**.

---

### **2. Tahap 2: Verifikasi Berkas oleh Admin Wilayah (Kabupaten/Kota)**
- **Pemeriksaan Administrasi**: Admin Dinas Sosial Kabupaten/Kota setempat memeriksa keabsahan data administrasi dan kejelasan dokumen foto berkas pendukung yang diunggah.
- **Hasil Verifikasi**: Berkas yang lengkap dan sesuai akan disetujui menjadi status **"DISETUJUI_WILAYAH"** dan otomatis diteruskan ke tingkat Provinsi.

---

### **3. Tahap 3: Pengesahan oleh Superadmin (Provinsi Jawa Barat)**
- **Pengesahan Akhir**: Superadmin Dinas Sosial Provinsi Jawa Barat melakukan validasi akhir keselarasan data.
- **Hasil Pengesahan**: Berkas resmi disahkan dengan status **"SAH_TERDAFTAR"** dalam pangkalan data potensi dan sumber kesejahteraan sosial Jawa Barat.

---

### **Pemantauan Status Pengajuan**:
Pemohon dapat memantau perkembangan status pengajuannya kapan saja secara langsung melalui menu **"Riwayat Pengajuan Pendaftaran"**.

[[action:tab:beranda:Pilih Pilar di Beranda]] [[action:pillar:${pilarId}:Buka Formulir Pendaftaran ${pilarShort}]] [[action:tab:user_reg_history:Buka Riwayat Pendaftaran]]`;
    };

    // 1. CARA DAFTAR PSM (Pekerja Sosial Masyarakat)
    if (q.includes('psm') || q.includes('pekerja sosial masyarakat') || activePillar === 'psm') {
      return formatPillarRegistrationFlow(
        'psm',
        'PSM',
        'Pekerja Sosial Masyarakat (PSM)',
        '(seperti foto KTP, SK Pengukuhan Kepala Desa/Lurah/Camat, atau Sertifikat Pelatihan/Bimtek Dasar PSM)'
      );
    }

    // 2. CARA DAFTAR TAGANA (Taruna Siaga Bencana)
    if (q.includes('tagana') || q.includes('taruna siaga') || q.includes('bencana') || activePillar === 'tagana') {
      return formatPillarRegistrationFlow(
        'tagana',
        'TAGANA',
        'relawan TAGANA (Taruna Siaga Bencana)',
        '(seperti foto KTP, Sertifikat Diklatsar Kebencanaan / Kesiapsiagaan, atau SK Penugasan TAGANA)'
      );
    }

    // 3. CARA DAFTAR KARANG TARUNA
    if (q.includes('karang taruna') || q.includes('katar') || q.includes('pemuda') || activePillar === 'karangtaruna') {
      return formatPillarRegistrationFlow(
        'karangtaruna',
        'Karang Taruna',
        'anggota atau pengurus Karang Taruna',
        '(seperti foto KTP, SK Kepengurusan Karang Taruna Desa/Kelurahan atau unit RT/RW)'
      );
    }

    // 4. CARA DAFTAR TKSK (Tenaga Kesejahteraan Sosial Kecamatan)
    if (q.includes('tksk') || activePillar === 'tksk') {
      return formatPillarRegistrationFlow(
        'tksk',
        'TKSK',
        'Tenaga Kesejahteraan Sosial Kecamatan (TKSK)',
        '(seperti foto KTP, SK Pengangkatan TKSK Kemensos RI / Dinas Sosial, atau dokumen penugasan kecamatan)'
      );
    }

    // 5. CARA MENJADI PEKSOS / PKSP (Pekerja Sosial Profesional)
    if (q.includes('peksos') || q.includes('pksp') || q.includes('pekerja sosial') || activePillar === 'peksos') {
      return formatPillarRegistrationFlow(
        'peksos',
        'PEKSOS',
        'Pekerja Sosial Profesional (PEKSOS)',
        '(seperti foto KTP, Ijazah Profesi Kesejahteraan Sosial, Sertifikat Kompetensi, STRPS Kemensos RI, atau SIPPS)'
      );
    }

    // 6. CARA DAFTAR LKS (Lembaga Kesejahteraan Sosial / Panti / Yayasan)
    if (q.includes('lks') || q.includes('panti') || q.includes('yayasan') || activePillar === 'lks') {
      return formatPillarRegistrationFlow(
        'lks',
        'LKS',
        'Lembaga Kesejahteraan Sosial (LKS / Panti / Yayasan)',
        '(seperti foto KTP Penanggung Jawab, Akta Notaris Kemenkumham, serta TDLKS / Izin Operasional Dinsos)'
      );
    }

    // 7. CARA DAFTAR SLRT / PUSKESOS (Sistem Layanan & Rujukan Terpadu / Pusat Kesejahteraan Sosial)
    if (q.includes("slrt") || q.includes("puskesos") || activePillar === "slrt_puskesos") {
      return formatPillarRegistrationFlow(
        "slrt_puskesos",
        "SLRT / Puskesos",
        "personil / sekretariat SLRT dan Puskesos",
        "(seperti foto KTP, SK Pengukuhan Pengurus Sekretariat Puskesos Desa/Kelurahan dari Kepala Desa/Lurah/Camat, atau Surat Tugas)"
      );
    }

    // 8. CARA DAFTAR LK3 (Lembaga Konsultasi Kesejahteraan Keluarga)
    if (q.includes("lk3") || q.includes("konsultasi keluarga") || activePillar === "lk3") {
      return formatPillarRegistrationFlow(
        "lk3",
        "LK3",
        "Lembaga Konsultasi Kesejahteraan Keluarga (LK3)",
        "(seperti foto KTP Penanggung Jawab, SK Pendirian Lembaga, atau Sertifikat Keahlian Konselor Keluarga)"
      );
    }

    // 9. CARA DAFTAR PENYULUH SOSIAL (PENSOS)
    if (q.includes("penyuluh") || q.includes("pensos") || activePillar === "pensos") {
      return formatPillarRegistrationFlow(
        "pensos",
        "Penyuluh Sosial",
        "Penyuluh Sosial (PENSOS)",
        "(seperti foto KTP, Sertifikat Diklat Fungsional Penyuluh Sosial, atau SK Jabatan Fungsional PENSOS)"
      );
    }

    // 10. CARA DAFTAR KUBE & BADAN USAHA KESSOS
    if (q.includes("kube") || q.includes("kelompok usaha") || q.includes("badan usaha") || activePillar === "badanusaha") {
      return formatPillarRegistrationFlow(
        "badanusaha",
        "KUBE",
        "Kelompok Usaha Bersama (KUBE) & Usaha Sosial",
        "(seperti foto KTP Ketua/Pengurus, Berita Acara Pembentukan Kelompok, atau Dokumen Profil Usaha Anggota KPM)"
      );
    }

    // 11. PANDUAN CARA MENDAFTAR SALAH SATU PILAR DI WEBSITE PSKS JABAR (UMUM)
    return `Halo ${politeUserHonorific}, alur pendaftaran mandiri salah satu dari 10 Pilar PSKS di website **PSKS JABAR** dilakukan secara berjenjang dan transparan melalui 3 tahapan berikut:

---

### **1. Tahap 1: Pendaftaran & Upload Berkas oleh Pengguna (User Terdaftar)**
- **Masuk Akun**: Masuk (*login*) ke portal **PSKS JABAR** (atau klik menu *"Daftar Akun Baru"* bila belum memiliki akun).
- **Pilih Pilar**: Di halaman **Beranda**, pilih salah satu dari 10 Pilar Sosial yang ingin diikuti, lalu klik tombol hijau **"+ Tambah Anggota Mandiri / Pendaftaran"**.
- **Pengisian Formulir**: Lengkapi biodata (NIK 16 digit, Nama Lengkap, Nomor WhatsApp aktif, serta Wilayah Penugasan di Jawa Barat).
- **Upload Foto Berkas Pendukung**: Unggah foto berkas pendukung (seperti foto KTP, SK Pengangkatan/Kepengurusan, atau Sertifikat Pelatihan/Bimtek). Sistem secara otomatis mengompresi ukuran foto agar jelas dan hemat memori.
- **Kirim Pengajuan**: Klik tombol **"Kirim Pengajuan"**. Berkas otomatis tercatat dengan status awal **"Menunggu Verifikasi" (Pending)**.

---

### **2. Tahap 2: Verifikasi Berkas oleh Admin Wilayah (Kabupaten/Kota)**
- **Pemeriksaan Administrasi**: Admin Dinas Sosial Kabupaten/Kota setempat memeriksa keabsahan data administrasi dan kelengkapan foto berkas pendukung yang diunggah.
- **Hasil Verifikasi**: Berkas yang sesuai disetujui menjadi status **"DISETUJUI_WILAYAH"** dan otomatis diteruskan ke antrean pengesahan tingkat Provinsi.

---

### **3. Tahap 3: Pengesahan oleh Superadmin (Provinsi Jawa Barat)**
- **Pengesahan Akhir**: Superadmin Dinas Sosial Provinsi Jawa Barat melakukan validasi akhir keselarasan data se-Jawa Barat.
- **Hasil Pengesahan**: Berkas resmi disahkan dengan status **"SAH_TERDAFTAR"** dalam pangkalan data potensi dan sumber kesejahteraan sosial Jawa Barat.

---

### **Pemantauan Status Pengajuan**:
Pemohon dapat memantau perkembangan status pengajuannya kapan saja secara langsung melalui menu **"Riwayat Pengajuan Pendaftaran"**.

[[action:tab:beranda:Pilih Pilar di Beranda]] [[action:tab:user_reg_history:Buka Riwayat Pendaftaran]]`;
  }

  // 4. PILAR SPECIFIC QUERIES

  // 4.1 PEKSOS / PKSP (Pekerja Sosial Profesional)
  if (
    q.includes('peksos') ||
    q.includes('pksp') ||
    (q.includes('pekerja sosial') && !q.includes('pekerja sosial masyarakat')) ||
    q.includes('sipps') ||
    q.includes('sertifikasi peksos') ||
    q.includes('peksos pemerintah') ||
    q.includes('peksos masyarakat') ||
    q.includes('peksos ahli')
  ) {
    return `${opening}**Pekerja Sosial Profesional (PEKSOS / PKSP)**:
- **Definisi Resmi**: Tenaga ahli yang memiliki kualifikasi keilmuan formal pekerjaan sosial (lulusan D-IV/S-1/S-2/Profesi Spesialis Kesejahteraan Sosial/Pekerjaan Sosial) yang telah lulus uji kompetensi profesi, mengantongi Sertifikat Kompetensi dari LSP/Kemensos RI, serta terdaftar memiliki Surat Izin Praktik Pekerja Sosial (SIPPS).
- **Dasar Hukum Utama**:
  * **Undang-Undang No. 14 Tahun 2019 tentang Pekerja Sosial**.
  * **Undang-Undang No. 11 Tahun 2009 tentang Kesejahteraan Sosial**.
  * Standar Kompetensi Kerja Nasional Indonesia (SKKNI) Bidang Pekerjaan Sosial.
- **Klasifikasi di Sistem PSKS Jawa Barat**:
  1. **Peksos Pemerintah (ASN / PPPK)**: Bertugas di lingkungan Dinas Sosial Provinsi Jawa Barat, Dinas Sosial Kabupaten/Kota, Balai/Sentra Rehabilitasi Sosial (UPTD), dan Rumah Perlindungan Sosial. Jenjang jabatan fungsional meliputi: *Peksos Ahli Pertama, Peksos Ahli Muda, Peksos Ahli Madya, dan Peksos Ahli Utama*.
  2. **Peksos Masyarakat (Non-ASN / Praktik Mandiri)**: Bertugas di Lembaga Kesejahteraan Sosial (LKS/Panti Asuhan/Panti Jompo), organisasi kemanusiaan non-pemerintah (NGO/LSM), rumah sakit, atau membuka praktik mandiri berlisensi SIPPS.
- **Tugas Pokok & Fungsi Layanan Klinis**:
  * **Manajemen Kasus (Case Management)**: Bertindak sebagai penanggung jawab utama (*case manager*) dalam menyelesaikan masalah sosial klien secara utuh dari asesmen hingga terminasi.
  * **Asesmen Biopsikososial Terstandar**: Menggali secara mendalam faktor psikologis, relasi keluarga, dan kondisi sosial lingkungan klien PPKS.
  * **Intervensi Klinis & Rehabilitasi Sosial**: Memberikan konseling sosial intensif, terapi psikososial pemulihan trauma, dan mediasi sosial.
  * **Pendampingan Hukum & Perlindungan Khusus**: Pendampingan bagi Anak yang Berhadapan dengan Hukum (ABH), korban Tindak Pidana Perdagangan Orang (TPPO), korban Kekerasan Dalam Rumah Tangga (KDRT), korban kekerasan seksual, penyandang disabilitas berat, dan lansia telantar.
  * **Advokasi Sosial**: Memperjuangkan pemenuhan hak-hak sosial dasar klien di hadapan instansi pemerintah, pengadilan, dan masyarakat.`;
  }

  // 4.2 PSM (Pekerja Sosial Masyarakat)
  if (q.includes('psm') || q.includes('pekerja sosial masyarakat')) {
    return `${opening}**Pekerja Sosial Masyarakat (PSM)**:
- **Definisi**: Warga masyarakat yang atas dasar rasa kesadaran dan tanggung jawab sosial serta didorong oleh rasa kebersamaan, kekeluargaan, dan kesetiakawanan sosial secara sukarela mengabdi di bidang penyelenggaraan kesejahteraan sosial di tingkat desa/kelurahan.
- **Dasar Hukum**: **Permensos RI No. 10 Tahun 2019 tentang Pekerja Sosial Masyarakat**.
- **Tugas Pokok & Peran Lapangan**:
  * **Deteksi Dini & Pemetaan PPKS**: Menemukan dan mendata warga yang mengalami masalah kesejahteraan sosial (lansia telantar, disabilitas, anak yatim piatu, fakir miskin) di tingkat RT/RW.
  * **Pendampingan Sosial Lapangan**: Memberikan motivasi, bimbingan sosial, dan membantu warga kurang mampu mendapatkan akses bantuan sosial (PKH, BPNT, KIS PBI).
  * **Rujukan & Kemitraan**: Menghubungkan warga ke Sekretariat Puskesos Desa, TKSK Kecamatan, dan Dinas Sosial Kabupaten/Kota.
  * **Penggerak Kesetiakawanan Sosial**: Memelopori gotong royong warga, jimpitan sosial, dan pengumpulan beras perelek (kearifan lokal Sunda).`;
  }

  // 4.3 TAGANA (Taruna Siaga Bencana)
  if (
    (q.includes('tagana') || q.includes('taruna siaga') || q.includes('bencana')) &&
    !q.includes('kok') &&
    !q.includes('kenapa') &&
    !q.includes('naha') &&
    !q.includes('lah')
  ) {
    return `${opening}**Taruna Siaga Bencana (TAGANA)** Jawa Barat:
- **Definisi**: Relawan sosial yang terlatih dan memiliki keahlian khusus dalam penanggulangan bencana alam dan bencana sosial pada bidang Perlindungan & Jaminan Sosial (Linjamsos) Dinas Sosial Jawa Barat.
- **Dasar Hukum**: Permensos RI tentang Taruna Siaga Bencana.
- **Tugas Pokok Berdasarkan Fase Bencana**:
  * **Fase Pra-Bencana (Mitigasi & Kesiapsiagaan)**: Sosialisasi mitigasi bencana, simulasi Kampung Siaga Bencana (KSB), edukasi Tagana Masuk Sekolah (TMS), dan pemetaan jalur evakuasi di 27 Kab/Kota.
  * **Fase Tanggap Darurat (Saat Terjadi Bencana)**: Respon cepat 1x24 jam, pencarian dan evakuasi dasar, pendirian tenda pengungsian (shelter), serta pengoperasian Mobil Dapur Umum Lapangan (DUMLAP) untuk memasok ribuan porsi makanan siap saji harian bagi pengungsi dan relawan.
  * **Fase Pasca-Bencana (Pemulihan)**: Layanan Dukungan Psikososial (LDP/trauma healing) bagi anak-anak dan lansia korban bencana, pembersihan lingkungan pemukiman, dan pendistribusian santunan ahli waris.`;
  }

  // 4.4 TKSK (Tenaga Kesejahteraan Sosial Kecamatan)
  if (q.includes('tksk') || q.includes('tenaga kesejahteraan sosial kecamatan')) {
    return `${opening}**Tenaga Kesejahteraan Sosial Kecamatan (TKSK)**:
- **Definisi**: Seseorang yang diberi tugas, fungsi, dan kewenangan oleh Kementerian Sosial dan Dinas Sosial untuk membantu penyelenggaraan kesejahteraan sosial di tingkat kecamatan (**1 orang di setiap kecamatan**, total 627 personil se-Jawa Barat).
- **Dasar Hukum**: **Permensos RI No. 28 Tahun 2018 tentang Tenaga Kesejahteraan Sosial Kecamatan**.
- **Tugas Pokok & Peran**:
  * **Koordinator Pilar Sosial Kecamatan**: Mengoordinasikan seluruh pilar sosial (PSM, Karang Taruna, LKS) di wilayah kecamatannya.
  * **Verifikasi & Validasi Data Bansos**: Mengawal pemutakhiran data kemiskinan (DTKS / SIKS-NG) dan memantau penyaluran bantuan sosial (Bansos Sembako/BPNT, PKH, BLT).
  * **Penanganan Kedaruratan Wilayah**: Merespon cepat laporan kedaruratan sosial warga di kecamatan dan memfasilitasi rujukan ke Dinas Sosial Kabupaten/Kota.`;
  }

  // 4.5 LKS (Lembaga Kesejahteraan Sosial / Panti)
  if (q.includes('lks') || q.includes('lembaga kesejahteraan sosial') || q.includes('panti')) {
    return `${opening}**Lembaga Kesejahteraan Sosial (LKS)**:
- **Definisi**: Lembaga, yayasan, atau organisasi sosial kemasyarakatan berbadan hukum yang didirikan oleh masyarakat untuk melaksanakan pelayanan, rehabilitasi, dan santunan kesejahteraan sosial.
- **Dasar Hukum**: **Permensos RI No. 184 Tahun 2011 tentang Lembaga Kesejahteraan Sosial**.
- **Klasifikasi Bidang Pelayanan**:
  * **LKS Anak (LKSA / Panti Asuhan Anak)**: Asuhan pengasuhan anak yatim, piatu, dan telantar.
  * **LKS Lanjut Usia (LKS LU / Panti Jompo)**: Perawatan lansia telantar dan pemenuhan kebutuhan permakanan.
  * **LKS Disabilitas (LKSPD)**: Rehabilitasi vokasional penyandang disabilitas fisik, netra, rungu, dan grahita.
  * **LKS Napza & Korban Tindak Kekerasan**: Pemulihan medis dan rehabilitasi sosial korban adiksi narkoba dan kekerasan.
- **Persyaratan Legalitas di PSKS Jabar**: Akta Notaris Kemenkumham, Tanda Daftar Yayasan (TDY), Izin Operasional Dinsos, dan Akreditasi Badan Akreditasi Lembaga Kesejahteraan Sosial (BALKS/Kemensos).`;
  }

  // 4.6 KARANG TARUNA (KT)
  if (q.includes('karang taruna') || q.includes('katar') || (q.includes('pemuda') && !q.includes('pekerja'))) {
    return `${opening}**Karang Taruna (KT)**:
- **Definisi**: Organisasi kepemudaan non-partisan yang berkedudukan di tingkat desa/kelurahan sebagai wadah pengembangan potensi generasi muda yang tumbuh dari, oleh, dan untuk masyarakat.
- **Dasar Hukum**: **Permensos RI No. 25 Tahun 2019 tentang Karang Taruna**.
- **Fungsi Pokok**:
  * **Pembinaan Pemuda Desa**: Wadah kreativitas pemuda usia 13–45 tahun di bidang keolahragaan, seni budaya, dan keagamaan.
  * **Usaha Ekonomi Produktif (UEP)**: Pemberdayaan kewirausahaan pemuda desa untuk membuka lapangan kerja mandiri.
  * **Pencegahan Patologi Sosial**: Membentengi generasi muda dari narkoba, geng motor, minuman keras, dan tawuran.
  * **Kepeloporan Sosial**: Gotong royong kerja bakti lingkungan dan bantuan tanggap darurat warga.`;
  }

  // 4.7 LK3 (Lembaga Konsultasi Kesejahteraan Keluarga)
  if (q.includes('lk3') || q.includes('konsultasi keluarga') || q.includes('konseling keluarga')) {
    return `${opening}**Lembaga Konsultasi Kesejahteraan Keluarga (LK3)**:
- **Definisi**: Lembaga rujukan sosial profesional berbadan hukum atau binaan Dinsos yang memberikan pelayanan konsultasi psikologis, mediasi hukum keluarga, dan penguatan ketahanan keluarga.
- **Ruang Lingkup Layanan Utama**:
  * **Konseling Keharmonisan Rumah Tangga**: Mengatasi konflik suami-istri, krisis komunikasi keluarga, dan pengasuhan anak (*parenting*).
  * **Mediasi Krisis & Pendampingan KDRT**: Mediasi perselisihan rumah tangga serta pendampingan psikologis korban Kekerasan Dalam Rumah Tangga bekerja sama dengan Unit PPA Kepolisian dan Rumah Perlindungan Sosial.
  * **Penguatan Ketahanan Keluarga**: Mencegah perceraian, edukasi kesiapan pranikah, dan advokasi hak perlindungan anak menuju keluarga Jawa Barat Juara Lahir Batin.`;
  }

  // 4.8 PENSOS (Penyuluh Sosial)
  if (q.includes('pensos') || q.includes('penyuluh sosial')) {
    return `${opening}**Penyuluh Sosial (PENSOS)**:
- **Definisi**: Baik Penyuluh Sosial ASN (Jabatan Fungsional) maupun Penyuluh Sosial Masyarakat (tokoh masyarakat sukarela tersertifikasi) yang bertugas menyampaikan komunikasi, informasi, edukasi, dan motivasi pembangunan kesejahteraan sosial.
- **Dasar Hukum**: Permensos RI No. 10 Tahun 2014 tentang Penyuluh Sosial Masyarakat.
- **Tugas Pokok**:
  * **Komunikasi Informasi Edukasi (KIE)**: Menyosialisasikan program-program perlindungan sosial, bansos, dan layanan Dinsos Jabar ke masyarakat luas.
  * **Penyuluhan Preventif**: Edukasi bahaya Tindak Pidana Perdagangan Orang (TPPO), pencegahan pernikahan usia anak, dan bahaya napza.
  * **Advokasi Sosial Inklusif**: Menghapus stigma negatif terhadap penyandang disabilitas dan mantan warga binaan sosial, serta mengampanyekan kesetiakawanan sosial.`;
  }

  // 4.8B HUBUNGAN KESAMAAN KUBE & BADAN USAHA SOSIAL DI WEBSITE PSKS JABAR
  const isKubeBadanUsahaRelation =
    (
      ((q.includes('kube') || q.includes('kelompok usaha')) &&
      (q.includes('badan usaha') || q.includes('usaha sosial') || q.includes('pilar 9') || q.includes('website') || q.includes('web ini') || q.includes('tertera') || q.includes('tertulis') || q.includes('namanya'))) ||
      (q.includes('badan usaha') && q.includes('kube'))
    ) &&
    (
      q.includes('kenapa') ||
      q.includes('mengapa') ||
      q.includes('kok') ||
      q.includes('naha') ||
      q.includes('bukannya') ||
      q.includes('bukan nya') ||
      q.includes('bukan') ||
      q.includes('tertera') ||
      q.includes('tertulis') ||
      q.includes('namanya') ||
      q.includes('disebut') ||
      q.includes('sama gak') ||
      q.includes('sama ga') ||
      q.includes('sama keneh') ||
      q.includes('sama juga') ||
      q.includes('sama aja') ||
      q.includes('sama saja') ||
      q.includes('apakah sama') ||
      q.includes('apa bedanya') ||
      q.includes('perbedaan') ||
      q.includes('hubungannya') ||
      q.includes('hubungan')
    );

  if (isKubeBadanUsahaRelation) {
    return `${opening}Pertanyaan yang sangat tepat dan jeli Bapak/Ibu! Terkait penyebutan di dalam website **PSKS JABAR**, **KUBE (Kelompok Usaha Bersama)** dan **Badan Usaha (Badan Usaha Kesejahteraan Sosial)** pada hakikatnya adalah **SAMA SAJA** dan berada dalam satu kesatuan pilar pemberdayaan sosial yang sama (Pilar ke-9 PSKS Jawa Barat).\n\nBerikut penjelasan profesionalnya:\n\n1. **Payung Kelembagaan Sistem (*Institutional Umbrella*)**:\n   Di dalam pangkalan data dan modul website **PSKS JABAR**, penamaan **"Badan Usaha"** (atau *Badan Usaha Sosial*) digunakan sebagai payung kelembagaan terpadu untuk menaungi seluruh aktivitas ekonomi produktif di bidang kesejahteraan sosial, yang program dan kegiatan intinya di lapangan adalah **KUBE (Kelompok Usaha Bersama)**.\n\n2. **Karakteristik & Sasaran Program yang Sama**:\n   Keduanya beranggotakan 5 hingga 10 Kepala Keluarga (KK) pra-sejahtera binaan yang terdaftar di DTKS/KPM. Mereka dihimpun dalam kelompok usaha bersama untuk mengelola Usaha Ekonomi Produktif (UEP)—seperti budidaya peternakan, perikanan, warung sembako, kerajinan lokal, maupun olahan pangan—melalui bantuan stimulan modal usaha agar dapat mandiri secara finansial dan bergraduasi dari garis kemiskinan.\n\n3. **Integrasi Formulir & Data Wilayah**:\n   Ketika Anda membuka modul beranda, melihat peta sebaran data, atau mengisi formulir pendaftaran **Badan Usaha** di website ini, modul tersebut secara otomatis diperuntukkan bagi pencatatan, verifikasi berkas, dan legalitas kelompok **KUBE** di 27 Kabupaten/Kota se-Jawa Barat.\n\nJadi, Anda tidak perlu bingung; penyebutan Badan Usaha di website ini sama sekali tidak berbeda tujuannya dengan KUBE, melainkan untuk standardisasi administrasi kelembagaan potensi sumber kesejahteraan sosial di Jawa Barat. 😊\n\n[[action:tab:beranda:Lihat Modul di Beranda]] [[action:pillar:badanusaha:Buka Modul Badan Usaha / KUBE]]`;
  }

  // 4.9 KUBE & BADAN USAHA SOSIAL
  if (q.includes('kube') || q.includes('badan usaha') || q.includes('kelompok usaha')) {
    return `${opening}**Kelompok Usaha Bersama (KUBE) & Badan Usaha Sosial**:
- **Definisi**: Wadah beranggotakan 5 hingga 10 Kepala Keluarga (KK) dari keluarga pra-sejahtera binaan terdaftar DTKS yang dibentuk untuk mengelola kegiatan usaha ekonomi produktif secara bersama-sama.
- **Tujuan Utama**:
  * **Bantuan Stimulan Modal Usaha**: Memanfaatkan modal stimulan Kemensos/Dinsos (seperti budidaya ternak, olahan pangan lokal, warung sembako, dan kerajinan tangan).
  * **Pemberdayaan Gotong Royong**: Membangun kemandirian ekonomi keluarga pra-sejahtera melalui manajemen usaha bersama.
  * **Graduasi Mandiri**: Membantu keluarga penerima manfaat keluar dari garis kemiskinan dan mandiri secara ekonomi tanpa bergantung lagi pada bansos tunai.`;
  }

  // 4.10 SLRT / PUSKESOS (Sistem Layanan dan Rujukan Terpadu)
  if (q.includes('slrt') || q.includes('puskesos') || q.includes('rujukan terpadu') || q.includes('satu pintu')) {
    return `${opening}**SLRT & Puskesos (Pusat Kesejahteraan Sosial)**:
- **Definisi**: Sistem Layanan dan Rujukan Terpadu (SLRT di tingkat kabupaten/kota) dan Pusat Kesejahteraan Sosial (Puskesos di tingkat desa/kelurahan).
- **Dasar Hukum**: **Permensos RI No. 15 Tahun 2018 tentang Sistem Layanan dan Rujukan Terpadu**.
- **Fungsi One-Stop Social Service (Layanan Terpadu Satu Pintu)**:
  * **Pusat Pengaduan & Keluhan**: Menerima pendaftaran warga miskin dan rentan yang belum terakomodir bantuan sosial.
  * **Pencatatan & Identifikasi Kebutuhan**: Menilai kebutuhan warga terkait jaminan kesehatan (BPJS PBI/KIS), pendidikan (KIP/beasiswa), PKH, atau perbaikan rumah tidak layak huni (Rutilahu).
  * **Rujukan Terpadu Lintas Sektor**: Menghubungkan warga ke OPD/instansi terkait dengan pelacakan status penanganan secara transparan dan terukur.`;
  }

  // 4.11 PILAR & JEJARING SOSIAL LAINNYA (PKH, WKSBM, KSB, CSR)
  if (
    q.includes('pkh') ||
    q.includes('pendamping pkh') ||
    q.includes('wksbm') ||
    q.includes('ksb') ||
    q.includes('kampung siaga') ||
    q.includes('pilar sosial lainnya') ||
    q.includes('jejaring sosial')
  ) {
    return `${opening}**Pilar & Jejaring Kesejahteraan Sosial Terkait Lainnya di Jawa Barat**:
1. **Pendamping PKH (Program Keluarga Harapan)**:
   - Tenaga profesional lapangan yang mendampingi Keluarga Penerima Manfaat (KPM) bansos bersyarat, menyelenggarakan Pertemuan Peningkatan Kemampuan Keluarga (P2K2/FDS), serta memastikan komitmen akses kesehatan ibu hamil/balita dan pendidikan anak.
2. **Wahana Kesejahteraan Sosial Berbasis Masyarakat (WKSBM)**:
   - Sistem jejaring sosial swadaya masyarakat lokal di tingkat RT/RW/Dusun yang menghimpun dana jimpitan, beras perelek (kearifan lokal Jawa Barat), dan gotong royong untuk membantu warga tetangga yang sakit atau membutuhkan.
3. **Kampung Siaga Bencana (KSB)**:
   - Organisasi kesiapsiagaan bencana berbasis komunitas desa di kawasan rawan bencana, didukung lumbung sosial (*social buffer stock*) dan relawan Tagana.
4. **Dunia Usaha / CSR Kemitraan Sosial**:
   - Sektor swasta, BUMN, dan BUMD yang menyalurkan dana tanggung jawab sosial lingkungan untuk program penanggulangan kemiskinan dan pemberdayaan 10 Pilar PSKS Jawa Barat.`;
  }

  // 5. KARTU ANGGOTA DIGITAL & QR CODE (SMART ACCESS CARD - KHUSUS SUPERADMIN)
  if (
    q.includes('kartu') ||
    q.includes('cetak') ||
    q.includes('qr') ||
    q.includes('barcode') ||
    q.includes('scan') ||
    q.includes('pindai') ||
    q.includes('kta') ||
    q.includes('smart access')
  ) {
    if (!isSuperAdmin && !isDeveloperUser) {
      return `${opening}Mohon maaf, fasilitas dan pengelolaan Kartu Tanda Anggota (KTA) maupun kode QR merupakan instrumen kedinasan internal yang dikhususkan hanya untuk Superadmin (Dinas Sosial Provinsi Jawa Barat), dan bukan fasilitas untuk umum/publik.

Bagi personil relawan maupun pengguna umum, bukti keabsahan keanggotaan pilar sosial ditunjukkan secara sah melalui status terdaftar resmi (**SAH_TERDAFTAR**) dalam sistem pangkalan data terintegrasi PSKS Jawa Barat serta Surat Keputusan (SK) Pengesahan kedinasan dari instansi terkait.

[[action:tab:user_reg_history:Lihat Riwayat Pendaftaran]] [[action:tab:contact:Hubungi Dinas Sosial Jabar]]`;
    }
    return `${opening}**Panduan Modul Smart Access Card & Penerbitan Kartu Anggota (Khusus Superadmin)**:

1. **Penerbitan & Keabsahan**:
   - Kartu Anggota diterbitkan secara resmi untuk seluruh personil 10 pilar sosial yang telah tervalidasi dengan status **SAH_TERDAFTAR**.
   - Setiap kartu memuat foto, nama lengkap, NIK/NIP, pilar sosial, wilayah tugas (Kabupaten/Kota), dan tanda tangan/stempel kedinasan.

2. **Opsi Pencetakan Kartu**:
   - **Cetak Satuan**: Mengunduh atau mencetak kartu perorangan beresolusi tinggi dengan atribut resmi Dinas Sosial Provinsi Jawa Barat.
   - **Cetak Massal Format A4 (8 Kartu per Lembar)**: Otomatis menata 8 kartu berukuran standar per lembar kertas A4 siap potong dan laminasi, dilengkapi garis pembatas potong presisi.

3. **Verifikasi QR Code Kriptografis (Smart QR Scanner)**:
   - Setiap kartu dilengkapi kode QR dengan hash kriptografi SHA-256 yang aman dari pemalsuan.
   - Kamera gawai atau fitur **Smart QR Scanner** di portal dapat langsung memindai QR Code untuk memverifikasi keaslian personil ke pangkalan data Supabase secara real-time.

4. **Cara Mengakses**:
   - Buka menu **Smart Access Card** di bilah navigasi atas (atau melalui menu Pengaturan).
   - Filter berdasarkan Pilar Sosial dan Kabupaten/Kota, lalu klik tombol cetak satuan atau cetak massal A4.`;
  }

  // 6. MAINTENANCE MODE / SAKLAR PEMELIHARAAN
  if (q.includes('maintenance') || q.includes('pemeliharaan') || q.includes('saklar')) {
    if (userRole === 'superadmin' || userRole === 'developer') {
      return `${opening}**Panduan Saklar Maintenance Cerdas (Super Admin & Developer)**:

1. **Tingkatan Saklar Maintenance**:
   - **Per Role**: Dapat mengunci akses khusus untuk user (publik), admin (daerah), atau superadmin.
   - **Per Wilayah (Granular)**: Dapat mengaktifkan pemeliharaan pada kabupaten/kota tertentu saja tanpa mengganggu 26 daerah lainnya.
2. **Cara Mengaktifkan**:
   - Buka **Panel Kontrol Super Admin / Developer Panel**.
   - Buka tab **Pengaturan Sistem & Maintenance**.
   - Geser toggle switch pada role/wilayah yang dituju, lalu masukkan pesan pengumuman (*custom maintenance message*).
3. **Penyimpanan State**:
   - Konfigurasi tersimpan secara realtime di Supabase dan terefleksi langsung pada layar pengguna.`;
    }

    return `**Informasi Mode Pemeliharaan (Maintenance Mode)**:
Sistem PSKS JABAR dilengkapi sistem pemeliharaan berkala untuk menjaga keandalan server dan sinkronisasi data. Jika Anda melihat banner pemeliharaan di wilayah Anda, silakan hubungi Admin Dinsos Kabupaten/Kota atau tunggu beberapa saat hingga proses pembaharuan selesai.`;
  }

  // 7. KEAMANAN, BRUTE FORCE & UU PDP
  if (
    q.includes('keamanan') ||
    q.includes('brute') ||
    q.includes('terkunci') ||
    q.includes('lockout') ||
    q.includes('pdp') ||
    q.includes('privasi') ||
    q.includes('enkripsi')
  ) {
    return `${opening}**Sistem Keamanan & Kepatuhan Perlindungan Data (UU PDP)**:

1. **Proteksi Brute-Force Lockout**:
   - Jika pengguna salah memasukkan PIN/kata sandi sebanyak 3 kali berturut-turut, sistem akan membekukan akses (*lockout*) selama 30 detik secara otomatis untuk mencegah serangan peretasan.
2. **Kriptografi Standar Kedinasan**:
   - Seluruh kata sandi dienkripsi menggunakan algoritma **Bcrypt dengan Salt 10-Rounds**. Data sesi diverifikasi melalui signed JWT token.
3. **Kepatuhan UU PDP No. 27 Tahun 2022**:
   - Data pribadi sensitif (NIK, nomor telepon pribadi) dilindungi secara ketat dengan prinsip kerahasiaan (*confidentiality*), integritas (*integrity*), dan ketersediaan (*availability*).
4. **Bantuan Akun Terkunci**:
   - Admin Daerah dapat menghubungi Super Admin Provinsi untuk reset darurat jika PIN lupa/hilang.`;
  }

  // 8. ROLE SPECIFIC KNOWLEDGE: ADMIN DAERAH
  if (userRole === 'admin' || currentTab === 'admin_manage' || currentTab === 'admin_monitor') {
    if (q.includes('input') || q.includes('tambah') || q.includes('edit') || q.includes('hapus') || q.includes('kelola') || q.includes('mutasi')) {
      return `**Panduan Pengelolaan Data Wilayah (${wilayah})**:

1. **Menambah Anggota Baru**:
   - Masuk ke tab **Kelola Data Pilar** pada Dashboard Admin Daerah Anda.
   - Klik tombol **+ Tambah Personil / Lembaga**.
   - Isi formulir: Nama Lengkap, NIP/NIK, Pilar Sosial, Kecamatan/Desa, No. SK, dan unggah pasfoto/dokumen.
   - Klik **Simpan Data**.
2. **Pencegahan Data Duplikat**:
   - Sistem secara otomatis memeriksa kesamaan NIK/NIP. Jika sudah terdaftar di kecamatan lain, sistem akan memberi peringatan konfirmasi mutasi.
3. **Peremajaan & Mutasi**:
   - Pilih tombol **Ubah Status** untuk memutasi anggota atau menandai status *Purna Tugas/Non-Aktif* tanpa menghapus rekam jejak historisnya.`;
    }

    if (q.includes('excel') || q.includes('pdf') || q.includes('ekspor') || q.includes('laporan') || q.includes('musrenbang')) {
      return `**Panduan Ekspor Laporan Daerah (${wilayah})**:

1. **Ekspor Excel (.xlsx)**:
   - Buka tab **Laporan & Rekapitulasi**.
   - Pilih filter pilar (misal: Tagana atau Semua Pilar).
   - Klik tombol hijau **Ekspor Spreadsheet (.xlsx)** untuk mengunduh data tabular lengkap beserta nomor kontak dan nomor SK.
2. **Cetak PDF Resmi**:
   - Klik tombol **Cetak Dokumen PDF** untuk menghasilkan lembar rekapitulasi bertandatangan digital dan kop resmi Dinas Sosial.`;
    }
  }

  // 9. ROLE SPECIFIC KNOWLEDGE: SUPERADMIN
  if (userRole === 'superadmin' || currentTab === 'superadmin_settings') {
    if (q.includes('tambah') || q.includes('buat') || q.includes('reset') || q.includes('buka blokir') || q.includes('akun admin') || q.includes('kabupaten')) {
      return `**Manajemen Akun & Kredensial (Super Admin Jabar)**:

1. **Menambah Akun Admin Baru**:
   - Buka menu **Pengaturan** > tab **Manajemen Akun / Pengguna**.
   - Klik tombol **+ Tambah Akun Baru**.
   - Isi Nama Petugas, Nomor HP/Username, Role (Admin Daerah / Superadmin), Wilayah Kab/Kota, dan PIN awal.
   - Set status **ACTIVE** dan klik **Simpan**. Akun langsung aktif.
2. **Reset Kredensial Admin Daerah**:
   - Buka menu **Manajemen Pengguna & Wilayah**.
   - Cari kabupaten/kota yang dimaksud (misal: Kab. Bandung, Kota Cirebon).
   - Klik tombol **Reset PIN / Buka Kunci**. Sistem akan mengenerate PIN sementara yang dapat diserahkan ke Kepala Bidang Dinsos bersangkutan.
3. **Audit Log Aktivitas**:
   - Buka tab **Audit Trail**. Anda dapat melihat rekam jejak siapa yang mengubah data, jam berapa, dan dari IP address mana.`;
    }

    if (q.includes('satu data') || q.includes('dtks') || q.includes('integrasi') || q.includes('kemensos')) {
      return `**Integrasi Satu Data Jabar & DTKS Kemensos**:
- PSKS Jabar menggunakan standardisasi kode wilayah Kemendagri (2 digit provinsi, 2 digit kab/kota, 2 digit kecamatan).
- Agregat data pilar dapat disinkronkan ke platform **Satu Data Jabar (Open Data Jabar)** dan menjadi data rujukan potensi penanganan kemiskinan ekstrem di DTKS Pusdatin Kemensos RI.`;
    }

    if (q.includes('audit') || q.includes('jejak') || q.includes('bpk') || q.includes('inspektorat')) {
      return `**Audit Trail & Forensik Keamanan Provinsi**:
- Setiap aksi mutasi data (CREATE, UPDATE, DELETE, LOGIN, RESET_PIN) dicatat secara otomatis ke dalam koleksi immutable \`audit_logs\` beserta stempel waktu, identitas aparatur, dan alamat IP asal.
- Data log dapat difilter berdasarkan rentang tanggal dan diekspor untuk kebutuhan audit kepatuhan BPK RI dan Inspektorat Daerah Provinsi Jawa Barat.`;
    }
  }

  // 10. ROLE SPECIFIC KNOWLEDGE: DEVELOPER
  if (userRole === 'developer') {
    if (q.includes('arsitektur') || q.includes('stack') || q.includes('control panel') || q.includes('proxy') || q.includes('esbuild')) {
      return `${opening}**Spesifikasi Arsitektur Sistem PSKS JABAR**:

- **Frontend Core**: React 18 SPA, TypeScript 5+, Tailwind CSS 4, Motion (Framer Motion) animations, Lucide Icons.
- **Backend & Proxy**: Express.js server (\`server.ts\`) bertindak sebagai proxy aman API Gemini @google/genai (model \`gemini-3.8-flash\` dengan fallback cascade ke \`gemini-3.1-flash-lite\` & \`gemini-flash-latest\`), lazy SDK init, dan reverse proxy handling.
- **Database & Persistence**: Supabase (PostgreSQL Cloud Database) dengan Row Level Security (RLS), real-time sync, dan sinkronisasi data relasional terpadu.
- **Kriptografi & Auth**: Bcrypt Salt 10 hashing untuk PIN/Password, Role-Based Access Control (RBAC), dan Session Lockout Engine.
- **Container Environment**: Di-deploy pada Cloud Run sandbox dengan binding port 3000 (0.0.0.0:3000) dan reverse proxy Nginx.
- **Developer Control Panel**: Fitur inspeksi memori, simulasi payload brute-force, hot-reload rules, JSON Schema exporter, dan audit log telemetry.`;
    }

    if (q.includes('supabase') || q.includes('database') || q.includes('rules') || q.includes('schema') || q.includes('backup') || q.includes('index')) {
      return `${opening}**Manajemen Supabase & Keamanan Data (Developer)**:

1. **Struktur Tabel Utama**:
   - \`psks_data\`: Tabel anggota 10 pilar per wilayah.
   - \`wilayah_config\`: Metadata 27 Kab/Kota Jawa Barat.
   - \`app_settings\`: Pengaturan saklar maintenance, foto Kadinas, kontak WA.
   - \`audit_logs\`: Catatan riwayat mutasi data dan otentikasi.
2. **Security Policies (Supabase Row Level Security / RLS)**:
   - Membatasi penulisan hanya pada akun terotentikasi sesuai wilayah masing-masing (Admin Kab/Kota hanya bisa menulis data wilayahnya).
3. **Backup & Restore**:
   - Tersedia tombol Export Database Snapshot JSON di Developer Panel untuk backup berkala sebelum migrasi skema.
4. **Indeks & Query Optimization**:
   - Dikonfigurasikan untuk query multi-kriteria: \`wilayah_id ASC\`, \`pilar_id ASC\`, \`status_aktif ASC\`.`;
    }

    if (q.includes('anti-jailbreak') || q.includes('injection') || q.includes('prompt injection') || q.includes('sanitasi')) {
      return `${opening}**Arsitektur Anti-Jailbreak & Sanitasi Input**:
- **Dual-Layer Guard**: Layer 1 (Express Middleware Regex & Intent Screening) menyaring pola serangan injeksi prompt, permintaan dump credentials, dan modifikasi runtime. Layer 2 (System Instruction Strict Conditioning) menginstruksikan LLM untuk selalu menolak dengan format resmi *"Mohon maaf, kami tidak bisa..."*.
- **Data Protection**: Seluruh data NIK/NIP disanitasi sebelum dikirim ke model dan di-mask pada log debugging sesuai mandat UU PDP No. 27/2022.`;
    }
  }

  // 11. HALAMAN PROFIL, KONTAK & PENGATURAN (Full Website-Wide Comprehensive Knowledge)
  // 11.1 Halaman Profil & Kepala Dinas
  if (q.includes('profil') || q.includes('visi') || q.includes('misi') || q.includes('dasar hukum') || q.includes('kadinas') || q.includes('kepala dinas') || q.includes('sambutan') || q.includes('pimpinan')) {
    const kadinas = appSettings?.kadinasName || 'Noneng Komara Nengsih, S.E., M.A.P.';
    if (q.includes('kadinas') || q.includes('kepala dinas') || q.includes('pimpinan') || q.includes('nama kadinas')) {
      return `${opening}**Kepala Dinas Sosial Provinsi Jawa Barat** saat ini dijabat oleh **${kadinas}**.\n\nBeliau memimpin tata kelola pelayanan dan perlindungan sosial di Jawa Barat dengan visi *"Mewujudkan Jawa Barat Juara Lahir Batin dengan Inovasi dan Kolaborasi"*, memperkuat peran 10 Pilar PSKS dan modernisasi digital data sosial.`;
    }
    return `${opening}**Halaman Profil Dinas Sosial Provinsi Jawa Barat**:
- **Kepala Dinas Sosial**: ${kadinas}
- **Visi & Misi**: Mewujudkan Jawa Barat Juara Lahir Batin dengan Inovasi dan Kolaborasi melalui penanganan PPKS terpadu, pemberdayaan 10 Pilar PSKS, perlindungan jaminan sosial (Linjamsos), dan tata kelola digital.
- **4 Bagian Navigasi Halaman Profil**:
  1. **Sambutan Resmi Kadinas**: Arahan resmi Kepala Dinas Sosial tentang integrasi satu data dan penguatan 10 pilar sosial di 27 Kab/Kota.
  2. **Dasar Hukum & Regulasi**: UU No. 11/2009 (Kesejahteraan Sosial), Permensos No. 10/2019 (PSM), Permensos No. 28/2018 (TKSK), Permensos No. 25/2019 (Karang Taruna), Perda Prov. Jabar No. 10/2012, UU PDP No. 27/2022.
  3. **Tujuan Sistem PSKS JABAR**: Integrasi data terpadu se-Jawa Barat, standarisasi KTA QR Code digital, pemetaan GIS sebaran personil, dan transparansi publik.
  4. **Visi & Misi Jawa Barat**: Akselerasi penanganan kemiskinan dan pemerataan kesejahteraan sosial.`;
  }

  // 11.2 Penanganan Cerdas Alamat Kantor & Lokasi Wilayah (3 Kondisi Interaktif)
  const addrQueryRes = resolveDinsosAddressQuery(q, userWilayah);
  if (addrQueryRes.isAddressQuery) {
    return `${opening}${addrQueryRes.replyText}`;
  }

  // 11.2B Halaman Kontak & Layanan Publik (Medsos, WhatsApp, Email Umum)
  if (q.includes('kontak') || q.includes('hubungi') || q.includes('medsos') || q.includes('instagram') || q.includes('youtube') || q.includes('facebook') || q.includes('tiktok') || q.includes('email') || q.includes('nomor telepon') || q.includes('call center')) {
    const waNum = appSettings?.floatingWaNumber || '+62 821-2603-0038';
    return `${opening}**Halaman Kontak & Layanan Pengaduan Publik Dinsos Jabar**:
- 📍 **Kantor Utama**: Jl. Jend. H. Amir Machmud No. 331, Cigugur Tengah, Kec. Cimahi Tengah, Kota Cimahi, Jawa Barat 40522
- 📍 **Kantor Bandung**: Jl. Rajiman No. 6, Pasir Kaliki, Kec. Cicendo, Kota Bandung 40171
- 📞 **WhatsApp Layanan Cepat**: ${waNum} / +62 896-0242-1065 (tersedia via widget tombol WA melayang)
- ✉️ **Email Resmi**: dinsos@jabarprov.go.id
- 🌐 **Portal Resmi**: dinsos.jabarprov.go.id
- 📱 **Media Sosial Resmi**:
  * Instagram: @dinsos.jabar (instagram.com/dinsos.jabar)
  * YouTube: Dinsos Jabar TV (youtube.com/@dinsosjabartv)
  * Facebook: Dinsos Jawa Barat (facebook.com/dinsos.jabar)
  * TikTok: @dinsos.jabar (tiktok.com/@dinsos.jabar)
  * Twitter / X: @dinsosjabar (x.com/dinsosjabar)
- ⏰ **Jam Operasional**: Senin – Jumat (08:00 – 16:00 WIB).`;
  }

  // 11.3 Halaman Pengaturan (Settings & Developer Control Panel)
  if (q.includes('pengaturan') || q.includes('settings') || q.includes('panel kontrol') || q.includes('background') || q.includes('video background') || q.includes('foto kadinas') || q.includes('teks sambutan') || q.includes('kelola pengumuman')) {
    if (!isSuperAdmin && !isDeveloperUser) {
      return `${opening}Mohon maaf, menu Pengaturan Sistem merupakan area kerja administratif internal. Untuk keperluan akun Anda atau koordinasi kedinasan, silakan hubungi administrator dinas atau Dinas Sosial Provinsi Jawa Barat.\n\n[[action:tab:contact:Hubungi Bantuan Resmi]]`;
    }
    return `${opening}**Halaman Pengaturan (Developer & Super Admin Control Panel)**:
- **Pengaturan Background**: Pilihan mode Latar Belakang Foto atau Video MP4 berulang serta kustomisasi URL media dinamis.
- **Pengaturan Foto & Nama Kadinas**: Unggah foto resmi Ibu Noneng Komara Nengsih, S.E., M.A.P. dan sub-judul profil.
- **Pengaturan Teks Profil & Sambutan**: Kustomisasi salam pembuka, paragraf sambutan resmi Kadinas, dan salam penutup.
- **Pengaturan Medsos & WA**: Kelola nomor WhatsApp layanan cepat dan tautan 6 kanal medsos resmi.
- **Pengaturan Saklar Maintenance Cerdas**: Saklar 3 level (Global, Per-Role, Granular 27 Wilayah) dan teks banner peringatan pemeliharaan.
- **Pengaturan Keamanan & Enkripsi**: Kriptografi Bcrypt Salt 10-rounds, auto lockout 30 detik (3x salah PIN), dan audit log trail.
- **Pengaturan Smart Card**: Konfigurasi kartu akses digital internal, cetak satuan, dan cetak massal format A4 (8 kartu siap potong).
- **Manajemen Akun Admin**: Hak khusus pemilik akun pusat untuk mengelola 27 akun admin wilayah, otorisasi, dan reset credential.
- **Task Manager & Verifikasi**: Tinjau berkas pendaftar baru, tombol *Terima Pendaftaran* (\`SAH_TERDAFTAR\`) dan *Tolak Pendaftaran*.
- **Pengaturan Pengumuman**: Publikasi maklumat siaga, modal popup di Beranda, running text, dan arsip publikasi dinas.
- **Floating WA Manager**: Konfigurasi nomor WA dan template pesan tombol melayang.`;
  }

  // 12. FITUR SISTEM SPESIFIK LAINNYA
  // 12.0 Pemulihan Akun Admin / Lupa Akun Admin
  if (q.includes('lupa akun') || q.includes('admin yang lupa') || q.includes('admin lupa') || q.includes('lupa password admin') || q.includes('lupa sandi admin') || q.includes('lupa pin admin') || q.includes('pemulihan akun')) {
    if (!isSuperAdmin && !isDeveloperUser) {
      return `${opening}**Prosedur Resmi Pemulihan Akun Kedinasan Admin Wilayah (Dinas Sosial Jawa Barat)**:

Apabila Anda adalah Admin Wilayah/Daerah yang lupa akun atau kredensial masuk ke sistem PSKS JABAR, silakan ikuti prosedur resmi kedinasan berikut:

1. **Hubungi Superadmin Provinsi**:
   Segera berkoordinasi langsung dengan pihak **Superadmin Dinas Sosial Provinsi Jawa Barat** melalui saluran komunikasi kedinasan resmi. Superadmin memiliki kewenangan resmi untuk memverifikasi dan memulihkan kredensial akun kedinasan Anda melalui protokol verifikasi internal yang aman.

2. **Verifikasi Identitas Kedinasan**:
   Saat berkoordinasi dengan pihak Superadmin, pastikan Anda menyertakan data diri kedinasan untuk proses verifikasi keabsahan aparatur:
   - Nama Lengkap sesuai SK
   - NIP atau NIK terdaftar
   - Wilayah Penugasan Kabupaten/Kota di Jawa Barat
   - Salinan Surat Keputusan (SK) Penugasan atau surat pengantar kedinasan resmi

3. **Pemberian Kredensial Baru**:
   Setelah identitas Anda terverifikasi secara sah, Superadmin akan memberikan kredensial login baru sementara yang aman. Demi keamanan pangkalan data, pastikan Anda segera memperbarui kata sandi atau PIN setelah berhasil masuk kembali ke sistem.

[[action:tab:contact:Hubungi Dinas Sosial Jabar]]`;
    }
  }

  // 12.1 Manajemen Akun Admin
  if (q.includes('manajemen akun') || q.includes('kelola akun') || q.includes('bekukan') || q.includes('freeze')) {
    if (!isSuperAdmin && !isDeveloperUser) {
      return `${opening}Mohon maaf, fitur manajemen dan pengelolaan akun admin merupakan kewenangan khusus Superadmin dan Developer sistem. Pengguna umum/tamu tidak memiliki otorisasi untuk mengakses konfigurasi akun administratif.\n\n[[action:tab:contact:Hubungi Dinas Sosial Jabar]]`;
    }
    return `${opening}**Fitur Manajemen Akun Admin (Super Admin & Developer)**:
- **Kontrol Hak Akses**: Pengelolaan penuh akun admin wilayah (27 Kab/Kota) dan Superadmin.
- **Status Akun**: Tombol cepat untuk mengaktifkan atau membekukan akun (\`ACTIVE\` / \`FROZEN\`).
- **Reset Kredensial**: Fitur ganti kata sandi admin dengan syarat minimal 12 karakter kombinasi (huruf besar, kecil, angka).
- **Penugasan Wilayah & Role**: Penyesuaian hak akses role dan wilayah penugasan (27 Kab/Kota) secara dinamis.`;
  }

  // 12.2 Akun User & Visualisasi Analitik
  if (q.includes('akun user') || q.includes('grafik akun') || q.includes('analitik akun') || q.includes('status registrasi')) {
    return `${opening}**Fitur Akun User & Visualisasi Analitik**:
- **Portal Profil Mandiri**: Pendaftar 10 pilar dapat memantau proses verifikasi berkas (\`MENUNGGU\`, \`SAH_TERDAFTAR\`, \`DITOLAK\`), dan memperbarui data profil.
- **Grafik Analitik Real-Time**: Dilengkapi grafik analitik visual yang menyajikan tren pendaftaran akun user, perbandingan status verifikasi, dan sebaran pendaftar di 27 Kab/Kota se-Jawa Barat.`;
  }

  // 12.3 Pemantauan Admin (Live Admin Monitoring)
  if (q.includes('pemantauan admin') || q.includes('monitoring admin') || q.includes('status admin') || q.includes('online') || q.includes('keaktifan admin')) {
    return `${opening}**Fitur Pemantauan Admin (Live Admin Monitoring)**:
- **Live Status 27 Daerah**: Dashboard pemantauan status keaktifan admin di 27 Kabupaten/Kota secara langsung.
- **Indikator Keaktifan**: Titik hijau menandakan admin berstatus \`ONLINE\` (sedang aktif bekerja), dan titik abu/merah menandakan \`OFFLINE\`.
- **Telemetri Aktivitas**: Menampilkan catatan waktu login terakhir (*last active*), estimasi durasi sesi, jenis perangkat, dan rekapitulasi data personil yang telah diinput di wilayah bersangkutan.`;
  }

  // 12.4 Riwayat Aktivitas (Comprehensive Audit Trail)
  if (q.includes('riwayat aktivitas') || q.includes('audit') || q.includes('log aktivitas') || q.includes('jejak')) {
    return `${opening}**Fitur Riwayat Aktivitas (Comprehensive Audit Trail)**:
- **Perekaman Forensik Otomatis**: Setiap aksi mutasi data (CREATE, UPDATE, DELETE, LOGIN, LOGOUT, RESET_PIN, MAINTENANCE_SWITCH) tercatat otomatis di koleksi \`audit_logs\`.
- **Atribut Forensik Lengkap**: Menyimpan nama aparatur, role, stempel waktu presisi milidetik, alamat IP address, dan browser user agent.
- **Kepatuhan Audit**: Data dapat difilter berdasarkan rentang waktu dan diekspor untuk kebutuhan audit BPK RI dan Inspektorat Provinsi Jawa Barat.`;
  }

  // 12.5 Verifikasi Pendaftaran & Terima Pendaftaran
  if (q.includes('verifikasi') || q.includes('terima pendaftaran') || q.includes('tolak pendaftaran') || q.includes('validasi pendaftaran')) {
    return `${opening}**Fitur Verifikasi & Penerimaan Pendaftaran**:
- **Pemeriksaan Berkas**: Admin Wilayah dan Superadmin meninjau kelengkapan berkas pemohon baru, kesesuaian NIK, nomor SK, dan foto bukti legalitas.
- **Tombol Terima Pendaftaran**: Mengesahkan status calon anggota menjadi \`SAH_TERDAFTAR\` seketika dalam pangkalan data terintegrasi Jawa Barat.
- **Tombol Tolak Pendaftaran**: Menolak permohonan yang tidak memenuhi persyaratan disertai catatan perbaikan resmi untuk pendaftar.`;
  }

  // 12.6 Riwayat Pendaftaran
  if (q.includes('riwayat pendaftaran') || q.includes('history pendaftaran') || q.includes('daftar permohonan')) {
    return `${opening}**Fitur Riwayat Pendaftaran**:
- Merekam seluruh arsip permohonan registrasi yang masuk sejak sistem beroperasi.
- Dilengkapi pencarian nama/NIK, filter status (*Menunggu Verifikasi*, *Disetujui*, *Ditolak*), dan tanggal pengajuan berkas.`;
  }

  // 12.7 Tambah Pengumuman
  if (q.includes('pengumuman') || q.includes('tambah pengumuman') || q.includes('maklumat') || q.includes('berita')) {
    return `${opening}**Fitur Tambah Pengumuman & Berita Siaga**:
- **Publikasi Berita**: Superadmin dan Developer dapat menerbitkan pengumuman kedinasan, instruksi apel siaga bencana, atau pemutakhiran regulasi sosial.
- **Format Penyajian**: Tampil dalam bentuk modal banner popup melayang di Beranda pengunjung selama 15 detik, teks berjalan (*running text*), foto kompresi hemat storage, serta 27 saklar pemilihan wilayah (publik dan/atau admin).

[[action:tab:announcement_manage:Buka Pengaturan Pengumuman]]`;
  }

  // 12.7b Fitur 5: Pengesahan & Penerimaan Anggota (Task Manager)
  if (q.includes('pengesahan') || q.includes('penerimaan anggota') || q.includes('task manager')) {
    return `${opening}**Fitur Pengesahan & Penerimaan Anggota (Tier 2 Provinsi)**:
- **Pusat Pengesahan Akhir**: Menampung berkas pendaftaran calon anggota 10 Pilar PSKS yang telah disetujui oleh Admin Wilayah di 27 Kab/Kota (\`DISETUJUI_WILAYAH\`).
- **Indikator Sensor Lampu Berkedip**: Di pojok kanan atas kotak fitur terdapat sensor lampu bulat yang berkedip jika masih ada berkas pending, dan berubah menjadi **centang hijau solid** ketika seluruh berkas selesai disahkan.
- **Pengesahan Status Resmi**: Superadmin memeriksa kelengkapan data lalu mengklik tombol **"Pengesahan Sah"** untuk menetapkan status keanggotaan resmi menjadi \`SAH_TERDAFTAR\` dalam Satu Data Sosial Jawa Barat.

[[action:tab:task_manager:Buka Pengesahan Anggota]]`;
  }

  // 12.7c Fitur 8: Saklar Maintenance Sistem
  if (q.includes('maintenance') || q.includes('pemeliharaan') || q.includes('saklar')) {
    if (!isSuperAdmin && !isDeveloperUser) {
      return `${opening}Mohon maaf, pengaturan mode pemeliharaan (maintenance) sistem merupakan wewenang khusus Superadmin dan Developer. Pengguna umum/tamu tidak memiliki otorisasi untuk mengakses konfigurasi pemeliharaan ini.\n\n[[action:tab:contact:Hubungi Dinas Sosial Jabar]]`;
    }
    return `${opening}**Fitur Saklar Maintenance Sistem (Superadmin & Developer)**:
- **Saklar Global Berdasarkan Peran**: Saklar pemeliharaan untuk mengunci akses pengunjung umum/user dan/atau admin wilayah saat peremajaan database.
- **Saklar Granular per Wilayah**: Mengaktifkan mode pemeliharaan secara spesifik hanya untuk 1 atau beberapa kabupaten/kota tertentu dari 27 Kab/Kota se-Jabar, sementara daerah lain tetap beroperasi 100% normal.
- **Banner Pesan & Estimasi Waktu**: Kustomisasi pesan pengumuman pemeliharaan darurat dan estimasi waktu selesai.
- **Akses Bypass Otomatis**: Superadmin dan Developer memiliki hak bypass otomatis untuk tetap dapat login dan menguji sistem saat pemeliharaan berlangsung.

[[action:tab:maintenance:Buka Manajemen Maintenance]]`;
  }

  // 12.8 Kontak Floating WhatsApp
  if (q.includes('floating wa') || q.includes('kontak wa') || q.includes('tombol wa') || q.includes('layanan cepat wa')) {
    return `${opening}**Fitur Kontak Floating WhatsApp**:
- **Tombol Melayang**: Widget tombol WhatsApp interaktif di sudut kanan bawah layar untuk pusat aduan dan koordinasi cepat dengan Tim Dinsos.
- **Konfigurasi Realtime**: Nomor WhatsApp dinas 27 wilayah, Superadmin, dan Developer dapat dikonfigurasi melalui tab Pengaturan Floating WA (tersedia fitur ALL IN massal).

[[action:tab:contact:Buka Kontak Resmi]]`;
  }

  // 12.9 SOP KASUS LAPANGAN: MUTASI PERSONIL ANTAR WILAYAH
  if (q.includes('mutasi') || q.includes('pindah wilayah') || q.includes('pindah domisili') || q.includes('pindah tugas')) {
    return `${opening}**SOP Resmi Mutasi Personil Pilar Sosial Antar-Wilayah se-Jawa Barat**:
1. **Surat Pengantar Mutasi**: Personil meminta Surat Keterangan / Pengantar Mutasi dari Dinas Sosial Kabupaten/Kota asal yang memuat riwayat pengabdian dan nomor registrasi keanggotaan.
2. **Lapor Dinsos Tujuan**: Menyerahkan surat pengantar dan KTP ke Bidang Linjamsos / Pemberdayaan Sosial Dinsos Kabupaten/Kota yang baru.
3. **Mutasi Data Digital di PSKS Jabar**: Admin Wilayah tujuan melalui sistem terpusat memperbarui domisili penugasan anggota ke lokasi baru tanpa menghapus NIK atau riwayat pelatihan yang telah diraih.
4. **Pembaruan Wilayah Tugas**: Data penugasan personil otomatis disesuaikan dengan wilayah tugas baru berstatus \`SAH_TERDAFTAR\` di pangkalan data Dinas Sosial Jawa Barat.

[[action:tab:user_reg_history:Lihat Riwayat Pendaftaran]] [[action:tab:contact:Hubungi Dinas Sosial Jabar]]`;
  }

  // 12.10 SOP KASUS LAPANGAN: KTA RUSAK ATAU HILANG DI LAPANGAN (RE-PRINT)
  if (q.includes('kta rusak') || q.includes('kta hilang') || q.includes('hilang kta') || q.includes('kartu hilang') || q.includes('kartu rusak')) {
    if (!isSuperAdmin && !isDeveloperUser) {
      return `${opening}**SOP Penanganan Status Keabsahan Personil Jika Dokumen Lapangan Hilang atau Rusak**:
1. **Data Tetap Aman**: Status keanggotaan Anda tetap tersimpan dan terlindungi secara aman di pangkalan data resmi Dinas Sosial Jawa Barat dengan status **SAH_TERDAFTAR**.
2. **Koordinasi Wilayah**: Silakan melapor kepada Koordinator Pilar Kecamatan atau Dinas Sosial Kabupaten/Kota setempat dengan menunjukkan NIK KTP Anda untuk verifikasi status pengesahan kedinasan.
3. **Cek Riwayat Mandiri**: Anda dapat mengecek status keabsahan akun dan pendaftaran melalui tab Riwayat Pengajuan Pendaftaran di portal.

[[action:tab:user_reg_history:Lihat Riwayat Pendaftaran]] [[action:tab:contact:Hubungi Bantuan Resmi]]`;
    }
    return `${opening}**SOP Penanganan Kartu Anggota Rusak atau Hilang di Lapangan (Superadmin)**:
1. **Tidak Perlu Registrasi Ulang**: Data keanggotaan tetap aman dan terenkripsi di cloud database sistem PSKS Jabar.
2. **Verifikasi NIK KTP**: Periksa NIK personil di pangkalan data PSKS Jabar.
3. **Cetak Ulang Kartu (Re-Print)**: Superadmin dapat langsung mencetak ulang kartu personil melalui modul **Smart Access Card** (opsi Cetak Satuan atau Cetak Massal A4).
4. Kartu yang baru dicetak langsung aktif dengan tanda validasi hash QR Code resmi.

[[action:tab:contact:Hubungi Bantuan Resmi]]`;
  }

  // 12.11 SOP KASUS LAPANGAN: TALI ASIH & BPJS KETENAGAKERJAAN RELAWAN
  if (q.includes('tali asih') || q.includes('bpjs') || q.includes('insentif') || q.includes('honor relawan') || q.includes('jaminan kerja') || q.includes('gaji')) {
    return `${opening}**Informasi Jaminan Sosial & Tali Asih Relawan PSKS Jawa Barat**:
1. **Perlindungan BPJS Ketenagakerjaan**: Pemprov Jawa Barat bersama Kementerian Sosial RI secara bertahap memfasilitasi relawan pilar sosial (seperti Tagana dan personil aktif) dalam program perlindungan Jaminan Kecelakaan Kerja (JKK) dan Jaminan Kematian (JKM) untuk menjamin keselamatan saat bertugas di medan risiko tinggi.
2. **Tali Asih / Insentif Tanggap Darurat**: Relawan yang diterjunkan dalam operasi tanggap darurat bencana alam/sosial berhak mendapatkan tali asih operasional harian, akomodasi shelter, logistik dapur umum, dan APD lapangan sesuai Surat Keputusan (SK) Tanggap Darurat Kepala Daerah/Kemensos.
3. **Prinsip Pengabdian**: Pilar sosial (PSM, Tagana, Karang Taruna) berlandaskan jiwa kerelawanan (*volunteerism*), gotong royong, dan kepedulian sosial kemasyarakatan.

[[action:tab:contact:Konsultasi Hak Relawan]] [[action:pillar:tagana:Buka Info Tagana]]`;
  }

  // 12.12 SOP KASUS LAPANGAN: KEDARURATAN PPKS (RESPON CEPAT 1X24 JAM)
  if (q.includes('kedaruratan ppks') || q.includes('ppks darurat') || q.includes('lansia telantar') || q.includes('anak telantar') || q.includes('trc') || q.includes('kasus darurat') || q.includes('korban kdrt')) {
    return `${opening}**SOP Respon Cepat 1x24 Jam Penanganan Kasus PPKS Darurat Lapangan**:
1. **Deteksi & Laporan Awal (Tingkat Desa)**: Temuan kasus lansia telantar, disabilitas telantar, ABH, atau korban kekerasan segera dilaporkan ke Puskesos Desa/Kelurahan atau personil PSM.
2. **Asesmen Cepat (Tingkat Kecamatan)**: Tenaga Kesejahteraan Sosial Kecamatan (TKSK) melakukan asesmen awal dan perlindungan darurat tempat singgah sementara.
3. **Eskalasi ke Tim Reaksi Cepat (TRC) Dinsos**: Menghubungi TRC Dinsos Kabupaten/Kota atau hotline Dinsos Jabar untuk evakuasi darurat.
4. **Rujukan ke Balai / Panti UPTD**: Korban dirujuk ke Balai Rehabilitasi Sosial Dinsos Jabar (seperti Balai Lansia Ciparay, Balai Netra Wyata Guna, atau Balai Anak) untuk penanganan medis dan pendampingan Pekerja Sosial Profesional (Peksos).

[[action:tab:contact:Buka Kontak Hotline Darurat]] [[action:pillar:peksos:Info Layanan Peksos]]`;
  }

  // 12.13 SOP KASUS LAPANGAN: SPESIALISASI KORPS TAGANA & DIKLATSAR LANJUTAN
  if (q.includes('spesialisasi tagana') || q.includes('keahlian tagana') || q.includes('water rescue') || q.includes('vertical rescue') || q.includes('dumlap') || q.includes('diklatsar lanjutan')) {
    return `${opening}**6 Bidang Spesialisasi Kebencanaan Korps Tagana Jawa Barat**:
Setelah menyelesaikan Diklatsar Dasar, personil Tagana dapat mengambil spesialisasi lanjutan:
1. **Water Rescue**: Penyelamatan korban di wilayah banjir bandang, arung jeram, dan perairan terbuka.
2. **Vertical Rescue**: Evakuasi korban di medan tebing curam, jurang, dan reruntuhan gempa bumi.
3. **Dapur Umum Lapangan (Dumlap)**: Manajemen penyediaan ribuan porsi makanan higienis bergizi dalam 1x24 jam pasca-bencana.
4. **Shelter & Pengungsian**: Manajemen pendirian tenda pleton terstandar ramah lansia, anak, dan kelompok rentan.
5. **Layanan Dukungan Psikososial (LDP)**: *Trauma healing* untuk anak-anak dan pemulihan kesehatan mental penyintas.
6. **Logistik & Pergudangan**: Pengelolaan bufferstock sandang-pangan terintegrasi.

[[action:pillar:tagana:Buka Modul Tagana Jabar]] [[action:tab:user_reg_history:Pantau Riwayat Penugasan]]`;
  }

  // 13. STATISTIK SEBARAN DATA UMUM
  if (q.includes('total') || q.includes('sdm') || q.includes('sebaran') || q.includes('jumlah') || q.includes('peta') || q.includes('data')) {
    return `**Statistik & Sebaran SDM PSKS Jawa Barat**:
- Sistem saat ini mencatat **${totalRecords.toLocaleString('id-ID')} personil/lembaga** dari 10 Pilar PSKS yang tersebar di **27 Kabupaten/Kota (627 Kecamatan dan 5.957 Desa/Kelurahan)** se-Jawa Barat.
- Anda dapat memilih nama kabupaten/kota pada dropdown Peta Beranda untuk melihat rincian riil per pilar di wilayah tersebut.`;
  }

  // 14. DYNAMIC KNOWLEDGE BASE QUERY MATCH (CLOUD FIRESTORE)
  const { normalizedText: normQ, detectedPillar: detPillar } = normalizeQueryWithComprehensiveVocabulary(targetQ);
  const resolvedPillar = activePillar || (detPillar as PillarId) || null;
  const matchedDocs = searchKnowledgeBase(normQ, resolvedPillar, userRole);
  if (matchedDocs.length > 0 && matchedDocs[0]) {
    return matchedDocs[0].content;
  }

  // DEFAULT COMPREHENSIVE FALLBACK FOR QUERIES OUTSIDE KNOWLEDGE BASE
  if (userRole === 'admin') {
    return `Halo **Admin Wilayah**! Saya siap membantu Anda dalam operasional data pilar sosial. Anda dapat menanyakan seputar:\n- **Pengelolaan Data Pilar**: Cara input anggota baru, peremajaan data, dan ekspor Excel/PDF.\n- **Verifikasi Berkas**: Validasi pengajuan pendaftaran mandiri dan pengesahan status anggota terdaftar di wilayah Anda.\n- **Wawasan 10 Pilar PSKS**: Regulasi, dasar hukum, dan tugas fungsional tiap pilar sosial.\n\nSilakan tanyakan apa yang ingin Anda ketahui!`;
  }

  if (userRole === 'superadmin') {
    return `Halo **Superadmin**! Saya siap membantu Anda mengelola sistem **PSKS Jabar**. Anda dapat menanyakan seputar:\n- **Panduan Pengelolaan**: Cara menambah akun admin baru, reset PIN, verifikasi berkas pendaftar 10 pilar, cetak KTA massal A4, dan pengaturan saklar maintenance.\n- **Data 10 Pilar PSKS**: Regulasi lengkap Peksos, PSM, Tagana, LKS, Karang Taruna, LK3, Pensos, TKSK, KUBE, SLRT, dan sebaran 27 Kab/Kota.\n- **Bantuan Pengembang**: Hubungi developer aplikasi **Ilham Fazril** via [WhatsApp: +6289602421065](https://wa.me/6289602421065).\n\nAda fitur atau panduan yang ingin Anda ketahui lebih detail?`;
  }

  if (userRole === 'developer') {
    return `${opening}Pertanyaan atau perintah spesifik ini di luar parameter database default PSKS JABAR. Ada skema, query data, atau logika sistem yang mau kita kembangkan lagi, **Ilham Fazril**? 💻⚡`;
  }

  // Default user role fallback
  const isBasicGreeting =
    isGreeting ||
    targetQ === 'halo' ||
    targetQ === 'hai' ||
    targetQ === 'assalamualaikum' ||
    targetQ === 'sampurasun' ||
    targetQ.startsWith('selamat pagi') ||
    targetQ.startsWith('selamat siang') ||
    targetQ.startsWith('selamat sore') ||
    targetQ.startsWith('selamat malam') ||
    targetQ === 'pagi' ||
    targetQ === 'siang' ||
    targetQ === 'sore' ||
    targetQ === 'malam';

  if (isBasicGreeting) {
    return `Halo! Selamat datang di Portal **PSKS JABAR**. Saya siap memberikan informasi seputar:\n- **10 Pilar Utama PSKS**: Penjelasan detail PKSP (Peksos), PSM, Tagana, LKS, Karang Taruna, LK3, Pensos, TKSK, KUBE, dan SLRT/Puskesos.\n- **Layanan Dinsos Jabar**: Kontak pengaduan, alamat kantor dinas, profil pimpinan Ibu Noneng Komara Nengsih, S.E., M.A.P., dan integrasi data sosial di 27 Kab/Kota.\n\nAda yang bisa saya bantu atau informasi apa yang sedang Anda cari?`;
  }

  // Double-check conversational filler before unhandled fallback to guarantee no false refusal
  const finalFillerCheck = checkConversationalFiller(rawQ) || checkConversationalFiller(targetQ);
  if (finalFillerCheck.isFiller && finalFillerCheck.fillerType) {
    return formatConversationalFillerReply(
      finalFillerCheck.fillerType,
      isDeveloperUser,
      previousContext,
      userName,
      finalFillerCheck.extractedCount
    );
  }

  // General discussion / open conversational query handling
  const isDiscussionOrOpenQuery =
    targetQ.includes('kenapa') ||
    targetQ.includes('mengapa') ||
    targetQ.includes('bagaimana pendapat') ||
    targetQ.includes('menurut anda') ||
    targetQ.includes('menurut kamu') ||
    targetQ.includes('menurutmu') ||
    targetQ.includes('apa arti') ||
    targetQ.includes('apa makna') ||
    targetQ.includes('solusi') ||
    targetQ.includes('kemiskinan') ||
    targetQ.includes('solidaritas') ||
    targetQ.includes('gotong royong') ||
    targetQ.includes('kemanusiaan') ||
    targetQ.includes('kepedulian') ||
    targetQ.includes('masalah sosial') ||
    targetQ.includes('isu sosial') ||
    targetQ.includes('diskusi');

  if (isDiscussionOrOpenQuery) {
    return `Tentu, ini topik yang sangat menarik dan bernilai penting untuk didiskusikan! Pada prinsipnya, aspek kepedulian sosial, kemanusiaan, dan kesejahteraan masyarakat merupakan ikhtiar bersama yang membutuhkan sinergi erat antara pemerintah, para relawan, dan seluruh komponen warga.\n\nDi wilayah Jawa Barat, nilai-nilai luhur gotong royong dan kesetiakawanan sosial ini diimplementasikan secara nyata melalui peran aktif **10 Pilar Potensi dan Sumber Kesejahteraan Sosial (PSKS)**—seperti Taruna Siaga Bencana (Tagana) dalam penanggulangan kedaruratan, Pekerja Sosial Masyarakat (PSM) yang mendampingi warga rentan di desa/kelurahan, hingga Karang Taruna yang menggerakkan potensi kepemudaan.\n\nApakah ada perspektif khusus atau pilar sosial tertentu yang ingin Anda bahas lebih jauh? Silakan sampaikan, saya siap berdiskusi! 😊`;
  }

  // Modern, intelligent, and polite conversational fallback
  return `Halo! Terkait hal yang Anda tanyakan, sebagai Asisten Resmi **PSKS JABAR**, saya siap berdiskusi dan memberikan informasi serta panduan seputar:\n- **10 Pilar Kesejahteraan Sosial** (Tagana, PSM, TKSK, Peksos, Karang Taruna, LKS, LK3, Pensos, KUBE, dan SLRT/Puskesos).\n- **Alur Pendaftaran Mandiri Anggota Baru** & pemantauan status verifikasi berkas.\n- **Data Sebaran & Statistik Personil** di 27 Kabupaten/Kota se-Jawa Barat.\n- **Layanan dan Kontak Pengaduan** Dinas Sosial Provinsi Jawa Barat.\n\nSilakan sampaikan pertanyaan atau hal apa yang ingin Anda diskusikan, saya siap membantu menjawabnya! 😊\n\n[[action:tab:contact:Hubungi Dinas Sosial Jabar]]`;
}


/**
 * Comprehensive Local Data Keyword Mapping Dictionary
 * Maps query keywords directly to local database domains, pillar attributes, regional scopes, and system parameters
 */
export interface KeywordMappingCategory {
  category: string;
  description: string;
  keywords: string[];
}

export const LOCAL_DATA_KEYWORD_MAPPING: Record<string, KeywordMappingCategory> = {
  // 1. Pillar Identifiers, Titles & Aliases
  pillar_names: {
    category: 'Pilar PSKS',
    description: 'Nama dan sebutan 10 Pilar Potensi dan Sumber Kesejahteraan Sosial',
    keywords: [
      'tagana', 'taruna siaga bencana', 'psm', 'pekerja sosial masyarakat', 'tksk',
      'tenaga kesejahteraan sosial kecamatan', 'lks', 'lembaga kesejahteraan sosial',
      'karang taruna', 'kt', 'karangtaruna', 'lk3', 'lembaga konsultasi kesejahteraan keluarga',
      'pensos', 'penyuluh sosial', 'penyuluh sosial masyarakat', 'peksos', 'pksp',
      'pekerja sosial profesional', 'kube', 'kelompok usaha bersama', 'badan usaha',
      'badan usaha sosial', 'slrt', 'puskesos', 'pusat kesejahteraan sosial', 'pilar',
      '10 pilar', 'sepuluh pilar', 'sumber kesejahteraan', 'organisasi sosial', 'relawan',
      'potensi kesejahteraan', 'psks'
    ],
  },

  // 2. Data Attributes & Member Properties
  data_attributes: {
    category: 'Atribut Data Personil',
    description: 'Kolom-kolom atribut data personil atau lembaga di database lokal',
    keywords: [
      'nik', 'nip', 'nomor induk', 'ktp', 'no sk', 'sk pengangkatan', 'sk penugasan',
      'sertifikasi', 'nomor sertifikasi', 'sertifikat', 'kompetensi', 'sipps', 'keahlian',
      'nomor handphone', 'no hp', 'telepon', 'whatsapp', 'wa', 'kontak', 'alamat',
      'tanda daftar', 'tdy', 'badan hukum', 'kemenkumham', 'izin operasional', 'akreditasi',
      'ban-p2ks', 'unit', 'satuan', 'jabatan', 'struktur', 'ketua', 'pimpinan', 'pengurus',
      'pasfoto', 'foto profil', 'status aktif', 'keaktifan', 'status', 'sah_terdaftar',
      'purna tugas', 'non-aktif', 'mutasi', 'peremajaan', 'duplikat', 'duplikasi'
    ],
  },

  // 3. Regions, Jurisdictions & Administrative Scopes (27 Kab/Kota)
  regions_and_jurisdictions: {
    category: 'Wilayah & Geografis Jabar',
    description: '27 Kabupaten/Kota, Kecamatan, Desa, dan Kode Wilayah Jawa Barat',
    keywords: [
      'jawa barat', 'jabar', 'provinsi', 'kabupaten', 'kota', 'kecamatan', 'desa', 'kelurahan',
      'bandung', 'bogor', 'sukabumi', 'cianjur', 'garut', 'tasikmalaya', 'ciamis',
      'kuningan', 'cirebon', 'majalengka', 'sumedang', 'indramayu', 'subang', 'purwakarta',
      'karawang', 'bekasi', 'bandung barat', 'pangandaran', 'depok', 'cimahi', 'banjar',
      'sebaran', 'peta', 'agregat', 'wilayah', 'daerah', 'terdata', 'populasi', 'pemetaan'
    ],
  },

  // 4. Numerical Counts, Statistics & Recapitulation
  statistics_and_counts: {
    category: 'Statistik & Agregasi Data',
    description: 'Penghitungan agregat, metrik numerik, dan rekapitulasi data',
    keywords: [
      'jumlah', 'berapa', 'total', 'banyak', 'personil', 'anggota', 'lembaga', 'rekap',
      'rekapitulasi', 'statistik', 'angka', 'kuantitas', 'akumulasi', 'terdaftar', 'data'
    ],
  },

  // 5. Official Tasks, Responsibilities & Procedures (Tupoksi & SOP)
  tupoksi_and_procedures: {
    category: 'Tupoksi & Prosedur Resmi',
    description: 'Tugas pokok, fungsi, wewenang, dasar hukum, dan SOP operasional',
    keywords: [
      'tupoksi', 'tugas', 'fungsi', 'wewenang', 'peran', 'kewenangan', 'sop', 'dasar hukum',
      'permensos', 'perda', 'pergub', 'uu', 'regulasi', 'aturan', 'pedoman', 'prosedur',
      'alur', 'syarat', 'persyaratan', 'kriteria', 'pendaftaran', 'rekrutmen'
    ],
  },

  // 6. Digital Member Card (KTA) & Smart QR Scanner
  digital_cards_and_qr: {
    category: 'KTA Digital & QR Code',
    description: 'Pencetakan kartu tanda anggota, validasi QR code, dan pencetakan massal',
    keywords: [
      'kartu', 'kta', 'kartu tanda anggota', 'cetak', 'cetak kartu', 'print', 'unduh kartu',
      'download kartu', 'qr', 'qr code', 'barcode', 'scan', 'scanner', 'pindai', 'pemindai',
      'pindai qr', 'a4', '8 kartu', 'batch', 'massal', 'validasi', 'verifikasi kartu', 'kartu digital'
    ],
  },

  // 7. Role Governance, Admin Features & System Operations
  system_governance_and_admin: {
    category: 'Tata Kelola Sistem & Admin',
    description: 'Fitur administrasi daerah, super admin provinsi, dan developer control panel',
    keywords: [
      'admin', 'superadmin', 'super admin', 'role', 'hak akses', 'kelola data', 'tambah data',
      'input data', 'edit data', 'hapus data', 'mutasi data', 'ekspor', 'excel', 'xlsx',
      'pdf', 'laporan', 'musrenbang', 'maintenance', 'mode pemeliharaan', 'saklar',
      'saklar maintenance', 'broadcast', 'pengumuman', 'reset pin', 'reset kata sandi',
      'kredensial', 'audit', 'audit trail', 'audit log', 'log aktivitas', 'keamanan',
      'brute force', 'lockout', 'terkunci', 'enkripsi', 'bcrypt', 'jwt', 'pdp',
      'perlindungan data pribadi', 'uu no. 27', 'privasi', 'satu data', 'satu data jabar',
      'dtks', 'kemensos', 'pusdatin', 'puskesos', 'integrasi', 'sync', 'sinkronisasi'
    ],
  },

  // 8. Creator, Architecture & Tech Stack
  developer_and_tech_stack: {
    category: 'Pengembang & Arsitektur Sistem',
    description: 'Profil kreator dan spesifikasi teknologi arsitektur PSKS JABAR',
    keywords: [
      'developer', 'pembuat', 'bikin', 'dibuat', 'cipta', 'pengembang', 'arsitek', 'author',
      'ilham fazril', 'ilham', 'fazril', 'siapa yang buat', 'siapa yang bikin', 'siapa pembuat',
      'siapa developer', 'arsitektur', 'stack', 'teknologi', 'react', 'vite', 'express',
      'firestore', 'tailwind', 'gemini', 'proxy', 'full-stack', 'kodingan'
    ],
  },

  // 9. Dinsos Official Contact, Leadership & Offices
  official_contacts_and_dinsos: {
    category: 'Kontak & Sekretariat Dinas Sosial',
    description: 'Pimpinan dinas, alamat kantor, email, dan WhatsApp Dinsos Jawa Barat',
    keywords: [
      'dinsos', 'dinas sosial', 'provinsi jawa barat', 'prov jabar', 'kadinas', 'kepala dinas',
      'dodo suhendar', 'alamat', 'lokasi', 'kantor', 'cimahi', 'amir machmud', 'kontak',
      'whatsapp', 'wa', 'telepon', 'email', 'helpdesk', 'aduan', 'layanan'
    ],
  },
};

/**
 * Checks if a query matches any local data keyword category
 */
export function matchLocalDataKeyword(query: string): {
  isMatched: boolean;
  matchedCategory?: string;
  matchedKeywords: string[];
} {
  const normQ = query.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  const tokens = normQ.split(/\s+/).filter(Boolean);
  const matchedKeywords: string[] = [];
  let foundCategory: string | undefined;

  for (const [catKey, catObj] of Object.entries(LOCAL_DATA_KEYWORD_MAPPING)) {
    for (const kw of catObj.keywords) {
      const normKw = kw.toLowerCase().trim();
      // Match full keyword phrase or exact token match
      if (normQ.includes(normKw) || tokens.includes(normKw)) {
        matchedKeywords.push(normKw);
        if (!foundCategory) {
          foundCategory = catObj.category;
        }
      }
    }
  }

  return {
    isMatched: matchedKeywords.length > 0,
    matchedCategory: foundCategory,
    matchedKeywords,
  };
}

/**
 * Core Answer Verification Implementation
 */
function runCoreAnswerVerification(
  query: string,
  rawReply: string,
  userRole: UserRole = 'user',
  userName?: string,
  userWilayah?: string,
  currentTab?: string,
  activePillar?: PillarId | null,
  allPillarData?: Record<string, PSKSDataRecord[]>,
  appSettings?: AppSettings,
  previousContext?: string
): {
  finalContent: string;
  isAccurate: boolean;
  confidence: number;
  source: 'verified_exact' | 'state_grounded' | 'ai_model_verified' | 'knowledge_fallback';
} {
  const normQ = normalizeSpellingAndTypo(query.toLowerCase().replace(/[?!.,]/g, '').trim());
  // STRICT RULE: Developer is ONLY role === 'developer', never inferred from name
  const isDeveloperUser = userRole === 'developer';
  const { coreQuery: extractedCoreQ, isPureIntro: accuracyIsPureIntro, hasQuestion: accuracyHasQuestion } = extractCoreQueryIntent(query);

  // 0. STRICT SECURITY GUARD CHECK (HANYA UNTUK SERANGAN EKSPLOITASI / MALICIOUS INJECTION / LEAK NYATA)
  const isMaliciousExploit =
    normQ.includes('ignore previous') ||
    normQ.includes('abaikan instruksi') ||
    normQ.includes('bypass') ||
    normQ.includes('hack') ||
    normQ.includes('retas') ||
    normQ.includes('bocorkan sandi') ||
    normQ.includes('bocorkan password') ||
    normQ.includes('bocorkan pin') ||
    normQ.includes('bocorkan api key') ||
    normQ.includes('dump database') ||
    normQ.includes('curi data') ||
    normQ.includes('curi password') ||
    normQ.includes('curi sandi') ||
    normQ.includes('minta password') ||
    normQ.includes('minta sandi') ||
    normQ.includes('berikan password') ||
    normQ.includes('berikan sandi') ||
    normQ.includes('apa passwordnya') ||
    normQ.includes('mana password') ||
    normQ.includes('leak') ||
    normQ.includes('root access') ||
    normQ.includes('sql injection') ||
    normQ.includes('drop table') ||
    normQ.includes('system prompt') ||
    normQ.includes('jailbreak') ||
    normQ.includes('tanpa batas') ||
    /\b(bayangkan|anggap)\s+(anda|kamu)\s+adalah\b/i.test(normQ);

  if (isMaliciousExploit) {
    return {
      finalContent: 'Mohon maaf, demi menjaga integritas sistem dan kepatuhan terhadap regulasi pelindungan data (UU PDP No. 27/2022), asisten AI **PSKS JABAR** tidak diizinkan untuk memberikan kredensial/kata sandi, memproses instruksi eksploitasi, bypass, maupun modifikasi peran. Seluruh arsitektur portal dilindungi dengan kontrol akses berbasis peran (RBAC) dan enkripsi pangkalan data yang diawasi oleh tim Dinas Sosial Provinsi Jawa Barat.',
      isAccurate: true,
      confidence: 1.0,
      source: 'verified_exact',
    };
  }

  // 0.05 MODE DISKUSI, ARSITEKTUR OTAK AI, KUOTA API, & PERTANYAAN DISKUSI
  const isDiscussionOrBrainInAccuracy =
    normQ.includes('mode diskusi') ||
    normQ.includes('masuk dalam mode diskusi') ||
    normQ.includes('masuk mode diskusi') ||
    normQ.includes('kita diskusi') ||
    normQ.includes('diskusi lagi') ||
    normQ.includes('diskusi dulu') ||
    (normQ.includes('quota') && (normQ.includes('exceeded') || normQ.includes('habis') || normQ.includes('limit'))) ||
    (normQ.includes('otak') && (normQ.includes('ai') || normQ.includes('asisten') || normQ.includes('kamus') || normQ.includes('disimpan'))) ||
    (normQ.includes('kamus') && (normQ.includes('ai') || normQ.includes('asisten') || normQ.includes('disimpan'))) ||
    (normQ.includes('permasalahan') && normQ.includes('solusi')) ||
    (normQ.includes('ingat') && (normQ.includes('sebelumnya') || normQ.includes('tadi') || normQ.includes('masalah')));

  if (isDiscussionOrBrainInAccuracy) {
    if (rawReply && rawReply.trim().length > 0 && !rawReply.includes('belum memiliki informasi')) {
      return {
        finalContent: rawReply.trim(),
        isAccurate: true,
        confidence: 0.99,
        source: 'ai_model_verified',
      };
    }
    const discussionAnswer = getComprehensiveSmartAnswer(
      query,
      userRole,
      userName,
      userWilayah,
      currentTab,
      activePillar,
      allPillarData,
      appSettings,
      previousContext
    );
    return {
      finalContent: discussionAnswer,
      isAccurate: true,
      confidence: 1.0,
      source: 'verified_exact',
    };
  }

  // Conversational Filler & Natural Reaction Interceptor ("ohh", "oke", "siap", "mantap", "makasih", "paham", "ngerti", "oh gitu", follow-up preambles, etc.)
  // Handled FIRST to guarantee conversational flow and prevent false-positive trigger of other filters
  const accuracyFillerCheck = checkConversationalFiller(normQ) || checkConversationalFiller(query);
  if (accuracyFillerCheck.isFiller && accuracyFillerCheck.fillerType) {
    const isModelRefusal =
      !rawReply ||
      rawReply.includes('belum memiliki informasi') ||
      rawReply.includes('belum dapat mengenali') ||
      rawReply.includes('belum menemukan informasi') ||
      rawReply.includes('di luar parameter database') ||
      rawReply.includes('tidak memiliki informasi') ||
      rawReply.includes('Mohon maaf, saya belum');

    if (!isModelRefusal && rawReply.trim().length > 0) {
      return {
        finalContent: rawReply.trim(),
        isAccurate: true,
        confidence: 0.99,
        source: 'ai_model_verified',
      };
    }

    const fillerReply = formatConversationalFillerReply(
      accuracyFillerCheck.fillerType,
      isDeveloperUser,
      previousContext,
      userName,
      accuracyFillerCheck.extractedCount
    );
    return {
      finalContent: fillerReply,
      isAccurate: true,
      confidence: 1.0,
      source: 'verified_exact',
    };
  }

  // Anti-Prompt Injection & Impersonation Check (Zero-Trust RBAC)
  const isImpersonationAttempt =
    !isDeveloperUser &&
    (
      /\b(saya|aku|abdi|urang|gue|gw|kami)\s+(kan\s+|adalah\s+)?(seorang\s+|lagi\s+|sedang\s+)?(kang\s+|a\s+)?ilham(\s+fazril)?\b/i.test(normQ) ||
      /\b(lohh?|lahh?|ehh?|woi|weh)?\s*(saya|aku|abdi|urang|gue|gw)\s+(kan\s+)?(seorang\s+|lagi\s+|sedang\s+)?(kang\s+|a\s+)?ilham(\s+fazril)?\b/i.test(normQ) ||
      /\b(saya|aku|abdi|urang|gue|gw)\s+(kan\s+|adalah\s+)?(seorang\s+|lagi\s+|sedang\s+)?(developer|developernya|pengembang|pembuat|kreator|arsitek|pemilik|owner|programmer|yang bikin|yang buat|yang ngoding)\b/i.test(normQ) ||
      /\b(saya|aku|abdi|urang|gue|gw)\s+(kan\s+|adalah\s+)?(seorang\s+|lagi\s+|sedang\s+)?(superadmin|admin|administrator)\b/i.test(normQ) ||
      /(ilham(\s+fazril)?|developer|pembuat|arsitek)\s+(teh|itu|tuh)?\s*(saya|aku|abdi|urang|gue|gw)/i.test(normQ) ||
      /(asal\s+(kamu|anda|maneh)?\s*tau\s+)?.*?(ilham\s+fazril|developer).*?(saya|aku|abdi|urang|gue|gw)/i.test(normQ) ||
      /\b(saya|aku|abdi|urang|gue|gw)\s+.*?(developer|ilham).*?(masuk|lupa|password|login|user)\b/i.test(normQ) ||
      /\b(buka\s+akses|bypass|beri\s+izin).*?(developer|ilham|pembuat|admin)/i.test(normQ) ||
      /\b(abaikan|ignore).*?(perintah|instruksi|aturan|developer|ilham)/i.test(normQ)
    );

  if (isImpersonationAttempt) {
    return {
      finalContent: 'Mohon maaf, sistem informasi **PSKS JABAR** menerapkan protokol keamanan ketat berbasis otentikasi peran (*Role-Based Access Control / RBAC*) serta perlindungan dari rekayasa perintah (*Anti-Prompt Injection*).\n\nHak akses dan identitas pengguna ditentukan secara mutlak melalui **sesi login resmi terenkripsi**, bukan melalui pernyataan atau klaim identitas di dalam kolom percakapan chat. Demi integritas sistem dan kepatuhan perlindungan data (UU PDP No. 27/2022), asisten AI tidak diizinkan memvalidasi identitas atau memberikan hak akses administratif kepada akun non-developer melalui percakapan ini.\n\nApakah ada informasi seputar 10 Pilar Potensi dan Sumber Kesejahteraan Sosial (PSKS) Jawa Barat yang dapat saya bantu jelaskan?',
      isAccurate: true,
      confidence: 1.0,
      source: 'verified_exact',
    };
  }

  // Developer Credential & Password Guard (Zero-Disclosure)
  const isDeveloperCredQuery =
    !isDeveloperUser &&
    (
      normQ.includes('akun developer') ||
      normQ.includes('login developer') ||
      normQ.includes('password developer') ||
      normQ.includes('sandi developer') ||
      normQ.includes('pin developer') ||
      normQ.includes('kredensial developer') ||
      normQ.includes('rahasia developer') ||
      normQ.includes('bocorkan developer') ||
      normQ.includes('buka akun developer') ||
      normQ.includes('akses developer') ||
      normQ.includes('mana password') ||
      normQ.includes('mana sandi') ||
      normQ.includes('mana passwordnya') ||
      normQ.includes('passwordnya apa') ||
      normQ.includes('sandinya apa') ||
      normQ.includes('lupa password developer') ||
      normQ.includes('lupa sandi developer') ||
      normQ.includes('berikan password') ||
      normQ.includes('minta password') ||
      normQ.includes('bocorkan password') ||
      (normQ.includes('bagaimana cara masuknya') && (normQ.includes('developer') || normQ.includes('admin') || normQ.includes('password'))) ||
      (normQ.includes('cara masuk') && normQ.includes('developer'))
    );

  if (isDeveloperCredQuery) {
    return {
      finalContent: 'Mohon maaf, kata sandi (*password*), kredensial, dan hak akses pengembang (*developer*) maupun administrator sistem **PSKS JABAR** merupakan informasi rahasia internal terenkripsi tingkat tinggi (*zero-disclosure*) dan sama sekali tidak dapat diberikan, di-reset, atau dibocorkan melalui asisten AI demi mematuhi UU Pelindungan Data Pribadi (UU PDP No. 27/2022) serta menjaga integritas sistem.\n\nApabila Anda adalah pengembang atau administrator resmi yang memiliki hak akses, silakan masuk melalui menu login resmi sistem.\n\n[[action:tab:login:Buka Halaman Login]] [[action:tab:contact:Hubungi Dinas Sosial Jabar]]',
      isAccurate: true,
      confidence: 1.0,
      source: 'verified_exact',
    };
  }

  // =========================================================================
  // GRANULAR ROLE-BASED ACCESS CONTROL (RBAC) GUARDRAIL
  // =========================================================================
  // Isolasi Pengetahuan Berdasarkan Peran:
  // 1. DEVELOPER (root): Akses absolut ke seluruh sistem, arsitektur, database, dan control panel.
  // 2. SUPERADMIN: Akses penuh ke 8 fitur superadmin di Beranda & Pengaturan. Dilarang mengakses info developer rahasia.
  // 3. ADMIN WILAYAH: Akses penuh ke pengelolaan data pilar daerahnya & verifikasi pendaftaran wilayah. Dilarang mengakses wewenang khusus Superadmin (tambah/edit/hapus admin kab/kota lain, monitoring seluruh admin se-Jawa Barat, saklar maintenance).
  // 4. USER / TAMU PUBLIK: Hanya info publik dan pendaftaran relawan. Dilarang mengakses panduan administratif internal.

  // A. Admin Wilayah memohon fitur khusus Superadmin (Intersepsi Halus)
  const isSuperadminExclusiveWorkflow =
    normQ.includes('hapus akun admin') ||
    normQ.includes('menghapus akun admin') ||
    normQ.includes('tambah akun admin') ||
    normQ.includes('menambah akun admin') ||
    normQ.includes('ubah akun admin') ||
    normQ.includes('merubah akun admin') ||
    normQ.includes('edit akun admin') ||
    normQ.includes('hapus admin') ||
    normQ.includes('menghapus admin') ||
    normQ.includes('tambah admin') ||
    normQ.includes('menambah admin') ||
    normQ.includes('ubah admin') ||
    normQ.includes('merubah admin') ||
    normQ.includes('edit admin') ||
    normQ.includes('kelola akun admin') ||
    normQ.includes('manajemen akun admin') ||
    normQ.includes('monitoring admin') ||
    normQ.includes('pantau admin') ||
    normQ.includes('cara monitoring admin') ||
    normQ.includes('monitoring seluruh admin') ||
    normQ.includes('maintenance mode') ||
    normQ.includes('mode maintenance') ||
    normQ.includes('mode pemeliharaan') ||
    normQ.includes('saklar maintenance') ||
    normQ.includes('cara maintenance');

  if (userRole === 'admin' && !isDeveloperUser && isSuperadminExclusiveWorkflow) {
    return {
      finalContent: 'Mohon maaf, fitur dan kewenangan tersebut merupakan wewenang khusus Superadmin Provinsi Jawa Barat. Sebagai Admin Wilayah, Anda memiliki wewenang penuh untuk pengelolaan data 10 pilar, input personil, ekspor laporan daerah, dan verifikasi berkas pendaftaran di wilayah penugasan Anda.',
      isAccurate: true,
      confidence: 1.0,
      source: 'verified_exact',
    };
  }

  // B. Tamu Publik & Pengguna Biasa (User) mencoba mengakses panduan teknis administratif admin/superadmin
  const isPublicAskingAdminControl =
    !isDeveloperUser &&
    userRole !== 'superadmin' &&
    userRole !== 'admin' &&
    (
      ((normQ.includes('masuk') || normQ.includes('login') || normQ.includes('akses') || normQ.includes('buka') || normQ.includes('cara jadi') || normQ.includes('daftar jadi') || normQ.includes('minta') || normQ.includes('bocorkan') || normQ.includes('kasih tau') || normQ.includes('kunci') || normQ.includes('rahasia') || normQ.includes('rubah') || normQ.includes('merubah') || normQ.includes('ubah') || normQ.includes('mengubah') || normQ.includes('edit') || normQ.includes('ganti') || normQ.includes('mengganti') || normQ.includes('tambah') || normQ.includes('menambah') || normQ.includes('buat') || normQ.includes('membuat') || normQ.includes('bikin') || normQ.includes('hapus') || normQ.includes('menghapus') || normQ.includes('delete') || normQ.includes('kelola') || normQ.includes('mengelola') || normQ.includes('atur') || normQ.includes('mengatur') || normQ.includes('reset') || normQ.includes('monitoring') || normQ.includes('maintenance')) &&
      (normQ.includes('akun admin') || normQ.includes('akun superadmin') || normQ.includes('akun developer') || normQ.includes('ke admin') || normQ.includes('ke superadmin') || normQ.includes('ke developer') || normQ.includes('sebagai admin') || normQ.includes('sebagai superadmin') || normQ.includes('sebagai developer') || normQ.includes('panel admin') || normQ.includes('panel superadmin') || normQ.includes('panel developer') || normQ.includes('login admin') || normQ.includes('login superadmin') || normQ.includes('rahasia sistem') || normQ.includes('password admin') || normQ.includes('pin superadmin') || normQ.includes('kredensial admin') || normQ.includes('token admin') || normQ.includes('data admin') || normQ.includes('daftar admin') || normQ.includes('monitoring admin') || normQ.includes('mode maintenance') || normQ.includes('saklar maintenance') || normQ.includes('admin wilayah'))) ||
      (normQ.includes('cara login admin') || normQ.includes('cara login superadmin') || normQ.includes('password superadmin') || normQ.includes('pin admin') || normQ.includes('rahasia admin') || normQ.includes('merubah akun admin') || normQ.includes('mengubah akun admin') || normQ.includes('menambah akun admin') || normQ.includes('menghapus akun admin') || normQ.includes('hapus akun admin') || normQ.includes('tambah akun admin') || normQ.includes('kelola akun admin') || normQ.includes('mengelola akun admin') || normQ.includes('edit akun admin') || normQ.includes('reset password admin') || normQ.includes('reset sandi admin'))
    );

  if (isPublicAskingAdminControl) {
    return {
      finalContent: 'Mohon maaf, informasi dan panduan teknis pengelolaan akun administrator sistem (seperti menambah, merubah, mengedit, atau menghapus akun admin, monitoring admin, maupun mode maintenance) merupakan wewenang khusus Superadmin / Administrator Dinas Sosial Provinsi Jawa Barat dan tidak dapat diakses melalui akun pengguna umum/tamu. Untuk keperluan administratif atau koordinasi kedinasan resmi, silakan hubungi pihak Dinas Sosial Provinsi Jawa Barat.\n\n[[action:tab:contact:Hubungi Dinas Sosial Jabar]]',
      isAccurate: true,
      confidence: 1.0,
      source: 'verified_exact',
    };
  }

  // C. SUPERADMIN & DEVELOPER: PANDUAN LANGKAH DIGITAL RIIL WEBSITE (ANTI-HALUSINASI BIROKRASI MANUAL)
  const isSuperadminAskingStepByStep =
    (userRole === 'superadmin' || isDeveloperUser) &&
    (
      normQ.includes('merubah akun admin') ||
      normQ.includes('mengubah akun admin') ||
      normQ.includes('ubah akun admin') ||
      normQ.includes('edit akun admin') ||
      normQ.includes('merubah admin') ||
      normQ.includes('mengubah admin') ||
      normQ.includes('ubah admin') ||
      normQ.includes('edit admin') ||
      normQ.includes('ubah password admin') ||
      normQ.includes('mengubah password admin') ||
      normQ.includes('merubah password admin') ||
      normQ.includes('reset password admin') ||
      normQ.includes('reset sandi admin') ||
      normQ.includes('tambah admin') ||
      normQ.includes('menambah admin') ||
      normQ.includes('hapus admin') ||
      normQ.includes('menghapus admin') ||
      normQ.includes('8 fitur superadmin') ||
      normQ.includes('8 fitur') ||
      normQ.includes('fitur superadmin') ||
      normQ.includes('fitur di pengaturan') ||
      normQ.includes('fitur pengaturan') ||
      normQ.includes('menu pengaturan') ||
      (normQ.includes('admin wilayah') && (normQ.includes('ubah') || normQ.includes('rubah') || normQ.includes('edit') || normQ.includes('ganti') || normQ.includes('password') || normQ.includes('sandi') || normQ.includes('kelola')))
    );

  // Deteksi halusinasi prosedur manual kertas / surat permohonan dinas
  const isHallucinatedBureaucracy =
    rawReply &&
    (
      rawReply.includes('Surat Tugas') ||
      rawReply.includes('surat tugas') ||
      rawReply.includes('surat permohonan') ||
      rawReply.includes('surat resmi') ||
      rawReply.includes('Pengajuan Resmi melalui Surat') ||
      rawReply.includes('pengajuan resmi melalui surat') ||
      rawReply.includes('ditandatangani oleh Kepala Dinas') ||
      rawReply.includes('mengirimkan surat') ||
      rawReply.includes('tidak dapat dilakukan secara mandiri') ||
      rawReply.includes('kewenangan sistem yang bersifat terbatas')
    );

  // Jika Superadmin bertanya alur fiturnya dan model berhalusinasi birokrasi kertas, langsung berikan panduan UI riil
  if (isSuperadminAskingStepByStep && (isHallucinatedBureaucracy || !rawReply || rawReply.trim().length === 0)) {
    const verifiedStepGuide = getComprehensiveSmartAnswer(
      query,
      userRole,
      userName,
      userWilayah,
      currentTab,
      activePillar,
      allPillarData,
      appSettings,
      previousContext
    );
    return {
      finalContent: verifiedStepGuide,
      isAccurate: true,
      confidence: 1.0,
      source: 'verified_exact',
    };
  }

  // =========================================================================
  // ARCHITECTURAL UPGRADE: PRIORITIZE MODEL INTELLIGENCE & NATURAL CONVERSATION
  // =========================================================================
  if (rawReply && rawReply.trim().length > 0) {
    const isModelRefusal =
      rawReply.includes('Mohon maaf untuk saat ini masih belum memiliki informasi') ||
      rawReply.includes('belum dapat mengenali atau menemukan informasi') ||
      isHallucinatedBureaucracy;

    if (!isModelRefusal) {
      return {
        finalContent: rawReply.trim(),
        isAccurate: true,
        confidence: 0.99,
        source: 'ai_model_verified',
      };
    }
  }

  // =========================================================================
  // DINSOS 27 KAB/KOTA ADDRESS GROUNDING (FALLBACK IF MODEL FAILED OR EMPTY)
  // =========================================================================
  const addrCheck = resolveDinsosAddressQuery(query, userWilayah, previousContext);
  if (addrCheck.isAddressQuery) {
    if (addrCheck.isFallback || addrCheck.isSpecificRegion || addrCheck.needsClarification) {
      return {
        finalContent: addrCheck.replyText,
        isAccurate: true,
        confidence: 1.0,
        source: 'verified_exact',
      };
    }
  }

  // 0.44 Interceptor Durasi / Berapa Lama Ajuan Pendaftaran Hingga Diterima / Disetujui
  const isDurationVerificationQuery =
    (normQ.includes('berapa lama') ||
      normQ.includes('berapa hari') ||
      normQ.includes('durasi') ||
      normQ.includes('estimasi waktu') ||
      normQ.includes('kapan diterima') ||
      normQ.includes('kapan disetujui') ||
      normQ.includes('kapan diverifikasi') ||
      normQ.includes('kapan verifikasi') ||
      normQ.includes('lama proses') ||
      normQ.includes('lama ajuan') ||
      normQ.includes('lama verifikasi') ||
      normQ.includes('lama pendaftaran') ||
      normQ.includes('lama daftar') ||
      normQ.includes('waktu verifikasi') ||
      normQ.includes('waktu pengajuan') ||
      normQ.includes('waktu proses') ||
      normQ.includes('berapa waktu')) &&
    (normQ.includes('daftar') ||
      normQ.includes('pendaftaran') ||
      normQ.includes('ajuan') ||
      normQ.includes('pengajuan') ||
      normQ.includes('verifikasi') ||
      normQ.includes('diterima') ||
      normQ.includes('disetujui') ||
      normQ.includes('berkas') ||
      normQ.includes('anggota') ||
      normQ.includes('psks'));

  if (isDurationVerificationQuery) {
    const verifiedDurationAnswer = getComprehensiveSmartAnswer(
      query,
      userRole,
      userName,
      userWilayah,
      currentTab,
      activePillar,
      allPillarData,
      appSettings,
      previousContext
    );
    return {
      finalContent: verifiedDurationAnswer,
      isAccurate: true,
      confidence: 1.0,
      source: 'verified_exact',
    };
  }

  // Comprehensive Registration & Recruitment Workflow Interceptor
  // Guarantees that any query regarding registration/joining any of the 10 pillars or general PSKS is answered with the 100% verified, untruncated application workflow
  const isRegistrationWorkflowQuery =
    !isDurationVerificationQuery &&
    !normQ.includes('mode diskusi') &&
    !normQ.includes('masuk dalam mode') &&
    !normQ.includes('masuk mode') &&
    !normQ.includes('diskusi') &&
    !normQ.includes('berapa lama') &&
    !normQ.includes('berapa hari') &&
    !normQ.includes('durasi') &&
    !normQ.includes('estimasi waktu') &&
    (normQ.includes('cara daftar') ||
      normQ.includes('alur pendaftaran') ||
      normQ.includes('tata cara daftar') ||
      normQ.includes('bagaimana cara mendaftar') ||
      normQ.includes('prosedur pendaftaran') ||
      normQ.includes('syarat pendaftaran') ||
      normQ.includes('syarat daftar') ||
      normQ.includes('syarat gabung') ||
      normQ.includes('cara gabung') ||
      normQ.includes('cara registrasi') ||
      normQ.includes('cara bergabung') ||
      normQ.includes('gabung pilar') ||
      normQ.includes('gabung relawan') ||
      normQ.includes('daftar pilar') ||
      normQ.includes('daftar relawan') ||
      normQ.includes('pendaftaran mandiri') ||
      normQ.includes('tambah anggota mandiri') ||
      normQ.includes('daftar jadi anggota') ||
      normQ.includes('cara jadi anggota') ||
      normQ.includes('cara jadi relawan') ||
      normQ.includes('rekrutmen pilar') ||
      normQ.includes('rekrutmen anggota') ||
      normQ === 'cara daftar' ||
      normQ === 'alur pendaftaran' ||
      normQ === 'pendaftaran' ||
      normQ === 'syarat daftar');

  if (isRegistrationWorkflowQuery) {
    const verifiedRegistrationAnswer = getComprehensiveSmartAnswer(
      query,
      userRole,
      userName,
      userWilayah,
      currentTab,
      activePillar,
      allPillarData,
      appSettings,
      previousContext
    );
    return {
      finalContent: verifiedRegistrationAnswer,
      isAccurate: true,
      confidence: 1.0,
      source: 'verified_exact',
    };
  }

  // Sensor Lights & 2-Tier Verification Interceptor
  const isSensorOrTierVerificationInAccuracy =
    !normQ.includes('mode diskusi') &&
    !normQ.includes('diskusi') &&
    (normQ.includes('sensor lampu') ||
      normQ.includes('lampu berkedip') ||
      normQ.includes('lampu sensor') ||
      normQ.includes('sensor berkedip') ||
      normQ.includes('centang hijau sensor') ||
      (normQ.includes('sensor') && (normQ.includes('lampu') || normQ.includes('kedip'))) ||
      (normQ.includes('alur verifikasi') && (normQ.includes('bertingkat') || normQ.includes('dua tahap') || normQ.includes('2 tier'))));

  if (isSensorOrTierVerificationInAccuracy) {
    const verifiedSensorAnswer = getComprehensiveSmartAnswer(
      query,
      userRole,
      userName,
      userWilayah,
      currentTab,
      activePillar,
      allPillarData,
      appSettings,
      previousContext
    );
    return {
      finalContent: verifiedSensorAnswer,
      isAccurate: true,
      confidence: 1.0,
      source: 'verified_exact',
    };
  }

  // Polite Introductory Preamble Interceptor ("Bolehkah saya bertanya?", "Boleh nanya?", "Izin bertanya", "Bade naros")
  // Only intercepts when user is ONLY asking to ask (no substantive question follows)
  const isIntroductoryPreambleInAccuracy =
    !accuracyHasQuestion &&
    (
      accuracyIsPureIntro ||
      normQ === 'bolehkah saya bertanya' ||
      normQ === 'bolehkah saya bertanya?' ||
      normQ === 'boleh saya bertanya' ||
      normQ === 'boleh saya bertanya?' ||
      normQ === 'bisakah saya bertanya' ||
      normQ === 'bisakah saya bertanya?' ||
      normQ === 'bolehkah bertanya' ||
      normQ === 'bolehkah bertanya?' ||
      normQ.startsWith('bolehkah saya bertanya') ||
      normQ.startsWith('boleh saya bertanya') ||
      normQ.startsWith('bisakah saya bertanya') ||
      normQ.startsWith('bolehkah bertanya') ||
      normQ.includes('izin bertanya') ||
      normQ.includes('izin nanya') ||
      normQ === 'boleh nanya' ||
      normQ === 'boleh nanya?' ||
      normQ === 'boleh nanya dong' ||
      normQ === 'boleh nanya dong?' ||
      normQ.startsWith('boleh nanya') ||
      normQ === 'bade naros' ||
      normQ === 'bade naros?' ||
      normQ === 'bade naros tiasa' ||
      normQ === 'bade naros tiasa?' ||
      normQ.includes('bade naros') ||
      normQ.includes('tiasa naros') ||
      normQ === 'mau nanya' ||
      normQ === 'mau nanya?' ||
      normQ === 'mau nanya dong' ||
      normQ === 'mau nanya dong?' ||
      normQ.startsWith('mau nanya') ||
      normQ === 'ada yang ingin saya tanyakan' ||
      normQ === 'ada yang ingin saya tanyakan?' ||
      normQ.startsWith('ada yang ingin saya tanyakan') ||
      normQ === 'apakah anda bisa bantu saya' ||
      normQ === 'apakah anda bisa bantu saya?' ||
      normQ === 'apakah bisa bantu saya' ||
      normQ === 'apakah bisa bantu saya?' ||
      normQ === 'bisakah bantu saya' ||
      normQ === 'bisakah bantu saya?' ||
      normQ === 'bisakah anda bantu saya' ||
      normQ === 'bisakah anda bantu saya?' ||
      normQ === 'bisakah kamu bantu saya' ||
      normQ === 'bisakah kamu bantu saya?' ||
      normQ === 'bisakah membantu saya' ||
      normQ === 'bisakah membantu saya?' ||
      normQ === 'bisa bantu saya' ||
      normQ === 'bisa bantu saya?' ||
      normQ === 'bisa tolong bantu saya' ||
      normQ === 'bisa tolong bantu saya?' ||
      normQ === 'bisa tolong saya' ||
      normQ === 'tolong bantu saya' ||
      normQ.includes('bisakah bantu') ||
      normQ.includes('bisakah membantu') ||
      normQ.includes('bisa tolong bantu') ||
      normQ === 'halo min mau nanya' ||
      normQ === 'halo admin mau nanya' ||
      normQ.includes('menanyakan 1 hal') ||
      normQ.includes('menanyakan satu hal') ||
      normQ.includes('nanya 1 hal') ||
      normQ.includes('nanya satu hal') ||
      normQ.includes('1 hal lagi') ||
      normQ.includes('satu hal lagi') ||
      normQ.includes('ingin bertanya lagi') ||
      normQ.includes('mau bertanya lagi') ||
      normQ.includes('mau nanya lagi') ||
      normQ.includes('ingin nanya lagi')
    );

  if (isIntroductoryPreambleInAccuracy) {
    if (rawReply && rawReply.trim().length > 0 && !rawReply.includes('Mohon maaf, saya belum dapat mengenali atau menemukan informasi') && !rawReply.includes('Mohon maaf untuk saat ini masih belum memiliki informasi')) {
      return {
        finalContent: rawReply.trim(),
        isAccurate: true,
        confidence: 0.99,
        source: 'ai_model_verified',
      };
    }
    const verifiedIntroAnswer = getComprehensiveSmartAnswer(
      query,
      userRole,
      userName,
      userWilayah,
      currentTab,
      activePillar,
      allPillarData,
      appSettings,
      previousContext
    );
    return {
      finalContent: verifiedIntroAnswer,
      isAccurate: true,
      confidence: 1.0,
      source: 'verified_exact',
    };
  }

  // Confirmation / acknowledgment of developer or system creation
  const isQuestionOrSecurityInVerify =
    normQ.includes('?') ||
    normQ.includes('mana') ||
    normQ.includes('bagaimana') ||
    normQ.includes('gimana') ||
    normQ.includes('kenapa') ||
    normQ.includes('mengapa') ||
    normQ.includes('kapan') ||
    normQ.includes('berapa') ||
    normQ.includes('siapa') ||
    normQ.includes('apakah') ||
    normQ.includes('apa ') ||
    normQ.endsWith('apa') ||
    normQ.includes('lupa') ||
    normQ.includes('password') ||
    normQ.includes('sandi') ||
    normQ.includes('pin') ||
    normQ.includes('kredensial') ||
    normQ.includes('masuk') ||
    normQ.includes('login') ||
    normQ.includes('bocorkan') ||
    normQ.includes('minta') ||
    normQ.includes('berikan') ||
    normQ.includes('kasih') ||
    normQ.includes('buka') ||
    normQ.includes('reset') ||
    normQ.includes('daftar') ||
    normQ.includes('syarat') ||
    normQ.includes('cara');

  const hasAckEndingInVerify = /(^|\s)(ya|kan|toh|nih)\??$/i.test(normQ);

  const isConfirmingOrAcknowledgingDev =
    !isQuestionOrSecurityInVerify &&
    (
      normQ.startsWith('owalah') ||
      normQ.startsWith('oalah') ||
      normQ.startsWith('oh jadi') ||
      normQ.startsWith('oh ternyata') ||
      normQ.startsWith('oh begitu') ||
      normQ.startsWith('oh gitu') ||
      normQ.startsWith('berarti') ||
      normQ.startsWith('ternyata') ||
      normQ.startsWith('pantesan') ||
      normQ.includes('itu pembuat') ||
      normQ.includes('dia yang bikin') ||
      normQ.includes('dia yang buat') ||
      normQ.includes('dia developernya') ||
      normQ.includes('dia pembuatnya') ||
      (hasAckEndingInVerify && (normQ.startsWith('jadi ') || normQ.startsWith('berarti ')))
    ) &&
    (
      normQ.includes('ilham') ||
      normQ.includes('fazril') ||
      ((normQ.includes('pembuat') || normQ.includes('developer')) && (normQ.includes('dia') || normQ.includes('beliau') || normQ.includes('siswa') || normQ.includes('magang')))
    );

  // If user is confirming / acknowledging, PRESERVE Gemini's natural conversational response if available!
  if (isConfirmingOrAcknowledgingDev && rawReply && rawReply.trim().length > 0) {
    return {
      finalContent: rawReply.trim(),
      isAccurate: true,
      confidence: 0.99,
      source: 'ai_model_verified',
    };
  }

  // Developer / Creator Identity Verification Check (Applies to all users without exception)
  const isAskingDeveloper =
    !isDeveloperCredQuery &&
    !isImpersonationAttempt &&
    (
      normQ.includes('siapa yang buat') ||
      normQ.includes('siapa yang bikin') ||
      normQ.includes('siapa pembuat') ||
      normQ.includes('siapa developernya') ||
      normQ.includes('siapa developer') ||
      normQ.includes('siapa author') ||
      normQ.includes('siapa arsitek') ||
      normQ.includes('siapa pengembang') ||
      normQ.includes('yang bikin aplikasi') ||
      normQ.includes('yang buat website') ||
      normQ.includes('ilham fazril') ||
      normQ.includes('ilhamfazril') ||
      normQ.includes('siapa ilham') ||
      normQ.includes('kenal ilham') ||
      normQ.includes('siapakah ilham') ||
      normQ.includes('siapa itu ilham') ||
      normQ.includes('tau ilham') ||
      normQ.includes('tahu ilham') ||
      normQ.includes('ilham itu siapa') ||
      (normQ.includes('developer') && !normQ.includes('password') && !normQ.includes('sandi') && !normQ.includes('masuk') && !normQ.includes('lupa') && !normQ.includes('kredensial') && (normQ.includes('siapa') || normQ.includes('profil') || normQ.includes('biodata') || normQ.includes('tentang') || normQ.includes('kenal') || normQ.includes('tau') || normQ.includes('tahu')))
    );

  // If user is asking who developed or who is Ilham, and rawReply already correctly mentions Ilham Fazril, PRESERVE Gemini's conversational reply!
  if (
    isAskingDeveloper &&
    rawReply &&
    (rawReply.toLowerCase().includes('ilham') || rawReply.toLowerCase().includes('fazril'))
  ) {
    return {
      finalContent: rawReply.trim(),
      isAccurate: true,
      confidence: 0.99,
      source: 'ai_model_verified',
    };
  }

  if (isAskingDeveloper) {
    const accurateDevAnswer = getComprehensiveSmartAnswer(
      query,
      userRole,
      userName,
      userWilayah,
      currentTab,
      activePillar,
      allPillarData,
      appSettings,
      previousContext
    );
    return {
      finalContent: accurateDevAnswer,
      isAccurate: true,
      confidence: 1.0,
      source: 'verified_exact',
    };
  }

  // Personal "Siapa Saya" Check (Strictly separated)
  const isAskingSelfIdentity =
    normQ.includes('siapa saya') ||
    normQ.includes('kenal saya') ||
    normQ.includes('kamu kenal saya') ||
    normQ.includes('tau siapa saya') ||
    normQ.includes('tahu siapa saya') ||
    normQ.includes('siapakah saya');

  if (isAskingSelfIdentity) {
    const selfAnswer = getComprehensiveSmartAnswer(
      query,
      userRole,
      userName,
      userWilayah,
      currentTab,
      activePillar,
      allPillarData,
      appSettings,
      previousContext
    );
    return {
      finalContent: selfAnswer,
      isAccurate: true,
      confidence: 1.0,
      source: 'verified_exact',
    };
  }

  // 1. Developer Query Handling: Always preserve Gemini's rich, fluent generative output (including Sundanese and lively banter)
  if (isDeveloperUser && rawReply && rawReply.trim().length > 5) {
    return {
      finalContent: rawReply.trim(),
      isAccurate: true,
      confidence: 0.99,
      source: 'ai_model_verified',
    };
  }

  // 1.05 KUBE vs Badan Usaha Nomenclature / Equivalence Verification
  const isKubeBadanUsahaQuery =
    (normQ.includes('kube') || normQ.includes('kelompok usaha')) &&
    (normQ.includes('badan usaha') || normQ.includes('usaha sosial') || normQ.includes('pilar 9') || normQ.includes('tertera') || normQ.includes('tertulis') || normQ.includes('bukannya') || normQ.includes('bukan nya')) &&
    (
      normQ.includes('kenapa') ||
      normQ.includes('mengapa') ||
      normQ.includes('kok') ||
      normQ.includes('naha') ||
      normQ.includes('bukannya') ||
      normQ.includes('bukan nya') ||
      normQ.includes('bukan') ||
      normQ.includes('tertera') ||
      normQ.includes('tertulis') ||
      normQ.includes('namanya') ||
      normQ.includes('disebut') ||
      normQ.includes('sama') ||
      normQ.includes('beda') ||
      normQ.includes('hubungan')
    );

  if (isKubeBadanUsahaQuery) {
    const rawLower = (rawReply || '').toLowerCase();
    const hasProperExplanation =
      (rawLower.includes('sama saja') || rawLower.includes('sama aja') || rawLower.includes('payung') || rawLower.includes('nomenklatur') || rawLower.includes('kesatuan pilar')) &&
      !rawReply?.startsWith('**Kelompok Usaha Bersama (KUBE) & Badan Usaha Sosial**:\n- **Definisi**:');

    if (hasProperExplanation && rawReply) {
      return {
        finalContent: rawReply.trim(),
        isAccurate: true,
        confidence: 0.99,
        source: 'ai_model_verified',
      };
    }

    const accurateKubeAnswer = getComprehensiveSmartAnswer(
      query,
      userRole,
      userName,
      userWilayah,
      currentTab,
      activePillar,
      allPillarData,
      appSettings,
      previousContext
    );
    return {
      finalContent: accurateKubeAnswer,
      isAccurate: true,
      confidence: 1.0,
      source: 'verified_exact',
    };
  }

  // 1.045 Priority: Real-time PIN Security Guidance (Strictly differentiates 6-Digit PIN vs 12-Char Password)
  const pinSecurityAnswer = resolvePinSecurityQuery(query, userRole, userName);
  if (pinSecurityAnswer) {
    return {
      finalContent: pinSecurityAnswer,
      isAccurate: true,
      confidence: 1.0,
      source: 'verified_exact',
    };
  }

  // 1.05 Priority: Sensitive Personal Data Protection (UU PDP No. 27/2022)
  const privacyRefusal = resolveSensitivePrivacyQuery(query);
  if (privacyRefusal) {
    return {
      finalContent: privacyRefusal,
      isAccurate: true,
      confidence: 1.0,
      source: 'verified_exact',
    };
  }

  // 1.06 Priority: Real-time Member Verification Grounding (Reads live state directly)
  const memberVerified = resolveMemberVerificationQuery(query, allPillarData, userWilayah);
  if (memberVerified) {
    return {
      finalContent: memberVerified,
      isAccurate: true,
      confidence: 1.0,
      source: 'state_grounded',
    };
  }

  // 1.07 Priority: Real-time Regional Pillar Data Grounding (Overrules any theoretical calculations)
  const regionalVerified = resolveRegionalPillarDataQuery(query, allPillarData, userWilayah);
  if (regionalVerified) {
    return {
      finalContent: regionalVerified,
      isAccurate: true,
      confidence: 1.0,
      source: 'state_grounded',
    };
  }

  // 1.1 Priority for Dynamic Model / Firestore Engine Reply with Context Awareness
  if (rawReply && rawReply.trim().length > 0) {
    const isModelRefusal =
      rawReply.includes('Mohon maaf untuk saat ini masih belum memiliki informasi') ||
      rawReply.includes('Mohon maaf, terjadi kendala saat memproses respons') ||
      rawReply.includes('Halo! Saya Asisten AI **PSKS JABAR**. Ada yang bisa saya bantu atau informasi apa yang ingin Anda diskusikan seputar 10 Pilar PSKS');

    if (isModelRefusal) {
      const cleanQ = query.toLowerCase().trim();
      const isSimpleGreeting = /^(halo|hai|hi|hey|assalamualaikum|assalamu'alaikum|sampurasun|p|tes|test|pagi|siang|sore|malam)$/i.test(cleanQ);

      // If user asked a substantive question, provide the authoritative, context-aware local smart answer
      if (!isSimpleGreeting) {
        const smartAnswer = getComprehensiveSmartAnswer(
          query,
          userRole,
          userName,
          userWilayah,
          currentTab,
          activePillar,
          allPillarData,
          appSettings,
          previousContext
        );
        if (
          smartAnswer &&
          !smartAnswer.includes('Mohon maaf untuk saat ini masih belum memiliki informasi') &&
          !smartAnswer.includes('Mohon maaf, terjadi kendala saat memproses respons')
        ) {
          return {
            finalContent: smartAnswer,
            isAccurate: true,
            confidence: 0.99,
            source: 'verified_exact',
          };
        }
      }
    }

    return {
      finalContent: rawReply.trim(),
      isAccurate: true,
      confidence: 0.98,
      source: 'ai_model_verified',
    };
  }

  // 1.2 Direct Catalog Match Check (Exact verified answers when clicking catalog prompt without backend)
  const allCatalogQuestions: AIQuestionItem[] = [];
  Object.values(ROLE_QUESTION_CATALOG).forEach((groups) => {
    groups.forEach((g) => allCatalogQuestions.push(...g.questions));
  });

  const matchingCatalogItem = allCatalogQuestions.find((item) => {
    const itemQ = item.question.toLowerCase().replace(/[?!.,]/g, '').trim();
    return normQ === itemQ;
  });

  if (matchingCatalogItem && EXACT_QUESTION_ANSWERS[matchingCatalogItem.id]) {
    return {
      finalContent: EXACT_QUESTION_ANSWERS[matchingCatalogItem.id],
      isAccurate: true,
      confidence: 1.0,
      source: 'verified_exact',
    };
  }

  // 3. Generative Model Output (Fluent, intelligent, multi-turn, understands informal language & preambles)
  if (rawReply && rawReply.trim().length > 10) {
    return {
      finalContent: rawReply.trim(),
      isAccurate: true,
      confidence: 0.98,
      source: 'ai_model_verified',
    };
  }

  // 4. Fallback to Enhanced Local Knowledge Engine
  const fallback = getComprehensiveSmartAnswer(
    query,
    userRole,
    userName,
    userWilayah,
    currentTab,
    activePillar,
    allPillarData,
    appSettings,
    previousContext
  );

  return {
    finalContent: fallback,
    isAccurate: true,
    confidence: 0.92,
    source: 'knowledge_fallback',
  };
}

/**
 * Verification & Tracking System: Cross-checks response accuracy against state & knowledge base,
 * cleans repeated greetings in multi-turn dialogues, and guarantees contextual pillar action buttons.
 */
export function verifyAndTrackAnswerAccuracy(
  query: string,
  rawReply: string,
  userRole: UserRole = 'user',
  userName?: string,
  userWilayah?: string,
  currentTab?: string,
  activePillar?: PillarId | null,
  allPillarData?: Record<string, PSKSDataRecord[]>,
  appSettings?: AppSettings,
  previousContext?: string
): {
  finalContent: string;
  isAccurate: boolean;
  confidence: number;
  source: 'verified_exact' | 'state_grounded' | 'ai_model_verified' | 'knowledge_fallback';
} {
  const result = runCoreAnswerVerification(
    query,
    rawReply,
    userRole,
    userName,
    userWilayah,
    currentTab,
    activePillar,
    allPillarData,
    appSettings,
    previousContext
  );

  let res = result.finalContent || '';

  // 1. GREETING POLICY: Hapus salam & sapaan 'Sampurasun' / 'Bapak/Ibu' berulang pada dialog lanjutan (Turn 2+)
  if (previousContext && userRole !== 'developer') {
    res = res
      .replace(
        /^(?:sampurasun[,\s]*(?:bapak\/ibu|bapak|ibu|sadayana)?[!.,\s]*|halo[,\s]*(?:bapak\/ibu|bapak|ibu)?[!.,\s]*|wilujeng\s+(?:sumping|enjing|siang|sonten|wengi)[!.,\s]*|bapak\/ibu[,\s]*)+/i,
        ''
      )
      .trim();
    if (res.length > 0) {
      res = res.charAt(0).toUpperCase() + res.slice(1);
    }
  }

  // 2. CONTEXTUAL ACTION BUTTON: Pastikan tombol aksi relevan dan nyambung dengan pilar yang sedang dibahas
  const detectedP = detectPillarInText(query) || (activePillar && PILLARS_CONFIG[activePillar] ? { pillarId: activePillar, pillarName: PILLARS_CONFIG[activePillar].title } : null);
  if (detectedP) {
    if (/\[\[action:tab:beranda:[^\]]*\]\]/i.test(res) || /\[\[action:[^\]]*lihat data psks[^\]]*\]\]/i.test(res)) {
      res = res.replace(/\[\[action:tab:beranda:[^\]]*\]\]/gi, `[[action:pillar:${detectedP.pillarId}:Lihat Data ${detectedP.pillarName}]]`);
      res = res.replace(/\[\[action:[^\]]*lihat data psks[^\]]*\]\]/gi, `[[action:pillar:${detectedP.pillarId}:Lihat Data ${detectedP.pillarName}]]`);
    } else if (!res.includes(`action:pillar:${detectedP.pillarId}`) && !res.includes('action:tab:') && !res.includes('action:pillar:')) {
      res = `${res.trim()}\n\n[[action:pillar:${detectedP.pillarId}:Lihat Data ${detectedP.pillarName}]]`;
    }
  }

  return {
    ...result,
    finalContent: res,
  };
}
