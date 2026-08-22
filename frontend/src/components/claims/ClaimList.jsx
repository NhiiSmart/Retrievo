import { useEffect } from 'react';
import { useClaims } from '../../hooks/useClaims';
import { formatRelativeTime } from '../../utils/helpers';
import { STATUS_COLORS } from '../../utils/constants';

export const ClaimList = ({ itemId, isOwner, onClaimUpdate }) => {
  const { claims, loading, fetchItemClaims, approveClaim, rejectClaim } = useClaims();

  useEffect(() => {
    if (itemId) {
      fetchItemClaims(itemId);
    }
  }, [itemId]);

  const handleApprove = async (claimId) => {
    if (window.confirm('Approve this claim? This will mark the item as resolved.')) {
      try {
        await approveClaim(claimId);
        await fetchItemClaims(itemId);
        if (onClaimUpdate) onClaimUpdate();
      } catch (err) {
        // Error handled in hook
      }
    }
  };

  const handleReject = async (claimId) => {
    if (window.confirm('Reject this claim?')) {
      try {
        await rejectClaim(claimId);
        await fetchItemClaims(itemId);
      } catch (err) {
        // Error handled in hook
      }
    }
  };

  if (loading) {
    return <div className="text-gray-500">Loading claims...</div>;
  }

  if (!claims || claims.length === 0) {
    return <div className="text-gray-500">No claims submitted yet</div>;
  }

  return (
    <div className="space-y-4">
      {claims.map((claim) => (
        <div
          key={claim.id}
          className="border border-gray-200 rounded-lg p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="font-medium">{claim.claimant_name || `User #${claim.claimant_id}`}</p>
              <p className="text-xs text-gray-500">
                {formatRelativeTime(claim.created_at)}
              </p>
            </div>
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[claim.status]}`}
            >
              {claim.status}
            </span>
          </div>
          <p className="text-sm text-gray-700">{claim.message}</p>
          {isOwner && claim.status === 'pending' && (
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => handleApprove(claim.id)}
                className="btn-primary text-sm px-3 py-1"
              >
                Approve
              </button>
              <button
                onClick={() => handleReject(claim.id)}
                className="btn-danger text-sm px-3 py-1"
              >
                Reject
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
