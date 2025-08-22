
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import db from '@/lib/db';
import type { User, Visit } from '@/lib/types';
import { generateGatePass } from '@/ai/flows/gatePass';

// Helper function to find user by email
function findUserByEmail(email: string): User | undefined {
  const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
  const user = stmt.get(email) as User | undefined;
  return user;
}

// Helper function to find user by ID
function findUserById(id: string): User | undefined {
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    const user = stmt.get(id) as User | undefined;
    return user;
}

const registerSchema = z.object({
  name: z.string().min(3, { message: 'Name must be at least 3 characters.' }),
  email: z.string().email({ message: 'Invalid email address.' }),
  flatNumber: z.string().min(1, { message: 'Flat number is required.' }),
  role: z.enum(['owner', 'tenant']),
  password: z
    .string()
    .min(6, { message: 'Password must be at least 6 characters.' }),
});

export async function registerUser(prevState: any, formData: FormData) {
  const data = Object.fromEntries(formData.entries());
  const parsed = registerSchema.safeParse(data);

  if (!parsed.success) {
    return {
      success: false,
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const { name, email, flatNumber, role, password } = parsed.data;

  // Check if owner exists for the flat
  const ownerStmt = db.prepare("SELECT * FROM users WHERE flatNumber = ? AND role = 'owner' AND status = 'approved'");
  const ownerExists = ownerStmt.get(flatNumber);

  if (role === 'owner' && ownerExists) {
     return {
      success: false,
      message: 'This flat already has an approved owner.',
    };
  }

  // Check if tenant exists for the flat
  const tenantStmt = db.prepare("SELECT * FROM users WHERE flatNumber = ? AND role = 'tenant' AND status = 'approved'");
  const tenantExists = tenantStmt.get(flatNumber);

  if (role === 'tenant' && tenantExists) {
     return {
      success: false,
      message: 'This flat already has an approved tenant.',
    };
  }

  const newUser: User = {
    id: `user-${Date.now()}`,
    name,
    email,
    flatNumber,
    role,
    passwordHash: password, // In a real app, hash this password
    status: 'pending',
  };

  const insertStmt = db.prepare(`
    INSERT INTO users (id, name, email, flatNumber, role, status, passwordHash)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertStmt.run(newUser.id, newUser.name, newUser.email, newUser.flatNumber, newUser.role, newUser.status, newUser.passwordHash);

  revalidatePath('/admin');
  return {
    success: true,
    pendingUser: newUser
  }
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
});

export async function loginUser(formData: FormData) {
  const data = Object.fromEntries(formData.entries());
  const parsed = loginSchema.safeParse(data);

  if (!parsed.success) {
    redirect('/?error=validation_failed');
    return;
  }

  const { email, password } = parsed.data;

  const user = findUserByEmail(email);

  if (!user || user.passwordHash !== password || user.status !== 'approved') {
    redirect('/?error=invalid_credentials');
    return;
  }
  
  // Fake session by redirecting. In a real app, use cookies/sessions.
  if (user.email === 'admin@society.com') {
    redirect('/admin');
  } else {
    redirect('/dashboard');
  }
}

export async function logout() {
  // In a real app, you'd clear session cookies here.
  redirect('/');
}


export async function approveRegistration(userId: string) {
  const stmt = db.prepare("UPDATE users SET status = 'approved' WHERE id = ?");
  stmt.run(userId);
  revalidatePath('/admin');
}

export async function rejectRegistration(userId: string) {
  const stmt = db.prepare("UPDATE users SET status = 'rejected' WHERE id = ?");
  stmt.run(userId);
  revalidatePath('/admin');
}

const logEntrySchema = z.object({
    visitorName: z.string().min(1, 'Visitor name is required'),
    visitorType: z.enum(['Guest', 'Delivery', 'Other']),
    flatNumber: z.string().min(1, 'Flat number is required'),
});

export async function logEntry(formData: FormData) {
    const data = Object.fromEntries(formData.entries());
    const parsed = logEntrySchema.safeParse(data);

    if(!parsed.success) {
        console.error('Validation failed:', parsed.error.flatten().fieldErrors);
        return { error: 'Validation failed' };
    }

    const newVisit: Omit<Visit, 'entryTime'> & {entryTime: string} = {
        id: `visit-${Date.now()}`,
        ...parsed.data,
        entryTime: new Date().toISOString(),
        status: 'Inside',
        approvedBy: 'admin-001', // Assume admin is logging
    };
    const stmt = db.prepare(`
        INSERT INTO visits (id, visitorName, visitorType, flatNumber, entryTime, status, approvedBy)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(newVisit.id, newVisit.visitorName, newVisit.visitorType, newVisit.flatNumber, newVisit.entryTime, newVisit.status, newVisit.approvedBy);

    revalidatePath('/admin');
    return { success: true };
}


export async function markAsExited(visitId: string) {
  const stmt = db.prepare("UPDATE visits SET status = 'Exited', exitTime = ? WHERE id = ?");
  stmt.run(new Date().toISOString(), visitId);
  revalidatePath('/admin');
  revalidatePath('/dashboard');
}

const preApproveSchema = z.object({
    guestName: z.string().min(1, 'Guest name is required'),
    purpose: z.string().min(1, 'Purpose of visit is required'),
});

export async function preApproveGuest(formData: FormData) {
    const data = Object.fromEntries(formData.entries());
    const parsed = preApproveSchema.safeParse(data);

    if(!parsed.success) {
        console.error('Validation failed:', parsed.error.flatten().fieldErrors);
        return { error: 'Validation failed' };
    }

    // This would be the logged-in user in a real app.
    // We'll fake it by finding the first approved tenant.
    const residentStmt = db.prepare("SELECT * FROM users WHERE status = 'approved' AND role = 'tenant' LIMIT 1");
    const resident = residentStmt.get() as User | undefined;
    
    if (!resident) {
        return { error: 'Could not find a resident to approve for.' };
    }

    try {
        const gatePassData = await generateGatePass({
            ...parsed.data,
            flatNumber: resident.flatNumber,
        });

        const newVisit: Omit<Visit, 'entryTime'> & {entryTime: string} = {
            id: `visit-${Date.now()}`,
            visitorName: parsed.data.guestName,
            visitorType: 'Guest',
            flatNumber: resident.flatNumber,
            entryTime: new Date().toISOString(),
            status: 'Pre-Approved',
            gatePassCode: gatePassData.qrData,
            approvedBy: resident.id,
        };
        const stmt = db.prepare(`
            INSERT INTO visits (id, visitorName, visitorType, flatNumber, entryTime, status, gatePassCode, approvedBy)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run(newVisit.id, newVisit.visitorName, newVisit.visitorType, newVisit.flatNumber, newVisit.entryTime, newVisit.status, newVisit.gatePassCode, newVisit.approvedBy);


        revalidatePath('/dashboard');
        return { success: true, gatePass: { ...gatePassData, visitorName: parsed.data.guestName, flatNumber: resident.flatNumber } };
    } catch(error) {
        console.error("AI Flow failed:", error);
        return { error: 'Failed to generate gate pass.' };
    }
}


export async function getPendingUsers(): Promise<User[]> {
    const stmt = db.prepare("SELECT * FROM users WHERE status = 'pending'");
    return stmt.all() as User[];
}

export async function getLiveVisits(): Promise<Visit[]> {
    const stmt = db.prepare("SELECT * FROM visits WHERE status = 'Inside'");
    const visits = stmt.all() as any[];
    return visits.map(v => ({ ...v, entryTime: new Date(v.entryTime) }));
}

export async function getMyVisits(): Promise<Visit[]> {
    // Faking logged in user 'user-002'
    const stmt = db.prepare("SELECT * FROM visits WHERE approvedBy = 'user-002'");
    const visits = stmt.all() as any[];
    return visits.map(v => ({ ...v, entryTime: new Date(v.entryTime) }));
}
