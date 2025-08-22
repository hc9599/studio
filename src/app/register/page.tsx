
'use client';

import { registerUser } from '@/app/actions';
import { AuthFormWrapper } from '@/components/auth-form-wrapper';
import { Button } from '@/components/ui/button';
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
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { Home, KeyRound, Mail, User, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useActionState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const registerSchema = z.object({
  name: z.string().min(3, { message: 'Name must be at least 3 characters.' }),
  email: z.string().email({ message: 'Invalid email address.' }),
  flatNumber: z.string().min(1, { message: 'Flat number is required.' }),
  role: z.enum(['owner', 'tenant']),
  password: z
    .string()
    .min(6, { message: 'Password must be at least 6 characters.' }),
});

export default function RegisterPage() {
  const { toast } = useToast();

  const [formState, formAction, isPending] = useActionState(registerUser, {
    success: false,
    errors: {},
    message: '',
    pendingUser: undefined
  });

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      flatNumber: '',
      role: 'owner',
      password: '',
    },
  });

  useEffect(() => {
    if (formState.success && formState.pendingUser) {
        form.reset();
    } else if (!formState.success && formState.errors) {
      Object.entries(formState.errors).forEach(([key, value]) => {
        if (value) {
            form.setError(key as keyof z.infer<typeof registerSchema>, {
                type: 'manual',
                message: value[0],
            });
        }
      });
    }
    if (!formState.success && formState.message) {
      toast({
        variant: 'destructive',
        title: 'Registration Failed',
        description: formState.message,
      });
    }
  }, [formState, form, toast]);


  if(formState.success && formState.pendingUser) {
    return (
      <AuthFormWrapper
        title="Registration Submitted"
        description="Your registration is now pending admin approval."
      >
        <Alert variant="default" className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Success!</AlertTitle>
            <AlertDescription className="text-green-700">
                Your request has been sent to the admin.
            </AlertDescription>
        </Alert>

        <Card className="mt-6">
            <CardHeader>
                <CardTitle className="text-lg">Your Submitted Details</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
                <p><strong>Name:</strong> {formState.pendingUser.name}</p>
                <p><strong>Email:</strong> {formState.pendingUser.email}</p>
                <p><strong>Flat:</strong> {formState.pendingUser.flatNumber}</p>
                <p><strong>Role:</strong> {formState.pendingUser.role}</p>
            </CardContent>
        </Card>
        
        <Button asChild className="w-full mt-6">
            <Link href="/">Back to Login</Link>
        </Button>
      </AuthFormWrapper>
    )
  }

  const onSubmit = (data: z.infer<typeof registerSchema>) => {
    const formData = new FormData();
    for (const key in data) {
      formData.append(key, data[key as keyof typeof data]);
    }
    formAction(formData);
  }


  return (
    <AuthFormWrapper
      title="Create Account"
      description="Join the SocietyConnect community"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input {...field} placeholder="John Doe" className="pl-10" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        {...field}
                        type="email"
                        placeholder="john.doe@example.com"
                        className="pl-10"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} name={field.name}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="owner">Owner</SelectItem>
                        <SelectItem value="tenant">Tenant</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            <FormField
              control={form.control}
              name="flatNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Flat Number</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Home className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input {...field} placeholder="e.g., A-401" className="pl-10" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        {...field}
                        type="password"
                        placeholder="••••••••"
                        className="pl-10"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? 'Registering...' : 'Register'}
          </Button>
        </form>
      </Form>
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link
          href="/"
          className="font-medium text-primary hover:underline"
        >
          Login here
        </Link>
      </p>
    </AuthFormWrapper>
  );
}
