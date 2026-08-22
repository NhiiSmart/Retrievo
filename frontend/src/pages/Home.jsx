import { useState, useEffect } from 'react';
import { useItems } from '../hooks/useItems';
import { ItemList } from '../components/items/ItemList';
import { ItemFilters } from '../components/items/ItemFilters';

export const Home = () => {
  const { items, loading, fetchItems } = useItems();
  const [filters, setFilters] = useState({});

  useEffect(() => {
    fetchItems(filters);
  }, [filters]);

  const handleSearch = (searchData) => {
    setFilters(prev => ({ ...prev, ...searchData }));
  };

  const handleFilter = (filterData) => {
    setFilters(prev => ({ ...prev, ...filterData }));
  };

  return (
    <div>
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          RETRIEVO
        </h1>
        <p className="text-gray-600">
          Find lost items or help others find theirs
        </p>
      </div>

      <ItemFilters
        onSearch={handleSearch}
        onFilter={handleFilter}
        initialFilters={filters}
      />

      <ItemList items={items} loading={loading} />
    </div>
  );
};
