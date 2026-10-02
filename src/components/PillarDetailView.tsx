import React, { useState, useMemo, useEffect, useRef } from 'react';
import { PillarId, PSKSDataRecord, UserSession, PillarRegistrationSubmission } from '../types';
import { PILLARS_CONFIG, KAB_KOTA_ONLY, JABAR_REGIONS } from '../data/initialData';
import { ArrowLeft, Search, Download, Plus, Trash2, Lock, X, UserPlus, LogIn, AlertCircle, FileText, UploadCloud, ChevronDown, CheckSquare, MapPin, RefreshCw } from 'lucide-react';
import { PillarTable } from './pillar/PillarTable';
import { PillarModal } from './pillar/PillarModal';
import { PillarExcelImportModal } from './pillar/PillarExcelImportModal';
import { getRegionSortIndex, sortRecordsByJabarRegion, matchJabarRegion } from '../utils/regionSort';
import { BackToHomeButton } from './BackToHomeButton';

interface AnimatedCounterProps {
  end: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  trigger: boolean;
}

const AnimatedCounter: React.FC<AnimatedCounterProps> = React.memo(({
  end,
  prefix = '',
  suffix = '',
}) => {
  return (
    <span>
      {prefix}
      {Number(end || 0).toLocaleString('id-ID')}
      {suffix}
    </span>
  );
});

interface PillarDetailViewProps {
  pillarId: PillarId;
  session: UserSession;
  dataRecords: PSKSDataRecord[];
  onBackToDashboard: () => void;
  onAddRecord: (newRecord: Omit<PSKSDataRecord, 'id'>) => void;
  onUpdateRecord?: (recordId: string, updatedRecord: Partial<PSKSDataRecord>, targetPillarId?: PillarId) => void;
  onBatchAddRecords?: (records: Omit<PSKSDataRecord, 'id'>[], targetPillarId?: PillarId) => Promise<number>;
  onDeleteRecord: (recordId: string) => void;
  onBatchDeleteRecords?: (recordIds: string[], targetPillarId?: PillarId) => Promise<void>;
  onAddSubmission?: (
    newSubmission: Omit<
      PillarRegistrationSubmission,
      'id' | 'submittedAt' | 'submittedAtFormatted'
    > & { status?: string }
  ) => void;
  onOpenGateModal?: () => void;
  onRescueSync?: () => Promise<void> | void;
  isRescueSyncing?: boolean;
  rescueProgressText?: string;
}

