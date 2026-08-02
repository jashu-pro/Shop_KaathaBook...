/* features/customers/pages/CustomerDetail.tsx */
import React from 'react';
import { useParams } from 'react-router-dom';

const CustomerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  return (
    <div className="glass-panel glass-card">
      <h2>Customer Ledger: {id}</h2>
      <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
        Traditional Khata ledger layout showing debit/credit logs and derived running balances.
      </p>
    </div>
  );
};

export default CustomerDetail;
