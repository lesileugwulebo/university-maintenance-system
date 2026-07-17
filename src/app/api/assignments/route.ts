import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const user = await getUserFromRequest(req);
    if (!user || user.role.name !== 'ADMINISTRATOR') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { requestId, officerId } = await req.json();

    if (!requestId || !officerId) {
      return NextResponse.json(
        { error: 'requestId and officerId are required' },
        { status: 400 }
      );
    }

    const rId = parseInt(requestId);
    const oId = parseInt(officerId);

    // Verify request
    const request = await db.get('SELECT status FROM Request WHERE id = ?', [rId]);
    if (!request) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    const previousStatus = request.status;

    // Verify officer
    const officer = await db.get(`
      SELECT u.id, u.fullName, r.name as roleName 
      FROM User u 
      JOIN Role r ON u.roleId = r.id 
      WHERE u.id = ?
    `, [oId]);

    if (!officer || officer.roleName !== 'MAINTENANCE_OFFICER') {
      return NextResponse.json(
        { error: 'Target user is not a maintenance officer' },
        { status: 400 }
      );
    }

    // 1. Remove previous assignments
    await db.run('DELETE FROM Assignment WHERE requestId = ?', [rId]);

    // 2. Insert new assignment
    await db.run(`
      INSERT INTO Assignment (requestId, officerId, assignedById)
      VALUES (?, ?, ?)
    `, [rId, oId, user.id]);

    // 3. Update request status to ASSIGNED
    await db.run(`
      UPDATE Request 
      SET status = 'ASSIGNED', updatedAt = CURRENT_TIMESTAMP 
      WHERE id = ?
    `, [rId]);

    // 4. Create StatusLog entry
    await db.run(`
      INSERT INTO StatusLog (requestId, userId, previousStatus, newStatus, comment)
      VALUES (?, ?, ?, 'ASSIGNED', ?)
    `, [rId, user.id, previousStatus, `Request assigned to ${officer.fullName} by Admin.`]);

    const assignment = await db.get(`
      SELECT a.*, o.fullName as officerName 
      FROM Assignment a 
      JOIN User o ON a.officerId = o.id 
      WHERE a.requestId = ?
    `, [rId]);

    return NextResponse.json({
      success: true,
      assignment: {
        id: assignment.id,
        officer: {
          id: assignment.officerId,
          fullName: assignment.officerName,
        },
      },
    });
  } catch (error) {
    console.error('Assignment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
