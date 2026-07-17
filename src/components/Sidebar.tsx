'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import styles from '@/styles/dashboard.module.css';

interface SidebarProps {
  user: {
    fullName: string;
    role: string;
    email: string;
  };
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        router.refresh();
        router.push('/login');
      }
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const getLinks = () => {
    switch (user.role) {
      case 'ADMINISTRATOR':
        return [
          { name: 'Dashboard Overview', href: '/dashboard/admin', icon: '📊' },
          { name: 'Manage Users', href: '/dashboard/admin/users', icon: '👤' },
          { name: 'System Logs (Audit)', href: '/dashboard/admin/audit', icon: '📜' },
        ];
      case 'MAINTENANCE_OFFICER':
        return [
          { name: 'My Assigned Jobs', href: '/dashboard/officer', icon: '🔧' },
        ];
      case 'STUDENT_STAFF':
      default:
        return [
          { name: 'My Requests', href: '/dashboard/student', icon: '📋' },
          { name: 'File Complaint', href: '/dashboard/student/submit', icon: '✏️' },
        ];
    }
  };

  const links = getLinks();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logoArea}>
        <div>
          <div className={styles.logoIcon}>MIT 8333</div>
          <div className={styles.logoSub}>Maintenance Portal</div>
        </div>
      </div>
      <nav className={styles.navSection}>
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
            >
              <span>{link.icon}</span>
              <span>{link.name}</span>
            </Link>
          );
        })}
      </nav>
      <div className={styles.profileSection}>
        <div className={styles.profileInfo}>
          <span className={styles.profileName} title={user.fullName}>
            {user.fullName}
          </span>
          <span className={styles.profileRole}>{user.role.replace('_', ' ')}</span>
        </div>
        <button onClick={handleLogout} className={styles.logoutButton}>
          <span>🚪</span> Sign Out
        </button>
      </div>
    </aside>
  );
}
