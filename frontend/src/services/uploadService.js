import api from '../api/client';

export const uploadService = {
  getPresignedUrl: (filename, filetype) => 
    api.get('/uploads/presigned', { 
      params: { filename, filetype } 
    }),
};
