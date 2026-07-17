import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const user = await getUserFromRequest(req);
    if (!user || user.role.name !== 'ADMINISTRATOR') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('export');

    // Fetch all requests with relational fields
    const requests = db.prepare(`
      SELECT r.*, c.name as categoryName, u.fullName as creatorName, u.email as creatorEmail, o.fullName as officerName
      FROM Request r
      JOIN RequestCategory c ON r.categoryId = c.id
      JOIN User u ON r.creatorId = u.id
      LEFT JOIN Assignment a ON r.id = a.requestId
      LEFT JOIN User o ON a.officerId = o.id
      ORDER BY r.createdAt DESC
    `).all() as any[];

    if (mode === 'csv') {
      const headers = [
        'Request ID',
        'Title',
        'Description',
        'Reporter Name',
        'Reporter Email',
        'Category',
        'Priority',
        'Status',
        'Assigned Officer',
        'Created Date',
        'Updated Date',
      ];

      const escapeCSV = (val: any) => {
        if (val === null || val === undefined) return '""';
        const str = String(val);
        return `"${str.replace(/"/g, '""')}"`;
      };

      const rows = requests.map((r) => {
        const officerName = r.officerName || 'Unassigned';
        return [
          r.id,
          escapeCSV(r.title),
          escapeCSV(r.description),
          escapeCSV(r.creatorName),
          escapeCSV(r.creatorEmail),
          escapeCSV(r.categoryName),
          escapeCSV(r.priority),
          escapeCSV(r.status),
          escapeCSV(officerName),
          escapeCSV(r.createdAt),
          escapeCSV(r.updatedAt),
        ];
      });

      const csvContent = [
        headers.join(','),
        ...rows.map((row) => row.join(',')),
      ].join('\n');

      return new Response(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="university_maintenance_report.csv"',
        },
      });
    }

    // JSON metrics
    const totalRequests = requests.length;
    const pendingCount = requests.filter((r) => r.status === 'PENDING').length;
    const assignedCount = requests.filter((r) => r.status === 'ASSIGNED').length;
    const inProgressCount = requests.filter((r) => r.status === 'IN_PROGRESS').length;
    const completedCount = requests.filter((r) => r.status === 'COMPLETED').length;
    const cancelledCount = requests.filter((r) => r.status === 'CANCELLED').length;

    // Categories breakdown
    const categoryCounts: Record<string, number> = {};
    requests.forEach((r) => {
      categoryCounts[r.categoryName] = (categoryCounts[r.categoryName] || 0) + 1;
    });

    const categoryBreakdown = Object.entries(categoryCounts).map(([name, count]) => ({
      name,
      count,
    }));

    // Priorities breakdown
    const priorityCounts = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
    requests.forEach((r) => {
      const p = r.priority as keyof typeof priorityCounts;
      if (priorityCounts[p] !== undefined) {
        priorityCounts[p]++;
      }
    });

    // Recent 50 audit logs
    const auditLogs = db.prepare(`
      SELECT l.*, r.title as requestTitle, u.fullName as userName, rl.name as roleName
      FROM StatusLog l
      JOIN Request r ON l.requestId = r.id
      JOIN User u ON l.userId = u.id
      JOIN Role rl ON u.roleId = rl.id
      ORDER BY l.createdAt DESC
      LIMIT 50
    `).all() as any[];

    const formattedAudit = auditLogs.map(log => ({
      id: log.id,
      requestId: log.requestId,
      previousStatus: log.previousStatus,
      newStatus: log.newStatus,
      comment: log.comment,
      createdAt: log.createdAt,
      request: {
        id: log.requestId,
        title: log.requestTitle
      },
      user: {
        fullName: log.userName,
        role: {
          name: log.roleName
        }
      }
    }));

    return NextResponse.json({
      summary: {
        total: totalRequests,
        pending: pendingCount,
        assigned: assignedCount,
        inProgress: inProgressCount,
        completed: completedCount,
        cancelled: cancelledCount,
      },
      categoryBreakdown,
      priorityBreakdown: Object.entries(priorityCounts).map(([name, count]) => ({
        name,
        count,
      })),
      auditLogs: formattedAudit,
    });
  } catch (error) {
    console.error('Reports endpoint error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
