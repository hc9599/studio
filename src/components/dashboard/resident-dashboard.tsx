
'use client';

import { getMyVisits, preApproveGuest } from '@/app/actions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import type { Visit } from '@/lib/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ticket, UserPlus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { GatePassDialog } from './gate-pass-dialog';
import type { gatePassSchema } from '@/lib/types';

const preApproveSchema = z.object({
  guestName: z.string().min(1, 'Guest name is required'),
  purpose: z.string().min(1, 'Purpose of visit is required'),
});

type GatePassData = z.infer<typeof gatePassSchema> & { visitorName: string, flatNumber: string };


export function ResidentDashboard() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gatePassData, setGatePassData] = useState<GatePassData | null>(null);
  const { toast } = useToast();
  
  const [myVisits, setMyVisits] = useState<Visit[]>([]);

  const fetchVisits = () => {
    getMyVisits().then(setMyVisits);
  }

  useEffect(() => {
    fetchVisits();
  }, []);

  const form = useForm<z.infer<typeof preApproveSchema>>({
    resolver: zodResolver(preApproveSchema),
    defaultValues: {
      guestName: '',
      purpose: '',
    },
  });

  async function onSubmit(values: z.infer<typeof preApproveSchema>) {
    setIsSubmitting(true);
    setGatePassData(null);
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => formData.append(key, value));
    
    const result = await preApproveGuest(formData);
    
    if (result.success && result.gatePass) {
        toast({ title: 'Success', description: 'Gate pass generated successfully!' });
        setGatePassData(result.gatePass as GatePassData);
        fetchVisits();
        form.reset();
    } else {
        toast({ variant: 'destructive', title: 'Error', description: result.error || 'Failed to generate gate pass.' });
    }
    
    setIsSubmitting(false);
  }

  const handleShareClick = (visit: Visit) => {
    if (!visit.gatePassCode) return;
    
    const passData: GatePassData = {
        displayInfo: [
            `Guest: ${visit.visitorName}`,
            `Flat: ${visit.flatNumber}`
        ],
        qrData: visit.gatePassCode,
        instructions: "Show this pass at the gate for entry.", // Generic instruction for re-share
        visitorName: visit.visitorName,
        flatNumber: visit.flatNumber,
        validUntil: visit.gatePassExpiresAt?.toISOString(),
    };
    setGatePassData(passData);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GatePassDialog gatePassData={gatePassData} setGatePassData={setGatePassData} />
        <div className="lg:col-span-1">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <UserPlus className="mr-2 h-5 w-5" />
                        Pre-Approve Visitor
                    </CardTitle>
                    <CardDescription>
                        Generate a gate pass for your upcoming guest.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="guestName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Guest Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g., Alex Ray" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="purpose"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Purpose of Visit</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="e.g., Dinner party, study session" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" className="w-full" disabled={isSubmitting}>
                                {isSubmitting ? 'Generating...' : 'Generate Gate Pass'}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
        <div className="lg:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle>Visitor History</CardTitle>
                    <CardDescription>A log of your past and present visitors.</CardDescription>
                </CardHeader>
                <CardContent>
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Visitor</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Entry Time</TableHead>
                                <TableHead>Gate Pass</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {myVisits.length > 0 ? (
                                myVisits.map((visit: Visit) => (
                                    <TableRow key={visit.id}>
                                        <TableCell className="font-medium">{visit.visitorName}</TableCell>
                                        <TableCell>
                                            <Badge variant={
                                                visit.status === 'Inside' ? 'destructive' : 
                                                visit.status === 'Pre-Approved' ? 'default' : 'secondary'
                                            } className={visit.status === 'Inside' ? 'bg-green-500 hover:bg-green-600' : ''}>{visit.status}</Badge>
                                        </TableCell>
                                        <TableCell>{new Date(visit.entryTime).toLocaleDateString()}</TableCell>
                                        <TableCell>{visit.status !== "Pre-Approved" ? new Date(visit.entryTime).toLocaleTimeString() : '-'}</TableCell>
                                        <TableCell>
                                            {visit.gatePassCode ? (
                                                <Button variant="ghost" size="sm" onClick={() => handleShareClick(visit)}>
                                                    <Ticket className="mr-2 h-4 w-4" />
                                                    {visit.gatePassCode}
                                                </Button>
                                            ) : '-'}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center">No visitor history found.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
