'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import formStyles from '@/styles/forms.module.css';
import tablesStyles from '@/styles/tables.module.css';

export default function SubmitRequestPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const router = useRouter();

  // Load categories on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetch('/api/requests?limit=1');
        const data = await res.json();
        if (res.ok) {
          setCategories(data.categories);
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    };
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !categoryId || !priority) {
      setError('All fields except the evidence image are required.');
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('categoryId', categoryId);
      formData.append('priority', priority);
      if (imageFile) {
        formData.append('image', imageFile);
      }

      const res = await fetch('/api/requests', {
        method: 'POST',
        body: formData, // browser automatically sets Content-Type to multipart/form-data
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to submit complaint');
      } else {
        setSuccess('Maintenance request raised successfully!');
        setTimeout(() => {
          router.push('/dashboard/student');
        }, 1500);
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred during submission.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in" style={{ display: 'flex', justifyContent: 'center' }}>
      <div className={formStyles.formCard} style={{ maxWidth: '600px', margin: '0' }}>
        <h2 className={formStyles.formTitle}>File Maintenance Complaint</h2>
        <p className={formStyles.formSubtitle}>
          Provide exact details of the fault. The maintenance team will review your report.
        </p>

        {error && <div className={`${formStyles.message} ${formStyles.error}`}>{error}</div>}
        {success && <div className={`${formStyles.message} ${formStyles.success}`}>{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className={formStyles.formGroup}>
            <label className={formStyles.label} htmlFor="title">
              Complaint Title / Summary
            </label>
            <input
              type="text"
              id="title"
              className={formStyles.input}
              placeholder="e.g. Damaged power socket in Room 102"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className={formStyles.formGroup}>
            <label className={formStyles.label} htmlFor="categoryId">
              Maintenance Category
            </label>
            <select
              id="categoryId"
              className={formStyles.select}
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              disabled={loading}
              required
            >
              <option value="">Select category...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className={formStyles.formGroup}>
            <label className={formStyles.label}>
              Severity / Priority
            </label>
            <div className={formStyles.priorityGroup}>
              {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((p) => {
                const isActive = priority === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`${formStyles.priorityOption} ${
                      isActive ? formStyles[`priorityActive${p}`] : ''
                    }`}
                    disabled={loading}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </div>

          <div className={formStyles.formGroup}>
            <label className={formStyles.label} htmlFor="description">
              Detailed Description
            </label>
            <textarea
              id="description"
              className={formStyles.textarea}
              placeholder="Describe the issue. Include location details, frequency, or any warnings/danger signs."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className={formStyles.formGroup}>
            <label className={formStyles.label}>
              Evidence Image (Optional)
            </label>
            <div
              className={formStyles.fileUploadZone}
              onClick={() => document.getElementById('imageInput')?.click()}
            >
              <span className={formStyles.fileUploadIcon}>📸</span>
              <span className={formStyles.fileUploadText}>
                {imageFile ? `Selected: ${imageFile.name}` : 'Click to upload proof photo (leaks, broken parts, etc.)'}
              </span>
              <input
                type="file"
                id="imageInput"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setImageFile(e.target.files[0]);
                  }
                }}
                disabled={loading}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
            <button
              type="button"
              className={formStyles.btnSecondary}
              onClick={() => router.push('/dashboard/student')}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`${formStyles.btn} ${formStyles.btnPrimary}`}
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Raise Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
