import { useState } from 'react';
import toast from 'react-hot-toast';
import { claimService } from '../services/claimService';

export const useClaims = () => {
  const [loading, setLoading] = useState(false);
  const [claims, setClaims] = useState([]);

  const fetchItemClaims = async (itemId) => {
    setLoading(true);
    try {
      const { data } = await claimService.getItemClaims(itemId);
      setClaims(data);
      return data;
    } catch (err) {
      toast.error('Failed to fetch claims');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const submitClaim = async (itemId, message) => {
    setLoading(true);
    try {
      const { data } = await claimService.submit(itemId, message);
      toast.success('Claim submitted successfully!');
      return data;
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit claim');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const approveClaim = async (claimId) => {
    setLoading(true);
    try {
      const { data } = await claimService.approve(claimId);
      toast.success('Claim approved! Item marked as resolved.');
      return data;
    } catch (err) {
      toast.error('Failed to approve claim');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const rejectClaim = async (claimId) => {
    setLoading(true);
    try {
      const { data } = await claimService.reject(claimId);
      toast.success('Claim rejected');
      return data;
    } catch (err) {
      toast.error('Failed to reject claim');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    claims,
    loading,
    fetchItemClaims,
    submitClaim,
    approveClaim,
    rejectClaim,
  };
};
