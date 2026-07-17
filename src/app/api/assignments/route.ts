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
    const request = db.prepare('SELECT status FROM Request WHERE id = ?').get(rId) as any;
    if (!request) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    const previousStatus = request.status;

    // Verify officer
    const officer = db.prepare(`
      SELECT u.id, u.fullName, r.name as roleName 
      FROM User u 
      JOIN Role r ON u.roleId = r.id 
      WHERE u.id = ?
    `).get(oId) as any;

    if (!officer || officer.roleName !== 'MAINTENANCE_OFFICER') {
      return NextResponse.json(
        { error: 'Target user is not a maintenance officer' },
        { status: 400 }
      );
    }

    // Run transaction
    db.exec('BEGIN TRANSACTION');
    try {
      // 1. Remove previous assignments
      db.prepare('DELETE FROM Assignment WHERE requestId = ?').run(rId);

      // 2. Insert new assignment
      db.prepare(`
        INSERT INTO Assignment (requestId, officerId, assignedById)
        VALUES (?, ?, ?)
      `).run(rId, oId, user.id);

      // 3. Update request status to ASSIGNED
      db.prepare(`
        UPDATE Request 
        SET status = 'ASSIGNED', updatedAt = CURRENT_TIMESTAMP 
        WHERE id = ?
      `).run(rId);

      // 4. Create StatusLog entry
      db.prepare(`
        INSERT INTO StatusLog (requestId, userId, previousStatus, newStatus, comment)
        VALUES (?, ?, ?, 'ASSIGNED', ?)
      `).run(
        rId,
        user.id,
        previousStatus,
        `Request assigned to ${officer.fullName} by Admin.`
      );

      db.exec('COMMIT');
    } catch (txError) {
      db.exec('ROLLBACK');
      throw txError;
    }

    const assignment = db.prepare(`
      SELECT a.*, o.fullName as officerName 
      FROM Assignment a 
      JOIN User o ON a.officerId = o.id 
      WHERE a.requestId = ?
    `).get(rId) as any;

    return NextResponse.json({
      success: true,
      assignment: {
        id: assignment.id,
        officer: {
          id: assignment.officerId,
          fullName: assignment.officerName
        }
      }
    });
  } catch (error) {
    console.error('Assignment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
