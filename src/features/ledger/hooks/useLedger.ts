/* features/ledger/hooks/useLedger.ts */
import { useState, useEffect, useCallback } from 'react';
import type { LedgerEntry, CreateLedgerEntryDTO } from '../types';
import { RepositoryFactory } from '../../../repositories/RepositoryFactory';
import { useAuthStore } from '../../../stores/authStore';
import { EventBus } from '../../../services/EventBus';

export const useLedger = (customerId?: string, startDate?: string, endDate?: string) => {
  const { shop } = useAuthStore();
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const ledgerRepo = RepositoryFactory.getLedgerRepository();

  const loadLedger = useCallback(async () => {
    if (!shop?.id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await ledgerRepo.listLedgerEntries(shop.id, customerId, startDate, endDate);
      setEntries(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load ledger notebook');
    } finally {
      setIsLoading(false);
    }
  }, [shop?.id, customerId, startDate, endDate]);

  useEffect(() => {
    loadLedger();
    const unsubLedger = EventBus.subscribe('ledger:changed', () => loadLedger());
    const unsubSync = EventBus.subscribe('data:sync', () => loadLedger());
    return () => {
      unsubLedger();
      unsubSync();
    };
  }, [loadLedger]);

  const createEntry = async (dto: CreateLedgerEntryDTO): Promise<LedgerEntry> => {
    if (!shop?.id) throw new Error('Shop identifier missing');
    const created = await ledgerRepo.createLedgerEntry(shop.id, dto);
    setEntries((prev) => [created, ...prev]);
    EventBus.publish('ledger:changed', created);
    EventBus.publish('customers:changed');
    return created;
  };

  const removeEntry = async (id: string): Promise<void> => {
    await ledgerRepo.deleteLedgerEntry(id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
    EventBus.publish('ledger:changed');
    EventBus.publish('customers:changed');
  };

  return {
    entries,
    isLoading,
    error,
    refetch: loadLedger,
    createEntry,
    removeEntry,
  };
};
