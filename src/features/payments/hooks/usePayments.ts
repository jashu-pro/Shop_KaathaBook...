/* features/payments/hooks/usePayments.ts */
import { useState, useEffect, useCallback } from 'react';
import type { Payment, CreatePaymentDTO } from '../types';
import { RepositoryFactory } from '../../../repositories/RepositoryFactory';
import { useAuthStore } from '../../../stores/authStore';
import { EventBus } from '../../../services/EventBus';

export const usePayments = () => {
  const { shop } = useAuthStore();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const paymentRepo = RepositoryFactory.getPaymentRepository();

  const loadPayments = useCallback(async () => {
    if (!shop?.id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await paymentRepo.listPayments(shop.id);
      setPayments(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load payments history');
    } finally {
      setIsLoading(false);
    }
  }, [shop?.id]);

  useEffect(() => {
    loadPayments();
    const unsubPay = EventBus.subscribe('payments:changed', () => loadPayments());
    const unsubSync = EventBus.subscribe('data:sync', () => loadPayments());
    return () => {
      unsubPay();
      unsubSync();
    };
  }, [loadPayments]);

  const createPayment = async (dto: CreatePaymentDTO): Promise<Payment> => {
    if (!shop?.id) throw new Error('Shop identifier missing');
    const created = await paymentRepo.createPayment(shop.id, dto);
    setPayments((prev) => [created, ...prev]);
    EventBus.publish('payments:changed', created);
    EventBus.publish('ledger:changed');
    EventBus.publish('customers:changed');
    return created;
  };

  const removePayment = async (id: string): Promise<void> => {
    await paymentRepo.deletePayment(id);
    setPayments((prev) => prev.filter((p) => p.id !== id));
    EventBus.publish('payments:changed');
    EventBus.publish('ledger:changed');
    EventBus.publish('customers:changed');
  };

  return {
    payments,
    isLoading,
    error,
    refetch: loadPayments,
    createPayment,
    removePayment,
  };
};
