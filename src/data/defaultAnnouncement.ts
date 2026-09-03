import { AnnouncementConfig } from '../types';
import { KAB_KOTA_ONLY } from './initialData';

// Generate default map with all 27 Jawa Barat Kab/Kota enabled
export const createDefaultWilayahSwitches = (defaultValue = true): Record<string, boolean> => {
  const result: Record<string, boolean> = {};
  KAB_KOTA_ONLY.forEach((w) => {
    result[w] = defaultValue;
  });
  return result;
};

// Default high-resolution lightweight banner SVG for announcement
export const DEFAULT_ANNOUNCEMENT_PHOTO =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 700" width="1200" height="700">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#022a1f"/>
      <stop offset="45%" stop-color="#043e2e"/>
      <stop offset="85%" stop-color="#065e44"/>
      <stop offset="100%" stop-color="#021d15"/>
    </linearGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#b8860b"/>
      <stop offset="30%" stop-color="#f3e5ab"/>
      <stop offset="70%" stop-color="#d4af37"/>
      <stop offset="100%" stop-color="#996515"/>
    </linearGradient>
    <linearGradient id="cardGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0.04"/>
    </linearGradient>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#d4af37" stroke-width="0.75" stroke-opacity="0.12"/>
    </pattern>
  </defs>

  <!-- Background Base -->
  <rect width="1200" height="700" fill="url(#bg)"/>
  <rect width="1200" height="700" fill="url(#grid)"/>

  <!-- Decorative Top & Bottom Borders -->
  <rect x="0" y="0" width="1200" height="14" fill="url(#gold)"/>
  <rect x="0" y="686" width="1200" height="14" fill="url(#gold)"/>

  <!-- Decorative Background Circles -->
  <circle cx="1100" cy="150" r="220" fill="#10b981" fill-opacity="0.06"/>
  <circle cx="100" cy="550" r="260" fill="#d4af37" fill-opacity="0.05"/>

  <!-- Official Header Badge -->
  <rect x="360" y="45" width="480" height="42" rx="21" fill="#022118" stroke="url(#gold)" stroke-width="1.5"/>
  <text x="600" y="72" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="900" letter-spacing="3" text-anchor="middle" fill="#fef08a">PEMERINTAH PROVINSI JAWA BARAT</text>

  <!-- Central Announcement Badge -->
  <circle cx="600" cy="170" r="52" fill="#032e22" stroke="url(#gold)" stroke-width="3"/>
  <text x="600" y="185" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="44" text-anchor="middle">📢</text>

  <!-- Main Titles -->
  <text x="600" y="270" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="800" letter-spacing="4" text-anchor="middle" fill="#d4af37">DINAS SOSIAL PROVINSI JAWA BARAT</text>
  <text x="600" y="335" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="40" font-weight="900" text-anchor="middle" fill="#ffffff" letter-spacing="1">PENGUMUMAN RESMI SISTEM PSKS</text>
  <text x="600" y="380" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="600" text-anchor="middle" fill="#a7f3d0">Sosialisasi Pendataan Mandiri &amp; Verifikasi 10 Pilar 27 Kab/Kota</text>

  <!-- Highlight Box with 3 Checklist Points -->
  <rect x="180" y="420" width="840" height="155" rx="20" fill="url(#cardGrad)" stroke="#d4af37" stroke-opacity="0.4" stroke-width="1.5"/>
  
  <g transform="translate(220, 460)">
    <circle cx="15" cy="0" r="12" fill="#10b981"/>
    <text x="15" y="4" font-family="sans-serif" font-size="12" font-weight="bold" fill="#ffffff" text-anchor="middle">✓</text>
    <text x="40" y="4" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="16" font-weight="700" fill="#ffffff">Pendaftaran Mandiri Anggota &amp; Pengurus 10 Pilar Terbuka</text>
  </g>

  <g transform="translate(220, 500)">
    <circle cx="15" cy="0" r="12" fill="#10b981"/>
    <text x="15" y="4" font-family="sans-serif" font-size="12" font-weight="bold" fill="#ffffff" text-anchor="middle">✓</text>
    <text x="40" y="4" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="16" font-weight="700" fill="#ffffff">Verifikasi Berkas Berjenjang oleh Admin 27 Kabupaten/Kota</text>
  </g>

  <g transform="translate(220, 540)">
    <circle cx="15" cy="0" r="12" fill="#10b981"/>
    <text x="15" y="4" font-family="sans-serif" font-size="12" font-weight="bold" fill="#ffffff" text-anchor="middle">✓</text>
    <text x="40" y="4" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="16" font-weight="700" fill="#ffffff">Penerbitan Kredensial &amp; ID Card Resmi PSKS Terdaftar</text>
  </g>

  <!-- Footer Subtext -->
  <text x="600" y="635" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="14" font-weight="600" text-anchor="middle" fill="#fef08a">✨ Klik tombol Info di bawah untuk membaca petunjuk teknis selengkapnya</text>
