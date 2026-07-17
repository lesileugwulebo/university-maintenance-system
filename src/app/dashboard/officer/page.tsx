'use client';

import { useState, useEffect } from 'react';
import RequestCard from '@/components/RequestCard';
import styles from '@/styles/tables.module.css';
import formStyles from '@/styles/forms.module.css';

export default function OfficerDashboard() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Status Form State
  const [newStatus, setNewStatus] = useState('IN_PROGRESS');
  const [comment, setComment] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ASSIGNED'); // Default to show newly assigned tasks

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search,
        status,
        page: '1',
        limit: '20',
      });
      const res = await fetch(`/api/requests?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setRequests(data.requests);
      }
    } catch (err) {
      console.error('Failed to fetch officer tasks:', err);
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
        setNewStatus(data.request.status === 'ASSIGNED' ? 'IN_PROGRESS' : data.request.status);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [search, status]);

  useEffect(() => {
    if (selectedRequestId !== null) {
      fetchRequestDetails(selectedRequestId);
    }
  }, [selectedRequestId]);

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;
    if (!comment.trim()) {
      setFormError('Please enter a comment for this work update.');
      return;
    }

    setFormError('');
    setFormSubmitting(true);

    try {
      const res = await fetch(`/api/requests/${selectedRequest.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          comment: comment.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'Failed to update request status.');
      } else {
        setComment('');
        fetchRequests();
        fetchRequestDetails(selectedRequest.id);
      }
    } catch (err) {
      console.error(err);
      setFormError('An error occurred during update.');
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 800 }}>Maintenance Officer Panel</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          Inspect assigned repairs, update works-in-progress, and log task resolutions.
        </p>
      </div>

      {/* Mini Stats Bar */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Assigned Jobs</span>
          <span className={styles.statValue}>
            {requests.filter((r) => r.status === 'ASSIGNED').length}
          </span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Active Work In-Progress</span>
          <span className={styles.statValue}>
            {requests.filter((r) => r.status === 'IN_PROGRESS').length}
          </span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Total Resolving Tasks</span>
          <span className={styles.statValue}>{requests.length}</span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className={styles.filterBar}>
        <div className={styles.searchWrapper}>
          <input
            type="text"
            className={formStyles.input}
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ padding: '8px 12px' }}
          />
        </div>
        <div className={styles.filterGroup}>
          <select
            className={styles.filterSelect}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All My Tasks</option>
            <option value="ASSIGNED">New Assigned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
      </div>

      {/* Split details view */}
      <div className={styles.detailsContainer}>
        {/* Left column */}
        <div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
              Loading assigned tasks...
            </div>
          ) : requests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', border: '1px dashed var(--border-color)', borderRadius: '12px' }}>
              <span style={{ fontSize: '32px', display: 'block', marginBottom: '12px' }}>🛠️</span>
              <p style={{ color: 'var(--text-secondary)' }}>No jobs assigned matching filter.</p>
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
        </div>

        {/* Right column */}
        <div className={styles.panel} style={{ alignSelf: 'start' }}>
          <h3 className={styles.panelTitle}>Task Execution Panel</h3>

          {detailLoading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
              Loading task details...
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
                  Problem Description
                </span>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  {selectedRequest.description}
                </p>
              </div>

              {selectedRequest.imagePath && (
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                    Uploaded Proof Image
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

              {/* Progress Update Form */}
              {selectedRequest.status !== 'COMPLETED' && selectedRequest.status !== 'CANCELLED' && (
                <form
                  onSubmit={handleUpdateStatus}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    padding: '16px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    marginTop: '8px',
                  }}
                >
                  <span style={{ fontSize: '12px', color: 'var(--accent-color)', fontWeight: 700, display: 'block', marginBottom: '12px' }}>
                    ⚙️ Log Activity / Transition Status
                  </span>

                  {formError && (
                    <div className={`${formStyles.message} ${formStyles.error}`} style={{ padding: '8px', fontSize: '12px' }}>
                      {formError}
                    </div>
                  )}

                  <div className={formStyles.formGroup} style={{ marginBottom: '12px' }}>
                    <label className={formStyles.label} htmlFor="updateStatus">
                      Set Work Status
                    </label>
                    <select
                      id="updateStatus"
                      className={formStyles.select}
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      disabled={formSubmitting}
                      style={{ padding: '8px 12px', fontSize: '13px' }}
                    >
                      <option value="IN_PROGRESS">In Progress / Work Begun</option>
                      <option value="COMPLETED">Completed / Resolved</option>
                    </select>
                  </div>

                  <div className={formStyles.formGroup} style={{ marginBottom: '16px' }}>
                    <label className={formStyles.label} htmlFor="updateComment">
                      Action Comments
                    </label>
                    <textarea
                      id="updateComment"
                      className={formStyles.textarea}
                      placeholder="Explain what steps you took or what parts are needed (e.g. Fixed cable leaks, replaced router power adapter)."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      disabled={formSubmitting}
                      style={{ minHeight: '80px', fontSize: '13px', padding: '10px' }}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className={`${formStyles.btn} ${formStyles.btnPrimary}`}
                    disabled={formSubmitting}
                    style={{ padding: '8px 16px', fontSize: '13px' }}
                  >
                    {formSubmitting ? 'Recording...' : 'Update Job Progress'}
                  </button>
                </form>
              )}

              {/* Status transition log */}
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: '12px' }}>
                  System Log history
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
                          By: {log.user.fullName}
                        </p>
                        {log.comment && <p className={styles.timelineComment}>{log.comment}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
              👈 Select a job from your assigned list to begin work, view images, or post resolution logs.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
