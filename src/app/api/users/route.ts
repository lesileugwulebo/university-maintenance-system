import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { hashPassword } from '@/lib/crypto';

export async function GET(req: Request) {
  try {
    const currentUser = await getUserFromRequest(req);
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const roleParam = searchParams.get('role');

    // Filter for maintenance officers (accessible by admin and officers)
    if (roleParam === 'MAINTENANCE_OFFICER') {
      const officers = db.prepare(`
        SELECT u.id, u.fullName, u.email 
        FROM User u 
        JOIN Role r ON u.roleId = r.id 
        WHERE r.name = 'MAINTENANCE_OFFICER'
        ORDER BY u.fullName ASC
      `).all() as any[];
      return NextResponse.json({ users: officers });
    }

    // Only Admin can list all users
    if (currentUser.role.name !== 'ADMINISTRATOR') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const userRows = db.prepare(`
      SELECT u.id, u.email, u.username, u.fullName, u.roleId, r.name as roleName 
      FROM User u 
      JOIN Role r ON u.roleId = r.id 
      ORDER BY u.fullName ASC
    `).all() as any[];

    const formattedUsers = userRows.map(u => ({
      id: u.id,
      email: u.email,
      username: u.username,
      fullName: u.fullName,
      roleId: u.roleId,
      role: {
        name: u.roleName
      }
    }));

    const roles = db.prepare('SELECT * FROM Role').all();

    return NextResponse.json({ users: formattedUsers, roles });
  } catch (error) {
    console.error('Fetch users error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const currentUser = await getUserFromRequest(req);
    if (!currentUser || currentUser.role.name !== 'ADMINISTRATOR') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { email, username, password, fullName, roleId } = await req.json();

    if (!email || !username || !password || !fullName || !roleId) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Check conflict
    const existing = db.prepare(
      'SELECT id FROM User WHERE email = ? OR username = ?'
    ).get(email, username);

    if (existing) {
      return NextResponse.json(
        { error: 'Email or username already in use' },
        { status: 409 }
      );
    }

    const hashedPassword = hashPassword(password);
    const result = db.prepare(`
      INSERT INTO User (email, username, password, fullName, roleId)
      VALUES (?, ?, ?, ?, ?)
    `).run(email, username, hashedPassword, fullName, parseInt(roleId));

    const userId = Number(result.lastInsertRowid);
    const createdUser = db.prepare('SELECT id, email, username, fullName, roleId FROM User WHERE id = ?').get(userId);

    return NextResponse.json({ user: createdUser }, { status: 201 });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const currentUser = await getUserFromRequest(req);
    if (!currentUser || currentUser.role.name !== 'ADMINISTRATOR') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id, email, username, fullName, roleId, password } = await req.json();

    if (!id || !email || !username || !fullName || !roleId) {
      return NextResponse.json(
        { error: 'All fields except password are required' },
        { status: 400 }
      );
    }

    const userId = parseInt(id);

    // Validate conflicts
    const conflict = db.prepare(
      'SELECT id FROM User WHERE id != ? AND (email = ? OR username = ?)'
    ).get(userId, email, username);

    if (conflict) {
      return NextResponse.json(
        { error: 'Email or username already in use' },
        { status: 409 }
      );
    }

    if (password && password.trim() !== '') {
      const hashedPassword = hashPassword(password);
      db.prepare(`
        UPDATE User 
        SET email = ?, username = ?, fullName = ?, roleId = ?, password = ? 
        WHERE id = ?
      `).run(email, username, fullName, parseInt(roleId), hashedPassword, userId);
    } else {
      db.prepare(`
        UPDATE User 
        SET email = ?, username = ?, fullName = ?, roleId = ? 
        WHERE id = ?
      `).run(email, username, fullName, parseInt(roleId), userId);
    }

    const updatedUser = db.prepare('SELECT id, email, username, fullName, roleId FROM User WHERE id = ?').get(userId);

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
