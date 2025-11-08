'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, firestore } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<'hypeman' | 'spotlight'>('spotlight');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
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
      if (!formData.email || !formData.password || !formData.displayName) {
        toast({
          title: 'Missing Information',
          description: 'Please fill in all required fields.',
          variant: 'destructive',
        });
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        toast({
          title: 'Passwords Don\'t Match',
          description: 'Please make sure your passwords match.',
          variant: 'destructive',
        });
        return;
      }

      if (formData.password.length < 6) {
        toast({
          title: 'Password Too Short',
          description: 'Your password must be at least 6 characters long.',
          variant: 'destructive',
        });
        return;
      }

      // Create user with Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      const user = userCredential.user;

      // Update user profile with display name
      await updateProfile(user, {
        displayName: formData.displayName,
      });

      // Create user document in Firestore
      await setDoc(doc(firestore, 'users', user.uid), {
        uid: user.uid,
        email: formData.email,
        displayName: formData.displayName,
        roles: [role],
        createdAt: new Date().toISOString(),
      });

      // Create default profile
      await setDoc(doc(firestore, 'users', user.uid, 'profiles', 'default'), {
        type: role,
        displayName: formData.displayName,
        visibility: 'public',
        createdAt: new Date().toISOString(),
      });

      // Success! Show toast and redirect
      toast({
        title: 'Account Created!',
        description: 'Your account has been created successfully. Redirecting to login...',
        variant: 'default',
      });

      setTimeout(() => {
        const redirect = searchParams.get('redirect');
        const target = `/auth/login?registered=true${redirect && redirect.startsWith('/') ? `&redirect=${encodeURIComponent(redirect)}` : ''}`;
        router.push(target);
      }, 500);
    } catch (err: any) {
      console.error('Registration error:', err);

      // Handle specific Firebase errors with user-friendly messages
      let userMessage = 'An error occurred during registration. Please try again.';

      if (err.code === 'auth/email-already-in-use') {
        userMessage = 'This email is already registered. Please use a different email or try logging in.';
      } else if (err.code === 'auth/invalid-email') {
        userMessage = 'Please enter a valid email address.';
      } else if (err.code === 'auth/weak-password') {
        userMessage = 'Your password is too weak. Please choose a stronger password.';
      } else if (err.code === 'auth/network-request-failed') {
        userMessage = 'Network connection failed. Please check your internet and try again.';
      }

      toast({
        title: 'Registration Failed',
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
          <CardDescription className="text-muted-foreground">Create your account</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">

            <div>
              <label className="text-sm font-medium text-foreground mb-3 block">What's your role?</label>
              <RadioGroup value={role} onValueChange={(value) => setRole(value as 'hypeman' | 'spotlight')}>
                <div className="flex items-center space-x-2 p-2 rounded hover:bg-secondary/50">
                  <RadioGroupItem value="hypeman" id="hypeman" />
                  <label htmlFor="hypeman" className="flex-1 cursor-pointer">
                    <div className="font-medium text-foreground">Hypeman</div>
                    <div className="text-xs text-muted-foreground">Host events and earn from hype messages</div>
                  </label>
                </div>
                <div className="flex items-center space-x-2 p-2 rounded hover:bg-secondary/50">
                  <RadioGroupItem value="spotlight" id="spotlight" />
                  <label htmlFor="spotlight" className="flex-1 cursor-pointer">
                    <div className="font-medium text-foreground">Spotlight</div>
                    <div className="text-xs text-muted-foreground">Send hype messages to events</div>
                  </label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Display Name</label>
              <Input
                type="text"
                name="displayName"
                value={formData.displayName}
                onChange={handleChange}
                placeholder="Your name"
                className="mt-1 bg-secondary border-primary/50 text-foreground placeholder:text-muted-foreground"
              />
            </div>

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

            <div>
              <label className="text-sm font-medium text-foreground">Confirm Password</label>
              <Input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
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
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-muted-foreground text-sm">
              Already have an account?{' '}
              <Link href={`/auth/login${searchParams.get('redirect') ? `?redirect=${encodeURIComponent(searchParams.get('redirect')!)}` : ''}`} className="text-accent hover:underline">
                Log in
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
