import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { uploadImage } from '@/lib/upload';

export async function GET(req: Request) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get('categoryId');
    const priority = searchParams.get('priority');
    const status = searchParams.get('status');
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    let query = `
      SELECT r.*, c.name as categoryName, u.fullName as creatorName, u.email as creatorEmail, u.username as creatorUsername
      FROM Request r
      JOIN RequestCategory c ON r.categoryId = c.id
      JOIN User u ON r.creatorId = u.id
    `;
    let countQuery = `
      SELECT COUNT(*) as count 
      FROM Request r
      JOIN User u ON r.creatorId = u.id
    `;
    
    const whereClauses: string[] = [];
    const params: any[] = [];

    // Role check
    if (user.role.name === 'STUDENT_STAFF') {
      whereClauses.push('r.creatorId = ?');
      params.push(user.id);
    } else if (user.role.name === 'MAINTENANCE_OFFICER') {
      whereClauses.push('r.id IN (SELECT requestId FROM Assignment WHERE officerId = ?)');
      params.push(user.id);
    }

    // Dynamic filters
    if (categoryId) {
      whereClauses.push('r.categoryId = ?');
      params.push(parseInt(categoryId));
    }
    if (priority) {
      whereClauses.push('r.priority = ?');
      params.push(priority);
    }
    if (status) {
      whereClauses.push('r.status = ?');
      params.push(status);
    }
    if (search) {
      whereClauses.push('(r.title LIKE ? OR r.description LIKE ? OR u.fullName LIKE ?)');
      const likeParam = `%${search}%`;
      params.push(likeParam, likeParam, likeParam);
    }

    if (whereClauses.length > 0) {
      const whereSQL = ' WHERE ' + whereClauses.join(' AND ');
      query += whereSQL;
      countQuery += whereSQL;
    }

    query += ' ORDER BY r.createdAt DESC LIMIT ? OFFSET ?';
    
    // Execute count
    const countResult = db.prepare(countQuery).get(...params) as { count: number };
    const total = countResult?.count || 0;

    // Execute requests query
    const requestRows = db.prepare(query).all(...[...params, limit, skip]) as any[];

    // Fetch assignments for each request row and map structure
    const requests = requestRows.map((row) => {
      const assignments = db.prepare(`
        SELECT a.*, o.fullName as officerName
        FROM Assignment a
        JOIN User o ON a.officerId = o.id
        WHERE a.requestId = ?
      `).all(row.id) as any[];

      const formattedAssignments = assignments.map(a => ({
        id: a.id,
        officer: {
          id: a.officerId,
          fullName: a.officerName
        }
      }));

      return {
        id: row.id,
        title: row.title,
        description: row.description,
        status: row.status,
        priority: row.priority,
        imagePath: row.imagePath,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        category: {
          name: row.categoryName
        },
        creator: {
          id: row.creatorId,
          fullName: row.creatorName,
          email: row.creatorEmail,
          username: row.creatorUsername
        },
        assignments: formattedAssignments
      };
    });

    // Fetch categories
    const categories = db.prepare('SELECT * FROM RequestCategory ORDER BY name ASC').all();

    return NextResponse.json({
      requests,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      categories,
    });
  } catch (error) {
    console.error('Fetch requests API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role.name !== 'STUDENT_STAFF') {
      return NextResponse.json(
        { error: 'Only student/staff users can submit requests' },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const categoryIdStr = formData.get('categoryId') as string;
    const priority = formData.get('priority') as string;
    const imageFile = formData.get('image') as File | null;

    if (!title || !description || !categoryIdStr || !priority) {
      return NextResponse.json(
        { error: 'Required fields: title, description, categoryId, priority' },
        { status: 400 }
      );
    }

    const categoryId = parseInt(categoryIdStr);
    const categoryExists = db.prepare(
      'SELECT id FROM RequestCategory WHERE id = ?'
    ).get(categoryId);

    if (!categoryExists) {
      return NextResponse.json(
        { error: 'Invalid category specified' },
        { status: 400 }
      );
    }

    // Process image file
    let imagePath: string | null = null;
    if (imageFile && imageFile.size > 0 && imageFile.name !== 'undefined') {
      try {
        imagePath = await uploadImage(imageFile);
      } catch (uploadError) {
        console.error('File upload error:', uploadError);
        return NextResponse.json(
          { error: 'Failed to process image upload' },
          { status: 500 }
        );
      }
    }

    // Insert Request
    const insertReq = db.prepare(`
      INSERT INTO Request (title, description, categoryId, priority, imagePath, creatorId)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(title, description, categoryId, priority, imagePath, user.id);

    const requestId = Number(insertReq.lastInsertRowid);

    // Insert Log
    db.prepare(`
      INSERT INTO StatusLog (requestId, userId, previousStatus, newStatus, comment)
      VALUES (?, ?, ?, ?, ?)
    `).run(requestId, user.id, 'NONE', 'PENDING', 'Service request created and queued.');

    const newRequest = db.prepare('SELECT * FROM Request WHERE id = ?').get(requestId);

    return NextResponse.json({ request: newRequest }, { status: 201 });
  } catch (error: any) {
    console.error('Create request error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
