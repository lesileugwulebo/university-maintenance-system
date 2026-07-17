import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { COOKIE_NAME, verifyJWT } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';
import styles from '@/styles/dashboard.module.css';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    redirect('/login');
  }

  const decoded = verifyJWT(token);
  if (!decoded) {
    redirect('/login');
  }

  // Load user data directly from DB
  const user = await db.get(`
    SELECT u.*, r.name as roleName 
    FROM User u 
    JOIN Role r ON u.roleId = r.id 
    WHERE u.id = ?
  `, [decoded.userId]);

  if (!user) {
    redirect('/login');
  }

  const formattedUser = {
    fullName: user.fullName,
    email: user.email,
    role: user.roleName,
  };

  return (
    <div className={styles.layout}>
      {/* Sidebar navigation */}
      <Sidebar user={formattedUser} />

      {/* Main dashboard content area */}
      <div className={styles.mainContainer}>
        <header className={styles.header}>
          <div className={styles.pageTitle}>University Maintenance Operations</div>
          <div className={styles.headerRight}>
            <span className={styles.universityTag}>🏛️ MIVA Open University</span>
          </div>
        </header>
        <main className={styles.contentBody}>{children}</main>
      </div>
    </div>
  );
}
