
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
};
