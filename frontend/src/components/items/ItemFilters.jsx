import { useState } from 'react';
import { CATEGORIES } from '../../utils/constants';

export const ItemFilters = ({ onSearch, onFilter, initialFilters = {} }) => {
  const [searchTerm, setSearchTerm] = useState(initialFilters.search || '');
  const [category, setCategory] = useState(initialFilters.category || '');
  const [status, setStatus] = useState(initialFilters.status || '');
  const [debounceTimer, setDebounceTimer] = useState(null);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (debounceTimer) clearTimeout(debounceTimer);
    const timer = setTimeout(() => {
      onSearch({ search: value });
    }, 500);
    setDebounceTimer(timer);
  };

  const handleCategoryChange = (e) => {
    const value = e.target.value;
    setCategory(value);
    onFilter({ category: value });
  };

  const handleStatusChange = (e) => {
    const value = e.target.value;
    setStatus(value);
    onFilter({ status: value });
  };

  const handleReset = () => {
    setSearchTerm('');
    setCategory('');
    setStatus('');
    onSearch({ search: '' });
    onFilter({ category: '', status: '' });
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md mb-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by title or description..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="input-field"
          />
        </div>
        <div className="flex gap-2 md:w-48">
          <select
            value={category}
            onChange={handleCategoryChange}
            className="input-field"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2 md:w-40">
          <select
            value={status}
            onChange={handleStatusChange}
            className="input-field"
          >
            <option value="">All Status</option>
            <option value="lost">Lost</option>
            <option value="found">Found</option>
          </select>
        </div>
        <button
          onClick={handleReset}
          className="btn-secondary whitespace-nowrap"
        >
          Reset Filters
        </button>
      </div>
    </div>
  );
};
