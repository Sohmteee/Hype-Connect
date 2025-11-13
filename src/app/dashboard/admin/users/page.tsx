'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface User {
  id: string;
  displayName: string;
  email: string;
  type: 'hypeman' | 'spotlight';
  suspended?: boolean;
  role?: string;
  createdAt: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'hypeman' | 'spotlight'>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchUsers();
  }, [typeFilter]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        router.push('/dashboard/admin-login');
        return;
      }

      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      if (typeFilter !== 'all') params.append('type', typeFilter);

      const response = await fetch(`/api/internal/dashboard/users?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        localStorage.removeItem('admin_token');
        router.push('/dashboard/admin-login');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data.users || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const executeAction = async (userId: string, action: string) => {
    try {
      setActionLoading(userId);
      const token = localStorage.getItem('admin_token');

      const response = await fetch('/api/internal/dashboard/users', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          userId,
        }),
      });

      if (!response.ok) {
        throw new Error('Action failed');
      }

      // Refresh the user list
      await fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers();
  };

  if (loading) {
    return <LoadingSpinner text="Loading users..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">User Management</h1>
        <button
          onClick={fetchUsers}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm"
        >
          Refresh
        </button>
      </div>

      {error && (
        <Card className="bg-red-500/10 border-red-500/50 p-4">
          <p className="text-red-400">{error}</p>
        </Card>
      )}

      {/* Search & Filter */}
      <form onSubmit={handleSearch} className="flex gap-4">
        <input
          type="text"
          placeholder="Search by email, name, or UID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white placeholder-gray-500"
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as any)}
          className="bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white"
        >
          <option value="all">All Types</option>
          <option value="hypeman">Hypeman</option>
          <option value="spotlight">Spotlight</option>
        </select>
        <button
          type="submit"
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white font-medium"
        >
          Search
        </button>
      </form>

      {/* Users List */}
      {users.length === 0 ? (
        <Card className="bg-gray-900 border-gray-800 p-8 text-center">
          <p className="text-gray-400">No users found</p>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-800/50">
                <th className="text-left py-3 px-4 text-gray-400">Email</th>
                <th className="text-left py-3 px-4 text-gray-400">Name</th>
                <th className="text-left py-3 px-4 text-gray-400">Type</th>
                <th className="text-left py-3 px-4 text-gray-400">Status</th>
                <th className="text-left py-3 px-4 text-gray-400">Role</th>
                <th className="text-left py-3 px-4 text-gray-400">Joined</th>
                <th className="text-left py-3 px-4 text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-gray-800 hover:bg-gray-800/30">
                  <td className="py-3 px-4 text-white text-xs font-mono">{user.email}</td>
                  <td className="py-3 px-4 text-white">{user.displayName}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">
                      {user.type}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {user.suspended ? (
                      <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs">
                        Suspended
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-xs ${user.role === 'admin'
                      ? 'bg-purple-500/20 text-purple-400'
                      : 'bg-gray-500/20 text-gray-400'
                      }`}>
                      {user.role === 'admin' ? 'Admin' : 'User'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-400 text-xs">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      {user.suspended ? (
                        <button
                          onClick={() => executeAction(user.id, 'unsuspend')}
                          disabled={actionLoading === user.id}
                          className="px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-xs disabled:opacity-50"
                        >
                          Unsuspend
                        </button>
                      ) : (
                        <button
                          onClick={() => executeAction(user.id, 'suspend')}
                          disabled={actionLoading === user.id}
                          className="px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs disabled:opacity-50"
                        >
                          Suspend
                        </button>
                      )}
                      {user.role !== 'admin' ? (
                        <button
                          onClick={() => executeAction(user.id, 'make-admin')}
                          disabled={actionLoading === user.id}
                          className="px-2 py-1 bg-purple-600 hover:bg-purple-700 rounded text-xs disabled:opacity-50"
                        >
                          Make Admin
                        </button>
                      ) : (
                        <button
                          onClick={() => executeAction(user.id, 'remove-admin')}
                          disabled={actionLoading === user.id}
                          className="px-2 py-1 bg-gray-600 hover:bg-gray-700 rounded text-xs disabled:opacity-50"
                        >
                          Remove Admin
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
