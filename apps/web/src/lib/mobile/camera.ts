/**
 * Camera and photo picker for listing uploads.
 *
 * On native (Capacitor), uses the Camera plugin for native photo picker / camera.
 * On web, falls back to standard file input (no-op, handled by existing upload UI).
 */

import { isCapacitorNative } from './capacitor';

export interface CapturedPhoto {
  /** Base64-encoded image data (without prefix) */
  base64: string;
  /** MIME type */
  mimeType: string;
  /** File name */
  fileName: string;
}

/**
 * Pick photos from device gallery using native picker.
 * Returns array of captured photos as base64.
 * On web, returns empty array (web uses file input instead).
 */
export async function pickPhotos(limit: number = 10): Promise<CapturedPhoto[]> {
  if (!isCapacitorNative()) return [];

  const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');

  try {
    const result = await Camera.pickImages({
      quality: 85,
      limit,
    });

    const photos: CapturedPhoto[] = [];
    for (const photo of result.photos) {
      if (photo.webPath) {
        // Fetch the blob from the webPath and convert to base64
        const response = await fetch(photo.webPath);
        const blob = await response.blob();
        const base64 = await blobToBase64(blob);
        photos.push({
          base64,
          mimeType: blob.type || 'image/jpeg',
          fileName: `photo_${Date.now()}_${photos.length}.${getExtension(blob.type)}`,
        });
      }
    }
    return photos;
  } catch (error: any) {
    // User cancelled or permission denied
    if (error?.message?.includes('User cancelled') || error?.message?.includes('cancelled')) {
      return [];
    }
    throw error;
  }
}

/**
 * Take a photo using device camera.
 * Returns the captured photo or null if cancelled.
 */
export async function takePhoto(): Promise<CapturedPhoto | null> {
  if (!isCapacitorNative()) return null;

  const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');

  try {
    const photo = await Camera.getPhoto({
      quality: 85,
      resultType: CameraResultType.Base64,
      source: CameraSource.Camera,
      allowEditing: false,
      saveToGallery: false,
    });

    if (!photo.base64String) return null;

    return {
      base64: photo.base64String,
      mimeType: `image/${photo.format || 'jpeg'}`,
      fileName: `camera_${Date.now()}.${photo.format || 'jpeg'}`,
    };
  } catch (error: any) {
    if (error?.message?.includes('User cancelled') || error?.message?.includes('cancelled')) {
      return null;
    }
    throw error;
  }
}

/**
 * Convert a CapturedPhoto to a File object for FormData upload.
 */
export function capturedPhotoToFile(photo: CapturedPhoto): File {
  const byteCharacters = atob(photo.base64);
  const byteArray = new Uint8Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteArray[i] = byteCharacters.charCodeAt(i);
  }

  const blob = new Blob([byteArray.buffer as ArrayBuffer], { type: photo.mimeType });
  return new File([blob], photo.fileName, { type: photo.mimeType });
}

// Helpers

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Remove the data:...;base64, prefix
      const base64 = result.split(',')[1] || result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function getExtension(mimeType: string): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/heic': 'heic',
    'image/heif': 'heif',
  };
  return map[mimeType] || 'jpg';
}
