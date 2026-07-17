import { DatabaseSync } from 'node:sqlite';
import { join } from 'path';
import { hashPassword } from './crypto';

const dbPath = join(process.cwd(), 'dev.db');
export const db = new DatabaseSync(dbPath);

// Initialize DB schema & seed default data on bootstrap
try {
  // 1. Create Tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS Role (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS User (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      fullName TEXT NOT NULL,
      roleId INTEGER NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(roleId) REFERENCES Role(id)
    );

    CREATE TABLE IF NOT EXISTS RequestCategory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS Request (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      categoryId INTEGER NOT NULL,
      status TEXT DEFAULT 'PENDING', -- PENDING, ASSIGNED, IN_PROGRESS, COMPLETED, CANCELLED
      priority TEXT DEFAULT 'MEDIUM', -- LOW, MEDIUM, HIGH, CRITICAL
      imagePath TEXT,
      creatorId INTEGER NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(categoryId) REFERENCES RequestCategory(id),
      FOREIGN KEY(creatorId) REFERENCES User(id)
    );

    CREATE TABLE IF NOT EXISTS Assignment (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      requestId INTEGER NOT NULL,
      officerId INTEGER NOT NULL,
      assignedById INTEGER NOT NULL,
      assignedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(requestId) REFERENCES Request(id) ON DELETE CASCADE,
      FOREIGN KEY(officerId) REFERENCES User(id),
      FOREIGN KEY(assignedById) REFERENCES User(id)
    );

    CREATE TABLE IF NOT EXISTS StatusLog (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      requestId INTEGER NOT NULL,
      userId INTEGER NOT NULL,
      previousStatus TEXT NOT NULL,
      newStatus TEXT NOT NULL,
      comment TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(requestId) REFERENCES Request(id) ON DELETE CASCADE,
      FOREIGN KEY(userId) REFERENCES User(id)
    );
  `);

  // 2. Seed default data if User table is empty
  const userCheck = db.prepare("SELECT COUNT(*) as count FROM User").get() as { count: number };
  
  if (userCheck.count === 0) {
    console.log('Seeding SQLite database with default roles, categories, and accounts...');
    
    // Seed Roles
    const insertRole = db.prepare("INSERT OR IGNORE INTO Role (name) VALUES (?)");
    insertRole.run('ADMINISTRATOR');
    insertRole.run('MAINTENANCE_OFFICER');
    insertRole.run('STUDENT_STAFF');

    // Fetch Role IDs
    const getRole = db.prepare("SELECT id FROM Role WHERE name = ?");
    const adminRoleId = (getRole.get('ADMINISTRATOR') as any).id;
    const officerRoleId = (getRole.get('MAINTENANCE_OFFICER') as any).id;
    const studentRoleId = (getRole.get('STUDENT_STAFF') as any).id;

    // Seed Request Categories
    const insertCategory = db.prepare("INSERT OR IGNORE INTO RequestCategory (name) VALUES (?)");
    const categories = [
      'Faulty Electricity',
      'Damaged Furniture',
      'Leaking Pipes',
      'Internet Problems',
      'Classroom Equipment',
      'Hostel Maintenance',
    ];
    categories.forEach(cat => insertCategory.run(cat));

    // Fetch Category IDs
    const getCat = db.prepare("SELECT id FROM RequestCategory WHERE name = ?");
    const electricityCatId = (getCat.get('Faulty Electricity') as any).id;
    const internetCatId = (getCat.get('Internet Problems') as any).id;
    const furnitureCatId = (getCat.get('Damaged Furniture') as any).id;

    // Seed Default Users
    const insertUser = db.prepare(`
      INSERT OR IGNORE INTO User (email, username, password, fullName, roleId)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const adminPw = hashPassword('admin123');
    const officerPw = hashPassword('officer123');
    const studentPw = hashPassword('student123');

    insertUser.run('admin@miva.edu', 'admin', adminPw, 'Principal Administrator', adminRoleId);
    insertUser.run('officer@miva.edu', 'officer', officerPw, 'John Doe (Maintenance)', officerRoleId);
    insertUser.run('student@miva.edu', 'student', studentPw, 'Alice Smith (Student)', studentRoleId);

    // Fetch User IDs
    const getUser = db.prepare("SELECT id FROM User WHERE email = ?");
    const adminUserId = (getUser.get('admin@miva.edu') as any).id;
    const officerUserId = (getUser.get('officer@miva.edu') as any).id;
    const studentUserId = (getUser.get('student@miva.edu') as any).id;

    // Seed Sample Requests
    const insertRequest = db.prepare(`
      INSERT INTO Request (title, description, categoryId, priority, status, creatorId)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const insertLog = db.prepare(`
      INSERT INTO StatusLog (requestId, userId, previousStatus, newStatus, comment)
      VALUES (?, ?, ?, ?, ?)
    `);

    const insertAsg = db.prepare(`
      INSERT INTO Assignment (requestId, officerId, assignedById)
      VALUES (?, ?, ?)
    `);

    // Request 1: Pending electricity report
    const req1 = insertRequest.run(
      'A/C unit leaking water in Lecture Room 3',
      'The split unit air conditioner is constantly leaking water onto the floor, making it slippery and dangerous for lectures.',
      electricityCatId,
      'HIGH',
      'PENDING',
      studentUserId
    );
    const req1Id = req1.lastInsertRowid;
    insertLog.run(req1Id, studentUserId, 'NONE', 'PENDING', 'Initial request submitted by student.');

    // Request 2: Assigned internet router issue
    const req2 = insertRequest.run(
      'Hostel Block B Wifi Router Offline',
      'The router on the 2nd floor of Block B has no power light. No internet connection since last night.',
      internetCatId,
      'CRITICAL',
      'ASSIGNED',
      studentUserId
    );
    const req2Id = req2.lastInsertRowid;
    insertLog.run(req2Id, studentUserId, 'NONE', 'PENDING', 'Initial request submitted.');
    insertLog.run(req2Id, adminUserId, 'PENDING', 'ASSIGNED', 'Router offline reported. Assigned to John for immediate repair.');
    insertAsg.run(req2Id, officerUserId, adminUserId);

    // Request 3: Completed furniture repair
    const req3 = insertRequest.run(
      'Broken chair armrests in Seminar Room B',
      'Three chairs in the back row have loose or broken wooden armrests. Need fixing or replacement.',
      furnitureCatId,
      'LOW',
      'COMPLETED',
      studentUserId
    );
    const req3Id = req3.lastInsertRowid;
    insertLog.run(req3Id, studentUserId, 'NONE', 'PENDING', 'Initial request.');
    insertLog.run(req3Id, adminUserId, 'PENDING', 'ASSIGNED', 'Assigned to maintenance team.');
    insertLog.run(req3Id, officerUserId, 'ASSIGNED', 'COMPLETED', 'Fixed with wood glue and screws. Chairs are back in order.');
    insertAsg.run(req3Id, officerUserId, adminUserId);

    console.log('Database successfully seeded.');
  }
} catch (error) {
  console.error('SQLite Database Initialization Error:', error);
}
