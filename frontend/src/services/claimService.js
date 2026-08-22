import api from '../api/client';

export const claimService = {
  submit: (itemId, message) => api.post('/claims', { itemId, message }),
  approve: (claimId) => api.put(`/claims/${claimId}/approve`),
  reject: (claimId) => api.put(`/claims/${claimId}/reject`),
  getItemClaims: (itemId) => api.get(`/claims/item/${itemId}`),
};
