'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const registered = searchParams.get('registered');
  const redirectTo = searchParams.get('redirect');

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate form
      if (!formData.email || !formData.password) {
        toast({
          title: 'Missing Information',
          description: 'Please enter both email and password.',
          variant: 'destructive',
        });
        return;
      }

      // No need to initialize, just use the imported auth instance
      await signInWithEmailAndPassword(auth, formData.email, formData.password);

      // Success! Show toast and redirect
      toast({
        title: 'Welcome!',
        description: 'You have been logged in successfully.',
        variant: 'default',
      });
      
      setTimeout(() => {
        // If there's a redirect parameter (e.g., from event page), go there
        // Otherwise, go to home page
        const destination = redirectTo || '/';
        router.push(destination);
      }, 500);
    } catch (err: any) {
      console.error('Login error:', err);

      // Handle specific Firebase errors with user-friendly messages
      let userMessage = 'An error occurred. Please try again.';
      
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        userMessage = 'The email or password you entered is incorrect.';
      } else if (err.code === 'auth/invalid-email') {
        userMessage = 'Please enter a valid email address.';
      } else if (err.code === 'auth/too-many-requests') {
        userMessage = 'Too many login attempts. Please try again later.';
      } else if (err.code === 'auth/network-request-failed') {
        userMessage = 'Network connection failed. Please check your internet.';
      } else if (err.code === 'auth/invalid-credential') {
        userMessage = 'The email or password you entered is incorrect.';
      }
      
      toast({
        title: 'Login Failed',
        description: userMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-md border-primary shadow-lg shadow-primary/20">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-accent">HypeSonovea</CardTitle>
          <CardDescription className="text-muted-foreground">Welcome back</CardDescription>
        </CardHeader>

        <CardContent>
          {registered && (
            <Alert className="mb-4 bg-green-500/20 border-green-500">
              <AlertDescription className="text-green-400">
                Account created successfully! Please log in.
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            <div>
              <label className="text-sm font-medium text-foreground">Email</label>
              <Input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your@email.com"
                className="mt-1 bg-secondary border-primary/50 text-foreground placeholder:text-muted-foreground"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Password</label>
              <Input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="mt-1 bg-secondary border-primary/50 text-foreground placeholder:text-muted-foreground"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground font-semibold hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/50 transition-all"
            >
              {loading ? 'Logging in...' : 'Log In'}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-muted-foreground text-sm">
              Don't have an account?{' '}
              <Link href="/auth/register" className="text-accent hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
