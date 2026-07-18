import mysql from 'mysql2/promise';
import { DatabaseSync } from 'node:sqlite';
import { join } from 'path';
import { hashPassword } from './crypto';

let sqliteDbInstance: DatabaseSync | null = null;
let mysqlPool: mysql.Pool | null = null;

function getSqliteDb(): DatabaseSync {
  if (!sqliteDbInstance) {
    const dbPath = join(process.cwd(), 'dev.db');
    sqliteDbInstance = new DatabaseSync(dbPath);
  }
  return sqliteDbInstance;
}

const USE_MYSQL = process.env.DATABASE_TYPE === 'mysql' || process.env.MYSQL_HOST !== undefined;

if (USE_MYSQL) {
  try {
    const mysqlConfig = {
      host: process.env.MYSQL_HOST || 'localhost',
      port: parseInt(process.env.MYSQL_PORT || '3306'),
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'miva_maintenance',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    };
    mysqlPool = mysql.createPool(mysqlConfig);
  } catch (err) {
    console.warn('⚠️ Could not initialize MySQL pool. Using SQLite fallback.');
    mysqlPool = null;
  }
}

export const db = {
  isMySQL(): boolean {
    return mysqlPool !== null;
  },

  async query(sql: string, params: any[] = []): Promise<any> {
    if (mysqlPool) {
      try {
        const [rows] = await mysqlPool.query(sql, params);
        return rows;
      } catch (err: any) {
        if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND' || err.code === 'ER_ACCESS_DENIED_ERROR' || err.code === 'ER_BAD_DB_ERROR') {
          console.warn(`⚠️ MySQL (${err.code}). Falling back to SQLite...`);
          mysqlPool = null;
          return this.query(sql, params);
        }
        throw err;
      }
    }
    const stmt = getSqliteDb().prepare(sql);
    return stmt.all(...params);
  },

  async get(sql: string, params: any[] = []): Promise<any> {
    if (mysqlPool) {
      try {
        const [rows]: any = await mysqlPool.query(sql, params);
        return rows && rows.length > 0 ? rows[0] : null;
      } catch (err: any) {
        if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND' || err.code === 'ER_ACCESS_DENIED_ERROR' || err.code === 'ER_BAD_DB_ERROR') {
          console.warn(`⚠️ MySQL (${err.code}). Falling back to SQLite...`);
          mysqlPool = null;
          return this.get(sql, params);
        }
        throw err;
      }
    }
    const stmt = getSqliteDb().prepare(sql);
    return stmt.get(...params);
  },

  async all(sql: string, params: any[] = []): Promise<any[]> {
    if (mysqlPool) {
      try {
        const [rows]: any = await mysqlPool.query(sql, params);
        return rows as any[];
      } catch (err: any) {
        if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND' || err.code === 'ER_ACCESS_DENIED_ERROR' || err.code === 'ER_BAD_DB_ERROR') {
          console.warn(`⚠️ MySQL (${err.code}). Falling back to SQLite...`);
          mysqlPool = null;
          return this.all(sql, params);
        }
        throw err;
      }
    }
    const stmt = getSqliteDb().prepare(sql);
    return stmt.all(...params) as any[];
  },

  async run(sql: string, params: any[] = []): Promise<{ lastInsertRowid: number; changes: number }> {
    if (mysqlPool) {
      try {
        const [result]: any = await mysqlPool.query(sql, params);
        return {
          lastInsertRowid: Number(result.insertId || 0),
          changes: Number(result.affectedRows || 0),
        };
      } catch (err: any) {
        if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND' || err.code === 'ER_ACCESS_DENIED_ERROR' || err.code === 'ER_BAD_DB_ERROR') {
          console.warn(`⚠️ MySQL (${err.code}). Falling back to SQLite...`);
          mysqlPool = null;
          return this.run(sql, params);
        }
        throw err;
      }
    }
    const stmt = getSqliteDb().prepare(sql);
    const res = stmt.run(...params);
    return {
      lastInsertRowid: Number(res.lastInsertRowid || 0),
      changes: Number(res.changes || 0),
    };
  },

  async exec(sql: string): Promise<void> {
    if (mysqlPool) {
      try {
        await mysqlPool.query(sql);
        return;
      } catch (err: any) {
        if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND' || err.code === 'ER_ACCESS_DENIED_ERROR' || err.code === 'ER_BAD_DB_ERROR') {
          mysqlPool = null;
          return this.exec(sql);
        }
        throw err;
      }
    }
    getSqliteDb().exec(sql);
  },

  prepare(sql: string) {
    return {
      get: (...params: any[]) => this.get(sql, params),
      all: (...params: any[]) => this.all(sql, params),
      run: (...params: any[]) => this.run(sql, params),
    };
  },
};

