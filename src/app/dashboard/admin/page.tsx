'use client';

import { useState, useEffect } from 'react';
import RequestCard from '@/components/RequestCard';
import styles from '@/styles/tables.module.css';
import formStyles from '@/styles/forms.module.css';

export default function AdminDashboard() {
  const [requests, setRequests] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [officers, setOfficers] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Task Assignment state
  const [assignedOfficerId, setAssignedOfficerId] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState('');

  // Status Change State
  const [newStatus, setNewStatus] = useState('');
  const [statusComment, setStatusComment] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Load metrics & officers
  const fetchMetrics = async () => {
    setMetricsLoading(true);
    try {
      const res = await fetch('/api/reports');
      const data = await res.json();
      if (res.ok) {
        setMetrics(data.summary);
      }
    } catch (err) {
      console.error('Failed to load metrics:', err);
    } finally {
      setMetricsLoading(false);
    }
  };

  const fetchOfficers = async () => {
    try {
      const res = await fetch('/api/users?role=MAINTENANCE_OFFICER');
      const data = await res.json();
      if (res.ok) {
        setOfficers(data.users);
      }
    } catch (err) {
      console.error('Failed to load officers:', err);
    }
  };

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

  const fetchRequestDetails = async (id: number) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/requests/${id}`);
      const data = await res.json();
      if (res.ok) {
        setSelectedRequest(data.request);
        setNewStatus(data.request.status);
        if (data.request.assignments && data.request.assignments.length > 0) {
          setAssignedOfficerId(data.request.assignments[0].officerId.toString());
        } else {
          setAssignedOfficerId('');
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    fetchOfficers();
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [search, categoryId, status, priority, page]);

  useEffect(() => {
    if (selectedRequestId !== null) {
      fetchRequestDetails(selectedRequestId);
    }
  }, [selectedRequestId]);

  const handleAssignTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest || !assignedOfficerId) return;

    setAssignError('');
    setAssigning(true);

    try {
      const res = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: selectedRequest.id,
          officerId: parseInt(assignedOfficerId),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setAssignError(data.error || 'Failed to assign officer.');
      } else {
        fetchRequests();
        fetchMetrics();
        fetchRequestDetails(selectedRequest.id);
      }
    } catch (err) {
      setAssignError('An error occurred.');
    } finally {
      setAssigning(false);
    }
  };

  const handleUpdateStatusAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest || !newStatus) return;

    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/requests/${selectedRequest.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          comment: statusComment.trim() || `Admin changed status to ${newStatus}.`,
        }),
      });

      if (res.ok) {
        setStatusComment('');
        fetchRequests();
        fetchMetrics();
        fetchRequestDetails(selectedRequest.id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDeleteRequest = async (id: number) => {
    if (!confirm('CAUTION: Are you sure you want to permanently delete this request? This action deletes all assignment history and status logs.')) return;
    try {
      const res = await fetch(`/api/requests/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSelectedRequest(null);
        setSelectedRequestId(null);
        fetchRequests();
        fetchMetrics();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 800 }}>System Control Center</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Monitor university complains, coordinate assignments, and review resolution records.
          </p>
        </div>
        <a
          href="/api/reports?export=csv"
          className={`${formStyles.btn} ${formStyles.btnSecondary}`}
          style={{ width: 'auto', padding: '10px 16px', fontSize: '13px' }}
        >
          📥 Export CSV Data Report
        </a>
      </div>

      {/* Metrics Dashboard */}
      {metricsLoading ? (
        <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
          Computing metrics...
        </div>
      ) : metrics ? (
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Total Reports Raised</span>
            <span className={styles.statValue}>{metrics.total}</span>
          </div>
          <div className={styles.statCard} style={{ borderLeft: '3px solid var(--color-pending)' }}>
            <span className={styles.statLabel}>Pending Queue</span>
            <span className={styles.statValue}>{metrics.pending}</span>
          </div>
          <div className={styles.statCard} style={{ borderLeft: '3px solid var(--color-progress)' }}>
            <span className={styles.statLabel}>In-Progress Jobs</span>
            <span className={styles.statValue}>{metrics.assigned + metrics.inProgress}</span>
          </div>
          <div className={styles.statCard} style={{ borderLeft: '3px solid var(--color-completed)' }}>
            <span className={styles.statLabel}>Resolved Cases</span>
            <span className={styles.statValue}>{metrics.completed}</span>
          </div>
        </div>
      ) : null}

      {/* Filter and Search Bar */}
      <div className={styles.filterBar}>
        <div className={styles.searchWrapper}>
          <input
            type="text"
            className={formStyles.input}
            placeholder="Search by keywords or reporter name..."
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

      {/* Main Split Grid */}
      <div className={styles.detailsContainer}>
        {/* Left Side: Ticket Grid */}
        <div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
              Loading service requests...
            </div>
          ) : requests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', border: '1px dashed var(--border-color)', borderRadius: '12px' }}>
              <span style={{ fontSize: '32px', display: 'block', marginBottom: '12px' }}>📊</span>
              <p style={{ color: 'var(--text-secondary)' }}>No complaints found matching filters.</p>
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

          {/* Pagination */}
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

        {/* Right Side: Execution Detail Panel */}
        <div className={styles.panel} style={{ alignSelf: 'start' }}>
          <h3 className={styles.panelTitle}>Operations Management</h3>

          {detailLoading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
              Loading record...
            </div>
          ) : selectedRequest ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <h4 style={{ fontSize: '18px', fontWeight: 700 }}>{selectedRequest.title}</h4>
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <span className={`${styles.badge} ${styles[`status_${selectedRequest.status}`]}`}>
                    {selectedRequest.status.replace('_', ' ')}
                  </span>
                  <span className={`${styles.badge} ${styles[`priority_${selectedRequest.priority}`]}`}>
                    {selectedRequest.priority}
                  </span>
                </div>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                  Reporter Details
                </span>
                <p style={{ fontSize: '14px', fontWeight: 600 }}>
                  👤 {selectedRequest.creator.fullName} ({selectedRequest.creator.email})
                </p>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                  Description
                </span>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  {selectedRequest.description}
                </p>
              </div>

              {selectedRequest.imagePath && (
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                    Fault Photo proof
                  </span>
                  <div>
                    <img
                      src={selectedRequest.imagePath}
                      alt="Evidence"
                      className={styles.evidenceImage}
                    />
                  </div>
                </div>
              )}

              {/* Coordinator Assignment Form */}
              {selectedRequest.status !== 'CANCELLED' && (
                <form
                  onSubmit={handleAssignTask}
                  style={{
                    backgroundColor: 'rgba(59, 130, 246, 0.04)',
                    padding: '16px',
                    borderRadius: '8px',
                    border: '1px solid rgba(59, 130, 246, 0.15)',
                    marginTop: '8px',
                  }}
                >
                  <span style={{ fontSize: '12px', color: 'var(--accent-color)', fontWeight: 700, display: 'block', marginBottom: '8px' }}>
                    🔧 Route Task to Maintenance Officer
                  </span>

                  {assignError && (
                    <div className={`${formStyles.message} ${formStyles.error}`} style={{ padding: '6px', fontSize: '12px' }}>
                      {assignError}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <select
                      className={formStyles.select}
                      value={assignedOfficerId}
                      onChange={(e) => setAssignedOfficerId(e.target.value)}
                      disabled={assigning}
                      style={{ padding: '6px 12px', fontSize: '13px' }}
                      required
                    >
                      <option value="">Select Officer...</option>
                      {officers.map((off) => (
                        <option key={off.id} value={off.id}>
                          {off.fullName}
                        </option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      className={`${formStyles.btn} ${formStyles.btnPrimary}`}
                      disabled={assigning || !assignedOfficerId}
                      style={{ width: 'auto', padding: '6px 12px', fontSize: '13px', whiteSpace: 'nowrap' }}
                    >
                      {assigning ? 'Routing...' : 'Assign'}
                    </button>
                  </div>
                </form>
              )}

              {/* Status Override Form for Admins */}
              {selectedRequest.status !== 'CANCELLED' && (
                <form
                  onSubmit={handleUpdateStatusAdmin}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    padding: '16px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 700, display: 'block', marginBottom: '8px' }}>
                    🚨 Force Override Status
                  </span>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <select
                        className={formStyles.select}
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value)}
                        disabled={updatingStatus}
                        style={{ padding: '6px 12px', fontSize: '13px' }}
                        required
                      >
                        <option value="PENDING">Pending</option>
                        <option value="ASSIGNED">Assigned</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="COMPLETED">Completed</option>
                      </select>
                      <button
                        type="submit"
                        className={`${formStyles.btn} ${formStyles.btnSecondary}`}
                        disabled={updatingStatus || newStatus === selectedRequest.status}
                        style={{ width: 'auto', padding: '6px 12px', fontSize: '13px', whiteSpace: 'nowrap' }}
                      >
                        Change
                      </button>
                    </div>

                    <input
                      type="text"
                      className={formStyles.input}
                      placeholder="Comment for state override..."
                      value={statusComment}
                      onChange={(e) => setStatusComment(e.target.value)}
                      disabled={updatingStatus}
                      style={{ padding: '6px 12px', fontSize: '13px' }}
                    />
                  </div>
                </form>
              )}

              {/* Status logs timeline */}
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: '12px' }}>
                  Resolution Logs
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

              {/* Delete Request Button */}
              <button
                onClick={() => handleDeleteRequest(selectedRequest.id)}
                className={formStyles.btnDanger}
                style={{
                  padding: '8px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  marginTop: '16px',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                }}
              >
                Delete Complaint Case (Admin)
              </button>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
              👈 Select a ticket from the left panel to assign a contractor, override statuses, or inspect proof images.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
