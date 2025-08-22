
import type { User, Visit } from './types';

// In-memory data store
let users: User[] = [];
let visits: Visit[] = [];

// Seed initial data if the store is empty
if (users.length === 0) {
    users = [
        { id: 'admin-001', name: 'Admin User', email: 'admin@society.com', flatNumber: 'A-101', role: 'owner', status: 'approved', passwordHash: 'password123' },
        { id: 'user-001', name: 'John Doe', email: 'john.doe@example.com', flatNumber: 'B-203', role: 'owner', status: 'approved', passwordHash: 'password123' },
        { id: 'user-002', name: 'Jane Smith', email: 'jane.smith@example.com', flatNumber: 'C-401', role: 'tenant', status: 'approved', passwordHash: 'password123' },
        { id: 'user-003', name: 'Peter Jones', email: 'peter.jones@example.com', flatNumber: 'A-102', role: 'owner', status: 'pending', passwordHash: 'password123' },
        { id: 'user-004', name: 'Mary Jane', email: 'mary.jane@example.com', flatNumber: 'B-203', role: 'tenant', status: 'pending', passwordHash: 'password123' },
    ];
}

if (visits.length === 0) {
    visits = [
        { id: 'visit-001', visitorName: 'Alice', visitorType: 'Guest', flatNumber: 'B-203', entryTime: new Date(Date.now() - 2 * 3600000).toISOString(), exitTime: new Date(Date.now() - 3600000).toISOString(), status: 'Exited', gatePassCode: 'ABC12345', approvedBy: 'user-001' },
        { id: 'visit-002', visitorName: 'Zomato Delivery', visitorType: 'Delivery', flatNumber: 'C-401', entryTime: new Date(Date.now() - 1800000).toISOString(), status: 'Inside', approvedBy: 'user-002' },
        { id: 'visit-003', visitorName: 'Bob', visitorType: 'Guest', flatNumber: 'C-401', entryTime: new Date(Date.now() - 3600000).toISOString(), status: 'Inside', approvedBy: 'user-002' },
        { id: 'visit-004', visitorName: 'Charlie', visitorType: 'Guest', flatNumber: 'B-203', entryTime: new Date().toISOString(), status: 'Pre-Approved', gatePassCode: 'XYZ98765', approvedBy: 'user-001', gatePassExpiresAt: new Date(Date.now() + 12 * 3600000).toISOString() },
    ];
}


// Mock database object
const db = {
    users: {
        find: (predicate: (user: User) => boolean) => users.find(predicate),
        filter: (predicate: (user: User) => boolean) => users.filter(predicate),
        create: (user: User) => {
            users.push(user);
            return user;
        },
        update: (id: string, updates: Partial<User>) => {
            const userIndex = users.findIndex(u => u.id === id);
            if (userIndex !== -1) {
                users[userIndex] = { ...users[userIndex], ...updates };
                return users[userIndex];
            }
            return undefined;
        },
    },
    visits: {
        find: (predicate: (visit: Visit) => boolean) => visits.find(predicate),
        filter: (predicate: (visit: Visit) => boolean) => visits.filter(predicate),
        create: (visit: Visit) => {
            visits.push(visit);
            return visit;
        },
        update: (id: string, updates: Partial<Visit>) => {
            const visitIndex = visits.findIndex(v => v.id === id);
            if (visitIndex !== -1) {
                visits[visitIndex] = { ...visits[visitIndex], ...updates };
                return visits[visitIndex];
            }
            return undefined;
        }
    }
};

export default db;
