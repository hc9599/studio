
'use client';

import { approveRegistration, getLiveVisits, getPendingUsers, logEntry, markAsExited, rejectRegistration } from '@/app/actions';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import type { User, Visit } from '@/lib/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle, PlusCircle, UserPlus, XCircle, UserCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const logEntrySchema = z.object({
  visitorName: z.string().min(1, 'Visitor name is required'),
  visitorType: z.enum(['Guest', 'Delivery', 'Other']),
  flatNumber: z.string().min(1, 'Flat number is required'),
});

export function AdminDashboard() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const form = useForm<z.infer<typeof logEntrySchema>>({
    resolver: zodResolver(logEntrySchema),
    defaultValues: {
      visitorName: '',
      visitorType: 'Guest',
      flatNumber: '',
    },
  });

  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [liveVisits, setLiveVisits] = useState<Visit[]>([]);

  useEffect(() => {
    getPendingUsers().then(setPendingUsers);
    getLiveVisits().then(setLiveVisits);
  }, []);
  

  async function handleLogEntry(data: z.infer<typeof logEntrySchema>) {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, value);
    });
    const result = await logEntry(formData);
    if(result?.success){
      toast({ title: 'Success', description: 'Entry logged successfully.' });
      getLiveVisits().then(setLiveVisits);
      form.reset();
      setOpen(false);
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result?.error || 'Failed to log entry.' });
    }
  }

  async function handleApprove(userId: string) {
    await approveRegistration(userId);
    setPendingUsers(users => users.filter(u => u.id !== userId));
    toast({ title: 'Success', description: 'User approved.' });
  }

  async function handleReject(userId: string) {
      await rejectRegistration(userId);
      setPendingUsers(users => users.filter(u => u.id !== userId));
      toast({ title: 'Success', description: 'User rejected.' });
  }

  async function handleMarkAsExited(visitId: string) {
      await markAsExited(visitId);
      setLiveVisits(visits => visits.filter(v => v.id !== visitId));
      toast({ title: 'Success', description: 'Visitor marked as exited.' });
  }

  return (
    <Tabs defaultValue="approvals">
      <div className="flex justify-between items-center">
        <TabsList>
          <TabsTrigger value="approvals">
            <UserPlus className="w-4 h-4 mr-2" />
            Pending Approvals ({pendingUsers.length})
          </TabsTrigger>
          <TabsTrigger value="log">
            <UserCheck className="w-4 h-4 mr-2" />
            Entry Log ({liveVisits.length})
          </TabsTrigger>
        </TabsList>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Entry
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Log a New Entry</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleLogEntry)} className="space-y-4">
                <FormField control={form.control} name="visitorName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Visitor Name</FormLabel>
                    <FormControl><Input {...field} placeholder="e.g., John Doe" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="visitorType" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Visitor Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Guest">Guest</SelectItem>
                        <SelectItem value="Delivery">Delivery</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="flatNumber" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Flat Number</FormLabel>
                    <FormControl><Input {...field} placeholder="e.g., A-101" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" className="w-full">Log Entry</Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <TabsContent value="approvals" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Registration Requests</CardTitle>
            <CardDescription>
              Review and approve or reject new user registrations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Flat No.</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingUsers.length > 0 ? (
                  pendingUsers.map((user: User) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.flatNumber}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === 'owner' ? 'default' : 'secondary'}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleApprove(user.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(user.id)}
                        >
                           <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">
                      No pending requests.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="log" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Live Entry Log</CardTitle>
            <CardDescription>
              Track all current visitors and deliveries inside the society.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Visitor</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Flat No.</TableHead>
                  <TableHead>Entry Time</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {liveVisits.length > 0 ? (
                  liveVisits.map((visit: Visit) => (
                    <TableRow key={visit.id}>
                      <TableCell className="font-medium">
                        {visit.visitorName}
                      </TableCell>
                      <TableCell>{visit.visitorType}</TableCell>
                      <TableCell>{visit.flatNumber}</TableCell>
                      <TableCell>
                        {visit.entryTime.toLocaleTimeString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          onClick={() => handleMarkAsExited(visit.id)}
                        >
                          Mark as Exited
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      No one is currently inside.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
