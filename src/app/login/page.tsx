'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from '@/styles/forms.module.css';

export default function LoginPage() {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginId || !password) {
      setError('Please enter both username/email and password.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loginId, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Invalid credentials');
      } else {
        router.refresh();
        router.push('/');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred during login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (email: string, pass: string) => {
    setLoading(true);
    setError('');
    setLoginId(email);
    setPassword(pass);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loginId: email, password: pass }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Quick login failed');
      } else {
        router.refresh();
        router.push('/');
      }
    } catch (err) {
      setError('An error occurred during login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authPage}>
      <div className={`${styles.formCard} fade-in`}>
        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '28px' }}>🏫</span>
        </div>
        <h2 className={styles.formTitle}>MIVA Portal</h2>
        <p className={styles.formSubtitle}>
          Maintenance & Service Request Center
        </p>

        {error && <div className={`${styles.message} ${styles.error}`}>{error}</div>}

        <form onSubmit={handleLogin}>
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="loginId">
              Email or Username
            </label>
            <input
              type="text"
              id="loginId"
              className={styles.input}
              placeholder="e.g. admin@miva.edu or admin"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="password">
              Password
            </label>
            <input
              type="password"
              id="password"
              className={styles.input}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <button
            type="submit"
            className={`${styles.btn} ${styles.btnPrimary}`}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <p className={styles.formLink}>
          Need a student account? <Link href="/register">Register here</Link>
        </p>

        <div
          style={{
            marginTop: '32px',
            paddingTop: '20px',
            borderTop: '1px solid var(--border-color)',
          }}
        >
          <p
            style={{
              fontSize: '11px',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              textAlign: 'center',
              marginBottom: '12px',
              fontWeight: 700,
            }}
          >
            🔑 Quick Demo Logins
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              onClick={() => handleQuickLogin('student@miva.edu', 'student123')}
              className={styles.btnSecondary}
              style={{ padding: '8px', fontSize: '12px', cursor: 'pointer', borderRadius: '4px', border: '1px solid var(--border-color)' }}
              disabled={loading}
            >
              🎓 Student/Staff Account
            </button>
            <button
              onClick={() => handleQuickLogin('officer@miva.edu', 'officer123')}
              className={styles.btnSecondary}
              style={{ padding: '8px', fontSize: '12px', cursor: 'pointer', borderRadius: '4px', border: '1px solid var(--border-color)' }}
              disabled={loading}
            >
              🔧 Maintenance Officer Account
            </button>
            <button
              onClick={() => handleQuickLogin('admin@miva.edu', 'admin123')}
              className={styles.btnSecondary}
              style={{ padding: '8px', fontSize: '12px', cursor: 'pointer', borderRadius: '4px', border: '1px solid var(--border-color)' }}
              disabled={loading}
            >
              💼 Administrator Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
