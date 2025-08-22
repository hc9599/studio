
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { users, visits } from '@/lib/data';
import type { Visit } from '@/lib/types';
import { generateGatePass } from '@/ai/flows/gatePass';

const registerSchema = z.object({
  name: z.string().min(3, 'Name is too short'),
  email: z.string().email(),
  flatNumber: z.string().min(1, 'Flat number is required'),
  role: z.enum(['owner', 'tenant']),
  password: z.string().min(6, 'Password is too short'),
});

export async function registerUser(formData: FormData) {
  const data = Object.fromEntries(formData.entries());
  const parsed = registerSchema.safeParse(data);

  if (!parsed.success) {
    // In a real app, you'd return error messages to the form.
    console.error('Validation failed:', parsed.error.flatten().fieldErrors);
    redirect('/register?error=validation_failed');
    return;
  }

  const { name, email, flatNumber, role, password } = parsed.data;

  // Check if flat is already registered by an owner
  const ownerExists = users.some(
    (u) => u.flatNumber === flatNumber && u.role === 'owner' && u.status === 'approved'
  );
  if (ownerExists) {
    redirect('/register?error=flat_already_has_owner');
    return;
  }

  // Check if flat already has a tenant
  const tenantExists = users.some(
    (u) => u.flatNumber === flatNumber && u.role === 'tenant' && u.status === 'approved'
  );
  if (tenantExists) {
    redirect('/register?error=flat_already_has_tenant');
    return;
  }

  // Add user to pending list
  users.push({
    id: `user-${Date.now()}`,
    name,
    email,
    flatNumber,
    role,
    passwordHash: password, // In a real app, hash this password
    status: 'pending',
  });

  revalidatePath('/admin');
  redirect('/register?success=true');
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function loginUser(formData: FormData) {
  const data = Object.fromEntries(formData.entries());
  const parsed = loginSchema.safeParse(data);

  if (!parsed.success) {
    redirect('/?error=validation_failed');
    return;
  }

  const { email, password } = parsed.data;

  const user = users.find((u) => u.email === email && u.passwordHash === password && u.status === 'approved');

  if (!user) {
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

export async function approveRegistration(userId: string) {
  const user = users.find((u) => u.id === userId);
  if (user) {
    user.status = 'approved';
  }
  revalidatePath('/admin');
}

export async function rejectRegistration(userId: string) {
  const user = users.find((u) => u.id === userId);
  if (user) {
    user.status = 'rejected';
  }
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
        entryTime: new Date(),
        status: 'Inside',
        approvedBy: 'admin-001', // Assume admin is logging
    };
    visits.unshift(newVisit);
    revalidatePath('/admin');
    return { success: true };
}


export async function markAsExited(visitId: string) {
  const visit = visits.find((v) => v.id === visitId);
  if (visit) {
    visit.status = 'Exited';
    visit.exitTime = new Date();
  }
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

    // This would be the logged-in user in a real app
    const resident = users.find(u => u.status === 'approved' && u.role !== 'owner' && u.email.includes('jane'))!; 

    try {
        const gatePassData = await generateGatePass({
            ...parsed.data,
            flatNumber: resident.flatNumber,
        });

        const newVisit: Visit = {
            id: `visit-${Date.now()}`,
            visitorName: parsed.data.guestName,
            visitorType: 'Guest',
            flatNumber: resident.flatNumber,
            entryTime: new Date(),
            status: 'Pre-Approved',
            gatePassCode: gatePassData.qrData,
            approvedBy: resident.id,
        };
        visits.unshift(newVisit);

        revalidatePath('/dashboard');
        return { success: true, gatePass: { ...gatePassData, visitorName: parsed.data.guestName, flatNumber: resident.flatNumber } };
    } catch(error) {
        console.error("AI Flow failed:", error);
        return { error: 'Failed to generate gate pass.' };
    }
}
