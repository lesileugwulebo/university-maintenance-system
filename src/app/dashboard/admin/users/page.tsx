'use client';

import { useState, useEffect } from 'react';
import formStyles from '@/styles/forms.module.css';
import tablesStyles from '@/styles/tables.module.css';

export default function ManageUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [userId, setUserId] = useState<number | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [roleId, setRoleId] = useState('');

  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const [isEditing, setIsEditing] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users);
        setRoles(data.roles);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const resetForm = () => {
    setUserId(null);
    setFullName('');
    setEmail('');
    setUsername('');
    setPassword('');
    setRoleId('');
    setFormError('');
    setFormSuccess('');
    setIsEditing(false);
  };

  const handleEditClick = (user: any) => {
    setUserId(user.id);
    setFullName(user.fullName);
    setEmail(user.email);
    setUsername(user.username);
    setPassword(''); // Leave password empty unless resetting
    setRoleId(user.roleId.toString());
    setFormError('');
    setFormSuccess('');
    setIsEditing(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !username || !roleId || (!isEditing && !password)) {
      setFormError('Please fill in all required fields.');
      return;
    }

    setFormError('');
    setFormSuccess('');
    setFormLoading(true);

    const payload = {
      id: userId,
      fullName,
      email,
      username,
      password: password || undefined,
      roleId,
    };

    try {
      const url = '/api/users';
      const method = isEditing ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'Operation failed');
      } else {
        setFormSuccess(isEditing ? 'User updated successfully!' : 'User created successfully!');
        resetForm();
        fetchUsers();
      }
    } catch (err) {
      setFormError('An error occurred.');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 800 }}>User Management Panel</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          Create, update, and manage access privileges across university roles.
        </p>
      </div>

      <div className={tablesStyles.detailsContainer}>
        {/* Left: User list table */}
        <div className={tablesStyles.panel}>
          <h3 className={tablesStyles.panelTitle}>Registered Accounts</h3>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
              Loading user accounts...
            </div>
          ) : (
            <div className={tablesStyles.tableWrapper}>
              <table className={tablesStyles.table}>
                <thead>
                  <tr>
                    <th>Full Name</th>
                    <th>Username</th>
                    <th>Email Address</th>
                    <th>Access Role</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td style={{ fontWeight: 600 }}>{u.fullName}</td>
                      <td>{u.username}</td>
                      <td>{u.email}</td>
                      <td>
                        <span
                          className={tablesStyles.badge}
                          style={{
                            backgroundColor:
                              u.role.name === 'ADMINISTRATOR'
                                ? 'rgba(139, 92, 246, 0.15)'
                                : u.role.name === 'MAINTENANCE_OFFICER'
                                ? 'rgba(59, 130, 246, 0.15)'
                                : 'rgba(255, 255, 255, 0.05)',
                            color:
                              u.role.name === 'ADMINISTRATOR'
                                ? '#a78bfa'
                                : u.role.name === 'MAINTENANCE_OFFICER'
                                ? '#60a5fa'
                                : 'var(--text-secondary)',
                          }}
                        >
                          {u.role.name.replace('_', ' ')}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => handleEditClick(u)}
                          className={formStyles.btnSecondary}
                          style={{ padding: '4px 8px', fontSize: '11px', width: 'auto', borderRadius: '4px' }}
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right: Form Panel */}
        <div className={tablesStyles.panel} style={{ alignSelf: 'start' }}>
          <h3 className={tablesStyles.panelTitle}>
            {isEditing ? 'Edit User Details' : 'Create New Account'}
          </h3>

          {formError && (
            <div className={`${formStyles.message} ${formStyles.error}`} style={{ padding: '8px', fontSize: '12px' }}>
              {formError}
            </div>
          )}
          {formSuccess && (
            <div className={`${formStyles.message} ${formStyles.success}`} style={{ padding: '8px', fontSize: '12px' }}>
              {formSuccess}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className={formStyles.formGroup}>
              <label className={formStyles.label} htmlFor="formName">
                Full Name
              </label>
              <input
                type="text"
                id="formName"
                className={formStyles.input}
                placeholder="Jane Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={formLoading}
                required
              />
            </div>

            <div className={formStyles.formGroup}>
              <label className={formStyles.label} htmlFor="formEmail">
                Email Address
              </label>
              <input
                type="email"
                id="formEmail"
                className={formStyles.input}
                placeholder="jane@miva.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={formLoading}
                required
              />
            </div>

            <div className={formStyles.formGroup}>
              <label className={formStyles.label} htmlFor="formUser">
                Username
              </label>
              <input
                type="text"
                id="formUser"
                className={formStyles.input}
                placeholder="janedoe"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={formLoading}
                required
              />
            </div>

            <div className={formStyles.formGroup}>
              <label className={formStyles.label} htmlFor="formRole">
                Access Role Privilege
              </label>
              <select
                id="formRole"
                className={formStyles.select}
                value={roleId}
                onChange={(e) => setRoleId(e.target.value)}
                disabled={formLoading}
                required
              >
                <option value="">Select role...</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>

            <div className={formStyles.formGroup}>
              <label className={formStyles.label} htmlFor="formPass">
                {isEditing ? 'Reset Password (Optional)' : 'Password'}
              </label>
              <input
                type="password"
                id="formPass"
                className={formStyles.input}
                placeholder={isEditing ? 'Leave empty to keep current' : '••••••••'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={formLoading}
                required={!isEditing}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '24px' }}>
              {isEditing && (
                <button
                  type="button"
                  onClick={resetForm}
                  className={formStyles.btnSecondary}
                  disabled={formLoading}
                  style={{ padding: '8px' }}
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                className={`${formStyles.btn} ${formStyles.btnPrimary}`}
                disabled={formLoading}
                style={{ padding: '8px' }}
              >
                {formLoading ? 'Saving...' : isEditing ? 'Update User' : 'Add Account'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
