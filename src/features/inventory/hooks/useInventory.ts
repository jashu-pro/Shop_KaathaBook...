/* features/inventory/hooks/useInventory.ts */
import { useState, useEffect, useCallback } from 'react';
import type { Category, Product, CreateCategoryDTO, CreateProductDTO, UpdateProductDTO } from '../types';
import { RepositoryFactory } from '../../../repositories/RepositoryFactory';
import { useAuthStore } from '../../../stores/authStore';

export const useInventory = () => {
  const { shop } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const categoryRepo = RepositoryFactory.getCategoryRepository();
  const productRepo = RepositoryFactory.getProductRepository();

  const loadData = useCallback(async () => {
    if (!shop?.id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const [cats, prods] = await Promise.all([
        categoryRepo.list(shop.id),
        productRepo.list(shop.id),
      ]);
      setCategories(cats);
      setProducts(prods);
    } catch (err: any) {
      setError(err.message || 'Failed to load inventory');
    } finally {
      setIsLoading(false);
    }
  }, [shop?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const addCategory = async (dto: CreateCategoryDTO): Promise<Category> => {
    if (!shop?.id) throw new Error('Shop identifier missing');
    const created = await categoryRepo.create(shop.id, dto);
    setCategories((prev) => [...prev, created]);
    return created;
  };

  const removeCategory = async (id: string): Promise<void> => {
    await categoryRepo.delete(id);
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  const addProduct = async (dto: CreateProductDTO): Promise<Product> => {
    if (!shop?.id) throw new Error('Shop identifier missing');
    const created = await productRepo.create(shop.id, dto);
    setProducts((prev) => [created, ...prev]);
    return created;
  };

  const editProduct = async (id: string, updates: UpdateProductDTO): Promise<Product> => {
    const updated = await productRepo.update(id, updates);
    setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
    return updated;
  };

  const removeProduct = async (id: string): Promise<void> => {
    await productRepo.delete(id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const adjustStock = async (productId: string, deltaQty: number, reason?: string): Promise<Product> => {
    if (!shop?.id) throw new Error('Shop identifier missing');
    const updated = await productRepo.adjustStock(shop.id, productId, deltaQty, reason);
    setProducts((prev) => prev.map((p) => (p.id === productId ? updated : p)));
    return updated;
  };

  return {
    products,
    categories,
    isLoading,
    error,
    refetch: loadData,
    addCategory,
    removeCategory,
    addProduct,
    editProduct,
    removeProduct,
    adjustStock,
  };
};
