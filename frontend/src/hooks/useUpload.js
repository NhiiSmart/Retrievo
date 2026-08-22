import { useState } from 'react';
import toast from 'react-hot-toast';
import imageCompression from 'browser-image-compression';
import { uploadService } from '../services/uploadService';

export const useUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const compressImage = async (file) => {
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1024,
      useWebWorker: true,
    };
    try {
      return await imageCompression(file, options);
    } catch (error) {
      console.error('Image compression failed:', error);
      return file;
    }
  };

  const uploadToS3 = async (file) => {
    setUploading(true);
    setProgress(0);
    try {
      const compressedFile = await compressImage(file);

      const { data } = await uploadService.getPresignedUrl(
        compressedFile.name,
        compressedFile.type
      );

      const uploadResponse = await fetch(data.url, {
        method: 'PUT',
        body: compressedFile,
        headers: {
          'Content-Type': compressedFile.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Upload failed');
      }

      const imageUrl = `${data.bucket}/${data.key}`;
      toast.success('Image uploaded successfully!');
      return imageUrl;
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Failed to upload image');
      throw error;
    } finally {
      setUploading(false);
      setProgress(100);
    }
  };

  return {
    uploading,
    progress,
    uploadToS3,
  };
};
