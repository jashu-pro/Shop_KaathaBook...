/* features/sales/pages/SalesList.tsx */
import React from 'react';
import { Link } from 'react-router-dom';

const SalesList: React.FC = () => {
  return (
    <div className="glass-panel glass-card">
      <div className="flex justify-between align-center" style={{ marginBottom: '1rem' }}>
        <h2>Sales Transactions</h2>
        <Link to="/sales/new" className="btn btn-primary">New Sale (POS)</Link>
      </div>
      <p style={{ color: 'var(--text-secondary)' }}>
        View historical sales, check payment statuses, and review invoice attachments.
      </p>
    </div>
  );
};

export default SalesList;
