/* features/reports/pages/Reports.tsx */
import React from 'react';

const Reports: React.FC = () => {
  return (
    <div className="glass-panel glass-card">
      <h2>Business Reports</h2>
      <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
        Generate daily books, client ledger statements, outstanding summaries, and export as CSV, Excel or PDF.
      </p>
    </div>
  );
};

export default Reports;
