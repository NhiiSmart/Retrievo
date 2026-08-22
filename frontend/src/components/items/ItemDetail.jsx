import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { formatDate, formatRelativeTime } from '../../utils/helpers';
import { STATUS_COLORS } from '../../utils/constants';
import { ClaimList } from '../claims/ClaimList';
import { ClaimButton } from '../claims/ClaimButton';

export const ItemDetail = ({ item, onUpdate }) => {
  const { user } = useAuth();
  const fallbackImage = 'https://via.placeholder.com/600x400?text=No+Image';

  const isOwner = user?.id === item?.user_id;
  const isResolved = item?.status === 'resolved';

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="relative h-96 bg-gray-200">
        <img
          src={item?.image_url || fallbackImage}
          alt={item?.title}
          className="w-full h-full object-contain"
          onError={(e) => {
            e.target.src = fallbackImage;
          }}
        />
      </div>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-900">{item?.title}</h1>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[item?.status]}`}
          >
            {item?.status === 'lost' ? '🔴 Lost' : item?.status === 'found' ? '🟢 Found' : '✅ Resolved'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-sm text-gray-500">Category</p>
            <p className="font-medium">{item?.category}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Location</p>
            <p className="font-medium">📍 {item?.location}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Date</p>
            <p className="font-medium">{formatDate(item?.date_lost_found)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Posted</p>
            <p className="font-medium">{formatRelativeTime(item?.created_at)}</p>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-sm text-gray-500">Description</p>
          <p className="mt-1 text-gray-800 whitespace-pre-wrap">{item?.description}</p>
        </div>

        {isResolved && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-green-800 font-medium">✅ This item has been resolved</p>
            <p className="text-sm text-green-600 mt-1">
              Claim approved and item returned to owner
            </p>
          </div>
        )}

        {!isOwner && !isResolved && (
          <div className="mb-6">
            <ClaimButton itemId={item?.id} onClaimSubmit={onUpdate} />
          </div>
        )}

        {isOwner && (
          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-xl font-semibold mb-4">Claims</h2>
            <ClaimList
              itemId={item?.id}
              isOwner={isOwner}
              onClaimUpdate={onUpdate}
            />
          </div>
        )}
      </div>
    </div>
  );
};
