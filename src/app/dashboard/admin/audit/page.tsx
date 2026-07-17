'use client';

import { useState, useEffect } from 'react';
import formStyles from '@/styles/forms.module.css';
import tablesStyles from '@/styles/tables.module.css';

export default function AuditTrailPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reports');
      const data = await res.json();
      if (res.ok) {
        setLogs(data.auditLogs);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="fade-in" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 800 }}>System Audit Trail</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Comprehensive log of all status changes, task assignments, and user activities.
          </p>
        </div>
        <button
          onClick={fetchLogs}
          className={formStyles.btnSecondary}
          style={{ width: 'auto', padding: '8px 16px', fontSize: '12px' }}
        >
          🔄 Refresh Logs
        </button>
      </div>

      <div className={tablesStyles.panel}>
        <h3 className={tablesStyles.panelTitle}>Operations Activity History</h3>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
            Loading audit trails...
          </div>
        ) : logs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
            No status log events registered yet.
          </div>
        ) : (
          <div className={tablesStyles.tableWrapper}>
            <table className={tablesStyles.table}>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Request Details</th>
                  <th>Transition</th>
                  <th>User / Operator</th>
                  <th>Comments</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const date = new Date(log.createdAt).toLocaleString();
                  return (
                    <tr key={log.id}>
                      <td style={{ fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {date}
                      </td>
                      <td style={{ fontWeight: 600 }}>
                        <span style={{ fontSize: '11px', color: 'var(--accent-color)', display: 'block' }}>
                          ID: #{log.requestId}
                        </span>
                        {log.request.title}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                          <span className={`${tablesStyles.badge} ${tablesStyles[`status_${log.previousStatus}`]}`}>
                            {log.previousStatus}
                          </span>
                          <span>➡️</span>
                          <span className={`${tablesStyles.badge} ${tablesStyles[`status_${log.newStatus}`]}`}>
                            {log.newStatus}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, display: 'block' }}>{log.user.fullName}</span>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          {log.user.role.name.replace('_', ' ')}
                        </span>
                      </td>
                      <td>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', fontStyle: log.comment ? 'normal' : 'italic' }}>
                          {log.comment || 'No description recorded.'}
                        </p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
