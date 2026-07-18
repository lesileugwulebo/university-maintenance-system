import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const COOKIE_NAME = 'miva_session';

export function middleware(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const { pathname } = request.nextUrl;

  // 1. If trying to access dashboard paths
  if (pathname.startsWith('/dashboard')) {
    if (!token) {
      // Redirect to login if not authenticated
      return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
      // Parse payload without full validation (endpoint handles actual verify)
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid token format');
      }

      const payloadStr = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
      const payload = JSON.parse(payloadStr);

      const userRole = payload.role;

      // Restrict access based on role
      if (pathname.startsWith('/dashboard/admin') && userRole !== 'ADMINISTRATOR') {
        return NextResponse.redirect(new URL(getDashboardRedirect(userRole), request.url));
      }
      if (pathname.startsWith('/dashboard/officer') && userRole !== 'MAINTENANCE_OFFICER') {
        return NextResponse.redirect(new URL(getDashboardRedirect(userRole), request.url));
      }
      if (pathname.startsWith('/dashboard/student') && userRole !== 'STUDENT_STAFF') {
        return NextResponse.redirect(new URL(getDashboardRedirect(userRole), request.url));
      }
    } catch (e) {
      // Clear invalid cookie and redirect to login
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.set(COOKIE_NAME, '', { maxAge: 0 });
      return response;
    }
  }

  // 2. If trying to access login/register while authenticated
  if (pathname === '/login' || pathname === '/register') {
    if (token) {
      try {
        const parts = token.split('.');
        const payloadStr = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
        const payload = JSON.parse(payloadStr);
        return NextResponse.redirect(new URL(getDashboardRedirect(payload.role), request.url));
      } catch (e) {
        // Continue to login page if token is corrupt
      }
    }
  }

  return NextResponse.next();
}

function getDashboardRedirect(role: string): string {
  switch (role) {
    case 'ADMINISTRATOR':
      return '/dashboard/admin';
    case 'MAINTENANCE_OFFICER':
      return '/dashboard/officer';
    case 'STUDENT_STAFF':
    default:
      return '/dashboard/student';
  }
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/register'],
};
