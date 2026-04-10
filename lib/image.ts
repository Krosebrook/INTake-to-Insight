/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Generates a small thumbnail from a base64 image string (SVG or Raster).
 */
export async function generateThumbnail(base64: string, maxWidth = 400, maxHeight = 225): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Maintain aspect ratio
      const ratio = Math.min(maxWidth / width, maxHeight / height);
      width *= ratio;
      height *= ratio;

      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      // Draw white background (especially for transparent SVGs)
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      
      ctx.drawImage(img, 0, 0, width, height);
      
      // Use JPEG for smaller size, 0.7 quality is usually enough for thumbnails
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };

    img.onerror = (err) => {
      console.error("Thumbnail generation error:", err);
      reject(new Error('Failed to load image for thumbnail generation'));
    };

    img.src = base64;
  });
}
