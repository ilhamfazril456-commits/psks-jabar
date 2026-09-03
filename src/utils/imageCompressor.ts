/**
 * Image Compression Utility for Firebase Firestore Document Storage
 * Compresses images client-side via HTML5 Canvas to keep base64 storage ultra-compact (< 70 KB).
 */

export interface CompressionResult {
  base64: string;
  sizeKb: number;
  originalSizeKb: number;
  width: number;
  height: number;
}

export async function compressImage(
  file: File,
  maxWidth = 1000,
  maxHeight = 800,
  quality = 0.72
): Promise<CompressionResult> {
  return new Promise((resolve, reject) => {
    const originalSizeKb = Math.round(file.size / 1024);
    const reader = new FileReader();

    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;

        // Calculate scaled dimensions keeping aspect ratio
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        // Draw and compress image
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Export as JPEG for high compression ratio
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        const head = 'data:image/jpeg;base64,';
        const rawLength = compressedBase64.length - head.length;
        const sizeInBytes = Math.round((rawLength * 3) / 4);
        const sizeKb = Math.round(sizeInBytes / 1024);

        resolve({
          base64: compressedBase64,
          sizeKb,
          originalSizeKb,
          width,
          height,
        });
      };

      img.onerror = () => reject(new Error('Gagal memproses file gambar'));
      img.src = readerEvent.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Gagal membaca file gambar'));
    reader.readAsDataURL(file);
  });
}
