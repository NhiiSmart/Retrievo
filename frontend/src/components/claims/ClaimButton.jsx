import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useClaims } from '../../hooks/useClaims';
import { validateClaim } from '../../utils/validators';

export const ClaimButton = ({ itemId, onClaimSubmit }) => {
  const { isAuthenticated } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { submitClaim, loading } = useClaims();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateClaim(message);
    if (Object.keys(errors).length > 0) {
      setError(errors.message);
      return;
    }

    try {
      await submitClaim(itemId, message);
      setShowModal(false);
      setMessage('');
      setError('');
      if (onClaimSubmit) onClaimSubmit();
    } catch (err) {
      // Error handled in hook
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
        <p className="text-gray-600">Please login to submit a claim</p>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="btn-primary w-full"
      >
        I found this item! Claim it
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Submit Claim</h2>
            <p className="text-sm text-gray-600 mb-4">
              Please provide details to verify this item belongs to you.
            </p>
            <form onSubmit={handleSubmit}>
              <textarea
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  setError('');
                }}
                placeholder="Describe why this item belongs to you..."
                className={`input-field min-h-[100px] ${error ? 'border-danger' : ''}`}
              />
              {error && <p className="text-sm text-danger mt-1">{error}</p>}
              <div className="flex gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setMessage('');
                    setError('');
                  }}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 btn-primary disabled:opacity-50"
                >
                  {loading ? 'Submitting...' : 'Submit Claim'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
