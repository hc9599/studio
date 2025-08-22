
'use client';

import { loginUser } from '@/app/actions';
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
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { KeyRound, Mail } from 'lucide-react';
import Link from 'next/link';
import { useActionState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z
    .string()
    .min(6, { message: 'Password must be at least 6 characters.' }),
});

export default function LoginPage() {
  const { toast } = useToast();
  const [formState, formAction, isPending] = useActionState(loginUser, {
    success: false,
    errors: {},
    message: '',
  });

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  useEffect(() => {
    if (!formState.success && formState.message) {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: formState.message,
      });
    }
  }, [formState, toast]);

  return (
    <AuthFormWrapper
      title="SocietyConnect"
      description="Sign in to your account"
    >
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(() => {
            const formData = new FormData();
            const a = form.getValues();
            Object.keys(a).forEach((key) =>
              formData.append(key, a[key as keyof typeof a])
            );
            formAction(formData);
          })}
          className="space-y-6"
        >
          <div className="space-y-4">
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
            {isPending ? 'Logging in...' : 'Login'}
          </Button>
        </form>
      </Form>
      <p className="text-center text-sm text-muted-foreground">
        Don't have an account?{' '}
        <Link
          href="/register"
          className="font-medium text-primary hover:underline"
        >
          Register here
        </Link>
      </p>
    </AuthFormWrapper>
  );
}
