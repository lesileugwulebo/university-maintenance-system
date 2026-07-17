import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, signJWT } from '@/lib/crypto';
import { COOKIE_NAME } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { email, username, password, fullName } = await req.json();

    if (!email || !username || !password || !fullName) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db.get(
      'SELECT id FROM User WHERE email = ? OR username = ?',
      [email, username]
    );

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email or username already registered' },
        { status: 409 }
      );
    }

    // Get the default role for registering users
    const studentRole = await db.get(
      'SELECT id FROM Role WHERE name = ?',
      ['STUDENT_STAFF']
    );

    if (!studentRole) {
      return NextResponse.json(
        { error: 'Database roles not initialized' },
        { status: 500 }
      );
    }

    // Hash password and create user
    const hashedPassword = hashPassword(password);
    const result = await db.run(`
      INSERT INTO User (email, username, password, fullName, roleId)
      VALUES (?, ?, ?, ?, ?)
    `, [email, username, hashedPassword, fullName, studentRole.id]);

    const userId = Number(result.lastInsertRowid);

    // Create JWT
    const token = signJWT({ userId, role: 'STUDENT_STAFF' });

    // Set cookie
    const response = NextResponse.json({
      user: {
        id: userId,
        email,
        username,
        fullName,
        role: 'STUDENT_STAFF',
      },
    });

    response.headers.set(
      'Set-Cookie',
      `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}`
    );

    return response;
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
