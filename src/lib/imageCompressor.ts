/**
 * Client-Side Image Compression Utility using HTML5 Canvas API
 * Mengompresi foto berkas pendaftaran (KTP/Surat Tugas/Dokumen) secara instan di browser
 * Mengurangi ukuran file dari 3-8 MB menjadi ~50-100 KB sehingga:
 * 1. Tidak membebani kuota penyimpanan Firestore
 * 2. Upload instan dan lancar
 * 3. Kualitas teks dokumen/foto KTP tetap tajam dan terbaca jelas
 */

export interface CompressionResult {
  dataUrl: string;
  name: string;
  originalSizeKb: number;
  compressedSizeKb: number;
  savedPercent: number;
  width: number;
  height: number;
}

export async function compressBerkasImage(
  file: File,
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.75
): Promise<CompressionResult> {
  return new Promise((resolve, reject) => {
    // Basic validation
    if (!file.type.startsWith('image/')) {
      return reject(new Error('File yang diunggah harus berupa gambar (JPG, PNG, atau WebP).'));
    }

    const originalSizeKb = Math.round(file.size / 1024);
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;

        // Maintain aspect ratio while bounding inside maxWidth / maxHeight
        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          return reject(new Error('Canvas context tidak didukung di perangkat ini.'));
        }

        // Fill background with white in case of transparent PNG
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);

        // Draw image onto canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Export as JPEG with targeted quality for high readability & ultra low size
        const dataUrl = canvas.toDataURL('image/jpeg', quality);

        // Calculate approximate compressed size in KB
        const head = 'data:image/jpeg;base64,';
        const rawLength = dataUrl.length - head.length;
        const compressedSizeBytes = Math.round((rawLength * 3) / 4);
        const compressedSizeKb = Math.max(1, Math.round(compressedSizeBytes / 1024));

        const savedPercent =
          originalSizeKb > 0
            ? Math.max(0, Math.round(((originalSizeKb - compressedSizeKb) / originalSizeKb) * 100))
            : 0;

        resolve({
          dataUrl,
          name: file.name,
          originalSizeKb,
          compressedSizeKb,
          savedPercent,
          width,
          height,
        });
      };

      img.onerror = () => {
        reject(new Error('Gagal memproses gambar. Pastikan file gambar tidak korup.'));
      };

      img.src = event.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Gagal membaca file dari penyimpanan lokal.'));
    };

    reader.readAsDataURL(file);
  });
}
