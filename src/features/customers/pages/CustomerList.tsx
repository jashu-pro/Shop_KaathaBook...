/* features/customers/pages/CustomerList.tsx */
import React from 'react';

const CustomerList: React.FC = () => {
  return (
    <div className="glass-panel glass-card">
      <h2>Customers Management</h2>
      <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
        Search, add, edit customers, village groups, and check individual outstanding balances.
      </p>
    </div>
  );
};

export default CustomerList;
