'use client';

import { useState, useEffect } from 'react';
import RequestCard from '@/components/RequestCard';
import styles from '@/styles/tables.module.css';
import formStyles from '@/styles/forms.module.css';

export default function StudentDashboard() {
  const [requests, setRequests] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch lists
  const fetchRequests = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search,
        categoryId,
        status,
        priority,
        page: page.toString(),
        limit: '6',
      });
      const res = await fetch(`/api/requests?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setRequests(data.requests);
        setCategories(data.categories);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (err) {
      console.error('Failed to fetch requests:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch specific request details
  const fetchRequestDetails = async (id: number) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/requests/${id}`);
      const data = await res.json();
      if (res.ok) {
        setSelectedRequest(data.request);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [search, categoryId, status, priority, page]);

  useEffect(() => {
    if (selectedRequestId !== null) {
      fetchRequestDetails(selectedRequestId);
    }
  }, [selectedRequestId]);

  const handleCancelRequest = async (id: number) => {
    if (!confirm('Are you sure you want to cancel this service request?')) return;
    try {
      const res = await fetch(`/api/requests/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'CANCELLED',
          comment: 'Request cancelled by the creator.',
        }),
      });
      if (res.ok) {
        fetchRequests();
        if (selectedRequestId === id) {
          fetchRequestDetails(id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusSummary = () => {
    const total = requests.length;
    const completed = requests.filter((r) => r.status === 'COMPLETED').length;
    const pending = requests.filter((r) => r.status === 'PENDING').length;
    return { total, completed, pending };
  };

  const summary = getStatusSummary();

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 800 }}>Student & Staff Panel</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          Raise complaints and monitor maintenance resolutions in real-time.
        </p>
      </div>

      {/* Mini Stats Bar */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>My Active Submissions</span>
          <span className={styles.statValue}>{requests.filter(r => r.status !== 'COMPLETED' && r.status !== 'CANCELLED').length}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Resolved Jobs</span>
          <span className={styles.statValue}>{requests.filter(r => r.status === 'COMPLETED').length}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Pending Assignments</span>
          <span className={styles.statValue}>{requests.filter(r => r.status === 'PENDING').length}</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className={styles.filterBar}>
        <div className={styles.searchWrapper}>
          <input
            type="text"
            className={formStyles.input}
            placeholder="Search by keywords..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            style={{ padding: '8px 12px' }}
          />
        </div>
        <div className={styles.filterGroup}>
          <select
            className={styles.filterSelect}
            value={categoryId}
            onChange={(e) => {
              setCategoryId(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            className={styles.filterSelect}
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <select
            className={styles.filterSelect}
            value={priority}
            onChange={(e) => {
              setPriority(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>
      </div>

      {/* Split Details Container */}
      <div className={styles.detailsContainer}>
        {/* Left Side: Requests List */}
        <div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
              Loading service requests...
            </div>
          ) : requests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', border: '1px dashed var(--border-color)', borderRadius: '12px' }}>
              <span style={{ fontSize: '32px', display: 'block', marginBottom: '12px' }}>📭</span>
              <p style={{ color: 'var(--text-secondary)' }}>No service requests found matching filters.</p>
            </div>
          ) : (
            <div className={styles.requestGrid}>
              {requests.map((req) => (
                <RequestCard
                  key={req.id}
                  request={req}
                  isActive={selectedRequestId === req.id}
                  onClick={() => setSelectedRequestId(req.id)}
                />
              ))}
            </div>
          )}

          {/* Pagination controls */}
          {totalPages > 1 && (
            <div className={styles.pagination}>
              <span className={styles.pageInfo}>
                Page {page} of {totalPages}
              </span>
              <div className={styles.pageControls}>
                <button
                  className={styles.pageBtn}
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </button>
                <button
                  className={styles.pageBtn}
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Request Details */}
        <div className={styles.panel} style={{ alignSelf: 'start' }}>
          <h3 className={styles.panelTitle}>Ticket Details Panel</h3>

          {detailLoading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
              Fetching logs and data...
            </div>
          ) : selectedRequest ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <h4 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {selectedRequest.title}
                </h4>
                <div style={{ display: 'flex', gap: '8px', margin: '12px 0' }}>
                  <span className={`${styles.badge} ${styles[`status_${selectedRequest.status}`]}`}>
                    {selectedRequest.status.replace('_', ' ')}
                  </span>
                  <span className={`${styles.badge} ${styles[`priority_${selectedRequest.priority}`]}`}>
                    {selectedRequest.priority}
                  </span>
                </div>
              </div>

              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                  Description
                </span>
                <p style={{ fontSize: '14px', marginTop: '4px', color: 'var(--text-secondary)' }}>
                  {selectedRequest.description}
                </p>
              </div>

              {selectedRequest.imagePath && (
                <div>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                    Uploaded Evidence
                  </span>
                  <div>
                    <img
                      src={selectedRequest.imagePath}
                      alt="Fault Evidence"
                      className={styles.evidenceImage}
                    />
                  </div>
                </div>
              )}

              {/* Assignments details if any */}
              {selectedRequest.assignments && selectedRequest.assignments.length > 0 && (
                <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.05)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.1)' }}>
                  <span style={{ fontSize: '12px', color: 'var(--accent-color)', fontWeight: 700 }}>
                    🛠️ Assigned Officer
                  </span>
                  <p style={{ fontSize: '14px', fontWeight: 600, marginTop: '2px' }}>
                    {selectedRequest.assignments[0].officer.fullName}
                  </p>
                </div>
              )}

              {/* Status transition log */}
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: '12px' }}>
                  Resolution Log History
                </span>
                <div className={styles.timeline}>
                  {selectedRequest.statusLogs?.map((log: any, idx: number) => (
                    <div key={log.id} className={styles.timelineItem}>
                      <span className={`${styles.timelineDot} ${idx === selectedRequest.statusLogs.length - 1 ? styles.timelineDotActive : ''}`} />
                      <div className={styles.timelineContent}>
                        <div className={styles.timelineHeader}>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            {log.newStatus}
                          </span>
                          <span>
                            {new Date(log.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                          By: {log.user.fullName} ({log.user.role.name.replace('_', ' ')})
                        </p>
                        {log.comment && <p className={styles.timelineComment}>{log.comment}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cancel Request Button */}
              {selectedRequest.status !== 'COMPLETED' && selectedRequest.status !== 'CANCELLED' && (
                <button
                  onClick={() => handleCancelRequest(selectedRequest.id)}
                  className={formStyles.btnDanger}
                  style={{
                    padding: '8px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    marginTop: '12px',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                  }}
                >
                  Cancel Complaint
                </button>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
              👈 Select a request from the list to track status logs, upload attachments, and view details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
