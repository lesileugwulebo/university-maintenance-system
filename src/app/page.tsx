import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { COOKIE_NAME, verifyJWT } from '@/lib/auth';

export default async function IndexPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    redirect('/login');
  }

  const decoded = verifyJWT(token);
  if (!decoded) {
    redirect('/login');
  }

  switch (decoded.role) {
    case 'ADMINISTRATOR':
      redirect('/dashboard/admin');
    case 'MAINTENANCE_OFFICER':
      redirect('/dashboard/officer');
    case 'STUDENT_STAFF':
    default:
      redirect('/dashboard/student');
  }
}
