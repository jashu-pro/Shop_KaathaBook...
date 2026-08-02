/* shop/hooks/useShop.ts */
import { useAuthStore } from '../../../stores/authStore';
import { RepositoryFactory } from '../../../repositories/RepositoryFactory';
import type { Shop } from '../types';

export const useShop = () => {
  const { shop, isOnboarded, isLoading, registerShop } = useAuthStore();
  const shopRepo = RepositoryFactory.getShopRepository();

  const updateShop = async (updates: Partial<Shop>) => {
    if (!shop) throw new Error('No active shop found');
    const updated = await shopRepo.updateShop(shop.id, updates);
    useAuthStore.setState({ shop: updated });
    return updated;
  };

  return {
    shop,
    isOnboarded,
    isLoading,
    registerShop,
    updateShop,
  };
};
