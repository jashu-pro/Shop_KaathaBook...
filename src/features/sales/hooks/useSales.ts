/* features/sales/hooks/useSales.ts */
import { useState, useEffect, useCallback } from 'react';
import type { Sale, CreateSaleDTO } from '../types';
import { RepositoryFactory } from '../../../repositories/RepositoryFactory';
import { useAuthStore } from '../../../stores/authStore';
import { EventBus } from '../../../services/EventBus';

import { useWorkerStore } from '../../staff/stores/workerStore';
import { isSupabaseConfigured } from '../../../config/supabase';

export const useSales = () => {
  const { shop } = useAuthStore();
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [saleRepo] = useState(() => RepositoryFactory.getSaleRepository());

  const shopId = shop?.id;

  const loadSales = useCallback(async () => {
    if (!shopId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await saleRepo.listSales(shopId);
      setSales(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load sales directory');
    } finally {
      setIsLoading(false);
    }
  }, [shopId, saleRepo]);

  useEffect(() => {
    loadSales();
    const unsubSales = EventBus.subscribe('sales:changed', () => loadSales());
    const unsubSync = EventBus.subscribe('data:sync', () => loadSales());
    return () => {
      unsubSales();
      unsubSync();
    };
  }, [loadSales]);

  const createSale = async (dto: CreateSaleDTO): Promise<Sale> => {
    if (!shop?.id) throw new Error('Shop identifier missing');
    const created = await saleRepo.createSale(shop.id, dto);
    setSales((prev) => [created, ...prev]);
    EventBus.publish('sales:changed', created);
    EventBus.publish('ledger:changed');
    EventBus.publish('customers:changed');

    // With Supabase, record_sale writes the activity entry itself.
    if (!isSupabaseConfigured()) {
      try {
        await useWorkerStore.getState().recordWorkerActivity(
          shop.id,
          `Created Sale (${dto.items.length} items)`,
          'sale',
          dto.totalAmount
        );
      } catch {
        // Non-blocking
      }
    }

    return created;
  };

  const getSaleById = async (id: string): Promise<Sale | null> => {
    return await saleRepo.getSaleById(id);
  };

  const removeSale = async (id: string): Promise<void> => {
    await saleRepo.deleteSale(id);
    setSales((prev) => prev.filter((s) => s.id !== id));
    EventBus.publish('sales:changed');
    EventBus.publish('ledger:changed');
    EventBus.publish('customers:changed');
  };

  return {
    sales,
    isLoading,
    error,
    refetch: loadSales,
    createSale,
    getSaleById,
    removeSale,
  };
};
