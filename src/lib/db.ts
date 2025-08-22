
import Database from 'better-sqlite3';
import type { User, Visit } from './types';

const db = new Database('society.db');

// Create tables if they don't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    flatNumber TEXT NOT NULL,
    role TEXT NOT NULL,
    status TEXT NOT NULL,
    passwordHash TEXT NOT NULL
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS visits (
    id TEXT PRIMARY KEY,
    visitorName TEXT NOT NULL,
    visitorType TEXT NOT NULL,
    flatNumber TEXT NOT NULL,
    entryTime TEXT NOT NULL,
    exitTime TEXT,
    status TEXT NOT NULL,
    gatePassCode TEXT,
    approvedBy TEXT NOT NULL,
    FOREIGN KEY (approvedBy) REFERENCES users(id)
  );
`);

// Seed initial data if tables are empty
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
if (userCount.count === 0) {
  const insertUser = db.prepare(`
    INSERT INTO users (id, name, email, flatNumber, role, status, passwordHash)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  db.transaction((users: Omit<User, 'mobile'>[]) => {
    for (const user of users) {
      insertUser.run(user.id, user.name, user.email, user.flatNumber, user.role, user.status, user.passwordHash);
    }
  })([
    { id: 'admin-001', name: 'Admin User', email: 'admin@society.com', flatNumber: 'A-101', role: 'owner', status: 'approved', passwordHash: 'password123' },
    { id: 'user-001', name: 'John Doe', email: 'john.doe@example.com', flatNumber: 'B-203', role: 'owner', status: 'approved', passwordHash: 'password123' },
    { id: 'user-002', name: 'Jane Smith', email: 'jane.smith@example.com', flatNumber: 'C-401', role: 'tenant', status: 'approved', passwordHash: 'password123' },
    { id: 'user-003', name: 'Peter Jones', email: 'peter.jones@example.com', flatNumber: 'A-102', role: 'owner', status: 'pending', passwordHash: 'password123' },
    { id: 'user-004', name: 'Mary Jane', email: 'mary.jane@example.com', flatNumber: 'B-203', role: 'tenant', status: 'pending', passwordHash: 'password123' },
  ]);
}

const visitCount = db.prepare('SELECT COUNT(*) as count FROM visits').get() as { count: number };
if (visitCount.count === 0) {
    const insertVisit = db.prepare(`
        INSERT INTO visits (id, visitorName, visitorType, flatNumber, entryTime, exitTime, status, gatePassCode, approvedBy)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    db.transaction((visits: Omit<Visit, 'entryTime' | 'exitTime' | 'status'> & { entryTime: Date, exitTime?: Date, status: string }[]) => {
        for (const visit of visits) {
            insertVisit.run(
                visit.id,
                visit.visitorName,
                visit.visitorType,
                visit.flatNumber,
                visit.entryTime.toISOString(),
                visit.exitTime?.toISOString(),
                visit.status,
                visit.gatePassCode,
                visit.approvedBy
            );
        }
    })([
        { id: 'visit-001', visitorName: 'Alice', visitorType: 'Guest', flatNumber: 'B-203', entryTime: new Date(Date.now() - 2 * 3600000), exitTime: new Date(Date.now() - 3600000), status: 'Exited', gatePassCode: 'ABC12345', approvedBy: 'user-001' },
        { id: 'visit-002', visitorName: 'Zomato Delivery', visitorType: 'Delivery', flatNumber: 'C-401', entryTime: new Date(Date.now() - 1800000), status: 'Inside', approvedBy: 'user-002' },
        { id: 'visit-003', visitorName: 'Bob', visitorType: 'Guest', flatNumber: 'C-401', entryTime: new Date(Date.now() - 3600000), status: 'Inside', approvedBy: 'user-002' },
        { id: 'visit-004', visitorName: 'Charlie', visitorType: 'Guest', flatNumber: 'B-203', entryTime: new Date(), status: 'Pre-Approved', gatePassCode: 'XYZ98765', approvedBy: 'user-001' },
    ]);
}

export default db;