async function initDatabase() {
  try {
    if (mysqlPool) {
      try {
        await mysqlPool.query(`CREATE TABLE IF NOT EXISTS Role (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255) UNIQUE NOT NULL);`);
        await mysqlPool.query(`CREATE TABLE IF NOT EXISTS User (id INT AUTO_INCREMENT PRIMARY KEY, email VARCHAR(255) UNIQUE NOT NULL, username VARCHAR(255) UNIQUE NOT NULL, password VARCHAR(255) NOT NULL, fullName VARCHAR(255) NOT NULL, roleId INT NOT NULL, createdAt DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(roleId) REFERENCES Role(id));`);
        await mysqlPool.query(`CREATE TABLE IF NOT EXISTS RequestCategory (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255) UNIQUE NOT NULL);`);
        await mysqlPool.query(`CREATE TABLE IF NOT EXISTS Request (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255) NOT NULL, description TEXT NOT NULL, categoryId INT NOT NULL, status VARCHAR(50) DEFAULT 'PENDING', priority VARCHAR(50) DEFAULT 'MEDIUM', imagePath VARCHAR(500), creatorId INT NOT NULL, createdAt DATETIME DEFAULT CURRENT_TIMESTAMP, updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, FOREIGN KEY(categoryId) REFERENCES RequestCategory(id), FOREIGN KEY(creatorId) REFERENCES User(id));`);
        await mysqlPool.query(`CREATE TABLE IF NOT EXISTS Assignment (id INT AUTO_INCREMENT PRIMARY KEY, requestId INT NOT NULL, officerId INT NOT NULL, assignedById INT NOT NULL, assignedAt DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(requestId) REFERENCES Request(id) ON DELETE CASCADE, FOREIGN KEY(officerId) REFERENCES User(id), FOREIGN KEY(assignedById) REFERENCES User(id));`);
        await mysqlPool.query(`CREATE TABLE IF NOT EXISTS StatusLog (id INT AUTO_INCREMENT PRIMARY KEY, requestId INT NOT NULL, userId INT NOT NULL, previousStatus VARCHAR(50) NOT NULL, newStatus VARCHAR(50) NOT NULL, comment TEXT, createdAt DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(requestId) REFERENCES Request(id) ON DELETE CASCADE, FOREIGN KEY(userId) REFERENCES User(id));`);

        const [userRows]: any = await mysqlPool.query("SELECT COUNT(*) as count FROM User");
        if (userRows[0].count === 0) {
          console.log('🌱 Seeding MySQL database with default roles, categories, and accounts...');
          await mysqlPool.query("INSERT IGNORE INTO Role (name) VALUES ('ADMINISTRATOR'), ('MAINTENANCE_OFFICER'), ('STUDENT_STAFF')");
          const [adminRole]: any = await mysqlPool.query("SELECT id FROM Role WHERE name = 'ADMINISTRATOR'");
          const [officerRole]: any = await mysqlPool.query("SELECT id FROM Role WHERE name = 'MAINTENANCE_OFFICER'");
          const [studentRole]: any = await mysqlPool.query("SELECT id FROM Role WHERE name = 'STUDENT_STAFF'");

          const categories = ['Faulty Electricity', 'Damaged Furniture', 'Leaking Pipes', 'Internet Problems', 'Classroom Equipment', 'Hostel Maintenance'];
          for (const cat of categories) {
            await mysqlPool.query("INSERT IGNORE INTO RequestCategory (name) VALUES (?)", [cat]);
          }

          await mysqlPool.query("INSERT IGNORE INTO User (email, username, password, fullName, roleId) VALUES (?, ?, ?, ?, ?)", ['admin@miva.edu', 'admin', hashPassword('admin123'), 'Principal Administrator', adminRole[0].id]);
          await mysqlPool.query("INSERT IGNORE INTO User (email, username, password, fullName, roleId) VALUES (?, ?, ?, ?, ?)", ['officer@miva.edu', 'officer', hashPassword('officer123'), 'John Doe (Maintenance)', officerRole[0].id]);
          await mysqlPool.query("INSERT IGNORE INTO User (email, username, password, fullName, roleId) VALUES (?, ?, ?, ?, ?)", ['student@miva.edu', 'student', hashPassword('student123'), 'Alice Smith (Student)', studentRole[0].id]);
        }
        return;
      } catch (err: any) {
        console.warn(`⚠️ MySQL initialization failed (${err.code}). Using SQLite fallback.`);
        mysqlPool = null;
      }
    }

    // SQLite Initialization
    const sqlite = getSqliteDb();
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS Role (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE NOT NULL);
      CREATE TABLE IF NOT EXISTS User (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT UNIQUE NOT NULL, username TEXT UNIQUE NOT NULL, password TEXT NOT NULL, fullName TEXT NOT NULL, roleId INTEGER NOT NULL, createdAt DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(roleId) REFERENCES Role(id));
      CREATE TABLE IF NOT EXISTS RequestCategory (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE NOT NULL);
      CREATE TABLE IF NOT EXISTS Request (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, description TEXT NOT NULL, categoryId INTEGER NOT NULL, status TEXT DEFAULT 'PENDING', priority TEXT DEFAULT 'MEDIUM', imagePath TEXT, creatorId INTEGER NOT NULL, createdAt DATETIME DEFAULT CURRENT_TIMESTAMP, updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(categoryId) REFERENCES RequestCategory(id), FOREIGN KEY(creatorId) REFERENCES User(id));
      CREATE TABLE IF NOT EXISTS Assignment (id INTEGER PRIMARY KEY AUTOINCREMENT, requestId INTEGER NOT NULL, officerId INTEGER NOT NULL, assignedById INTEGER NOT NULL, assignedAt DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(requestId) REFERENCES Request(id) ON DELETE CASCADE, FOREIGN KEY(officerId) REFERENCES User(id), FOREIGN KEY(assignedById) REFERENCES User(id));
      CREATE TABLE IF NOT EXISTS StatusLog (id INTEGER PRIMARY KEY AUTOINCREMENT, requestId INTEGER NOT NULL, userId INTEGER NOT NULL, previousStatus TEXT NOT NULL, newStatus TEXT NOT NULL, comment TEXT, createdAt DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(requestId) REFERENCES Request(id) ON DELETE CASCADE, FOREIGN KEY(userId) REFERENCES User(id));
    `);

    const userCheck = sqlite.prepare("SELECT COUNT(*) as count FROM User").get() as { count: number };
    if (userCheck.count === 0) {
      console.log('🌱 Seeding database with default roles, categories, and accounts...');
      const insertRole = sqlite.prepare("INSERT OR IGNORE INTO Role (name) VALUES (?)");
      insertRole.run('ADMINISTRATOR');
      insertRole.run('MAINTENANCE_OFFICER');
      insertRole.run('STUDENT_STAFF');

      const getRole = sqlite.prepare("SELECT id FROM Role WHERE name = ?");
      const adminRoleId = (getRole.get('ADMINISTRATOR') as any).id;
      const officerRoleId = (getRole.get('MAINTENANCE_OFFICER') as any).id;
      const studentRoleId = (getRole.get('STUDENT_STAFF') as any).id;

      const insertCategory = sqlite.prepare("INSERT OR IGNORE INTO RequestCategory (name) VALUES (?)");
      ['Faulty Electricity', 'Damaged Furniture', 'Leaking Pipes', 'Internet Problems', 'Classroom Equipment', 'Hostel Maintenance'].forEach((cat) => insertCategory.run(cat));

      const insertUser = sqlite.prepare("INSERT OR IGNORE INTO User (email, username, password, fullName, roleId) VALUES (?, ?, ?, ?, ?)");
      insertUser.run('admin@miva.edu', 'admin', hashPassword('admin123'), 'Principal Administrator', adminRoleId);
      insertUser.run('officer@miva.edu', 'officer', hashPassword('officer123'), 'John Doe (Maintenance)', officerRoleId);
      insertUser.run('student@miva.edu', 'student', hashPassword('student123'), 'Alice Smith (Student)', studentRoleId);
    }
  } catch (err) {
    console.error('Database Initialization Error:', err);
  }
}

initDatabase();
