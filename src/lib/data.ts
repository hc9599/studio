
import type { User, Visit } from './types';

// In a real app, this would be a database.
// We're using in-memory arrays for this example.

export const users: User[] = [
  {
    id: 'admin-001',
    name: 'Admin User',
    email: 'admin@society.com',
    flatNumber: 'A-101',
    role: 'owner',
    status: 'approved',
    passwordHash: 'password123', // In a real app, this would be a bcrypt hash
  },
  {
    id: 'user-001',
    name: 'John Doe',
    email: 'john.doe@example.com',
    flatNumber: 'B-203',
    role: 'owner',
    status: 'approved',
    passwordHash: 'password123',
  },
  {
    id: 'user-002',
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    flatNumber: 'C-401',
    role: 'tenant',
    status: 'approved',
    passwordHash: 'password123',
  },
  {
    id: 'user-003',
    name: 'Peter Jones',
    email: 'peter.jones@example.com',
    flatNumber: 'A-102',
    role: 'owner',
    status: 'pending',
    passwordHash: 'password123',
  },
  {
    id: 'user-004',
    name: 'Mary Jane',
    email: 'mary.jane@example.com',
    flatNumber: 'B-203',
    role: 'tenant',
    status: 'pending',
    passwordHash: 'password123',
  },
];

export const visits: Visit[] = [
  {
    id: 'visit-001',
    visitorName: 'Alice',
    visitorType: 'Guest',
    flatNumber: 'B-203',
    entryTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    exitTime: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
    status: 'Exited',
    gatePassCode: 'ABC12345',
    approvedBy: 'user-001',
  },
  {
    id: 'visit-002',
    visitorName: 'Zomato Delivery',
    visitorType: 'Delivery',
    flatNumber: 'C-401',
    entryTime: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    status: 'Inside',
    approvedBy: 'user-002',
  },
  {
    id: 'visit-003',
    visitorName: 'Bob',
    visitorType: 'Guest',
    flatNumber: 'C-401',
    entryTime: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
    status: 'Inside',
    approvedBy: 'user-002',
  },
  {
    id: 'visit-004',
    visitorName: 'Charlie',
    visitorType: 'Guest',
    flatNumber: 'B-203',
    entryTime: new Date(),
    status: 'Pre-Approved',
    gatePassCode: 'XYZ98765',
    approvedBy: 'user-001',
  },
];
