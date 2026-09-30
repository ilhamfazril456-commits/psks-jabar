import React, { useState, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import * as XLSX from 'xlsx';
import {
  X,
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Settings2,
  Table,
  Sparkles,
  Loader2,
  FileCheck,
  RefreshCw,
  Info
} from 'lucide-react';
import { PillarId, PSKSDataRecord, UserSession } from '../../types';
import { JABAR_REGIONS, KAB_KOTA_ONLY } from '../../data/initialData';

interface PillarExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  pillarId: PillarId;
  pillar: any;
  session: UserSession;
  onBatchImport: (records: Omit<PSKSDataRecord, 'id'>[]) => Promise<number>;
}

interface TargetFieldDef {
  key: string;
  label: string;
  required: boolean;
  hint?: string;
  synonyms: string[];
}

// Kamus sinonim kolom per pilar untuk pencocokan otomatis 100% cerdas
const FIELD_DEFINITIONS: Record<string, TargetFieldDef[]> = {
  common: [
    {
      key: 'nama',
      label: 'Nama Lengkap',
      required: true,
      hint: 'Nama orang, lembaga, atau nama organisasi',
      synonyms: ['nama', 'nama lengkap', 'nama_lengkap', 'namalengkap', 'nama anggota', 'nama pemohon', 'name', 'full name', 'fullname', 'nama_anggota', 'nama ketua'],
    },
    {
      key: 'nik',
      label: 'NIK (16 Digit) / Nomor Legalitas',
      required: true,
      hint: 'Nomor NIK KTP, No Induk, atau No Registrasi',
      synonyms: ['nik', 'no ktp', 'no. ktp', 'noktp', 'no_ktp', 'nomor ktp', 'nomor induk', 'no induk', 'nik ktp', 'nik_ktp', 'nomor kependudukan', 'nomor tanda daftar', 'no tanda daftar', 'nomor induk anggota', 'no badan hukum'],
    },
    {
      key: 'wilayah',
      label: 'Kabupaten/Kota (Jawa Barat)',
      required: true,
      hint: 'Nama Kabupaten/Kota domisili penugasan di Jawa Barat',
      synonyms: ['kabupaten', 'kota', 'kab/kota', 'kabupaten/kota', 'wilayah', 'kab', 'kota/kab', 'daerah', 'kabupaten domisili', 'wilayah tugas', 'kab/kota domisili', 'kabkota', 'kab_kota'],
    },
    {
      key: 'kec',
      label: 'Kecamatan',
      required: false,
      hint: 'Kecamatan penugasan atau domisili',
      synonyms: ['kecamatan', 'kec', 'kec.', 'wilayah penugasan', 'kecamatan domisili', 'kecamatan tugas'],
    },
    {
      key: 'kelDesa',
      label: 'Desa / Kelurahan',
      required: false,
      hint: 'Desa atau Kelurahan domisili',
      synonyms: ['kelurahan', 'desa', 'kel/desa', 'desa/kelurahan', 'kel', 'desa/kel', 'kel_desa', 'desakelurahan'],
    },
    {
      key: 'hp',
      label: 'Nomor Handphone / WhatsApp',
      required: false,
      hint: 'Kontak WhatsApp aktif untuk koordinasi',
      synonyms: ['hp', 'no hp', 'no. hp', 'nohp', 'nomor hp', 'telepon', 'telp', 'no telp', 'no whatsapp', 'whatsapp', 'wa', 'no wa', 'kontak', 'phone', 'mobile', 'nohandphone'],
    },
    {
      key: 'sertifikasi',
      label: 'Sertifikat / SK / Nomor Dokumen Legalitas',
      required: false,
      hint: 'No SK Pengangkatan, Sertifikat Diklat, atau Bidang Usaha',
      synonyms: ['sk', 'nomor sk', 'no sk', 'no. sk', 'nosk', 'sertifikat', 'sertifikasi', 'no sertifikat', 'sk pengangkatan', 'sk penugasan', 'tanda daftar', 'bidang', 'jenis usaha', 'layanan'],
    },
    {
      key: 'jenisKelamin',
      label: 'Jenis Kelamin (L/P)',
      required: false,
      hint: 'Laki-laki atau Perempuan',
      synonyms: ['jenis kelamin', 'jk', 'gender', 'kelamin', 'sex', 'l/p', 'jenis_kelamin'],
    },
    {
      key: 'pendidikan',
      label: 'Pendidikan Terakhir',
      required: false,
      hint: 'Tingkat pendidikan (SMA/D3/S1/S2/dll)',
      synonyms: ['pendidikan', 'pendidikan terakhir', 'lulusan', 'tingkat pendidikan', 'ijazah', 'pendidikan_terakhir'],
    },
    {
      key: 'alamat',
      label: 'Alamat Lengkap',
      required: false,
      hint: 'Alamat tempat tinggal atau sekretariat',
      synonyms: ['alamat', 'alamat lengkap', 'domisili', 'alamat domisili', 'alamat rumah', 'alamat sekretariat', 'alamat_lengkap'],
    },
  ],
};

