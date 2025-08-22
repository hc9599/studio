
import { z } from 'zod';

export type User = {
  id: string;
  name: string;
  email: string;
  mobile?: string;
  flatNumber: string;
  role: 'owner' | 'tenant';
  status: 'pending' | 'approved' | 'rejected';
  passwordHash: string;
};

export type Visit = {
  id: string;
  visitorName: string;
  visitorType: 'Guest' | 'Delivery' | 'Other';
  flatNumber: string;
  entryTime: Date;
  exitTime?: Date;
  status: 'Inside' | 'Exited' | 'Pre-Approved';
  gatePassCode?: string;
  approvedBy: string; // User ID
  gatePassExpiresAt?: Date;
};

export const gatePassSchema = z.object({
  displayInfo: z
    .array(z.string())
    .describe('Key information to display on the gate pass for the guard.'),
  qrData: z.string().describe('A unique alphanumeric code for this pass.'),
  instructions: z.string().describe('Brief instructions for the guest.'),
  validUntil: z.string().optional().describe('The expiry time of the gate pass.'),
});

export type GatePassOutput = z.infer<typeof gatePassSchema>;

export const gatePassInputSchema = z.object({
  guestName: z.string(),
  purpose: z.string(),
  flatNumber: z.string(),
});

export type GatePassInput = z.infer<typeof gatePassInputSchema>;
