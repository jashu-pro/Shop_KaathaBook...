/* features/customers/hooks/useCustomers.ts */
import { useState, useEffect, useCallback } from 'react';
import type { Customer, CreateCustomerDTO, UpdateCustomerDTO } from '../types';
import { RepositoryFactory } from '../../../repositories/RepositoryFactory';
import { useAuthStore } from '../../../stores/authStore';
import { EventBus } from '../../../services/EventBus';

export const useCustomers = () => {
  const { shop } = useAuthStore();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const customerRepo = RepositoryFactory.getCustomerRepository();

  const loadCustomers = useCallback(async () => {
    if (!shop?.id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await customerRepo.getCustomersByShop(shop.id);
      setCustomers(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load customer directory');
    } finally {
      setIsLoading(false);
    }
  }, [shop?.id]);

  useEffect(() => {
    // Purge legacy sample customers from browser localStorage if present
    const raw = localStorage.getItem('db_customers');
    if (raw && (raw.includes('Ramesh Kumar') || raw.includes('Lakshmi Devi') || raw.includes('Suresh Reddy'))) {
      localStorage.removeItem('db_customers');
    }
    loadCustomers();

    const unsubCust = EventBus.subscribe('customers:changed', () => loadCustomers());
    const unsubSync = EventBus.subscribe('data:sync', () => loadCustomers());
    return () => {
      unsubCust();
      unsubSync();
    };
  }, [loadCustomers]);

  const addCustomer = async (data: CreateCustomerDTO): Promise<Customer> => {
    if (!shop?.id) throw new Error('Shop identifier missing');
    const newCust = await customerRepo.createCustomer(shop.id, data);
    setCustomers((prev) => [newCust, ...prev]);
    EventBus.publish('customers:changed', newCust);
    return newCust;
  };

  const editCustomer = async (id: string, updates: UpdateCustomerDTO): Promise<Customer> => {
    const updated = await customerRepo.updateCustomer(id, updates);
    setCustomers((prev) => prev.map((c) => (c.id === id ? updated : c)));
    EventBus.publish('customers:changed', updated);
    return updated;
  };

  const removeCustomer = async (id: string): Promise<boolean> => {
    const success = await customerRepo.deleteCustomer(id);
    if (success) {
      setCustomers((prev) => prev.filter((c) => c.id !== id));
      EventBus.publish('customers:changed');
    }
    return success;
  };

  const checkDuplicatePhone = async (phone: string): Promise<Customer | null> => {
    if (!shop?.id || !phone) return null;
    return await customerRepo.findDuplicateByPhone(shop.id, phone);
  };

  return {
    customers,
    isLoading,
    error,
    refetch: loadCustomers,
    addCustomer,
    editCustomer,
    removeCustomer,
    checkDuplicatePhone,
  };
};
