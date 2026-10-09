-- ========================================================================
-- SISTEM INFORMASI PSKS JAWA BARAT - SUPABASE DATABASE MIGRATION SCHEMA
-- Jalankan skrip ini di SQL Editor pada Supabase Dashboard Anda.
-- ========================================================================

-- Aktifkan ekstensi UUID jika diperlukan
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABEL: psks_records (Data Master 21.963+ Rekaman PSKS)
CREATE TABLE IF NOT EXISTS public.psks_records (
    id TEXT PRIMARY KEY,
    "pillarId" TEXT,
    wilayah TEXT,
    nama TEXT,
    status TEXT,
    kec TEXT,
    "kelDesa" TEXT,
    "orderIndex" INTEGER,
    "createdAt" TEXT,
    "updatedAt" TEXT,
    data JSONB DEFAULT '{}'::jsonb
);

-- Index pencarian cepat untuk psks_records
CREATE INDEX IF NOT EXISTS idx_psks_records_pillar ON public.psks_records ("pillarId");
CREATE INDEX IF NOT EXISTS idx_psks_records_wilayah ON public.psks_records (wilayah);
CREATE INDEX IF NOT EXISTS idx_psks_records_nama ON public.psks_records (nama);
CREATE INDEX IF NOT EXISTS idx_psks_records_data ON public.psks_records USING gin (data);

