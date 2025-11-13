'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { app } from '@/firebase';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const auth = getAuth(app);

      // Sign in with email and password
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      // Get ID token
      const token = await userCredential.user.getIdToken();

      // Verify token with admin endpoint
      const response = await fetch('/api/internal/dashboard/analytics', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        setError('Invalid credentials or insufficient permissions');
        setLoading(false);
        return;
      }

      if (!response.ok) {
        setError('Authentication failed');
        setLoading(false);
        return;
      }

      // Token is valid, store it
      localStorage.setItem('admin_token', token);
      router.push('/dashboard/admin');
    } catch (err: any) {
      console.error(err);

      if (err.code === 'auth/user-not-found') {
        setError('Admin account not found');
      } else if (err.code === 'auth/wrong-password') {
        setError('Incorrect password');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email format');
      } else {
        setError(err.message || 'Authentication failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <Card className="w-full max-w-md bg-gray-900 border-gray-800 p-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-blue-400 mb-2">Admin Access</h1>
          <p className="text-gray-400">Secure administration panel</p>
        </div>

        {error && (
          <Alert className="mb-6 bg-red-500/10 border-red-500/50 text-red-400">
            {error}
          </Alert>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email
            </label>
            <Input
              type="email"
              placeholder="uscup@neptune.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="bg-gray-800 border-gray-700 text-white placeholder-gray-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <Input
              type="password"
              placeholder="Enter admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="bg-gray-800 border-gray-700 text-white placeholder-gray-500"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-800">
          <p className="text-xs text-gray-500 text-center">
            This panel requires admin privileges. Only authorized administrators can access.
          </p>
        </div>
      </Card>
    </div>
  );
}
