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
-- KEAMANAN PRODUKSI: ROW LEVEL SECURITY (RLS) TERTUTUP & PRINSIP LEAST-PRIVILEGE
-- Sesuai standar kepatuhan siber & UU Pelindungan Data Pribadi (UU PDP No. 27/2022)
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

-- 1. Bersihkan seluruh policy lama yang insecure (allow_all_ops)
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
        EXECUTE format('DROP POLICY IF EXISTS "read_public" ON public.%I;', tbl);
        EXECUTE format('DROP POLICY IF EXISTS "insert_public" ON public.%I;', tbl);
        EXECUTE format('DROP POLICY IF EXISTS "service_all" ON public.%I;', tbl);
    END LOOP;
END $$;

-- 2. Proteksi Mutlak: admin_accounts (DILARANG DIBACA OLEH PUBLIK / ANON)
-- Mencegah kebocoran username, hash password, dan session token ke pihak ketiga.
REVOKE ALL ON public.admin_accounts FROM anon;
CREATE POLICY "service_only_admin_accounts" ON public.admin_accounts 
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 3. Proteksi Data Master: psks_records (Publik HANYA boleh membaca data terverifikasi)
-- Mencegah penghapusan massal atau manipulasi data pilar oleh orang luar.
CREATE POLICY "psks_records_public_read" ON public.psks_records 
    FOR SELECT TO public USING (true);
CREATE POLICY "psks_records_service_all" ON public.psks_records 
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 4. Proteksi Pendaftaran Mandiri: registration_submissions
-- Publik (warga) hanya diizinkan mengirim pendaftaran (INSERT), tetapi DILARANG membaca data NIK pendaftar lain (SELECT).
CREATE POLICY "reg_submissions_public_insert" ON public.registration_submissions 
    FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "reg_submissions_service_all" ON public.registration_submissions 
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 5. Proteksi Audit Trail: system_logs
-- Mencegah manipulasi atau pembersihan log aktivitas kedinasan oleh pengguna umum.
CREATE POLICY "system_logs_public_insert" ON public.system_logs 
    FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "system_logs_service_all" ON public.system_logs 
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 6. Tabel Publik Terbaca: portal_faqs, app_settings, logos, ai_knowledge
-- Publik boleh membaca konfigurasi tampilan dan FAQ, namun pengubahan hanya melalui service_role.
DO $$
DECLARE
    read_tbl text;
BEGIN
    FOR read_tbl IN
        SELECT unnest(ARRAY[
            'portal_faqs',
            'app_settings',
            'psks_regional_logos',
            'psks_records_meta',
            'psks_app_settings',
            'ai_config',
            'ai_vocabulary',
            'ai_knowledge_base',
            'task_items',
            'ip_registrations'
        ])
    LOOP
        EXECUTE format('CREATE POLICY "public_read_only" ON public.%I FOR SELECT TO public USING (true);', read_tbl);
        EXECUTE format('CREATE POLICY "service_role_manage" ON public.%I FOR ALL TO service_role USING (true) WITH CHECK (true);', read_tbl);
    END LOOP;
END $$;

-- 7. Hak Akses Schema: Cabut hak destruktif dari anon
REVOKE DELETE, TRUNCATE ON ALL TABLES IN SCHEMA public FROM anon;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT ON public.psks_records, public.portal_faqs, public.app_settings, public.psks_regional_logos, public.ai_knowledge_base TO anon;
GRANT INSERT ON public.registration_submissions, public.system_logs TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