// Normalisasi pemetaan nama wilayah resmi Jawa Barat
function normalizeJabarRegion(val: any, defaultWilayah: string): string {
  if (!val || typeof val !== 'string') return defaultWilayah;
  const raw = val.trim().toLowerCase();
  if (!raw) return defaultWilayah;

  // Cek kecocokan presisi
  for (const reg of JABAR_REGIONS) {
    if (reg.toLowerCase() === raw) return reg;
  }

  // Cek kata kunci parsial (misal: "bogor", "kota bogor", "kab bogor")
  if (raw.includes('cimahi')) return 'Kota Cimahi';
  if (raw.includes('depok')) return 'Kota Depok';
  if (raw.includes('banjar')) return 'Kota Banjar';
  if (raw.includes('sukabumi')) {
    return raw.includes('kota') ? 'Kota Sukabumi' : 'Kab. Sukabumi';
  }
  if (raw.includes('cirebon')) {
    return raw.includes('kota') ? 'Kota Cirebon' : 'Kab. Cirebon';
  }
  if (raw.includes('bekasi')) {
    return raw.includes('kota') ? 'Kota Bekasi' : 'Kab. Bekasi';
  }
  if (raw.includes('tasik')) {
    return raw.includes('kota') ? 'Kota Tasikmalaya' : 'Kab. Tasikmalaya';
  }
  if (raw.includes('bandung barat') || raw.includes('kbb')) return 'Kab. Bandung Barat';
  if (raw.includes('bandung')) {
    return raw.includes('kota') ? 'Kota Bandung' : 'Kab. Bandung';
  }
  if (raw.includes('bogor')) {
    return raw.includes('kota') ? 'Kota Bogor' : 'Kab. Bogor';
  }
  if (raw.includes('cianjur')) return 'Kab. Cianjur';
  if (raw.includes('garut')) return 'Kab. Garut';
  if (raw.includes('ciamis')) return 'Kab. Ciamis';
  if (raw.includes('kuningan')) return 'Kab. Kuningan';
  if (raw.includes('majalengka')) return 'Kab. Majalengka';
  if (raw.includes('sumedang')) return 'Kab. Sumedang';
  if (raw.includes('indramayu')) return 'Kab. Indramayu';
  if (raw.includes('subang')) return 'Kab. Subang';
  if (raw.includes('purwakarta')) return 'Kab. Purwakarta';
  if (raw.includes('karawang')) return 'Kab. Karawang';
  if (raw.includes('pangandaran')) return 'Kab. Pangandaran';
  if (raw.includes('prov') || raw.includes('jabar') || raw.includes('jawa barat')) return 'Prov. Jabar';

  return defaultWilayah;
}

// Membersihkan NIK dari notasi scientific (misal: 3.27301E+15) atau float/string kotor
function sanitizeNIK(val: any): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'number') {
    // Hindari eksponensial di JS
    return BigInt(Math.floor(val)).toString();
  }
  const str = String(val).trim();
  // Jika notasi ilmiah E+
  if (str.toUpperCase().includes('E+')) {
    const num = Number(str);
    if (!isNaN(num)) {
      return BigInt(Math.floor(num)).toString();
    }
  }
  return str.replace(/\D/g, '');
}