export const PillarDetailView: React.FC<PillarDetailViewProps> = ({
  pillarId,
  session,
  dataRecords,
  onBackToDashboard,
  onAddRecord,
  onUpdateRecord,
  onBatchAddRecords,
  onDeleteRecord,
  onBatchDeleteRecords,
  onAddSubmission,
  onOpenGateModal,
  onRescueSync,
  isRescueSyncing,
  rescueProgressText,
}) => {
  const pillar = PILLARS_CONFIG[pillarId] || PILLARS_CONFIG.peksos;
  const [searchTerm, setSearchTerm] = useState('');
  const [showGuestLoginModal, setShowGuestLoginModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<PSKSDataRecord | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);

  const [chartVisible, setChartVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    setChartVisible(false);
    const timer = setTimeout(() => {
      setChartVisible(true);
    }, 100);
    return () => clearTimeout(timer);
  }, [pillarId]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setChartVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [pillarId]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<PSKSDataRecord | null>(null);
  const [alertInfo, setAlertInfo] = useState<{ title: string; message: string; type: 'success' | 'error' } | null>(null);

  // State untuk Hapus Checkbox Satuan & Massal Terpilih (Default: Nonaktif / Tertutup)
  const [isSelectionModeActive, setIsSelectionModeActive] = useState(false);
  const [showDeleteMenuDropdown, setShowDeleteMenuDropdown] = useState(false);
  const deleteMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (deleteMenuRef.current && !deleteMenuRef.current.contains(e.target as Node)) {
        setShowDeleteMenuDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [selectedRecordIds, setSelectedRecordIds] = useState<string[]>([]);
  const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState(false);

  // State untuk Hapus Bersih Data per Wilayah
  const [showDeleteByRegionModal, setShowDeleteByRegionModal] = useState(false);
  const [regionToDelete, setRegionToDelete] = useState('');
  const [isDeletingBatch, setIsDeletingBatch] = useState(false);

  // Daftar wilayah yang ada di pilar ini beserta jumlah anggotanya
  const availableRegionsWithCount = useMemo(() => {
    const counts: Record<string, number> = {};
    dataRecords.forEach((r) => {
      const w = r.wilayah || 'Lainnya';
      counts[w] = (counts[w] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => {
      const idxA = getRegionSortIndex(a[0]);
      const idxB = getRegionSortIndex(b[0]);
      if (idxA !== idxB) return idxA - idxB;
      return b[1] - a[1];
    });
  }, [dataRecords]);

  const handleToggleSelectRecord = (recordId: string) => {
    setSelectedRecordIds((prev) =>
      prev.includes(recordId) ? prev.filter((id) => id !== recordId) : [...prev, recordId]
    );
  };

  const handleToggleSelectAll = (records: PSKSDataRecord[]) => {
    const ids = records.map((r) => r.id);
    const allSelected = ids.length > 0 && ids.every((id) => selectedRecordIds.includes(id));
    if (allSelected) {
      setSelectedRecordIds((prev) => prev.filter((id) => !ids.includes(id)));
    } else {
      setSelectedRecordIds((prev) => Array.from(new Set([...prev, ...ids])));
    }
  };

  const handleExecuteBatchDelete = async () => {
    if (!selectedRecordIds.length || !onBatchDeleteRecords) return;
    setIsDeletingBatch(true);
    try {
      await onBatchDeleteRecords(selectedRecordIds, pillarId);
      setAlertInfo({
        title: 'Berhasil Menghapus',
        message: `Sebanyak ${selectedRecordIds.length} data anggota berhasil dihapus bersih.`,
        type: 'success',
      });
      setSelectedRecordIds([]);
      setShowBatchDeleteConfirm(false);
    } catch (err: any) {
      setAlertInfo({
        title: 'Gagal Menghapus',
        message: err?.message || 'Terjadi kesalahan saat menghapus data terpilih.',
        type: 'error',
      });
    } finally {
      setIsDeletingBatch(false);
    }
  };

  const handleExecuteDeleteByRegion = async () => {
    if (!regionToDelete || !onBatchDeleteRecords) return;
    const targetRecords = dataRecords.filter(
      (r) => (r.wilayah || '').toLowerCase().trim() === regionToDelete.toLowerCase().trim()
    );
    if (!targetRecords.length) {
      setAlertInfo({
        title: 'Tidak Ada Data',
        message: `Tidak ditemukan data anggota di wilayah ${regionToDelete}.`,
        type: 'error',
      });
      setShowDeleteByRegionModal(false);
      return;
    }

    const idsToDelete = targetRecords.map((r) => r.id);
    setIsDeletingBatch(true);
    try {
      await onBatchDeleteRecords(idsToDelete, pillarId);
      setAlertInfo({
        title: 'Berhasil Menghapus Wilayah',
        message: `Seluruh data (${idsToDelete.length} anggota) di ${regionToDelete} berhasil dibersihkan dari Pilar ${pillar.shortName}.`,
        type: 'success',
      });
      setSelectedRecordIds((prev) => prev.filter((id) => !idsToDelete.includes(id)));
      setShowDeleteByRegionModal(false);
      setRegionToDelete('');
    } catch (err: any) {
      setAlertInfo({
        title: 'Gagal Menghapus Wilayah',
        message: err?.message || 'Terjadi kesalahan saat menghapus data wilayah.',
        type: 'error',
      });
    } finally {
      setIsDeletingBatch(false);
    }
  };

  // Helper for PEKSOS status classification
  const isPeksosGov = (r: PSKSDataRecord) => {
    return r.statusPeksos === 'Pemerintah' || r.lembaga === 'Lembaga Pemerintah' || r.lembaga === 'Pemerintah';
  };

  const getInitialFormData = () => {
    const isUser = session.role === 'user';
    const isUserCimahi = isUser && (session.wilayah || '').toLowerCase().trim() === 'kota cimahi';
    let defaultWilayah = '';

    if (isUserCimahi) {
      defaultWilayah = ''; // Shows "Pilih Kab/Kota" for Kota Cimahi users
    } else if (isUser && session.wilayah && session.wilayah !== 'Prov. Jabar' && session.wilayah !== 'Semua Wilayah') {
      defaultWilayah = session.wilayah; // Locked to user's registered region
    } else if (session.role === 'admin' && session.wilayah && session.wilayah !== 'Prov. Jabar' && session.wilayah !== 'Semua Wilayah') {
      defaultWilayah = session.wilayah; // Locked to regional admin
    } else {
      defaultWilayah = ''; // Superadmin / unrestricted starts with "Pilih Kab/Kota"
    }

    return {
      wilayah: defaultWilayah,
      kec: '',
      kelDesa: '',
      nama: '',
      alamat: '',
      nik: '',
      jenisKelamin: '',
      predikatTerakhir: '',
      hp: '',
      email: '',
      nomorKontak: '',
      noTglSertifikatKompetensi: '',
      noTglSertifikasi: '',
      sertifikasiKompetensi: '',
      pendidikan: '',
      jenjangJabatan: '',
      tempatBertugas: '',
      instansiBertugas: '',
      statusPeksos: '',
      jenjangJabatanPemerintah: '',
      masaBerlakuSk: '',
      noSkKeanggotaan: '',
      statusKeaktifan: 'Aktif',
      bimtekDiikuti: [] as string[],
      sertifikasi: '',
      lembaga: '',

      // Dedicated fields for all pillars
      masaBakti: '',
      noSk: '',
      statusAktif: 'Aktif',
      nomorInduk: '',
      sertifikat: '',
      keahlian: '',
      pelatihan: '',
      namaLks: '',
      bidangPelayanan: '',
      ketua: '',
      nomorTandaDaftar: '',
      masaBerlaku: '',
      namaKarangTaruna: '',
      tahunBerdiri: '',
      namaLk3: '',
      kontak: '',
      jenisLayanan: '',
      instansi: '',
      jabatan: '',
      wilayahKerja: defaultWilayah,
      skPengangkatan: '',
      masaTugas: '',
      namaBadanUsaha: '',
      jenisUsaha: '',
      bentukCsr: '',
      bidangBantuan: '',
      namaSlrt: '',
      operator: '',
      berkasFotoUrl: '',
      berkasFotoNama: '',
      berkasFotoSizeKb: 0,
      berkasFotoOriginalSizeKb: 0,
    };
  };

  // Form State
  const [formData, setFormData] = useState(getInitialFormData());

  // Filter records based on role / active session region
  const filteredByRoleRecords = useMemo(() => {
    if (
      session.role === 'superadmin' ||
      session.role === 'developer' ||
      session.isDeveloper ||
      session.wilayah === 'Semua Wilayah' ||
      session.wilayah === 'Prov. Jabar' ||
      !session.wilayah
    ) {
      return dataRecords;
    }
    return dataRecords.filter((item) => {
      const itemWil = matchJabarRegion(item.wilayah) || item.wilayah.toLowerCase().trim();
      const sessWil = matchJabarRegion(session.wilayah) || session.wilayah.toLowerCase().trim();
      return itemWil.toLowerCase() === sessWil.toLowerCase();
    });
  }, [dataRecords, session.role, session.isDeveloper, session.wilayah]);

  // Filter by search term and sort by Jabar region hierarchy for superadmin/developer
  const displayRecords = useMemo(() => {
    let result = filteredByRoleRecords;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = filteredByRoleRecords.filter((item) => {
        return (
          (item.nama && item.nama.toLowerCase().includes(term)) ||
          (item.wilayah && item.wilayah.toLowerCase().includes(term)) ||
          (item.kec && item.kec.toLowerCase().includes(term)) ||
          (item.kelDesa && item.kelDesa.toLowerCase().includes(term)) ||
          (item.alamat && item.alamat.toLowerCase().includes(term)) ||
          (item.nik && item.nik.toLowerCase().includes(term)) ||
          (item.sertifikasi && item.sertifikasi.toLowerCase().includes(term)) ||
          (item.hp && item.hp.toLowerCase().includes(term)) ||
          (item.email && item.email.toLowerCase().includes(term)) ||
          (item.nomorKontak && item.nomorKontak.toLowerCase().includes(term)) ||
          (item.statusKeaktifan && item.statusKeaktifan.toLowerCase().includes(term)) ||
          (item.statusAktif && item.statusAktif.toLowerCase().includes(term)) ||
          (item.status && item.status.toLowerCase().includes(term)) ||
          (item.pendidikan && item.pendidikan.toLowerCase().includes(term)) ||
          (item.sertifikasiKompetensi && item.sertifikasiKompetensi.toLowerCase().includes(term)) ||
          (item.jenjangJabatan && item.jenjangJabatan.toLowerCase().includes(term)) ||
          (item.tempatBertugas && item.tempatBertugas.toLowerCase().includes(term)) ||
          (item.instansiBertugas && item.instansiBertugas.toLowerCase().includes(term)) ||
          (item.masaBakti && item.masaBakti.toLowerCase().includes(term)) ||
          (item.noSk && item.noSk.toLowerCase().includes(term)) ||
          (item.nomorInduk && item.nomorInduk.toLowerCase().includes(term)) ||
          (item.sertifikat && item.sertifikat.toLowerCase().includes(term)) ||
          (item.keahlian && item.keahlian.toLowerCase().includes(term)) ||
          (item.pelatihan && item.pelatihan.toLowerCase().includes(term)) ||
          (item.namaLks && item.namaLks.toLowerCase().includes(term)) ||
          (item.bidangPelayanan && item.bidangPelayanan.toLowerCase().includes(term)) ||
          (item.ketua && item.ketua.toLowerCase().includes(term)) ||
          (item.nomorTandaDaftar && item.nomorTandaDaftar.toLowerCase().includes(term)) ||
          (item.masaBerlaku && item.masaBerlaku.toLowerCase().includes(term)) ||
          (item.namaKarangTaruna && item.namaKarangTaruna.toLowerCase().includes(term)) ||
          (item.tahunBerdiri && item.tahunBerdiri.toLowerCase().includes(term)) ||
          (item.namaLk3 && item.namaLk3.toLowerCase().includes(term)) ||
          (item.kontak && item.kontak.toLowerCase().includes(term)) ||
          (item.jenisLayanan && item.jenisLayanan.toLowerCase().includes(term)) ||
          (item.instansi && item.instansi.toLowerCase().includes(term)) ||
          (item.jabatan && item.jabatan.toLowerCase().includes(term)) ||
          (item.wilayahKerja && item.wilayahKerja.toLowerCase().includes(term)) ||
          (item.skPengangkatan && item.skPengangkatan.toLowerCase().includes(term)) ||
          (item.masaTugas && item.masaTugas.toLowerCase().includes(term)) ||
          (item.namaBadanUsaha && item.namaBadanUsaha.toLowerCase().includes(term)) ||
          (item.jenisUsaha && item.jenisUsaha.toLowerCase().includes(term)) ||
          (item.bentukCsr && item.bentukCsr.toLowerCase().includes(term)) ||
          (item.bidangBantuan && item.bidangBantuan.toLowerCase().includes(term)) ||
          (item.namaSlrt && item.namaSlrt.toLowerCase().includes(term)) ||
          (item.operator && item.operator.toLowerCase().includes(term))
        );
      });
    }

    if (
      session.role === 'superadmin' ||
      session.role === 'developer' ||
      session.isDeveloper ||
      session.wilayah === 'Semua Wilayah' ||
      session.wilayah === 'Prov. Jabar' ||
      !session.wilayah
    ) {
      return sortRecordsByJabarRegion(result);
    }
    return result;
  }, [filteredByRoleRecords, searchTerm, session.role, session.isDeveloper, session.wilayah]);

  // Regional breakdown for horizontal chart
  const regionalCounts = useMemo(() => {
    const counts: Record<string, { total: number; gov: number; swasta: number }> = {};
    JABAR_REGIONS.forEach((r) => (counts[r] = { total: 0, gov: 0, swasta: 0 }));
    const safeRecords = Array.isArray(dataRecords) ? dataRecords : [];
    safeRecords.forEach((r) => {
      if (!r || typeof r !== 'object') return;
      const matchedWil = matchJabarRegion(r.wilayah);
      const wil = matchedWil || r.wilayah || 'Kota Bandung';
      if (!counts[wil]) {
        counts[wil] = { total: 0, gov: 0, swasta: 0 };
      }
      counts[wil].total++;
      if (typeof isPeksosGov === 'function' && isPeksosGov(r)) {
        counts[wil].gov++;
      } else {
        counts[wil].swasta++;
      }
    });
    return counts;
  }, [dataRecords, isPeksosGov]);

  // Chart regions to display
  const chartRegions = useMemo(() => {
    if (
      session.role === 'superadmin' ||
      session.role === 'developer' ||
      session.isDeveloper ||
      session.wilayah === 'Semua Wilayah' ||
      session.wilayah === 'Prov. Jabar' ||
      session.wilayah === 'PROVINSI JAWA BARAT' ||
      !session.wilayah
    ) {
      if (pillarId === 'peksos' || (regionalCounts['Prov. Jabar'] && regionalCounts['Prov. Jabar'].total > 0)) {
        return JABAR_REGIONS; // Includes Prov. Jabar at the top above Kab. Bogor
      }
      return KAB_KOTA_ONLY;
    }
    return [session.wilayah];
  }, [session.role, session.isDeveloper, session.wilayah, pillarId, regionalCounts]);

  const maxChartCount = useMemo(() => {
    let max = 1;
    chartRegions.forEach((r) => {
      const item = regionalCounts[r] || { total: 0, gov: 0, swasta: 0 };
      if (pillarId === 'peksos') {
        if (item.gov > max) max = item.gov;
        if (item.swasta > max) max = item.swasta;
      } else {
        if (item.total > max) max = item.total;
      }
    });
    return max;
  }, [chartRegions, regionalCounts, pillarId]);

  // Regions for modal dropdown - includes Prov. Jabar for Superadmin & Developer across all pillars
  const regionOptions = useMemo(() => {
    const isSuperOrDev =
      session.role === 'superadmin' ||
      session.role === 'developer' ||
      session.isDeveloper ||
      session.wilayah === 'Prov. Jabar' ||
      session.wilayah === 'Semua Wilayah';

    if (isSuperOrDev || pillarId === 'peksos') {
      return JABAR_REGIONS; // Includes Prov. Jabar
    }
    return KAB_KOTA_ONLY;
  }, [pillarId, session.role, session.isDeveloper, session.wilayah]);

  // Summary counts
  const totalCount = filteredByRoleRecords.length;
  const govCount = filteredByRoleRecords.filter((r) => isPeksosGov(r)).length;
  const swastaCount = filteredByRoleRecords.filter((r) => !isPeksosGov(r)).length;

  const handleOpenModal = () => {
    setEditingRecord(null);
    setFormData(getInitialFormData());
    setIsModalOpen(true);
  };

  const handleEditClick = (record: PSKSDataRecord) => {
    setEditingRecord(record);
    const initial = getInitialFormData();
    setFormData({
      ...initial,
      ...record,
      wilayah: record.wilayah || '',
      wilayahKerja: (record as any).wilayahKerja || record.wilayah || '',
      nama: record.nama || '',
      nik: record.nik || '',
      jenisKelamin: record.jenisKelamin || '',
      pendidikan: record.pendidikan || '',
      noTglSertifikasi: record.noTglSertifikasi || '',
      sertifikasiKompetensi: record.sertifikasiKompetensi || '',
      jenjangJabatan: record.jenjangJabatan || '',
      tempatBertugas: record.tempatBertugas || '',
      instansiBertugas: record.instansiBertugas || '',
      statusPeksos: record.statusPeksos || '',
      jenjangJabatanPemerintah: record.jenjangJabatanPemerintah || '',
      masaBerlakuSk: record.masaBerlakuSk || '',
      noSkKeanggotaan: record.noSkKeanggotaan || '',
      statusKeaktifan: record.statusKeaktifan || 'Aktif',
      bimtekDiikuti: Array.isArray(record.bimtekDiikuti) ? record.bimtekDiikuti : [],
      hp: record.hp || '',
      email: record.email || '',
      nomorKontak: record.nomorKontak || '',
      kec: record.kec || '',
      kelDesa: record.kelDesa || '',
      alamat: record.alamat || '',
      masaBakti: record.masaBakti || '',
      noSk: record.noSk || '',
      statusAktif: record.statusAktif || 'Aktif',
      nomorInduk: record.nomorInduk || '',
      sertifikat: record.sertifikat || '',
      keahlian: record.keahlian || '',
      pelatihan: record.pelatihan || '',
      namaLks: (record as any).namaLks || record.nama || '',
      bidangPelayanan: (record as any).bidangPelayanan || record.sertifikasi || '',
      ketua: (record as any).ketua || record.hp || '',
      nomorTandaDaftar: (record as any).nomorTandaDaftar || record.nik || '',
      masaBerlaku: (record as any).masaBerlaku || '',
      namaKarangTaruna: (record as any).namaKarangTaruna || record.nama || '',
      tahunBerdiri: (record as any).tahunBerdiri || '',
      namaLk3: (record as any).namaLk3 || record.nama || '',
      kontak: (record as any).kontak || record.hp || '',
      jenisLayanan: (record as any).jenisLayanan || record.sertifikasi || '',
      instansi: (record as any).instansi || '',
      jabatan: (record as any).jabatan || '',
      skPengangkatan: (record as any).skPengangkatan || record.sertifikasi || '',
      masaTugas: (record as any).masaTugas || '',
      namaBadanUsaha: (record as any).namaBadanUsaha || record.nama || '',
      jenisUsaha: (record as any).jenisUsaha || record.sertifikasi || '',
      bentukCsr: (record as any).bentukCsr || '',
      bidangBantuan: (record as any).bidangBantuan || '',
      namaSlrt: (record as any).namaSlrt || record.nama || '',
      operator: (record as any).operator || record.hp || '',
      berkasFotoUrl: (record as any).berkasFotoUrl || '',
      berkasFotoNama: (record as any).berkasFotoNama || '',
      berkasFotoSizeKb: (record as any).berkasFotoSizeKb || 0,
      berkasFotoOriginalSizeKb: (record as any).berkasFotoOriginalSizeKb || 0,
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Mandatory Authority & Region Locking Check
    const targetWilayah = pillarId === 'pensos' ? (formData.wilayahKerja || formData.wilayah || '').trim() : (formData.wilayah || '').trim();
    const isUser = session.role === 'user';
    const isUserCimahi = isUser && (session.wilayah || '').toLowerCase().trim() === 'kota cimahi';

    // Role User region lock check
    if (isUser) {
      if (isUserCimahi) {
        // Kota Cimahi user can choose either "Kota Cimahi" or "Prov. Jabar"
        const allowed = ['kota cimahi', 'prov. jabar'];
        if (!targetWilayah || !allowed.includes(targetWilayah.toLowerCase())) {
          setAlertInfo({
            title: 'Pilihan Wilayah Wajib Diisi',
            message: 'Pengguna Kota Cimahi wajib memilih salah satu wilayah: Kota Cimahi atau Prov. Jabar.',
            type: 'error',
          });
          return;
        }
      } else if (session.wilayah && session.wilayah !== 'Semua Wilayah' && session.wilayah !== 'Prov. Jabar') {
        // Standard user locked to their own region
        if (targetWilayah.toUpperCase().trim() !== session.wilayah.toUpperCase().trim()) {
          setAlertInfo({
            title: 'Pelanggaran Otoritas Wilayah',
            message: `Akun Anda terdaftar di ${session.wilayah}. Anda hanya dapat mengajukan pendaftaran untuk wilayah ${session.wilayah}.`,
            type: 'error',
          });
          return;
        }
      }
    }

    // Role Admin region lock check
    if (
      session.role === 'admin' &&
      session.wilayah &&
      session.wilayah !== 'Prov. Jabar' &&
      session.wilayah !== 'Semua Wilayah' &&
      targetWilayah.toUpperCase().trim() !== session.wilayah.toUpperCase().trim()
    ) {
      setAlertInfo({
        title: 'Pelanggaran Otoritas',
        message: `Admin Wilayah (${session.wilayah}) hanya berhak menginput data di wilayah kewenangannya sendiri.`,
        type: 'error',
      });
      return;
    }

    const saveRecordOrSubmission = (recordPayload: Omit<PSKSDataRecord, 'id'>) => {
      if (session.role === 'user') {
        const subWilayah = recordPayload.wilayah || session.wilayah || 'Kota Cimahi';
        const isProvJabar = subWilayah === 'Prov. Jabar' || subWilayah.toLowerCase().includes('provinsi');
        const initialStatus = isProvJabar ? 'MENUNGGU_PENGESAHAN_PROVINSI' : 'MENUNGGU_VERIFIKASI_WILAYAH';

        if (onAddSubmission) {
          onAddSubmission({
            pillarId,
            wilayah: subWilayah,
            kec: recordPayload.kec || '-',
            nama: recordPayload.nama || '-',
            nik: recordPayload.nik || '-',
            hp: recordPayload.hp || '-',
            submittedByUserId: session.userId,
            submittedByName: session.nama || session.username || 'User Terdaftar',
            submittedByUsername: session.username,
            submittedByRole: 'user',
            status: initialStatus,
            recordData: recordPayload,
            berkasFotoUrl: formData.berkasFotoUrl,
            berkasFotoNama: formData.berkasFotoNama,
            berkasFotoSizeKb: formData.berkasFotoSizeKb,
            berkasFotoOriginalSizeKb: formData.berkasFotoOriginalSizeKb,
          });
        }
        setAlertInfo({
          title: 'Pendaftaran Berhasil Diajukan',
          message: isProvJabar
            ? `Pendaftaran ${pillar.shortName} atas nama "${recordPayload.nama}" berhasil diajukan langsung ke antrean Superadmin Provinsi Jawa Barat untuk Pengesahan & Penerimaan Anggota.`
            : `Pendaftaran ${pillar.shortName} atas nama "${recordPayload.nama}" berhasil diajukan dan dikirim ke Admin Wilayah (${subWilayah}) untuk Verifikasi Berkas Wilayah. Setelah disetujui wilayah, otomatis diteruskan ke Superadmin Jabar untuk Pengesahan & Penerimaan Anggota.`,
          type: 'success',
        });
      } else if (editingRecord && onUpdateRecord) {
        onUpdateRecord(editingRecord.id, recordPayload, pillarId);
        setAlertInfo({
          title: 'Perubahan Data Berhasil Disimpan!',
          message: `Data "${recordPayload.nama || (recordPayload as any).namaLks || (recordPayload as any).namaKarangTaruna || (recordPayload as any).namaLk3 || (recordPayload as any).namaBadanUsaha || (recordPayload as any).namaSlrt || 'Anggota'}" berhasil diperbarui dan tersimpan realtime ke Database Firestore.`,
          type: 'success',
        });
      } else {
        onAddRecord(recordPayload);
        setAlertInfo({
          title: 'Data Tersimpan ke Database!',
          message: `Data "${recordPayload.nama}" berhasil tersimpan dan langsung terhubung tersinkronisasi ke server Database Firestore.`,
          type: 'success',
        });
      }
      setIsModalOpen(false);
      setEditingRecord(null);
    };

    const cleanNik = (formData.nik || '').replace(/\D/g, '').trim();

    if (pillarId === 'peksos') {
      // Strict 16-Digit NIK for Peksos
      if (cleanNik.length !== 16) {
        setAlertInfo({
          title: 'NIK Wajib 16 Angka',
          message: `Kolom NIK harus berisi tepat 16 digit angka! (Saat ini: ${cleanNik.length} digit). Mohon periksa kembali nomor KTP.`,
          type: 'error',
        });
        return;
      }
      if (!formData.nama.trim()) {
        setAlertInfo({ title: 'Kolom Wajib Diisi', message: 'Kolom 1: Nama Lengkap wajib diisi.', type: 'error' });
        return;
      }
      if (!formData.jenisKelamin) {
        setAlertInfo({ title: 'Kolom Wajib Diisi', message: 'Kolom 3: Jenis Kelamin wajib dipilih.', type: 'error' });
        return;
      }
      if (!formData.pendidikan.trim()) {
        setAlertInfo({ title: 'Kolom Wajib Diisi', message: 'Kolom 4: Pendidikan wajib dipilih/diisi.', type: 'error' });
        return;
      }
      if (!formData.noTglSertifikasi.trim()) {
        setAlertInfo({ title: 'Kolom Wajib Diisi', message: 'Kolom 5: Nomor dan Tanggal Sertifikasi wajib diisi.', type: 'error' });
        return;
      }
      if (!formData.sertifikasiKompetensi.trim()) {
        setAlertInfo({ title: 'Kolom Wajib Diisi', message: 'Kolom 6: Sertifikasi Kompetensi wajib dipilih.', type: 'error' });
        return;
      }
      if (!formData.jenjangJabatan.trim()) {
        setAlertInfo({ title: 'Kolom Wajib Diisi', message: 'Kolom 7: Jenjang Jabatan wajib dipilih.', type: 'error' });
        return;
      }
      if (!formData.tempatBertugas.trim()) {
        setAlertInfo({ title: 'Kolom Wajib Diisi', message: 'Kolom 8: Tempat Bertugas wajib diisi.', type: 'error' });
        return;
      }
      if (!formData.instansiBertugas.trim()) {
        setAlertInfo({ title: 'Kolom Wajib Diisi', message: 'Kolom 9: Instansi/tempat bertugas wajib diisi.', type: 'error' });
        return;
      }
      if (!formData.statusPeksos) {
        setAlertInfo({ title: 'Kolom Wajib Diisi', message: 'Kolom 10: Status Peksos wajib dipilih.', type: 'error' });
        return;
      }
      if (formData.statusPeksos === 'Pemerintah' && (!formData.jenjangJabatanPemerintah || formData.jenjangJabatanPemerintah === '-')) {
        setAlertInfo({ title: 'Kolom Wajib Diisi', message: 'Kolom 11: Jenjang Jabatan Pemerintah wajib dipilih untuk Peksos Pemerintah.', type: 'error' });
        return;
      }
      if (!formData.wilayah) {
        setAlertInfo({ title: 'Kolom Wajib Diisi', message: 'Kolom 12: Kabupaten/Kota wajib dipilih.', type: 'error' });
        return;
      }
      if (!formData.hp.trim() || formData.hp.trim().length < 8) {
        setAlertInfo({ title: 'Kolom Wajib Diisi', message: 'Kolom 13: Nomor HP aktif wajib diisi minimal 8 digit angka.', type: 'error' });
        return;
      }
      if (!formData.email.trim()) {
        setAlertInfo({ title: 'Kolom Wajib Diisi', message: 'Kolom 14: Email wajib diisi dengan format email yang valid.', type: 'error' });
        return;
      }
      if (!formData.statusKeaktifan) {
        setAlertInfo({ title: 'Kolom Wajib Diisi', message: 'Kolom 15: Status keaktifan wajib dipilih.', type: 'error' });
        return;
      }
      if (!formData.nomorKontak.trim()) {
        setAlertInfo({ title: 'Kolom Wajib Diisi', message: 'Kolom 16: Nomor kontak kantor/darurat wajib diisi.', type: 'error' });
        return;
      }

      const isGov = formData.statusPeksos === 'Pemerintah';
      saveRecordOrSubmission({
        nama: formData.nama.trim(),
        nik: cleanNik,
        jenisKelamin: formData.jenisKelamin || 'Laki-laki',
        pendidikan: formData.pendidikan || 'D4/S1 Kesejahteraan Sosial / Pekerjaan Sosial',
        noTglSertifikasi: formData.noTglSertifikasi.trim(),
        noTglSertifikatKompetensi: formData.noTglSertifikasi.trim(),
        sertifikasiKompetensi: formData.sertifikasiKompetensi || 'Pekerja Sosial Generalis',
        jenjangJabatan: formData.jenjangJabatan || 'Peksos Ahli Pertama',
        tempatBertugas: formData.tempatBertugas.trim(),
        instansiBertugas: formData.instansiBertugas.trim(),
        statusPeksos: formData.statusPeksos || 'Pemerintah',
        jenjangJabatanPemerintah: isGov ? (formData.jenjangJabatanPemerintah || 'Ahli Pertama') : '-',
        wilayah: formData.wilayah,
        hp: formData.hp.trim(),
        email: formData.email.trim(),
        statusKeaktifan: formData.statusKeaktifan || 'Aktif',
        nomorKontak: formData.nomorKontak.trim(),
        kec: formData.tempatBertugas.trim(),
        sertifikasi: formData.noTglSertifikasi.trim(),
        lembaga: isGov ? 'Lembaga Pemerintah' : 'Swasta',
        status: formData.statusKeaktifan || 'Aktif',
      });
    } else if (pillarId === 'psm') {
      // 1. PSM: Nama, Desa/Kelurahan, Kecamatan, Kabupaten/Kota, Masa Bakti, Nomor SK, Nomor HP, Status aktif
      if (!formData.nama.trim()) {
        setAlertInfo({ title: 'Kolom Wajib Diisi', message: 'Nama lengkap wajib diisi.', type: 'error' });
        return;
      }
      if (!formData.kelDesa.trim()) {
        setAlertInfo({ title: 'Kolom Wajib Diisi', message: 'Desa/Kelurahan wajib diisi.', type: 'error' });
        return;
      }
      if (!formData.kec.trim()) {
        setAlertInfo({ title: 'Kolom Wajib Diisi', message: 'Kecamatan wajib diisi.', type: 'error' });
        return;
      }
      if (!formData.wilayah) {
        setAlertInfo({ title: 'Kolom Wajib Diisi', message: 'Kabupaten/Kota wajib dipilih.', type: 'error' });
        return;
      }
      if (!formData.masaBakti.trim()) {
        setAlertInfo({ title: 'Kolom Wajib Diisi', message: 'Masa Bakti wajib diisi.', type: 'error' });
        return;
      }
      if (!formData.noSk.trim()) {
        setAlertInfo({ title: 'Kolom Wajib Diisi', message: 'Nomor SK wajib diisi.', type: 'error' });
        return;
      }
      if (!formData.hp.trim()) {
        setAlertInfo({ title: 'Kolom Wajib Diisi', message: 'Nomor HP wajib diisi.', type: 'error' });
        return;
      }

      saveRecordOrSubmission({
        nama: formData.nama.trim(),
        kelDesa: formData.kelDesa.trim(),
        kec: formData.kec.trim(),
        wilayah: formData.wilayah,
        masaBakti: formData.masaBakti.trim(),
        noSk: formData.noSk.trim(),
        hp: formData.hp.trim(),
        statusAktif: formData.statusAktif || 'Aktif',
        status: formData.statusAktif || 'Aktif',
        nik: cleanNik.length === 16 ? cleanNik : `32${Math.floor(10000000000000 + Math.random() * 90000000000000)}`,
        sertifikasi: formData.noSk.trim(),
      });
    } else if (pillarId === 'tagana') {
      // 2. Tagana: Nama, Kabupaten/Kota, Nomor Induk, Sertifikat, Keahlian, Pelatihan, Status Aktif
      if (!formData.nama.trim()) {
        setAlertInfo({ title: 'Kolom Wajib Diisi', message: 'Nama anggota Tagana wajib diisi.', type: 'error' });
        return;
      }
      if (!formData.wilayah) {
        setAlertInfo({ title: 'Kolom Wajib Diisi', message: 'Kabupaten/Kota wajib dipilih.', type: 'error' });
        return;
      }
      if (!formData.nomorInduk.trim()) {
        setAlertInfo({ title: 'Kolom Wajib Diisi', message: 'Nomor Induk Anggota wajib diisi.', type: 'error' });
        return;
      }
      if (!formData.sertifikat.trim()) {
        setAlertInfo({ title: 'Kolom Wajib Diisi', message: 'Sertifikat wajib diisi.', type: 'error' });
        return;
      }
      if (!formData.keahlian.trim()) {
        setAlertInfo({ title: 'Kolom Wajib Diisi', message: 'Keahlian wajib diisi.', type: 'error' });
        return;
      }
      if (!formData.pelatihan.trim()) {
        setAlertInfo({ title: 'Kolom Wajib Diisi', message: 'Pelatihan wajib diisi.', type: 'error' });
        return;
      }

      saveRecordOrSubmission({
        nama: formData.nama.trim(),
        wilayah: formData.wilayah,
        nomorInduk: formData.nomorInduk.trim(),
        sertifikat: formData.sertifikat.trim(),
        keahlian: formData.keahlian.trim(),
        pelatihan: formData.pelatihan.trim(),
        statusAktif: formData.statusAktif || 'Aktif',
        status: formData.statusAktif || 'Aktif',
        kec: formData.wilayah,
        hp: formData.hp.trim() || '-',
        nik: cleanNik.length === 16 ? cleanNik : `32${Math.floor(10000000000000 + Math.random() * 90000000000000)}`,
        sertifikasi: formData.sertifikat.trim(),
      });
    } else if (pillarId === 'lks') {
      // 3. LKS: Nama LKS, Bidang pelayanan, Ketua, Alamat, Nomor Tanda Daftar, Masa Berlaku, Kabupaten/Kota
      if (!formData.namaLks.trim()) {
        setAlertInfo({ title: 'Kolom Wajib Diisi', message: 'Nama LKS wajib diisi.', type: 'error' });
        return;
      }
      if (!formData.bidangPelayanan.trim()) {
        setAlertInfo({ title: 'Kolom Wajib Diisi', message: 'Bidang pelayanan wajib diisi.', type: 'error' });
        return;
      }
      if (!formData.ketua.trim()) {
        setAlertInfo({ title: 'Kolom Wajib Diisi', message: 'Nama Ketua LKS wajib diisi.', type: 'error' });
        return;
      }
      if (!formData.alamat.trim()) {
        setAlertInfo({ title: 'Kolom Wajib Diisi', message: 'Alamat sekretariat LKS wajib diisi.', type: 'error' });
        return;
      }
      if (!formData.nomorTandaDaftar.trim()) {
        setAlertInfo({ title: 'Kolom Wajib Diisi', message: 'Nomor Tanda Daftar wajib diisi.', type: 'error' });
        return;
      }
      if (!formData.masaBerlaku.trim()) {
        setAlertInfo({ title: 'Kolom Wajib Diisi', message: 'Masa Berlaku wajib diisi.', type: 'error' });
        return;
      }
      if (!formData.wilayah) {
        setAlertInfo({ title: 'Kolom Wajib Diisi', message: 'Kabupaten/Kota wajib dipilih.', type: 'error' });
        return;
      }

      saveRecordOrSubmission({
        nama: formData.namaLks.trim(),
        namaLks: formData.namaLks.trim(),
        bidangPelayanan: formData.bidangPelayanan.trim(),
        ketua: formData.ketua.trim(),
        alamat: formData.alamat.trim(),
        nomorTandaDaftar: formData.nomorTandaDaftar.trim(),
        masaBerlaku: formData.masaBerlaku.trim(),
        wilayah: formData.wilayah,
        kec: formData.alamat.trim(),
        sertifikasi: formData.nomorTandaDaftar.trim(),
        hp: '-',
        nik: cleanNik.length === 16 ? cleanNik : `32${Math.floor(10000000000000 + Math.random() * 90000000000000)}`,
        status: 'Aktif',
      });
    } else if (pillarId === 'karangtaruna') {
      // 4. Karang Taruna: Nama Karang Taruna, Desa/Kelurahan, Kecamatan, Kabupaten/Kota, Ketua, Nomor SK, Tahun Berdiri
      if (!formData.namaKarangTaruna.trim()) {
        setAlertInfo({ title: 'Kolom Wajib Diisi', message: 'Nama Karang Taruna wajib diisi.', type: 'error' });
        return;
      }
      if (!formData.kelDesa.trim()) {
        setAlertInfo({ title: 'Kolom Wajib Diisi', message: 'Desa/Kelurahan wajib diisi.', type: 'error' });
        return;
      }
      if (!formData.kec.trim()) {
        setAlertInfo({ title: 'Kolom Wajib Diisi', message: 'Kecamatan wajib diisi.', type: 'error' });
        return;
      }
      if (!formData.wilayah) {
        setAlertInfo({ title: 'Kolom Wajib Diisi', message: 'Kabupaten/Kota wajib dipilih.', type: 'error' });
        return;
      }
      if (!formData.ketua.trim()) {
        setAlertInfo({ title: 'Kolom Wajib Diisi', message: 'Nama Ketua Karang Taruna wajib diisi.', type: 'error' });
        return;
      }
      if (!formData.noSk.trim()) {
        setAlertInfo({ title: 'Kolom Wajib Diisi', message: 'Nomor SK wajib diisi.', type: 'error' });
        return;
      }
      if (!formData.tahunBerdiri.trim()) {
        setAlertInfo({ title: 'Kolom Wajib Diisi', message: 'Tahun Berdiri wajib diisi.', type: 'error' });
        return;
      }

      saveRecordOrSubmission({
        nama: formData.namaKarangTaruna.trim(),
        namaKarangTaruna: formData.namaKarangTaruna.trim(),
        kelDesa: formData.kelDesa.trim(),
        kec: formData.kec.trim(),
        wilayah: formData.wilayah,
        ketua: formData.ketua.trim(),
        noSk: formData.noSk.trim(),
        tahunBerdiri: formData.tahunBerdiri.trim(),
        sertifikasi: formData.noSk.trim(),
        hp: '-',
        nik: cleanNik.length === 16 ? cleanNik : `32${Math.floor(10000000000000 + Math.random() * 90000000000000)}`,
        status: 'Aktif',
      });
    } else if (pillarId === 'lk3') {
      // 5. LK3: Nama LK3, Kabupaten/Kota, Ketua, Alamat, Kontak, Jenis layanan, Status aktif
      if (!formData.namaLk3.trim()) {
        setAlertInfo({ title: 'Kolom Wajib Diisi', message: 'Nama LK3 wajib diisi.', type: 'error' });
        return;
      }
      if (!formData.wilayah) {
        setAlertInfo({ title: 'Kolom Wajib Diisi', message: 'Kabupaten/Kota wajib dipilih.', type: 'error' });
        return;
      }
      if (!formData.ketua.trim()) {
        setAlertInfo({ title: 'Kolom Wajib Diisi', message: 'Nama Ketua LK3 wajib diisi.', type: 'error' });
        return;
      }
      if (!formData.alamat.trim()) {
        setAlertInfo({ title: 'Kolom Wajib Diisi', message: 'Alamat LK3 wajib diisi.', type: 'error' });
        return;
      }
      if (!formData.kontak.trim()) {
        setAlertInfo({ title: 'Kolom Wajib Diisi', message: 'Nomor Kontak LK3 wajib diisi.', type: 'error' });
        return;
      }
      if (!formData.jenisLayanan.trim()) {
        setAlertInfo({ title: 'Kolom Wajib Diisi', message: 'Jenis layanan LK3 wajib diisi.', type: 'error' });
        return;
      }

      saveRecordOrSubmission({
        nama: formData.namaLk3.trim(),
        namaLk3: formData.namaLk3.trim(),
        wilayah: formData.wilayah,
        ketua: formData.ketua.trim(),
        alamat: formData.alamat.trim(),
        kontak: formData.kontak.trim(),
        hp: formData.kontak.trim(),
        jenisLayanan: formData.jenisLayanan.trim(),
        statusAktif: formData.statusAktif || 'Aktif',
        status: formData.statusAktif || 'Aktif',
        kec: formData.alamat.trim(),
        nik: cleanNik.length === 16 ? cleanNik : `32${Math.floor(10000000000000 + Math.random() * 90000000000000)}`,
        sertifikasi: formData.jenisLayanan.trim(),
      });
    } else if (pillarId === 'pensos') {
      // 6. Pensos: Nama, Instansi, Jabatan, Wilayah kerja, Sertifikasi
      if (!formData.nama.trim()) {
        setAlertInfo({ title: 'Kolom Wajib Diisi', message: 'Nama Penyuluh Sosial wajib diisi.', type: 'error' });
        return;
      }
      if (!formData.instansi.trim()) {
        setAlertInfo({ title: 'Kolom Wajib Diisi', message: 'Instansi wajib diisi.', type: 'error' });
        return;
      }
      if (!formData.jabatan.trim()) {
        setAlertInfo({ title: 'Kolom Wajib Diisi', message: 'Jabatan wajib diisi.', type: 'error' });
        return;
      }
      const pWilayah = formData.wilayahKerja || formData.wilayah;
      if (!pWilayah) {
        setAlertInfo({ title: 'Kolom Wajib Diisi', message: 'Wilayah kerja wajib dipilih.', type: 'error' });
        return;
      }
      if (!formData.sertifikasi.trim()) {
        setAlertInfo({ title: 'Kolom Wajib Diisi', message: 'Sertifikasi wajib diisi.', type: 'error' });
        return;
      }

      saveRecordOrSubmission({
        nama: formData.nama.trim(),
        instansi: formData.instansi.trim(),
        jabatan: formData.jabatan.trim(),
        wilayahKerja: pWilayah,
        wilayah: pWilayah,
        sertifikasi: formData.sertifikasi.trim(),
        kec: pWilayah,
        hp: '-',
        nik: cleanNik.length === 16 ? cleanNik : `32${Math.floor(10000000000000 + Math.random() * 90000000000000)}`,
        status: 'Aktif',
      });
    } else if (pillarId === 'tksk') {
      // 7. TKSK: Nama, Kecamatan, Kabupaten/Kota, SK Pengangkatan, Pendidikan, Nomor HP, Masa tugas
      if (!formData.nama.trim()) {
        setAlertInfo({ title: 'Kolom Wajib Diisi', message: 'Nama TKSK wajib diisi.', type: 'error' });
        return;
      }
      if (!formData.kec.trim()) {
        setAlertInfo({ title: 'Kolom Wajib Diisi', message: 'Kecamatan tugas wajib diisi.', type: 'error' });
        return;
      }
      if (!formData.wilayah) {
        setAlertInfo({ title: 'Kolom Wajib Diisi', message: 'Kabupaten/Kota wajib dipilih.', type: 'error' });
        return;
      }
      if (!formData.skPengangkatan.trim()) {
        setAlertInfo({ title: 'Kolom Wajib Diisi', message: 'SK Pengangkatan wajib diisi.', type: 'error' });
        return;
      }
      if (!formData.pendidikan.trim()) {
        setAlertInfo({ title: 'Kolom Wajib Diisi', message: 'Pendidikan wajib diisi/dipilih.', type: 'error' });
        return;
      }
      if (!formData.hp.trim()) {
        setAlertInfo({ title: 'Kolom Wajib Diisi', message: 'Nomor HP wajib diisi.', type: 'error' });
        return;
      }
      if (!formData.masaTugas.trim()) {
        setAlertInfo({ title: 'Kolom Wajib Diisi', message: 'Masa tugas wajib diisi.', type: 'error' });
        return;
      }

      saveRecordOrSubmission({
        nama: formData.nama.trim(),
        kec: formData.kec.trim(),
        wilayah: formData.wilayah,
        skPengangkatan: formData.skPengangkatan.trim(),
        pendidikan: formData.pendidikan.trim(),
        hp: formData.hp.trim(),
        masaTugas: formData.masaTugas.trim(),
        sertifikasi: formData.skPengangkatan.trim(),
        nik: cleanNik.length === 16 ? cleanNik : `32${Math.floor(10000000000000 + Math.random() * 90000000000000)}`,
        status: 'Aktif',
      });
    } else if (pillarId === 'badanusaha') {
      // 8. Badan Usaha: Nama Badan Usaha, Jenis usaha, Kabupaten/Kota, Bentuk CSR, Bidang bantuan, Kontak
      if (!formData.namaBadanUsaha.trim()) {
        setAlertInfo({ title: 'Kolom Wajib Diisi', message: 'Nama Badan Usaha / Perusahaan wajib diisi.', type: 'error' });
        return;
      }
      if (!formData.jenisUsaha.trim()) {
        setAlertInfo({ title: 'Kolom Wajib Diisi', message: 'Jenis usaha wajib diisi.', type: 'error' });
        return;
      }
      if (!formData.wilayah) {
        setAlertInfo({ title: 'Kolom Wajib Diisi', message: 'Kabupaten/Kota wajib dipilih.', type: 'error' });
        return;
      }
      if (!formData.bentukCsr.trim()) {
        setAlertInfo({ title: 'Kolom Wajib Diisi', message: 'Bentuk CSR wajib diisi.', type: 'error' });
        return;
      }
      if (!formData.bidangBantuan.trim()) {
        setAlertInfo({ title: 'Kolom Wajib Diisi', message: 'Bidang bantuan wajib diisi.', type: 'error' });
        return;
      }
      if (!formData.kontak.trim()) {
        setAlertInfo({ title: 'Kolom Wajib Diisi', message: 'Kontak PIC / Perusahaan wajib diisi.', type: 'error' });
        return;
      }

      saveRecordOrSubmission({
        nama: formData.namaBadanUsaha.trim(),
        namaBadanUsaha: formData.namaBadanUsaha.trim(),
        jenisUsaha: formData.jenisUsaha.trim(),
        wilayah: formData.wilayah,
        bentukCsr: formData.bentukCsr.trim(),
        bidangBantuan: formData.bidangBantuan.trim(),
        kontak: formData.kontak.trim(),
        hp: formData.kontak.trim(),
        kec: formData.wilayah,
        sertifikasi: formData.bentukCsr.trim(),
        nik: cleanNik.length === 16 ? cleanNik : `32${Math.floor(10000000000000 + Math.random() * 90000000000000)}`,
        status: 'Aktif',
      });
    } else if (pillarId === 'slrt_puskesos') {
      // 9. SLRT PUSKESOS: Nama SLRT, Desa/Kelurahan, Kecamatan, Kabupaten/Kota, Tahun Berdiri, Operator Puskesos, Status Aktif
      if (!formData.namaSlrt.trim()) {
        setAlertInfo({ title: 'Kolom Wajib Diisi', message: 'Nama SLRT / Puskesos wajib diisi.', type: 'error' });
        return;
      }
      if (!formData.kelDesa.trim()) {
        setAlertInfo({ title: 'Kolom Wajib Diisi', message: 'Desa/Kelurahan wajib diisi.', type: 'error' });
        return;
      }
      if (!formData.kec.trim()) {
        setAlertInfo({ title: 'Kolom Wajib Diisi', message: 'Kecamatan wajib diisi.', type: 'error' });
        return;
      }
      if (!formData.wilayah) {
        setAlertInfo({ title: 'Kolom Wajib Diisi', message: 'Kabupaten/Kota wajib dipilih.', type: 'error' });
        return;
      }
      if (!formData.tahunBerdiri.trim()) {
        setAlertInfo({ title: 'Kolom Wajib Diisi', message: 'Tahun berdiri wajib diisi.', type: 'error' });
        return;
      }
      if (!formData.operator.trim()) {
        setAlertInfo({ title: 'Kolom Wajib Diisi', message: 'Nama Operator Puskesos wajib diisi.', type: 'error' });
        return;
      }

      saveRecordOrSubmission({
        nama: formData.namaSlrt.trim(),
        namaSlrt: formData.namaSlrt.trim(),
        kelDesa: formData.kelDesa.trim(),
        kec: formData.kec.trim(),
        wilayah: formData.wilayah,
        tahunBerdiri: formData.tahunBerdiri.trim(),
        operator: formData.operator.trim(),
        statusAktif: formData.statusAktif || 'Aktif',
        status: formData.statusAktif || 'Aktif',
        sertifikasi: formData.operator.trim(),
        hp: '-',
        nik: cleanNik.length === 16 ? cleanNik : `32${Math.floor(10000000000000 + Math.random() * 90000000000000)}`,
      });
    } else {
      // Generic Fallback
      if (!formData.nama.trim() || !formData.wilayah) {
        setAlertInfo({
          title: 'Form Belum Lengkap',
          message: 'Semua kolom formulir pendaftaran wajib diisi secara lengkap.',
          type: 'error',
        });
        return;
      }

      saveRecordOrSubmission({
        wilayah: formData.wilayah,
        kec: formData.kec.trim() || formData.wilayah,
        nama: formData.nama.trim(),
        nik: cleanNik.length === 16 ? cleanNik : `32${Math.floor(10000000000000 + Math.random() * 90000000000000)}`,
        sertifikasi: formData.sertifikasi.trim() || '-',
        hp: formData.hp.trim() || '-',
        status: 'Aktif',
      });
    }
  };

  const handleExportExcel = async () => {
    try {
      const { exportPillarToExcel } = await import('../utils/excelExport');
      exportPillarToExcel({
        pillarId,
        pillar,
        records: displayRecords,
        session,
      });
      setAlertInfo({
        title: 'Berhasil Ekspor Excel',
        message: `Laporan data ${pillar.title || pillar.shortName} berhasil diekspor ke format Excel (.xlsx) dengan tabel rapi.`,
        type: 'success',
      });
    } catch (err) {
      console.error('Failed to export Excel:', err);
      setAlertInfo({
        title: 'Gagal Ekspor Excel',
        message: 'Terjadi kesalahan sistem saat menyusun berkas Excel.',
        type: 'error',
      });
    }
  };

  const handleExportPDF = async () => {
    try {
      const { exportPillarToPDF } = await import('../utils/pdfExport');
      exportPillarToPDF({
        pillarId,
        pillar,
        records: displayRecords,
        session,
      });
      setAlertInfo({
        title: 'Berhasil Ekspor PDF',
        message: `Laporan resmi ${pillar.title || pillar.shortName} format PDF berhasil digenerate dan diunduh.`,
        type: 'success',
      });
    } catch (err) {
      console.error('Failed to export PDF:', err);
      setAlertInfo({
        title: 'Gagal Ekspor PDF',
        message: 'Terjadi kesalahan sistem saat menyusun berkas PDF.',
        type: 'error',
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#091f42] via-[#0f2b5c] to-[#143b7d] py-4 sm:py-6 px-3.5 sm:px-8 border-b-2 border-[#d4af37] text-white shadow-md">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-96 h-full bg-radial from-blue-500/10 to-transparent pointer-events-none" />
        <div className="absolute -bottom-6 left-1/4 w-64 h-24 bg-amber-400/5 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto">
          {/* Top Row for Navigation */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3 sm:mb-4 pb-2.5 sm:pb-3 border-b border-blue-700/40">
            <BackToHomeButton onClick={onBackToDashboard} variant="gold" id="btn-back-top-pillar-detail" />
            <div className="hidden sm:flex items-center gap-2 text-[11px] font-semibold text-blue-200/90 bg-blue-950/40 border border-blue-600/30 px-3 py-1 rounded-lg">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span>Portal Data Pilar Sosial Terpadu</span>
            </div>
          </div>

          <h1 className="text-xl sm:text-2xl md:text-3xl font-black uppercase tracking-tight leading-tight text-white mb-1 sm:mb-1.5">
            {pillar.title}
          </h1>
          <p className="text-blue-100 font-medium text-xs sm:text-sm max-w-3xl leading-relaxed mb-2 sm:mb-2.5">
            {pillar.subtitle}
          </p>
          <div className="text-[#d4af37] font-semibold text-[11px] sm:text-xs flex flex-wrap items-center gap-2 pt-0.5">
            <span>Dinas Sosial Provinsi Jawa Barat</span>
            <span className="text-blue-400/80">•</span>
            <span>Wilayah: {session.wilayah || 'Semua Kab/Kota'}</span>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div ref={containerRef} className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 mt-4 sm:mt-8">
        {/* 2. Summary Widget Cards */}
        <div className="flex flex-col items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="bg-[#0f2b5c] border-2 border-[#d4af37] rounded-xl p-3.5 sm:p-6 text-center text-white w-full max-w-lg shadow-lg">
            <h3 className="text-[10px] sm:text-xs uppercase tracking-widest text-[#f1c40f] font-bold mb-1 sm:mb-2">
              TOTAL {pillar.title} TERDATA
            </h3>
            <div className="text-3xl sm:text-5xl font-black">
              <AnimatedCounter end={totalCount} duration={1400} trigger={chartVisible} />{' '}
              <span className="text-sm sm:text-lg font-medium opacity-80">
                {pillar.unitLabel}
              </span>
            </div>
          </div>

          {pillarId === 'peksos' && (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full max-w-2xl">
              <div className="bg-blue-50 border-2 border-[#0f2b5c] rounded-xl p-3 sm:p-4 text-center shadow-xs">
                <div className="text-[10px] sm:text-xs font-black text-[#0f2b5c] uppercase tracking-wide">
                  PEKSOS PEMERINTAH
                </div>
                <div className="text-xl sm:text-2xl font-black text-[#0f2b5c] mt-0.5 sm:mt-1">
                  <AnimatedCounter end={govCount} duration={1400} trigger={chartVisible} /> <span className="text-[10px] sm:text-xs text-slate-500 font-bold">Orang</span>
                </div>
              </div>

              <div className="bg-amber-50 border-2 border-[#b8901c] rounded-xl p-3 sm:p-4 text-center shadow-xs">
                <div className="text-[10px] sm:text-xs font-black text-amber-900 uppercase tracking-wide">
                  PEKSOS MASYARAKAT
                </div>
                <div className="text-xl sm:text-2xl font-black text-[#b8901c] mt-0.5 sm:mt-1">
                  <AnimatedCounter end={swastaCount} duration={1400} trigger={chartVisible} /> <span className="text-[10px] sm:text-xs text-slate-500 font-bold">Orang</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 3. Horizontal Bar Chart */}
        <div className="bg-white rounded-xl sm:rounded-2xl p-3.5 sm:p-6 border border-slate-200 shadow-xs mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <h3 className="text-base font-bold text-[#0f2b5c]">
              Perbandingan Komposisi Kuantitas {pillar.shortName} di Wilayah Tugas
            </h3>

            {/* Note / Legend khusus PEKSOS */}
            {pillarId === 'peksos' && (
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-[#0f2b5c] inline-block shadow-sm"></span>
                  <span className="font-bold">Peksos Pemerintah</span>
                </div>
                <span className="text-slate-300">|</span>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-[#d4af37] inline-block shadow-sm"></span>
                  <span className="font-bold">Peksos Masyarakat</span>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3 border-l-2 border-slate-300 pl-2">
            {chartRegions.map((region) => {
              const counts = regionalCounts[region] || { total: 0, gov: 0, swasta: 0 };

              if (pillarId === 'peksos') {
                const percentGov = Math.max(6, (counts.gov / maxChartCount) * 100);
                const percentSwasta = Math.max(6, (counts.swasta / maxChartCount) * 100);

                return (
                  <div key={region} className="py-1.5 border-b border-slate-100 last:border-none">
                    <div className="flex items-center justify-between text-xs font-extrabold text-slate-800 mb-1">
                      <span>{region}</span>
                      <span className="text-[11px] font-semibold text-slate-500">
                        Total: <AnimatedCounter end={counts.total} duration={1400} trigger={chartVisible} /> Orang
                      </span>
                    </div>

                    <div className="space-y-1 pl-2">
                      {/* Batang 1: Peksos Lembaga Pemerintah (Biru Jabar) */}
                      <div className="flex items-center gap-2 text-xs">
                        <span className="w-24 text-[10px] font-bold text-blue-900 shrink-0 truncate">
                          Pemerintah
                        </span>
                        <div className="flex-1 bg-slate-100 p-0.5 rounded-lg overflow-hidden">
                          <div
                            style={{ width: chartVisible ? `${counts.gov > 0 ? percentGov : 0}%` : '0%' }}
                            className="h-4 bg-[#0f2b5c] rounded flex items-center justify-end px-2 shadow-sm transition-all duration-1000 ease-out min-w-[20px]"
                          >
                            <span className="text-[10px] font-black text-white">
                              <AnimatedCounter end={counts.gov} duration={1400} trigger={chartVisible} />
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Batang 2: Peksos Masyarakat (Golden) */}
                      <div className="flex items-center gap-2 text-xs">
                        <span className="w-24 text-[10px] font-bold text-amber-900 shrink-0 truncate">
                          Masyarakat
                        </span>
                        <div className="flex-1 bg-slate-100 p-0.5 rounded-lg overflow-hidden">
                          <div
                            style={{ width: chartVisible ? `${counts.swasta > 0 ? percentSwasta : 0}%` : '0%' }}
                            className="h-4 bg-[#d4af37] rounded flex items-center justify-end px-2 shadow-sm transition-all duration-1000 ease-out min-w-[20px]"
                          >
                            <span className="text-[10px] font-black text-[#0f2b5c]">
                              <AnimatedCounter end={counts.swasta} duration={1400} trigger={chartVisible} />
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              // Single bar for other pillars
              const percent = Math.max(8, (counts.total / maxChartCount) * 100);
              return (
                <div key={region} className="flex items-center gap-3 py-1 text-xs">
                  <div className="w-36 text-right font-bold text-slate-700 truncate shrink-0">
                    {region}
                  </div>
                  <div className="flex-1 bg-slate-100 p-1 rounded-lg overflow-hidden">
                    <div
                      style={{ width: chartVisible ? `${percent}%` : '0%' }}
                      className="h-5 bg-gradient-to-r from-[#b8901c] to-[#d4af37] rounded flex items-center justify-end px-2 shadow-sm transition-all duration-1000 ease-out min-w-[20px]"
                    >
                      <span className="text-[10px] font-black text-white drop-shadow">
                        <AnimatedCounter end={counts.total} duration={1400} trigger={chartVisible} />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. Regional Isolation Banner */}
        {session.role !== 'superadmin' &&
          session.role !== 'developer' &&
          !session.isDeveloper &&
          session.wilayah &&
          session.wilayah !== 'Prov. Jabar' && (
          <div className="bg-slate-100 border border-dashed border-red-400 rounded-2xl p-5 mb-8 text-center relative overflow-hidden">
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 bg-red-100 text-red-600 rounded-full flex items-center justify-center font-bold">
                <Lock className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-extrabold text-red-900">
                Anda tidak dapat mengakses Wilayah lain
              </h4>
              <span className="text-[11px] font-bold uppercase tracking-wider bg-red-200/80 text-red-800 px-3 py-1 rounded-full border border-red-300">
                Hak Akses Tersegmentasi Daerah Tugas ({session.wilayah})
              </span>
            </div>
          </div>
        )}

        {/* 5. Search & Action Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari berdasarkan nama, wilayah, atau sertifikasi..."
              className="w-full bg-white border border-slate-300 rounded-lg sm:rounded-xl pl-10 pr-4 py-2 sm:py-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#0f2b5c] shadow-xs font-medium"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-3 w-full md:w-auto">
            {session.role !== 'user' && (
              <>
                <button
                  id={`btn-export-excel-${pillarId}`}
                  type="button"
                  onClick={handleExportExcel}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 sm:gap-2 bg-[#b8901c] hover:bg-[#d4af37] text-[#0f2b5c] font-bold text-xs sm:text-sm px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl shadow-xs transition-all cursor-pointer active:scale-95 whitespace-nowrap"
                  title="Ekspor data pilar ke file spreadsheet CSV/Excel"
                >
                  <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span><span className="hidden sm:inline">Export Ke </span>Excel</span>
                </button>

                <button
                  id={`btn-export-pdf-${pillarId}`}
                  type="button"
                  onClick={handleExportPDF}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 sm:gap-2 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs sm:text-sm px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl shadow-xs transition-all cursor-pointer active:scale-95 whitespace-nowrap"
                  title="Ekspor data pilar ke dokumen PDF resmi bertandatangan digital"
                >
                  <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span><span className="hidden sm:inline">Export Ke </span>PDF</span>
                </button>

                {(session.role === 'superadmin' || session.role === 'developer' || session.isDeveloper) && (
                  <>
                    {onRescueSync && (
                      <button
                        id={`btn-rescue-sync-${pillarId}`}
                        type="button"
                        onClick={onRescueSync}
                        disabled={isRescueSyncing}
                        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 sm:gap-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold text-xs sm:text-sm px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl shadow-xs transition-all cursor-pointer active:scale-95 whitespace-nowrap disabled:opacity-60"
                        title="Penyelamatan Data: Dorong dan sinkronkan seluruh data lokal di perangkat ini langsung ke Google Cloud Firestore"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-200 ${isRescueSyncing ? 'animate-spin' : ''}`} />
                        <span>{isRescueSyncing ? (rescueProgressText || 'Menyinkronkan...') : `Sinkronkan Ke Cloud (${dataRecords.length})`}</span>
                      </button>
                    )}

                    <button
                      id={`btn-import-excel-${pillarId}`}
                      type="button"
                      onClick={() => setShowImportModal(true)}
                      className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 sm:gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl shadow-xs transition-all cursor-pointer active:scale-95 whitespace-nowrap"
                      title="Import data anggota massal dari file Excel (.xlsx / .csv) dengan pemetaan kolom otomatis"
                    >
                      <UploadCloud className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-200" />
                      <span><span className="hidden sm:inline">Import </span>Excel</span>
                    </button>

                    <div className="relative inline-block" ref={deleteMenuRef}>
                      <button
                        id={`btn-delete-menu-${pillarId}`}
                        type="button"
                        onClick={() => setShowDeleteMenuDropdown((prev) => !prev)}
                        className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 sm:gap-2 font-bold text-xs sm:text-sm px-2.5 sm:px-3.5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl shadow-xs transition-all cursor-pointer active:scale-95 whitespace-nowrap border ${
                          isSelectionModeActive
                            ? 'bg-rose-700 hover:bg-rose-800 text-white border-rose-600 ring-2 ring-rose-400/50'
                            : 'bg-slate-800 hover:bg-slate-900 text-rose-300 hover:text-white border-rose-500/40'
                        }`}
                        title="Opsi penghapusan data: Hapus Checkbox atau Hapus Data per Wilayah"
                      >
                        <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400" />
                        <span>Hapus</span>
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showDeleteMenuDropdown ? 'rotate-180' : ''}`} />
                      </button>

                      {/* Dropdown Menu 2 Opsi */}
                      {showDeleteMenuDropdown && (
                        <div className="absolute right-0 mt-2 w-64 sm:w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95 duration-150 text-left">
                          <div className="px-3 py-2 border-b border-slate-100 mb-1">
                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">
                              Pilih Fitur Hapus
                            </span>
                          </div>

                          {/* Opsi 1: Hapus Checkbox (Toggle Buka / Tutup) */}
                          <button
                            type="button"
                            onClick={() => {
                              setIsSelectionModeActive((prev) => !prev);
                              if (isSelectionModeActive) {
                                setSelectedRecordIds([]);
                              }
                              setShowDeleteMenuDropdown(false);
                            }}
                            className="w-full flex items-start gap-2.5 p-2.5 rounded-xl hover:bg-rose-50 text-left transition-colors cursor-pointer group"
                          >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-bold transition-colors ${
                              isSelectionModeActive ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-700 group-hover:bg-rose-100 group-hover:text-rose-700'
                            }`}>
                              <CheckSquare className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-black text-slate-800 group-hover:text-rose-900 block">
                                  Hapus Checkbox
                                </span>
                                <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
                                  isSelectionModeActive ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-500'
                                }`}>
                                  {isSelectionModeActive ? 'Aktif' : 'Buka'}
                                </span>
                              </div>
                              <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">
                                {isSelectionModeActive ? 'Klik untuk menutup kolom centang' : 'Munculkan kotak centang di tabel'}
                              </span>
                            </div>
                          </button>

                          {/* Opsi 2: Hapus Data Per Wilayah/Kab/Kota */}
                          <button
                            type="button"
                            onClick={() => {
                              setShowDeleteMenuDropdown(false);
                              setShowDeleteByRegionModal(true);
                            }}
                            className="w-full flex items-start gap-2.5 p-2.5 rounded-xl hover:bg-rose-50 text-left transition-colors cursor-pointer group mt-1"
                          >
                            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 group-hover:bg-rose-100 group-hover:text-rose-700 flex items-center justify-center shrink-0 font-bold transition-colors">
                              <MapPin className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-xs font-black text-slate-800 group-hover:text-rose-900 block">
                                Hapus per Wilayah
                              </span>
                              <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">
                                Bersihkan seluruh data anggota 1 kab/kota
                              </span>
                            </div>
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </>
            )}

            {session.role !== 'user' ? (
              <button
                id={`btn-new-reg-${pillarId}`}
                type="button"
                onClick={handleOpenModal}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 sm:gap-2 bg-[#0f2b5c] hover:bg-[#143b7d] text-white font-bold text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl shadow-xs transition-all cursor-pointer active:scale-95 whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Registrasi<span className="hidden sm:inline"> Baru</span></span>
              </button>
            ) : (
              <button
                id={`btn-submit-reg-${pillarId}`}
                type="button"
                onClick={() => {
                  if (session.statusActive === 'GUEST') {
                    setShowGuestLoginModal(true);
                  } else {
                    handleOpenModal();
                  }
                }}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 sm:gap-2 bg-[#0f2b5c] hover:bg-[#143b7d] text-white font-bold text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl shadow-xs transition-all cursor-pointer active:scale-95 whitespace-nowrap"
              >
                <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span><span className="hidden sm:inline">Ajukan </span>Pendaftaran</span>
              </button>
            )}
          </div>
        </div>

        {/* Notifikasi / Penanda jika Mode Centang (Checkbox) sedang Aktif */}
        {isSelectionModeActive && (
          <div className="bg-rose-50 border border-rose-300 rounded-2xl p-3 sm:p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs text-rose-950 shadow-xs animate-in fade-in">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-rose-600 text-white flex items-center justify-center font-black shrink-0">
                <CheckSquare className="w-4 h-4" />
              </div>
              <div>
                <span className="font-black text-rose-900 block">
                  Mode Hapus Checkbox Sedang Aktif
                </span>
                <span className="text-[11px] text-rose-700">
                  Silakan centang satu per satu atau centang seluruhnya di header tabel untuk menghapus data terpilih.
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsSelectionModeActive(false);
                setSelectedRecordIds([]);
              }}
              className="text-xs font-black text-rose-700 hover:text-white bg-white hover:bg-rose-600 border border-rose-400 px-3 py-1.5 rounded-xl cursor-pointer transition-all flex items-center gap-1.5 shadow-xs shrink-0"
              title="Sembunyikan kolom kotak centang dari tabel"
            >
              <X className="w-3.5 h-3.5" />
              <span>Tutup Mode Checkbox</span>
            </button>
          </div>
        )}

        {/* 6. Data Table */}
        <PillarTable
          pillarId={pillarId}
          pillar={pillar}
          session={session}
          displayRecords={displayRecords}
          searchTerm={searchTerm}
          isPeksosGov={isPeksosGov}
          onEditClick={handleEditClick}
          onDeleteClick={(record) => {
            if (
              session.role === 'admin' &&
              session.wilayah &&
              session.wilayah !== 'Prov. Jabar' &&
              session.wilayah !== 'Semua Wilayah' &&
              record.wilayah.toLowerCase().trim() !== session.wilayah.toLowerCase().trim()
            ) {
              setAlertInfo({
                title: 'Otoritas Ditolak',
                message: `Admin Wilayah (${session.wilayah}) hanya berhak menghapus data anggota di wilayahnya sendiri.`,
                type: 'error',
              });
              return;
            }
            setRecordToDelete(record);
          }}
          showCheckbox={isSelectionModeActive}
          selectedRecordIds={selectedRecordIds}
          onToggleSelectRecord={handleToggleSelectRecord}
          onToggleSelectAll={handleToggleSelectAll}
        />

        {/* Floating Action Bar jika ada data dicentang */}
        {selectedRecordIds.length > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-950/95 text-white px-5 py-3 rounded-2xl shadow-2xl border-2 border-rose-500/80 flex items-center gap-3 sm:gap-4 backdrop-blur-md animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-rose-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                {selectedRecordIds.length}
              </span>
              <span className="text-xs sm:text-sm font-bold text-slate-200">
                Data Terpilih
              </span>
            </div>
            <div className="h-5 w-px bg-slate-700" />
            <button
              type="button"
              onClick={() => setSelectedRecordIds([])}
              className="text-xs font-semibold text-slate-400 hover:text-white cursor-pointer px-2 py-1 transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={() => {
                setIsSelectionModeActive(false);
                setSelectedRecordIds([]);
              }}
              className="text-xs font-semibold text-slate-400 hover:text-white cursor-pointer px-2 py-1 transition-colors flex items-center gap-1"
              title="Tutup kolom checkbox dan bersihkan pilihan"
            >
              <X className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tutup Checkbox</span>
            </button>
            <button
              type="button"
              onClick={() => setShowBatchDeleteConfirm(true)}
              className="bg-rose-600 hover:bg-rose-700 text-white font-black text-xs sm:text-sm px-4 py-2 rounded-xl shadow-md cursor-pointer transition-all flex items-center gap-1.5 active:scale-95"
            >
              <Trash2 className="w-4 h-4" />
              <span>Hapus {selectedRecordIds.length} Data Terpilih</span>
            </button>
          </div>
        )}

        {/* BOTTOM NAVIGATION BAR: BUTTON KEMBALI KE BERANDA (POJOK KIRI BAWAH) */}
        <div className="mt-8 pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <BackToHomeButton onClick={onBackToDashboard} id="btn-back-bottom-pillar-detail" />
          <div className="text-xs text-slate-500 font-semibold">
            <span>Dinas Sosial Provinsi Jawa Barat • PSKS JABAR Pilar {pillar.title}</span>
          </div>
        </div>
      </div>

      {/* Registration / Edit Modal */}
      {isModalOpen && (
        <PillarModal
          pillarId={pillarId}
          pillar={pillar}
          session={session}
          formData={formData}
          setFormData={setFormData}
          regionOptions={regionOptions}
          isEditMode={!!editingRecord}
          onSubmit={handleFormSubmit}
          onClose={() => {
            setIsModalOpen(false);
            setEditingRecord(null);
          }}
        />
      )}

      {/* Excel Bulk Import Modal (Khusus Superadmin & Developer) */}
      {showImportModal && onBatchAddRecords && (
        <PillarExcelImportModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          pillarId={pillarId}
          pillar={pillar}
          session={session}
          onBatchImport={async (records) => {
            const count = await onBatchAddRecords(records, pillarId);
            setSearchTerm('');
            setAlertInfo({
              title: 'Import Massal Berhasil!',
              message: `Sebanyak ${count} data anggota telah berhasil ditambahkan dan disinkronkan ke tabel ${pillar.title}.`,
              type: 'success',
            });
            return count;
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {recordToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border-2 border-red-500 p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4 border border-red-200">
              <Trash2 className="w-7 h-7 stroke-[2.5]" />
            </div>
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">
              Konfirmasi Hapus Data
            </h3>
            <p className="text-slate-600 text-xs sm:text-sm mt-2 leading-relaxed">
              Apakah Anda yakin ingin MENGHAPUS data anggota <strong className="text-red-700 font-extrabold">{recordToDelete.nama}</strong> ({recordToDelete.wilayah}) secara permanen dari sistem?
            </p>
            <div className="flex items-center justify-center gap-3 mt-6 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRecordToDelete(null)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  const targetId = recordToDelete.id;
                  const targetName = recordToDelete.nama;
                  setRecordToDelete(null);
                  onDeleteRecord(targetId);
                  setAlertInfo({
                    title: 'Berhasil Dihapus!',
                    message: `Data anggota "${targetName}" telah berhasil dihapus secara permanen dari database.`,
                    type: 'success',
                  });
                }}
                className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer active:scale-95"
              >
                Ya, Hapus Permanen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Delete Selected Records Confirmation Modal */}
      {showBatchDeleteConfirm && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border-2 border-rose-500 p-6 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-300 shadow-sm">
              <Trash2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">
              Hapus Massal {selectedRecordIds.length} Data Terpilih
            </h3>
            <p className="text-slate-600 text-xs sm:text-sm mt-2 leading-relaxed">
              Apakah Anda yakin ingin menghapus <strong>{selectedRecordIds.length} data anggota</strong> yang Anda centang secara permanen dari database Firestore? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex items-center justify-center gap-3 mt-6 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowBatchDeleteConfirm(false)}
                disabled={isDeletingBatch}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteBatchDelete}
                disabled={isDeletingBatch}
                className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
              >
                {isDeletingBatch ? 'Sedang Menghapus...' : `Ya, Hapus ${selectedRecordIds.length} Data`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete by Region Modal */}
      {showDeleteByRegionModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border-2 border-rose-500 p-6 text-left animate-in zoom-in-95 duration-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-black">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Hapus Data per Wilayah
                  </h3>
                  <p className="text-xs text-slate-500">
                    Pilar {pillar.title} ({pillar.shortName})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDeleteByRegionModal(false)}
                disabled={isDeletingBatch}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs text-rose-900 space-y-1">
              <div className="font-black flex items-center gap-1.5 text-rose-800">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Pembersihan Bersih Data Khusus Satu Wilayah</span>
              </div>
              <p className="text-rose-800/90 leading-relaxed">
                Fitur ini akan menghapus <strong>seluruh data anggota di wilayah yang Anda pilih</strong> pada pilar ini. Data wilayah lainnya tetap aman dan tidak akan tersentuh.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700 block">
                Pilih Wilayah Yang Ingin Dihapus Bersih:
              </label>
              <select
                value={regionToDelete}
                onChange={(e) => setRegionToDelete(e.target.value)}
                className="w-full bg-white border-2 border-slate-300 focus:border-rose-500 rounded-xl p-3 text-xs font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 cursor-pointer"
              >
                <option value="">-- Pilih Wilayah / Kabupaten / Kota --</option>
                {availableRegionsWithCount.map(([regionName, count]) => (
                  <option key={regionName} value={regionName}>
                    📍 {regionName} ({count} Data Anggota)
                  </option>
                ))}
              </select>
            </div>

            {regionToDelete && (
              <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 font-bold">
                ⚠️ Anda akan menghapus{' '}
                <strong className="text-rose-700">
                  {availableRegionsWithCount.find(([r]) => r === regionToDelete)?.[1] || 0} data anggota
                </strong>{' '}
                di wilayah <strong>{regionToDelete}</strong>.
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowDeleteByRegionModal(false)}
                disabled={isDeletingBatch}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteDeleteByRegion}
                disabled={!regionToDelete || isDeletingBatch}
                className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
              >
                {isDeletingBatch ? 'Sedang Menghapus...' : `Hapus Bersih Data ${regionToDelete || 'Wilayah'}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Guest Login Required Modal */}
      {showGuestLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 text-center border-2 border-emerald-600">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-4 border border-amber-300">
              <Lock className="w-7 h-7" />
            </div>
            <h3 className="text-base font-black text-slate-900 uppercase">
              Akses Dibatasi - Perlu Login
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
              Anda harus login terlebih dahulu sebelum mengajukan pendaftaran pilar sosial PSKS Jawa Barat.
            </p>
            <div className="flex items-center gap-3 mt-6 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowGuestLoginModal(false)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowGuestLoginModal(false);
                  if (onOpenGateModal) {
                    onOpenGateModal();
                  }
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#043e2e] to-emerald-800 hover:from-emerald-800 hover:to-teal-800 text-amber-300 font-black text-xs shadow-md transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
              >
                <LogIn className="w-4 h-4" />
                <span>Masuk ke Akun</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Alert Modal */}
      {alertInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 text-center border border-slate-200">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${
              alertInfo.type === 'error' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-700'
            }`}>
              {alertInfo.type === 'error' ? <Lock className="w-6 h-6" /> : <X className="w-6 h-6 rotate-45" />}
            </div>
            <h3 className="text-base font-extrabold text-slate-900 mb-1">
              {alertInfo.title}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mb-5 leading-relaxed">
              {alertInfo.message}
            </p>
            <button
              type="button"
              onClick={() => setAlertInfo(null)}
              className="w-full py-2.5 bg-[#043e2e] hover:bg-[#065e44] text-white font-bold text-xs rounded-xl shadow transition-all cursor-pointer"
            >
              Tutup / Mengerti
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
