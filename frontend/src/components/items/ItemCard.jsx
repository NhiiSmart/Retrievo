import { Link } from 'react-router-dom';
import { formatRelativeTime } from '../../utils/helpers';
import { STATUS_COLORS } from '../../utils/constants';

export const ItemCard = ({ item }) => {
  const fallbackImage = 'https://via.placeholder.com/300x200?text=No+Image';

  return (
    <Link to={`/item/${item.id}`} className="block">
      <div className="card group">
        <div className="relative h-48 overflow-hidden bg-gray-200">
          <img
            src={item.image_url || fallbackImage}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.target.src = fallbackImage;
            }}
          />
          <span
            className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[item.status]}`}
          >
            {item.status === 'lost' ? '🔴 Lost' : item.status === 'found' ? '🟢 Found' : '✅ Resolved'}
          </span>
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-lg text-gray-900 truncate">
            {item.title}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Category: {item.category}
          </p>
          <p className="text-sm text-gray-600">
            📍 {item.location}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            {formatRelativeTime(item.created_at)}
          </p>
        </div>
      </div>
    </Link>
  );
};
