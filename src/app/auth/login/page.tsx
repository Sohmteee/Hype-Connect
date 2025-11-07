'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get('registered');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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
    setError('');
    setLoading(true);

    try {
      // Validate form
      if (!formData.email || !formData.password) {
        throw new Error('Please fill in all fields');
      }

      // No need to initialize, just use the imported auth instance
      await signInWithEmailAndPassword(auth, formData.email, formData.password);

      // Success! Redirect to homepage
      router.push('/');
    } catch (err: any) {
      console.error('Login error:', err);

      // Handle specific Firebase errors
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Invalid email or password');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many attempts. Please try again later.');
      } else if (err.code === 'auth/network-request-failed') {
        setError('Network error. Please check your connection.');
      } else {
        setError(err.message || 'Login failed. Please try again.');
      }
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
            {error && (
              <div className="p-3 bg-destructive/20 border border-destructive rounded text-destructive text-sm">
                {error}
              </div>
            )}

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
