/* features/inventory/index.ts */
export * from './types';
export * from './repositories/inventoryRepository';
export * from './hooks/useInventory';
export { default as ProductListPage } from './pages/ProductListPage';
export { AddProductModal } from './components/AddProductModal';
export { AddCategoryModal } from './components/AddCategoryModal';
export { RestockModal } from './components/RestockModal';
