/* features/admin/pages/AdminWorkersPage.tsx */
import React, { useState, useEffect } from 'react';
import { RepositoryFactory } from '../../../repositories/RepositoryFactory';
import type { AdminWorkerItem } from '../types';
import { Users, Search, Store } from 'lucide-react';

const adminRepo = RepositoryFactory.getAdminRepository();

export const AdminWorkersPage: React.FC = () => {
  const [workers, setWorkers] = useState<AdminWorkerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const loadWorkers = async () => {
      try {
        setLoading(true);
        const data = await adminRepo.getWorkers();
        setWorkers(data);
      } catch (err) {
        console.error('Error fetching workers:', err);
      } finally {
        setLoading(false);
      }
    };
    loadWorkers();
  }, []);

  const filtered = workers.filter((w) => {
    const term = search.toLowerCase();
    return (
      w.name.toLowerCase().includes(term) ||
      w.shopName.toLowerCase().includes(term) ||
      w.emailOrPhone.toLowerCase().includes(term)
    );
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
            Staff & Workers Directory
          </h1>
          <p style={{ fontSize: '0.9rem', color: '#9ca3af', margin: '0.35rem 0 0' }}>
            Multi-tenant worker accounts, assigned shops, and active staff access.
          </p>
        </div>

        <div style={{ fontSize: '0.85rem', color: '#9ca3af' }}>
          Total Workers: <strong style={{ color: '#ffffff' }}>{workers.length}</strong>
        </div>
      </div>

      <div style={{
        backgroundColor: '#111827',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '1rem 1.25rem',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
      }}>
        <Search size={18} style={{ color: '#6b7280' }} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by worker name, shop name, or phone/email..."
          style={{
            flex: 1,
            backgroundColor: 'transparent',
            border: 'none',
            color: '#ffffff',
            fontSize: '0.9rem',
            outline: 'none',
          }}
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '0.8rem' }}
          >
            Clear
          </button>
        )}
      </div>

      <div style={{
        backgroundColor: '#111827',
        borderRadius: '18px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        overflow: 'hidden',
      }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>
            Loading workers...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '3.5rem 1.5rem', textAlign: 'center', color: '#6b7280' }}>
            <Users size={40} style={{ margin: '0 auto 0.75rem', opacity: 0.5 }} />
            <div style={{ fontSize: '1.05rem', fontWeight: 600, color: '#f3f4f6' }}>
              No Workers Found
            </div>
            <p style={{ fontSize: '0.85rem', margin: '0.25rem 0 0' }}>
              {search ? 'No workers match your filter query.' : 'No worker records currently exist.'}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                  textAlign: 'left',
                  color: '#6b7280',
                  fontSize: '0.78rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>
                  <th style={{ padding: '1rem 1.25rem' }}>Worker Name</th>
                  <th style={{ padding: '1rem 1.25rem' }}>Assigned Shop</th>
                  <th style={{ padding: '1rem 1.25rem' }}>Contact</th>
                  <th style={{ padding: '1rem 1.25rem' }}>Member Type</th>
                  <th style={{ padding: '1rem 1.25rem' }}>Status</th>
                  <th style={{ padding: '1rem 1.25rem' }}>Joined Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((w) => (
                  <tr
                    key={w.id}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                      transition: 'background 0.15s ease',
                    }}
                  >
                    <td style={{ padding: '1.15rem 1.25rem', fontWeight: 600, color: '#ffffff' }}>
                      {w.name}
                    </td>

                    <td style={{ padding: '1.15rem 1.25rem', color: '#3b82f6', fontWeight: 500 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Store size={14} />
                        <span>{w.shopName}</span>
                      </div>
                    </td>

                    <td style={{ padding: '1.15rem 1.25rem', color: '#d1d5db' }}>
                      {w.emailOrPhone}
                    </td>

                    <td style={{ padding: '1.15rem 1.25rem' }}>
                      <span style={{
                        fontSize: '0.75rem',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '6px',
                        backgroundColor: 'rgba(139, 92, 246, 0.15)',
                        color: '#c4b5fd',
                        fontWeight: 600,
                        textTransform: 'capitalize',
                      }}>
                        {w.memberType}
                      </span>
                    </td>

                    <td style={{ padding: '1.15rem 1.25rem' }}>
                      <span style={{
                        fontSize: '0.72rem',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '6px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        backgroundColor: w.status === 'active' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                        color: w.status === 'active' ? '#34d399' : '#fbbf24',
                      }}>
                        {w.status}
                      </span>
                    </td>

                    <td style={{ padding: '1.15rem 1.25rem', color: '#9ca3af', fontSize: '0.82rem' }}>
                      {new Date(w.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
export default AdminWorkersPage;
