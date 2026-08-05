/* features/payments/hooks/usePayments.ts */
import { useState, useEffect, useCallback } from 'react';
import type { Payment, CreatePaymentDTO } from '../types';
import { RepositoryFactory } from '../../../repositories/RepositoryFactory';
import { useAuthStore } from '../../../stores/authStore';

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
  }, [loadPayments]);

  const createPayment = async (dto: CreatePaymentDTO): Promise<Payment> => {
    if (!shop?.id) throw new Error('Shop identifier missing');
    const created = await paymentRepo.createPayment(shop.id, dto);
    setPayments((prev) => [created, ...prev]);
    return created;
  };

  const removePayment = async (id: string): Promise<void> => {
    await paymentRepo.deletePayment(id);
    setPayments((prev) => prev.filter((p) => p.id !== id));
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
