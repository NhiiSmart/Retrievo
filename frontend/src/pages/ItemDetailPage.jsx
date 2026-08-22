import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useItems } from '../hooks/useItems';
import { ItemDetail } from '../components/items/ItemDetail';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const ItemDetailPage = () => {
  const { id } = useParams();
  const { fetchItem, loading } = useItems();
  const [item, setItem] = useState(null);
  const [error, setError] = useState(null);

  const loadItem = async () => {
    try {
      const data = await fetchItem(id);
      if (data) {
        setItem(data);
      } else {
        setError('Item not found');
      }
    } catch (err) {
      setError('Failed to load item');
    }
  };

  useEffect(() => {
    loadItem();
  }, [id]);

  if (loading) {
    return <LoadingSpinner size="lg" />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 text-lg">{error}</p>
        <Link to="/" className="text-primary hover:underline mt-4 inline-block">
          Return to Home
        </Link>
      </div>
    );
  }

  if (!item) {
    return null;
  }

  return <ItemDetail item={item} onUpdate={loadItem} />;
};
