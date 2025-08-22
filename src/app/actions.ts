
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import db from '@/lib/db';
import type { User, Visit } from '@/lib/types';
import { generateGatePass } from '@/ai/flows/gatePass';
import { shareGatePass } from '@/ai/flows/shareGatePass';
import { gatePassSchema } from '@/lib/types';

// Helper function to find user by email
function findUserByEmail(email: string): User | undefined {
  return db.users.find(u => u.email === email);
}

// Helper function to find user by ID
function findUserById(id: string): User | undefined {
    return db.users.find(u => u.id === id);
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
  const ownerExists = db.users.find(u => u.flatNumber === flatNumber && u.role === 'owner' && u.status === 'approved');

  if (role === 'owner' && ownerExists) {
     return {
      success: false,
      message: 'This flat already has an approved owner.',
    };
  }

  // Check if tenant exists for the flat
  const tenantExists = db.users.find(u => u.flatNumber === flatNumber && u.role === 'tenant' && u.status === 'approved');

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

  db.users.create(newUser);

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

export async function loginUser(prevState: any, formData: FormData) {
  const data = Object.fromEntries(formData.entries());
  const parsed = loginSchema.safeParse(data);

  if (!parsed.success) {
    return {
        success: false,
        message: 'Invalid data provided.',
        errors: parsed.error.flatten().fieldErrors,
    };
  }

  const { email, password } = parsed.data;

  const user = findUserByEmail(email);

  if (!user || user.passwordHash !== password) {
    return {
        success: false,
        message: 'Invalid email or password.',
    };
  }

  if (user.status !== 'approved') {
    return {
        success: false,
        message: 'Your account is not approved yet.',
    };
  }
  
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
  db.users.update(userId, { status: 'approved' });
  revalidatePath('/admin');
}

export async function rejectRegistration(userId: string) {
  db.users.update(userId, { status: 'rejected' });
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

    const newVisit: Visit = {
        id: `visit-${Date.now()}`,
        ...parsed.data,
        entryTime: new Date().toISOString(),
        status: 'Inside',
        approvedBy: 'admin-001', // Assume admin is logging
    };
    db.visits.create(newVisit);

    revalidatePath('/admin');
    return { success: true };
}


export async function markAsExited(visitId: string) {
  db.visits.update(visitId, { status: 'Exited', exitTime: new Date().toISOString() });
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
    const resident = db.users.find(u => u.status === 'approved' && u.role === 'tenant');
    
    if (!resident) {
        return { error: 'Could not find a resident to approve for.' };
    }

    try {
        const gatePassData = await generateGatePass({
            ...parsed.data,
            flatNumber: resident.flatNumber,
        });

        const expiryTime = new Date();
        expiryTime.setHours(expiryTime.getHours() + 12);

        const newVisit: Visit = {
            id: `visit-${Date.now()}`,
            visitorName: parsed.data.guestName,
            visitorType: 'Guest',
            flatNumber: resident.flatNumber,
            entryTime: new Date().toISOString(),
            status: 'Pre-Approved',
            gatePassCode: gatePassData.qrData,
            approvedBy: resident.id,
            gatePassExpiresAt: expiryTime.toISOString(),
        };
        db.visits.create(newVisit);

        revalidatePath('/dashboard');
        return { success: true, gatePass: { ...gatePassData, visitorName: parsed.data.guestName, flatNumber: resident.flatNumber, validUntil: expiryTime.toISOString() } };
    } catch(error) {
        console.error("AI Flow failed:", error);
        return { error: 'Failed to generate gate pass.' };
    }
}

const shareGatePassSchema = z.object({
  gatePass: gatePassSchema.extend({
      visitorName: z.string(),
      flatNumber: z.string(),
  }),
  shareMethod: z.enum(['email', 'sms']),
  contactInfo: z.string(),
});

export async function shareGatePassAction(input: z.infer<typeof shareGatePassSchema>) {
    const parsed = shareGatePassSchema.safeParse(input);
    if (!parsed.success) {
        return { success: false, error: 'Invalid input.' };
    }
    
    try {
        const response = await shareGatePass(parsed.data);
        return { success: true, message: response.message };
    } catch (error) {
        console.error('Share Gate Pass AI Flow failed:', error);
        return { success: false, error: 'Failed to send gate pass.' };
    }
}


export async function getPendingUsers(): Promise<User[]> {
    return db.users.filter(u => u.status === 'pending');
}

export async function getLiveVisits(): Promise<Visit[]> {
    const visits = db.visits.filter(v => v.status === 'Inside');
    return visits.map(v => ({ ...v, entryTime: new Date(v.entryTime).toISOString() }));
}

export async function getMyVisits(): Promise<Visit[]> {
    // Faking logged in user 'user-002'
    const resident = db.users.find(u => u.status === 'approved' && u.role === 'tenant');
    if (!resident) return [];

    const visits = db.visits.filter(v => v.approvedBy === resident.id).sort((a, b) => new Date(b.entryTime).getTime() - new Date(a.entryTime).getTime());
    return visits.map(v => ({ ...v, entryTime: new Date(v.entryTime).toISOString(), gatePassExpiresAt: v.gatePassExpiresAt ? new Date(v.gatePassExpiresAt).toISOString() : undefined }));
}
