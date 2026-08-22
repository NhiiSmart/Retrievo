import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { itemService } from '../services/itemService';

export const useItems = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchItems = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await itemService.getAll(filters);
      setItems(data);
      return data;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch items');
      toast.error('Failed to fetch items');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchItem = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await itemService.getById(id);
      return data;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch item');
      toast.error('Failed to fetch item');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createItem = useCallback(async (itemData) => {
    setLoading(true);
    try {
      const { data } = await itemService.create(itemData);
      toast.success('Item posted successfully!');
      return data;
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create item');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateItem = useCallback(async (id, itemData) => {
    setLoading(true);
    try {
      const { data } = await itemService.update(id, itemData);
      toast.success('Item updated successfully!');
      return data;
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update item');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteItem = useCallback(async (id) => {
    setLoading(true);
    try {
      await itemService.delete(id);
      toast.success('Item deleted successfully!');
      setItems(prev => prev.filter(item => item.id !== id));
      return true;
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete item');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    items,
    loading,
    error,
    fetchItems,
    fetchItem,
    createItem,
    updateItem,
    deleteItem,
  };
};