-- 2. TABEL: admin_accounts (Akun Petugas & Administrator)
CREATE TABLE IF NOT EXISTS public.admin_accounts (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE,
    "namaAdmin" TEXT,
    role TEXT,
    "statusActive" TEXT,
    "wilayahTugas" TEXT,
    "passwordHash" TEXT,
    "sessionToken" TEXT,
    data JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_admin_accounts_username ON public.admin_accounts (username);
CREATE INDEX IF NOT EXISTS idx_admin_accounts_role ON public.admin_accounts (role);

-- 3. TABEL: psks_regional_logos (Logo 28 Wilayah Jawa Barat)
CREATE TABLE IF NOT EXISTS public.psks_regional_logos (
    id TEXT PRIMARY KEY,
    "regionName" TEXT UNIQUE,
    logo TEXT,
    "updatedAt" TEXT
);

CREATE INDEX IF NOT EXISTS idx_regional_logos_name ON public.psks_regional_logos ("regionName");

-- 4. TABEL: system_logs (Riwayat Aktivitas & Audit Trail)
CREATE TABLE IF NOT EXISTS public.system_logs (
    id TEXT PRIMARY KEY,
    "actorName" TEXT,
    "actorRole" TEXT,
    "actorWilayah" TEXT,
    "actionType" TEXT,
    category TEXT,
    timestamp TEXT,
    "createdAt" TEXT,
    details TEXT,
    data JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_system_logs_created ON public.system_logs ("createdAt");

-- 5. TABEL: registration_submissions (Pendaftaran Mandiri)
CREATE TABLE IF NOT EXISTS public.registration_submissions (
    id TEXT PRIMARY KEY,
    nama TEXT,
    nik TEXT,
    hp TEXT,
    wilayah TEXT,
    kec TEXT,
    "pillarId" TEXT,
    status TEXT,
    "submittedAt" TEXT,
    "recordData" JSONB DEFAULT '{}'::jsonb,
    data JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_reg_submissions_pillar ON public.registration_submissions ("pillarId");
CREATE INDEX IF NOT EXISTS idx_reg_submissions_status ON public.registration_submissions (status);

-- 6. TABEL: task_items (Agenda & Tugas Wilayah)
CREATE TABLE IF NOT EXISTS public.task_items (
    id TEXT PRIMARY KEY,
    title TEXT,
    description TEXT,
    "pillarId" TEXT,
    status TEXT,
    priority TEXT,
    "targetWilayah" TEXT,
    "assignedTo" TEXT,
    deadline TEXT,
    "progressPercent" INTEGER,
    data JSONB DEFAULT '{}'::jsonb
);

-- 7. TABEL: portal_faqs (Pusat Bantuan & FAQ)
CREATE TABLE IF NOT EXISTS public.portal_faqs (
    id TEXT PRIMARY KEY,
    question TEXT,
    answer TEXT,
    category TEXT,
    "order" INTEGER,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TEXT,
    "updatedAt" TEXT
);

-- 8. TABEL: app_settings (Konfigurasi Aplikasi)
CREATE TABLE IF NOT EXISTS public.app_settings (
    id TEXT PRIMARY KEY,
    data JSONB DEFAULT '{}'::jsonb,
    "updatedAt" TEXT
);

-- 9. TABEL: psks_records_meta (Metadata & Riwayat Batch)
CREATE TABLE IF NOT EXISTS public.psks_records_meta (
    id TEXT PRIMARY KEY,
    data JSONB DEFAULT '{}'::jsonb,
    "updatedAt" TEXT
);

-- 10. TABEL: ip_registrations (Keamanan Registrasi IP & Perangkat)
CREATE TABLE IF NOT EXISTS public.ip_registrations (
    id TEXT PRIMARY KEY,
    type TEXT,
    identifier TEXT,
    count INTEGER,
    "lastRegisteredAt" TEXT,
    "updatedAt" TEXT,
    data JSONB DEFAULT '{}'::jsonb
);

-- 11. TABEL: ai_config (Konfigurasi Otak AI Assistant)
CREATE TABLE IF NOT EXISTS public.ai_config (
    id TEXT PRIMARY KEY,
    "systemInstruction" TEXT,
    "vocabularySummary" TEXT,
    "contextRules" TEXT,
    "dialogueExamples" TEXT,
    "updatedAt" TEXT,
    data JSONB DEFAULT '{}'::jsonb
);

-- 12. TABEL: ai_vocabulary (Kosakata AI - 278 kata)
CREATE TABLE IF NOT EXISTS public.ai_vocabulary (
    id TEXT PRIMARY KEY,
    word TEXT,
    canonical TEXT,
    category TEXT,
    data JSONB DEFAULT '{}'::jsonb
);

-- 13. TABEL: ai_knowledge_base (Basis Pengetahuan AI - 31 artikel)
CREATE TABLE IF NOT EXISTS public.ai_knowledge_base (
    id TEXT PRIMARY KEY,
    title TEXT,
    topic TEXT,
    category TEXT,
    content TEXT,
    summary TEXT,
    keywords TEXT,
    "actionTag" TEXT,
    "updatedAt" TEXT,
    data JSONB DEFAULT '{}'::jsonb
);

-- 14. TABEL: ai_unmatched_logs (Log Pertanyaan AI)
CREATE TABLE IF NOT EXISTS public.ai_unmatched_logs (
    id TEXT PRIMARY KEY,
    snippet TEXT,
    "guessedCategory" TEXT,
    "detectedWords" TEXT,
    status TEXT,
    count INTEGER,
    "createdAt" TEXT,
    "updatedAt" TEXT,
    data JSONB DEFAULT '{}'::jsonb
);

-- 15. TABEL: psks_app_settings (Pengaturan Tambahan PSKS)
CREATE TABLE IF NOT EXISTS public.psks_app_settings (
    id TEXT PRIMARY KEY,
    "updatedAt" TEXT,
    data JSONB DEFAULT '{}'::jsonb
);

-- ========================================================================
-- KEAMANAN: AKTIFKAN ROW LEVEL SECURITY (RLS) & IZINKAN AKSES PENUH
-- ========================================================================
ALTER TABLE public.psks_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.psks_regional_logos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registration_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.psks_records_meta ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ip_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_vocabulary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_unmatched_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.psks_app_settings ENABLE ROW LEVEL SECURITY;

-- Kebijakan Akses Publik / Anon / Authenticated (Read & Write)
DO $$
DECLARE
    tbl text;
BEGIN
    FOR tbl IN
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name IN (
            'psks_records',
            'admin_accounts',
            'psks_regional_logos',
            'system_logs',
            'registration_submissions',
            'task_items',
            'portal_faqs',
            'app_settings',
            'psks_records_meta',
            'ip_registrations',
            'ai_config',
            'ai_vocabulary',
            'ai_knowledge_base',
            'ai_unmatched_logs',
            'psks_app_settings'
          )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "allow_all_ops" ON public.%I;', tbl);
        EXECUTE format('CREATE POLICY "allow_all_ops" ON public.%I FOR ALL TO public USING (true) WITH CHECK (true);', tbl);
    END LOOP;
END $$;

-- Berikan hak akses penuh ke role anon dan authenticated
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
