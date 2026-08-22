export const CATEGORIES = [
  'Electronics',
  'Clothing',
  'Books',
  'Documents',
  'Keys',
  'Pets',
  'Other'
];

export const ITEM_STATUSES = {
  LOST: 'lost',
  FOUND: 'found',
  RESOLVED: 'resolved'
};

export const CLAIM_STATUSES = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
};

export const STATUS_COLORS = {
  lost: 'bg-red-100 text-red-800',
  found: 'bg-green-100 text-green-800',
  resolved: 'bg-gray-100 text-gray-800',
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800'
};
