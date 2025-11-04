'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Mail,
  Lock,
  Loader2,
  ArrowRight,
  User,
  LayoutDashboard,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/layout/Header';
import { HypeConnectLogo } from '@/components/icons';
import { signInWithEmail, getUserRoles } from '@/lib/auth';
import type { User as FirebaseUser } from 'firebase/auth';

const loginFormSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

export default function LoginPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [user, setUser] = React.useState<FirebaseUser | null>(null);
  const [roles, setRoles] = React.useState<string[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = React.useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(data: LoginFormValues) {
    setIsSubmitting(true);
    try {
      const userCredential = await signInWithEmail(data.email, data.password);
      setUser(userCredential.user);

      setIsLoadingRoles(true);
      const userRoles = await getUserRoles(userCredential.user.uid);
      setRoles(userRoles);
      setIsLoadingRoles(false);

      if (userRoles.length <= 1) {
        handleRoleSelection(userRoles[0] || 'spotlight');
      }
      // If user has more than one role, we wait for them to select one.
    } catch (error: any) {
      console.error('Login Error:', error);
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description:
          error.code === 'auth/invalid-credential'
            ? 'Invalid email or password.'
            : 'An unexpected error occurred. Please try again.',
      });
      setIsSubmitting(false);
    }
  }

  function handleRoleSelection(role: string) {
    toast({
      title: 'Login Successful!',
      description: `Welcome back! You are logged in as a ${role}.`,
    });
    if (role === 'hypeman') {
      router.push('/dashboard');
    } else {
      router.push('/dashboard/user');
    }
    router.refresh(); // This ensures the header updates
  }

  if (user) {
    return (
      <>
        <Header />
        <main className="container flex-1 flex items-center justify-center py-12">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <HypeConnectLogo className="h-16 w-16 mx-auto text-primary neon-glow-primary" />
              <CardTitle className="text-2xl font-headline mt-4">
                Welcome, {user.displayName || 'User'}!
              </CardTitle>
              <CardDescription>
                How do you want to continue?
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingRoles ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="animate-spin" />
                  <p className="ml-2">Loading your roles...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {roles.includes('hypeman') && (
                    <Button
                      size="lg"
                      className="w-full justify-between"
                      onClick={() => handleRoleSelection('hypeman')}
                    >
                      <span>
                        <LayoutDashboard className="inline mr-2" />
                        Continue as Hypeman
                      </span>
                      <ArrowRight />
                    </Button>
                  )}
                  {roles.includes('spotlight') && (
                    <Button
                      size="lg"
                      variant="secondary"
                      className="w-full justify-between"
                      onClick={() => handleRoleSelection('spotlight')}
                    >
                      <span>
                        <User className="inline mr-2" />
                        Continue as Spotlight
                      </span>
                      <ArrowRight />
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="container flex-1 flex items-center justify-center py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <HypeConnectLogo className="h-16 w-16 mx-auto text-primary neon-glow-primary" />
            <CardTitle className="text-2xl font-headline mt-4">
              Welcome Back
            </CardTitle>
            <CardDescription>
              Enter your credentials to access your account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Mail /> Email
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="your.email@example.com"
                          {...field}
                        />
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
                      <FormLabel className="flex items-center gap-2">
                        <Lock /> Password
                      </FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  size="lg"
                  className="w-full glowing-accent-btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting && (
                    <Loader2 className="animate-spin mr-2" />
                  )}
                  Sign In
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex justify-center text-sm">
            <p className="text-muted-foreground">
              Don't have an account?&nbsp;
              <Link
                href="/signup"
                className="text-primary hover:underline font-semibold"
              >
                Sign Up
              </Link>
            </p>
          </CardFooter>
        </Card>
      </main>
    </>
  );
}
