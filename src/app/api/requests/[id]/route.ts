import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(
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

    const request = db.prepare(`
      SELECT r.*, c.name as categoryName, u.fullName as creatorName, u.email as creatorEmail
      FROM Request r
      JOIN RequestCategory c ON r.categoryId = c.id
      JOIN User u ON r.creatorId = u.id
      WHERE r.id = ?
    `).get(requestId) as any;

    if (!request) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    // Role check
    if (user.role.name === 'STUDENT_STAFF' && request.creatorId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch assignments
    const assignments = db.prepare(`
      SELECT a.*, o.fullName as officerName, o.email as officerEmail, b.fullName as assignerName
      FROM Assignment a
      JOIN User o ON a.officerId = o.id
      JOIN User b ON a.assignedById = b.id
      WHERE a.requestId = ?
    `).all(requestId) as any[];

    if (user.role.name === 'MAINTENANCE_OFFICER') {
      const isAssigned = assignments.some(
        (asg) => asg.officerId === user.id
      );
      if (!isAssigned) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Fetch status logs
    const statusLogs = db.prepare(`
      SELECT l.*, u.fullName as userName, r.name as roleName
      FROM StatusLog l
      JOIN User u ON l.userId = u.id
      JOIN Role r ON u.roleId = r.id
      WHERE l.requestId = ?
      ORDER BY l.createdAt ASC
    `).all(requestId) as any[];

    // Format output object
    const formattedRequest = {
      id: request.id,
      title: request.title,
      description: request.description,
      categoryId: request.categoryId,
      status: request.status,
      priority: request.priority,
      imagePath: request.imagePath,
      creatorId: request.creatorId,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
      category: {
        name: request.categoryName
      },
      creator: {
        id: request.creatorId,
        fullName: request.creatorName,
        email: request.creatorEmail
      },
      assignments: assignments.map(a => ({
        id: a.id,
        officerId: a.officerId,
        officer: {
          id: a.officerId,
          fullName: a.officerName,
          email: a.officerEmail
        },
        assignedBy: {
          fullName: a.assignerName
        }
      })),
      statusLogs: statusLogs.map(l => ({
        id: l.id,
        newStatus: l.newStatus,
        previousStatus: l.previousStatus,
        comment: l.comment,
        createdAt: l.createdAt,
        user: {
          fullName: l.userName,
          role: {
            name: l.roleName
          }
        }
      }))
    };

    return NextResponse.json({ request: formattedRequest });
  } catch (error) {
    console.error('Fetch request detail error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role.name !== 'ADMINISTRATOR') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const requestId = parseInt(id);

    // Delete request. SQLite ON DELETE CASCADE will handle Assignment and StatusLog table cleanup automatically.
    db.prepare('DELETE FROM Request WHERE id = ?').run(requestId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete request error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
