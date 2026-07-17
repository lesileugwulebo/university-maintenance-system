import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const requestId = parseInt(id);
    const { status, comment } = await req.json();

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    // Retrieve request
    const request = await db.get(
      'SELECT id, creatorId, status FROM Request WHERE id = ?',
      [requestId]
    );

    if (!request) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    // Fetch assignments
    const assignments = await db.all(
      'SELECT officerId FROM Assignment WHERE requestId = ?',
      [requestId]
    );

    const previousStatus = request.status;

    // Validate role permissions
    if (user.role.name === 'STUDENT_STAFF') {
      if (request.creatorId !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      if (status !== 'CANCELLED') {
        return NextResponse.json(
          { error: 'Students can only cancel their requests' },
          { status: 400 }
        );
      }
    } else if (user.role.name === 'MAINTENANCE_OFFICER') {
      const isAssigned = assignments.some((asg) => asg.officerId === user.id);
      if (!isAssigned) {
        return NextResponse.json(
          { error: 'You are not assigned to this service request' },
          { status: 403 }
        );
      }
      if (status !== 'IN_PROGRESS' && status !== 'COMPLETED') {
        return NextResponse.json(
          { error: 'Officers can only set status to IN_PROGRESS or COMPLETED' },
          { status: 400 }
        );
      }
    } else if (user.role.name !== 'ADMINISTRATOR') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update Request status & log
    await db.run(`
      UPDATE Request 
      SET status = ?, updatedAt = CURRENT_TIMESTAMP 
      WHERE id = ?
    `, [status, requestId]);

    await db.run(`
      INSERT INTO StatusLog (requestId, userId, previousStatus, newStatus, comment)
      VALUES (?, ?, ?, ?, ?)
    `, [
      requestId,
      user.id,
      previousStatus,
      status,
      comment || `Status updated from ${previousStatus} to ${status}.`,
    ]);

    const updatedRequest = await db.get('SELECT * FROM Request WHERE id = ?', [requestId]);

    return NextResponse.json({ request: updatedRequest });
  } catch (error) {
    console.error('Update status API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