// Membersihkan nomor telepon / HP
function sanitizePhone(val: any): string {
  if (!val) return '';
  let str = String(val).trim();
  // Tangani nomor excel format numerik
  if (str.startsWith('62')) {
    str = '0' + str.slice(2);
  } else if (str.startsWith('+62')) {
    str = '0' + str.slice(3);
  }
  return str.replace(/[^0-9+\s-]/g, '');
}

// Membersihkan jenis kelamin
function sanitizeGender(val: any): string {
  if (!val) return '';
  const s = String(val).trim().toUpperCase();
  if (s === 'L' || s === 'LAKI' || s === 'LAKI-LAKI' || s === 'PRIA' || s === 'MALE' || s === 'M') {
    return 'Laki-laki';
  }
  if (s === 'P' || s === 'PEREMPUAN' || s === 'WANITA' || s === 'FEMALE' || s === 'F') {
    return 'Perempuan';
  }
  return String(val).trim();
}

export const PillarExcelImportModal: React.FC<PillarExcelImportModalProps> = ({
  isOpen,
  onClose,
  pillarId,
  pillar,
  session,
  onBatchImport,
}) => {
  // Step state: 1 = Upload, 2 = Mapping, 3 = Preview & Import, 4 = Success
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [file, setFile] = useState<File | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [rawRows, setRawRows] = useState<any[]>([]);
  const [excelHeaders, setExcelHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({}); // TargetFieldKey -> ExcelHeader
  const [isProcessing, setIsProcessing] = useState(false);
  const [importProgress, setImportProgress] = useState<{ current: number; total: number } | null>(null);
  const [importResultCount, setImportResultCount] = useState<number>(0);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Target fields untuk pilar saat ini
  const targetFields = useMemo(() => {
    return FIELD_DEFINITIONS.common;
  }, [pillarId]);

  // Reset state saat modal ditutup
  const handleClose = () => {
    if (isProcessing) return;
    setStep(1);
    setFile(null);
    setSheetNames([]);
    setSelectedSheet('');
    setRawRows([]);
    setExcelHeaders([]);
    setColumnMapping({});
    setParseError(null);
    setImportProgress(null);
    onClose();
  };

  // Baca file Excel menggunakan XLSX
  const processExcelFile = async (selectedFile: File) => {
    setParseError(null);
    setIsProcessing(true);
    try {
      const buffer = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });

      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        throw new Error('File Excel tidak memiliki lembar kerja (worksheet).');
      }

      setSheetNames(workbook.SheetNames);
      const firstSheet = workbook.SheetNames[0];
      setSelectedSheet(firstSheet);
      loadSheetData(workbook, firstSheet, selectedFile);
    } catch (err: any) {
      console.error('Error parsing Excel:', err);
      setParseError(err?.message || 'Gagal membaca isi file Excel. Pastikan format file valid (.xlsx, .xls, atau .csv).');
      setIsProcessing(false);
    }
  };

  // Muat data dari sheet yang dipilih
  const loadSheetData = (workbook: XLSX.WorkBook, sheetName: string, activeFile: File) => {
    try {
      const sheet = workbook.Sheets[sheetName];
      const jsonData: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

      if (!jsonData || jsonData.length === 0) {
        throw new Error(`Lembar kerja "${sheetName}" kosong.`);
      }

      // Cari baris header (baris pertama yang memiliki teks kolom)
      let headerRowIndex = 0;
      for (let i = 0; i < Math.min(jsonData.length, 10); i++) {
        const row = jsonData[i];
        if (row && row.some((cell) => cell !== null && String(cell).trim() !== '')) {
          headerRowIndex = i;
          break;
        }
      }

      const headers = (jsonData[headerRowIndex] || []).map((h, idx) => {
        const text = String(h || '').trim();
        return text ? text : `Kolom_${idx + 1}`;
      });

      // Filter baris data (mengabaikan baris kosong)
      const dataRows = jsonData
        .slice(headerRowIndex + 1)
        .filter((row) => row && row.some((cell) => cell !== null && String(cell).trim() !== ''));

      if (dataRows.length === 0) {
        throw new Error(`Tidak ditemukan baris data di lembar kerja "${sheetName}".`);
      }

      setFile(activeFile);
      setExcelHeaders(headers);
      setRawRows(dataRows);

      // Auto-detect kolom pemetaan berdasarkan sinonim
      const initialMapping: Record<string, string> = {};
      targetFields.forEach((target) => {
        let bestMatch = '';
        for (const header of headers) {
          const cleanHeader = header.toLowerCase().replace(/[^a-z0-9]/g, ' ').trim();
          if (target.synonyms.some((syn) => cleanHeader === syn || cleanHeader.includes(syn) || syn.includes(cleanHeader))) {
            bestMatch = header;
            break;
          }
        }
        initialMapping[target.key] = bestMatch;
      });

      setColumnMapping(initialMapping);
      setStep(2); // Lanjut ke step pemetaan
    } catch (err: any) {
      setParseError(err?.message || 'Gagal memproses data sheet.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      processExcelFile(f);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) {
      processExcelFile(f);
    }
  };

  // Ubah pemetaan kolom
  const handleMappingChange = (targetKey: string, excelHeader: string) => {
    setColumnMapping((prev) => ({
      ...prev,
      [targetKey]: excelHeader,
    }));
  };

  // Susun data terpetakan
  const mappedRecords = useMemo(() => {
    if (!rawRows.length || !excelHeaders.length) return [];

    const defaultWilayah = session.wilayah && session.wilayah !== 'Semua Wilayah' ? session.wilayah : 'Kota Bandung';

    return rawRows.map((row, index) => {
      const getVal = (targetKey: string): any => {
        const headerName = columnMapping[targetKey];
        if (!headerName) return '';
        const colIdx = excelHeaders.indexOf(headerName);
        if (colIdx === -1) return '';
        return row[colIdx] ?? '';
      };

      const rawNama = String(getVal('nama') || '').trim();
      const rawNik = sanitizeNIK(getVal('nik'));
      const rawWilayah = normalizeJabarRegion(getVal('wilayah'), defaultWilayah);
      const rawKec = String(getVal('kec') || '').trim();
      const rawKelDesa = String(getVal('kelDesa') || '').trim();
      const rawHp = sanitizePhone(getVal('hp'));
      const rawSertifikasi = String(getVal('sertifikasi') || '').trim();
      const rawGender = sanitizeGender(getVal('jenisKelamin'));
      const rawPendidikan = String(getVal('pendidikan') || '').trim();
      const rawAlamat = String(getVal('alamat') || '').trim();

      const record: Omit<PSKSDataRecord, 'id'> = {
        pillarId,
        wilayah: rawWilayah,
        kec: rawKec || 'Kecamatan Terdata',
        kelDesa: rawKelDesa,
        nama: rawNama || `Anggota Import #${index + 1}`,
        nik: rawNik || `${Date.now()}${String(index).padStart(4, '0')}`,
        sertifikasi: rawSertifikasi || 'Terdata Resmi Dinsos',
        hp: rawHp || '-',
        jenisKelamin: rawGender || 'Laki-laki',
        pendidikan: rawPendidikan || '-',
        alamat: rawAlamat || '-',
        status: 'Aktif',
      };

      return record;
    });
  }, [rawRows, excelHeaders, columnMapping, pillarId, session.wilayah]);

  // Eksekusi Import Massal ke Database
  const handleExecuteImport = async () => {
    if (!mappedRecords.length) return;
    setIsProcessing(true);
    setImportProgress({ current: 0, total: mappedRecords.length });

    try {
      const count = await onBatchImport(mappedRecords);
      setImportResultCount(count);
      setStep(4); // Sukses
    } catch (err: any) {
      console.error('Import failed:', err);
      setParseError(err?.message || 'Terjadi kesalahan saat menyimpan data import ke database.');
    } finally {
      setIsProcessing(false);
      setImportProgress(null);
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-[999999] bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-4xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl border-2 border-emerald-600/40 flex flex-col max-h-[92dvh] sm:max-h-[88vh] h-[92dvh] sm:h-auto overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-[#043e2e] via-[#065e44] to-[#043e2e] text-white p-4 sm:p-5 border-b-4 border-[#d4af37] flex items-center justify-between shrink-0 sticky top-0 z-20 shadow-xs">
          <div className="flex items-center gap-3 min-w-0 pr-2">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-md shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 uppercase tracking-wider">
                  Superadmin &amp; Developer
                </span>
                <span className="text-xs text-emerald-200 font-bold truncate">
                  Pilar {pillar.title} ({pillar.shortName})
                </span>
              </div>
              <h3 className="font-extrabold text-sm sm:text-base tracking-wide truncate text-white">
                Import Data Massal dari File Excel (.xlsx / .csv)
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isProcessing}
            className="text-white/80 hover:text-white p-2 rounded-xl cursor-pointer hover:bg-white/10 transition-colors shrink-0 disabled:opacity-50"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Indikator Langkah (Step Indicator) */}
        <div className="bg-slate-100 border-b border-slate-200 px-4 sm:px-6 py-2.5 flex items-center justify-between shrink-0 text-xs font-bold text-slate-600 overflow-x-auto">
          <div className={`flex items-center gap-2 ${step === 1 ? 'text-emerald-700 font-black' : step > 1 ? 'text-slate-800 font-bold' : 'text-slate-400'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${step === 1 ? 'bg-emerald-700 text-white' : step > 1 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-300 text-slate-600'}`}>
              1
            </span>
            <span>1. Unggah File</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0 mx-1" />
          <div className={`flex items-center gap-2 ${step === 2 ? 'text-emerald-700 font-black' : step > 2 ? 'text-slate-800 font-bold' : 'text-slate-400'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${step === 2 ? 'bg-emerald-700 text-white' : step > 2 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-300 text-slate-600'}`}>
              2
            </span>
            <span>2. Pemetaan Kolom</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0 mx-1" />
          <div className={`flex items-center gap-2 ${step === 3 ? 'text-emerald-700 font-black' : step > 3 ? 'text-slate-800 font-bold' : 'text-slate-400'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${step === 3 ? 'bg-emerald-700 text-white' : step > 3 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-300 text-slate-600'}`}>
              3
            </span>
            <span>3. Pratinjau &amp; Simpan</span>
          </div>
        </div>

        {/* Pesan Error Global jika ada */}
        {parseError && (
          <div className="m-4 p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-800 text-xs font-bold flex items-center gap-2 shrink-0">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="flex-1">{parseError}</span>
            <button
              type="button"
              onClick={() => setParseError(null)}
              className="text-rose-500 hover:text-rose-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Konten Scrollable */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 min-h-0 space-y-4 overscroll-contain">
          {/* ========================================================================= */}
          {/* STEP 1: UNGGAH FILE EXCEL */}
          {/* ========================================================================= */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-950 flex items-start gap-3">
                <Info className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-black text-emerald-900">Petunjuk Cerdas:</h4>
                  <p className="text-emerald-800 leading-relaxed">
                    Anda <strong>TIDAK PERLU merapikan atau menghapus kolom</strong> pada file Excel Anda. Sistem akan membaca seluruh kolom dan memberikan jendela pemetaan interaktif di langkah berikutnya, sehingga data yang tidak diperlukan akan otomatis dilewati.
                  </p>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileChange}
                className="hidden"
              />

              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !isProcessing && fileInputRef.current?.click()}
                className={`border-3 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                  isDragging
                    ? 'border-emerald-600 bg-emerald-100/70 scale-[0.99]'
                    : 'border-emerald-300 bg-slate-50 hover:bg-emerald-50/50 hover:border-emerald-500'
                }`}
              >
                {isProcessing ? (
                  <div className="flex flex-col items-center gap-3 py-6">
                    <Loader2 className="w-10 h-10 text-emerald-700 animate-spin" />
                    <span className="text-sm font-black text-slate-800">
                      Membaca &amp; Menganalisis File Excel...
                    </span>
                    <span className="text-xs text-slate-500">
                      Mendeteksi baris judul kolom dan lembar kerja secara otomatis
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-md">
                      <UploadCloud className="w-8 h-8 text-emerald-700" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm sm:text-base font-black text-slate-900">
                        Klik untuk Pilih File Excel Anda, atau Seret &amp; Lepas ke sini
                      </p>
                      <p className="text-xs text-slate-500 font-medium">
                        Mendukung format file <strong>.xlsx</strong>, <strong>.xls</strong>, atau <strong>.csv</strong> (Kapasitas hingga ribuan baris data)
                      </p>
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 border border-emerald-300 text-xs font-black text-emerald-900 mt-2">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Deteksi Kolom Otomatis Aktif</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 2: PEMETAAN KOLOM (COLUMN MAPPING) */}
          {/* ========================================================================= */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-slate-500 font-medium block">File Terpilih:</span>
                  <span className="font-black text-slate-900 text-sm flex items-center gap-1.5">
                    <FileCheck className="w-4 h-4 text-emerald-600" />
                    {file?.name}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-slate-500 font-medium block">Total Baris:</span>
                    <span className="font-mono font-black text-emerald-800 text-sm">
                      {rawRows.length} Baris Data
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium block">Jumlah Kolom:</span>
                    <span className="font-mono font-bold text-slate-800 text-sm">
                      {excelHeaders.length} Kolom
                    </span>
                  </div>
                </div>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Settings2 className="w-4 h-4 text-slate-700" />
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                      Cocokkan Kolom Database dengan Kolom File Excel Anda
                    </h4>
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Kolom yang diabaikan tidak akan mengotori database
                  </span>
                </div>

                <div className="divide-y divide-slate-100 p-2 sm:p-4 space-y-2">
                  {targetFields.map((field) => {
                    const selectedHeader = columnMapping[field.key] || '';
                    const isMatched = !!selectedHeader;

                    return (
                      <div
                        key={field.key}
                        className="py-2.5 px-3 rounded-xl hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-slate-800">
                              {field.label}
                            </span>
                            {field.required && (
                              <span className="text-[10px] font-extrabold px-2 py-0.2 rounded-md bg-rose-100 text-rose-700 border border-rose-200">
                                Wajib Diisi
                              </span>
                            )}
                          </div>
                          {field.hint && (
                            <p className="text-[11px] text-slate-500 mt-0.5">{field.hint}</p>
                          )}
                        </div>

                        <div className="w-full sm:w-72 shrink-0">
                          <select
                            value={selectedHeader}
                            onChange={(e) => handleMappingChange(field.key, e.target.value)}
                            className={`w-full text-xs font-bold p-2.5 rounded-xl border transition-all focus:outline-none ${
                              isMatched
                                ? 'bg-emerald-50/70 border-emerald-400 text-emerald-950 focus:border-emerald-600'
                                : field.required
                                ? 'bg-amber-50/50 border-amber-300 text-amber-900 focus:border-amber-500'
                                : 'bg-slate-50 border-slate-200 text-slate-600'
                            }`}
                          >
                            <option value="">[ Abaikan / Lewati Kolom Ini ]</option>
                            {excelHeaders.map((header) => (
                              <option key={header} value={header}>
                                📄 {header}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 3: PRATINJAU DATA SEBELUM IMPORT (LIVE PREVIEW) */}
          {/* ========================================================================= */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-emerald-800 font-bold block">
                    Kesiapan Import Data:
                  </span>
                  <p className="text-emerald-950 font-black text-sm">
                    {mappedRecords.length} baris data siap diimport sekaligus ke Pilar {pillar.shortName}.
                  </p>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-700 text-white text-xs font-extrabold shadow-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                  <span>Format Kolom Tervalidasi</span>
                </div>
              </div>

              {/* Tabel Pratinjau 5 Baris Pertama */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Table className="w-4 h-4 text-slate-700" />
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                      Pratinjau Hasil Pembacaan (5 Baris Pertama)
                    </h4>
                  </div>
                  <span className="text-[11px] text-slate-500 font-bold">
                    Menampilkan 5 dari {mappedRecords.length} Data
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-700 border-b border-slate-200">
                        <th className="py-2.5 px-3 font-bold">No</th>
                        <th className="py-2.5 px-3 font-bold">Nama Anggota</th>
                        <th className="py-2.5 px-3 font-bold">NIK</th>
                        <th className="py-2.5 px-3 font-bold">Kabupaten/Kota</th>
                        <th className="py-2.5 px-3 font-bold">Kecamatan</th>
                        <th className="py-2.5 px-3 font-bold">No HP</th>
                        <th className="py-2.5 px-3 font-bold">Sertifikasi / SK</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {mappedRecords.slice(0, 5).map((rec, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-500">{idx + 1}</td>
                          <td className="py-2.5 px-3 font-bold text-slate-900">{rec.nama}</td>
                          <td className="py-2.5 px-3 font-mono text-slate-700">{rec.nik}</td>
                          <td className="py-2.5 px-3 font-bold text-emerald-900">{rec.wilayah}</td>
                          <td className="py-2.5 px-3 text-slate-700">{rec.kec}</td>
                          <td className="py-2.5 px-3 font-mono text-slate-700">{rec.hp}</td>
                          <td className="py-2.5 px-3 text-slate-700">{rec.sertifikasi}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {isProcessing && importProgress && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="w-4 h-4 text-emerald-700 animate-spin" />
                      Sedang memproses dan menyimpan ke Firestore...
                    </span>
                    <span>
                      {importProgress.current} / {importProgress.total} Data
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-emerald-600 h-2 transition-all duration-300 rounded-full"
                      style={{
                        width: `${Math.round((importProgress.current / importProgress.total) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 4: SUKSES IMPORT */}
          {/* ========================================================================= */}
          {step === 4 && (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-lg border border-emerald-300">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-900">
                  Import Data Excel Berhasil!
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
                  Sebanyak <strong>{importResultCount} data anggota</strong> berhasil ditambahkan dan disinkronkan secara realtime ke database Firestore untuk Pilar {pillar.shortName}.
                </p>
              </div>
              <div className="pt-4 flex justify-center">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-6 py-2.5 bg-[#043e2e] hover:bg-[#065e44] text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md cursor-pointer transition-all hover:scale-105 active:scale-95"
                >
                  Selesai &amp; Lihat Tabel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {step !== 4 && (
          <div className="flex items-center justify-between gap-3 p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200 shrink-0 z-20 shadow-xs">
            <div>
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep((prev) => (prev - 1) as any)}
                  disabled={isProcessing}
                  className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs sm:text-sm cursor-pointer transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Kembali</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={isProcessing}
                className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs sm:text-sm cursor-pointer transition-colors disabled:opacity-50"
              >
                Batal
              </button>

              {step === 1 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                  className="px-6 py-2.5 bg-[#043e2e] hover:bg-[#065e44] text-white font-extrabold rounded-xl text-xs sm:text-sm shadow-md cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] border border-emerald-600/40 flex items-center gap-1.5"
                >
                  <span>Pilih File Excel</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              {step === 2 && (
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  disabled={!columnMapping['nama']}
                  className="px-6 py-2.5 bg-[#043e2e] hover:bg-[#065e44] text-white font-extrabold rounded-xl text-xs sm:text-sm shadow-md cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] border border-emerald-600/40 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>Lanjut ke Pratinjau</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              {step === 3 && (
                <button
                  type="button"
                  onClick={handleExecuteImport}
                  disabled={isProcessing || mappedRecords.length === 0}
                  className="px-6 py-2.5 bg-gradient-to-r from-[#043e2e] to-[#065e44] hover:from-[#032f23] hover:to-[#043e2e] text-white font-extrabold rounded-xl text-xs sm:text-sm shadow-md cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] border border-emerald-600/40 flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                      <span>Sedang Mengimport...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-amber-300" />
                      <span>Mulai Import Sekarang ({mappedRecords.length} Data)</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : modalContent;
};
