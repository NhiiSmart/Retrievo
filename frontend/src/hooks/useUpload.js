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

      // Handle both raw response or Axios-wrapped response
      const response = await uploadService.getPresignedUrl(
        compressedFile.name,
        compressedFile.type
      );
      const data = response.data || response;

      // Direct PUT request to S3 using the presigned URL
      const uploadResponse = await fetch(data.url, {
        method: 'PUT',
        body: compressedFile,
        headers: {
          'Content-Type': compressedFile.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Upload to S3 failed');
      }

      // Format clean, full HTTPS URL for the web browser
      let imageUrl = data.imageUrl || data.publicUrl;
      
      if (!imageUrl) {
        const cleanKey = data.key.startsWith('/') ? data.key.slice(1) : data.key;
        imageUrl = `https://${data.bucket || 'retrievo-item-photo'}.s3.amazonaws.com/${cleanKey}`;
      }

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
