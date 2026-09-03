/* features/staff/components/StaffAccessSection.tsx */
import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  History, 
  Search, 
  ExternalLink
} from 'lucide-react';
import { useStaff } from '../hooks/useStaff';
import type { WorkerMember } from '../types';
import { WorkerCard } from './WorkerCard';
import { AddWorkerModal } from './AddWorkerModal';
import { ManageWorkerAccessModal } from './ManageWorkerAccessModal';
import { WorkerActivityLogView } from './WorkerActivityLogView';
import { useNavigate } from 'react-router-dom';

export const StaffAccessSection: React.FC = () => {
  const navigate = useNavigate();
  const { workers, activityLogs, isLoading } = useStaff();

  const [activeSubTab, setActiveSubTab] = useState<'workers' | 'logs'>('workers');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState<WorkerMember | null>(null);

  const activeCount = workers.filter((w) => w.status === 'active').length;
  const invitedCount = workers.filter((w) => w.status === 'invited').length;

  const filteredWorkers = workers.filter(
    (w) =>
      w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.emailOrPhone.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Banner / Concept Card */}
      <div
        style={{
          padding: '1.5rem',
          borderRadius: '24px',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(59, 130, 246, 0.08) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
        }}
      >
        <div style={{ maxWidth: '640px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '1.25rem' }}>👑</span>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-heading)' }}>
              Owner-Controlled Worker Access
            </h3>
          </div>
          <p style={{ color: 'var(--text-body)', fontSize: '0.875rem', lineHeight: 1.45 }}>
            Add workers and define their custom module access (Sales, Payments, Customers, Inventory). Workers log in
            via their dedicated <strong>Worker Space</strong> with their personal 4-digit PIN.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={() => navigate('/worker-login')}
            className="btn btn-secondary"
            style={{
              padding: '0.65rem 1rem',
              borderRadius: '16px',
              fontSize: '0.85rem',
              gap: '0.4rem',
            }}
            title="Open Worker Space Login"
          >
            <ExternalLink size={16} />
            <span>Open Worker Space</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="btn btn-primary"
            style={{
              padding: '0.65rem 1.25rem',
              borderRadius: '16px',
              fontWeight: '700',
              fontSize: '0.9rem',
              gap: '0.45rem',
            }}
          >
            <UserPlus size={18} />
            <span>+ Add Worker</span>
          </button>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div
          className="glass-panel"
          style={{
            padding: '1.15rem 1.25rem',
            borderRadius: '20px',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
          }}
        >
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>
            Total Workers
          </span>
          <h4 style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--text-heading)', marginTop: '0.2rem' }}>
            {workers.length}
          </h4>
        </div>

        <div
          className="glass-panel"
          style={{
            padding: '1.15rem 1.25rem',
            borderRadius: '20px',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
          }}
        >
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>
            Active Workers
          </span>
          <h4 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#10B981', marginTop: '0.2rem' }}>
            {activeCount}
          </h4>
        </div>

        <div
          className="glass-panel"
          style={{
            padding: '1.15rem 1.25rem',
            borderRadius: '20px',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
          }}
        >
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>
            Pending Activations
          </span>
          <h4 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#F59E0B', marginTop: '0.2rem' }}>
            {invitedCount}
          </h4>
        </div>
      </div>

      {/* Sub Tabs: Workers vs Activity Log */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setActiveSubTab('workers')}
            className={`btn ${activeSubTab === 'workers' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.45rem 1rem', fontSize: '0.85rem', borderRadius: '12px', gap: '0.4rem' }}
          >
            <Users size={16} />
            <span>Workers ({workers.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('logs')}
            className={`btn ${activeSubTab === 'logs' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.45rem 1rem', fontSize: '0.85rem', borderRadius: '12px', gap: '0.4rem' }}
          >
            <History size={16} />
            <span>Activity Log ({activityLogs.length})</span>
          </button>
        </div>

        {activeSubTab === 'workers' && (
          <div style={{ position: 'relative', width: '100%', maxWidth: '260px' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="input-field"
              placeholder="Search workers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '2.4rem', paddingBlock: '0.5rem', fontSize: '0.85rem', borderRadius: '14px' }}
            />
          </div>
        )}
      </div>

      {/* Sub-Tab 1: Workers List */}
      {activeSubTab === 'workers' && (
        <div>
          {isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem 0' }}>
              <div className="spinner" />
            </div>
          ) : workers.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '3.5rem 1.5rem',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '24px',
                border: '2px dashed var(--border-color)',
              }}
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  color: 'var(--primary)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem',
                }}
              >
                <Users size={28} />
              </div>

              <h4 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-heading)' }}>
                No Workers Added Yet
              </h4>

              <p style={{ color: 'var(--text-body)', fontSize: '0.875rem', maxWidth: '420px', margin: '0.4rem auto 1.5rem auto' }}>
                Add your shop workers (e.g. billing staff or inventory helper) and customize their module permissions.
              </p>

              <button onClick={() => setIsAddModalOpen(true)} className="btn btn-primary" style={{ gap: '0.45rem' }}>
                <UserPlus size={18} />
                <span>+ Add Your First Worker</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
              {filteredWorkers.map((worker) => (
                <WorkerCard
                  key={worker.id}
                  worker={worker}
                  onManageAccess={(w) => setEditingWorker(w)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sub-Tab 2: Activity Logs */}
      {activeSubTab === 'logs' && (
        <WorkerActivityLogView logs={activityLogs} isLoading={isLoading} />
      )}

      {/* Add Worker Modal */}
      <AddWorkerModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      {/* Manage Access Modal */}
      <ManageWorkerAccessModal
        worker={editingWorker}
        isOpen={!!editingWorker}
        onClose={() => setEditingWorker(null)}
      />
    </div>
  );
};