</svg>
`);

export const DEFAULT_ANNOUNCEMENT_CONFIG: AnnouncementConfig = {
  id: 'announcement_global_v1',
  active: true,
  title: 'Pemberitahuan Pendataan & Verifikasi PSKS Jawa Barat 2026',
  subtitle: 'Sosialisasi Pemutakhiran Data 10 Pilar Kesejahteraan Sosial 27 Kabupaten/Kota',
  photoUrl: DEFAULT_ANNOUNCEMENT_PHOTO,
  photoStorageSizeKb: 4,
  actionType: 'content',
  content: `DINAS SOSIAL PROVINSI JAWA BARAT
Pemberitahuan Resmi Terkait Penataan & Verifikasi Data 10 Pilar Kesejahteraan Sosial

Kepada Yth.
1. Seluruh Admin Wilayah Dinas Sosial 27 Kabupaten/Kota se-Jawa Barat
2. Seluruh Pengurus & Anggota 10 Pilar Kesejahteraan Sosial (PEKSOS, PSM, TAGANA, LKS, KARANG TARUNA, LK3, PENSOS, TKSK, BADAN USAHA, SLRT/PUSKESOS)
3. Masyarakat Umum & Mitra Kesejahteraan Sosial

Dengan ini kami sampaikan bahwa Dinas Sosial Provinsi Jawa Barat resmi memberlakukan sistem informasi terintegrasi PSKS JABAR untuk mempercepat proses pendataan mandiri, verifikasi usulan pendaftaran, dan pemantauan distribusi personil di seluruh wilayah Jawa Barat.

POIN PENTING SOSIALISASI:
1. Pendaftaran Baru: Masyarakat dan anggota pilar dapat mengajukan pendaftaran secara mandiri melalui menu 'Terima Pendaftaran 10 Pilar' pada wilayah masing-masing.
2. Verifikasi Berjenjang: Setiap usulan akan diverifikasi langsung oleh Admin Wilayah setempat dan disinkronkan secara real-time ke Otoritas Pusat Dinas Sosial Provinsi.
3. Kredensial Resmi: Seluruh pengurus terdaftar berhak mendapatkan pengesahan NIK, Nomor Sertifikasi/SK, dan status keaktifan yang sah dan terlindungi.
4. Call Center & Bantuan: Apabila terdapat kendala teknis atau permohonan pendampingan, silakan hubungi Layanan Pengaduan Resmi Dinsos Jabar via WhatsApp Floating Widget.

Mari bersama-sama wujudkan tata kelola kesejahteraan sosial Jawa Barat yang transparan, akuntabel, dan berkeadilan.

Bandung, Agustus 2026
Kepala Dinas Sosial Provinsi Jawa Barat
Dinas Sosial Provinsi Jawa Barat`,
  linkUrl: 'https://dinsos.jabarprov.go.id',
  publishedAt: '22 Agustus 2026',
  publishedBy: 'Superadmin Otoritas Pusat & Tim Pengembang Sistem',
  updatedAt: Date.now(),
  targetUserWilayah: createDefaultWilayahSwitches(true),
  targetAdminWilayah: createDefaultWilayahSwitches(true),
  targetSuperadmin: true,
  targetDeveloper: true,
  displayDurationSeconds: 15,
  frameColor: '#ffffff',
  frameBorderColor: '#e2e8f0',
  frameTheme: 'white',
};
