import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useItems } from '../hooks/useItems';
import { ItemList } from '../components/items/ItemList';

export const Dashboard = () => {
  const { user } = useAuth();
  const { items, loading, fetchItems } = useItems();

  useEffect(() => {
    fetchItems({ userId: user?.id });
  }, [user]);

  const myItems = items || [];
  const totalItems = myItems.length;
  const pendingClaims = myItems.reduce((sum, item) => {
    return sum + (item.claims?.filter(c => c.status === 'pending').length || 0);
  }, 0);
  const resolvedItems = myItems.filter(item => item.status === 'resolved').length;

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome, {user?.name}!
        </h1>
        <Link to="/post-item" className="btn-primary mt-4 md:mt-0">
          + Post New Item
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow-md">
          <p className="text-sm text-gray-500">Total Items</p>
          <p className="text-2xl font-bold text-primary">{totalItems}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <p className="text-sm text-gray-500">Pending Claims</p>
          <p className="text-2xl font-bold text-yellow-600">{pendingClaims}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <p className="text-sm text-gray-500">Resolved Items</p>
          <p className="text-2xl font-bold text-green-600">{resolvedItems}</p>
        </div>
      </div>

      <h2 className="text-xl font-semibold text-gray-900 mb-4">My Items</h2>
      <ItemList items={myItems} loading={loading} />
    </div>
  );
};
