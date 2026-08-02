/* features/inventory/pages/ProductList.tsx */
import React from 'react';

const ProductList: React.FC = () => {
  return (
    <div className="glass-panel glass-card">
      <h2>Inventory Catalog</h2>
      <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
        Track categories, products, prices, barcodes, stock levels, and customize low stock warning thresholds.
      </p>
    </div>
  );
};

export default ProductList;
