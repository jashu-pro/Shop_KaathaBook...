/* features/sales/pages/NewSale.tsx */
import React from 'react';

const NewSale: React.FC = () => {
  return (
    <div className="glass-panel glass-card">
      <h2>Record New Sale (POS)</h2>
      <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
        Point of Sale interface to build carts, choose customers, calculate tax/discounts, and log payments.
      </p>
    </div>
  );
};

export default NewSale;
