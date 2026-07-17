import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { comparePassword, signJWT } from '@/lib/crypto';
import { COOKIE_NAME } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { loginId, password } = await req.json(); // loginId can be email or username

    if (!loginId || !password) {
      return NextResponse.json(
        { error: 'Credentials are required' },
        { status: 400 }
      );
    }

    // Find user by email or username
    const user = db.prepare(`
      SELECT u.*, r.name as roleName 
      FROM User u 
      JOIN Role r ON u.roleId = r.id 
      WHERE u.email = ? OR u.username = ?
    `).get(loginId, loginId) as any;

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email/username or password' },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = comparePassword(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email/username or password' },
        { status: 401 }
      );
    }

    // Create JWT
    const token = signJWT({ userId: user.id, role: user.roleName });

    // Response
    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.fullName,
        role: user.roleName,
      },
    });

    response.headers.set(
      'Set-Cookie',
      `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}` // 7 days
    );

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
