'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Header } from '@/components/layout/Header';
import { useToast } from '@/hooks/use-toast';
import { HypeConnectLogo } from '@/components/icons';
import { initiateEmailSignIn } from '@/firebase/non-blocking-login';
import { useAuth, useUser } from '@/firebase';
import { Loader2 } from 'lucide-react';

const loginFormSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });
  
  React.useEffect(() => {
    // If user is already logged in, redirect them.
    // We can decide where they should go, for now, let's check account type.
    if (!isUserLoading && user) {
        // A simple way to check for hypeman, in a real app this would be more robust (e.g., custom claims)
        const isHypeman = user.email?.includes('hypeman');
        if (isHypeman) {
            router.push('/dashboard');
        } else {
            router.push('/dashboard/user');
        }
    }
  }, [user, isUserLoading, router]);

  function onSubmit(data: LoginFormValues) {
    setIsSubmitting(true);
    // This function doesn't return a promise, it relies on the onAuthStateChanged listener
    initiateEmailSignIn(auth, data.email, data.password);
    
    // We can't immediately know if login was successful here.
    // The useEffect hook will handle redirection on successful login.
    // We can show a toast and wait.
    toast({
      title: 'Logging In...',
      description: 'Please wait while we check your credentials.',
    });
    
    // We might need a way to handle login failure.
    // For now, let's assume it works and the useEffect redirects.
    // A more robust solution would involve listening for auth errors.
    setTimeout(() => {
        setIsSubmitting(false);
    }, 3000) // Reset submit button after a few seconds if redirect doesn't happen
  }

  if (isUserLoading || user) {
      return (
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-background">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 text-lg text-muted-foreground">Loading your experience...</p>
        </div>
      );
  }

  return (
    <>
      <Header />
      <main className="container flex-1 flex items-center justify-center py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <HypeConnectLogo className="h-12 w-12 text-primary neon-glow-primary" />
            </div>
            <CardTitle className="text-2xl font-headline">Welcome Back</CardTitle>
            <CardDescription>
              Log in to your HypeConnect account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="you@awesome.com" {...field} />
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
                        <Input type="password" placeholder="********" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" size="lg" className="w-full glowing-accent-btn" disabled={isSubmitting}>
                   {isSubmitting ? (
                        <>
                            <Loader2 className="animate-spin mr-2" />
                            Signing In...
                        </>
                    ) : (
                        'Log In'
                    )}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="justify-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link href="/signup" className="text-accent hover:underline">
                Sign Up
              </Link>
            </p>
          </CardFooter>
        </Card>
      </main>
    </>
  );
}
