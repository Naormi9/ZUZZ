'use client';

import { Camera, ImagePlus } from 'lucide-react';
import { Button } from '@zuzz/ui';
import { isCapacitorNative, pickPhotos, takePhoto, capturedPhotoToFile } from '@/lib/mobile';
import type { CapturedPhoto } from '@/lib/mobile';
import { useState } from 'react';

interface CameraUploadButtonProps {
  /** Called with selected File objects ready for upload */
  onFilesSelected: (files: File[]) => void;
  /** Maximum number of photos to pick */
  maxPhotos?: number;
  /** Show camera option (vs gallery only) */
  showCamera?: boolean;
  className?: string;
  disabled?: boolean;
}

/**
 * Native camera/photo picker button for listing image uploads.
 *
 * On native: shows native photo picker or camera.
 * On web: renders nothing (existing file input handles web uploads).
 */
export function CameraUploadButton({
  onFilesSelected,
  maxPhotos = 10,
  showCamera = true,
  className,
  disabled,
}: CameraUploadButtonProps) {
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  // Only render on native
  if (typeof window !== 'undefined' && !isCapacitorNative()) {
    return null;
  }

  const handlePickPhotos = async () => {
    if (isPickerOpen) return;
    setIsPickerOpen(true);
    try {
      const photos = await pickPhotos(maxPhotos);
      if (photos.length > 0) {
        const files = photos.map(capturedPhotoToFile);
        onFilesSelected(files);
      }
    } finally {
      setIsPickerOpen(false);
    }
  };

  const handleTakePhoto = async () => {
    if (isPickerOpen) return;
    setIsPickerOpen(true);
    try {
      const photo = await takePhoto();
      if (photo) {
        const file = capturedPhotoToFile(photo);
        onFilesSelected([file]);
      }
    } finally {
      setIsPickerOpen(false);
    }
  };

  return (
    <div className={`flex gap-2 ${className ?? ''}`}>
      <Button
        type="button"
        variant="outline"
        onClick={handlePickPhotos}
        disabled={disabled || isPickerOpen}
        className="flex-1 gap-2"
      >
        <ImagePlus className="h-4 w-4" />
        <span>בחר תמונות</span>
      </Button>
      {showCamera && (
        <Button
          type="button"
          variant="outline"
          onClick={handleTakePhoto}
          disabled={disabled || isPickerOpen}
          className="flex-1 gap-2"
        >
          <Camera className="h-4 w-4" />
          <span>צלם תמונה</span>
        </Button>
      )}
    </div>
  );
}
