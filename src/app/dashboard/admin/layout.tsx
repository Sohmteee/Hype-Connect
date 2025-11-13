'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const storedToken = localStorage.getItem('admin_token');
    if (storedToken) {
      setToken(storedToken);
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setIsAuthenticated(false);
    router.push('/dashboard/admin-login');
  };

  const isActive = (path: string) => {
    if (path === '/dashboard/admin' && pathname === '/dashboard/admin') {
      return true;
    }
    if (path !== '/dashboard/admin' && pathname.startsWith(path)) {
      return true;
    }
    return false;
  };

  const getLinkClass = (path: string) => {
    const baseClass = 'w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800';
    if (isActive(path)) {
      return `${baseClass} bg-blue-600/20 text-blue-400 border-l-4 border-blue-400`;
    }
    return baseClass;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-gray-400 mb-6">Please log in to access the admin dashboard</p>
          <Link href="/dashboard/admin-login">
            <Button className="bg-blue-600 hover:bg-blue-700">Go to Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Only render children if authenticated
  if (!isAuthenticated || !token) {
    return null;
  }

  return (
    <div className="flex h-screen bg-black text-white">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-gray-900 border-r border-gray-800 p-6 overflow-y-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-blue-400">Admin Panel</h1>
          <p className="text-gray-400 text-sm mt-1">Control Center</p>
        </div>

        <nav className="space-y-2">
          <Link href="/dashboard/admin">
            <Button variant="ghost" className={getLinkClass('/dashboard/admin')}>
              📊 Analytics
            </Button>
          </Link>
          <Link href="/dashboard/admin/fraud-alerts">
            <Button variant="ghost" className={getLinkClass('/dashboard/admin/fraud-alerts')}>
              🚨 Fraud Alerts
            </Button>
          </Link>
          <Link href="/dashboard/admin/users">
            <Button variant="ghost" className={getLinkClass('/dashboard/admin/users')}>
              👥 Users
            </Button>
          </Link>
          <Link href="/dashboard/admin/payments">
            <Button variant="ghost" className={getLinkClass('/dashboard/admin/payments')}>
              💳 Payments
            </Button>
          </Link>
          <Link href="/dashboard/admin/withdrawals">
            <Button variant="ghost" className={getLinkClass('/dashboard/admin/withdrawals')}>
              💸 Withdrawals
            </Button>
          </Link>
          <Link href="/dashboard/admin/events">
            <Button variant="ghost" className={getLinkClass('/dashboard/admin/events')}>
              🎉 Events
            </Button>
          </Link>
          <Link href="/dashboard/admin/hypes">
            <Button variant="ghost" className={getLinkClass('/dashboard/admin/hypes')}>
              🔥 Hypes
            </Button>
          </Link>
          <Link href="/dashboard/admin/bookings">
            <Button variant="ghost" className={getLinkClass('/dashboard/admin/bookings')}>
              📅 Bookings
            </Button>
          </Link>
          <Link href="/dashboard/admin/logs">
            <Button variant="ghost" className={getLinkClass('/dashboard/admin/logs')}>
              📋 Logs
            </Button>
          </Link>
        </nav>

        <div className="mt-auto pt-6 border-t border-gray-800">
          <Button
            onClick={handleLogout}
            className="w-full bg-red-600 hover:bg-red-700 text-white"
          >
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
