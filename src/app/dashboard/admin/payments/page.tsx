'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface Payment {
  id: string;
  reference: string;
  userId: string;
  userEmail: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'rejected';
  createdAt: string;
  completedAt?: string;
  failureReason?: string;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'failed' | 'rejected'>('all');
  const [viewMode, setViewMode] = useState<'search' | 'failed'>('search');
  const [hoursBack, setHoursBack] = useState(24);
  const router = useRouter();

  useEffect(() => {
    if (viewMode === 'failed') {
      fetchFailedPayments();
    }
  }, [viewMode, hoursBack]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('admin_token');
      if (!token) {
        router.push('/dashboard/admin-login');
        return;
      }

      const params = new URLSearchParams();
      params.append('q', searchQuery);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const response = await fetch(`/api/internal/dashboard/payments?${params}`, {
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
        throw new Error('Failed to fetch payments');
      }

      const data = await response.json();
      setPayments(data.payments || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPayments();
  };

  const fetchFailedPayments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('admin_token');

      const response = await fetch('/api/internal/dashboard/payments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'failed',
          hoursBack,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch failed payments');
      }

      const data = await response.json();
      setPayments(data.payments || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-400';
      case 'failed':
        return 'bg-red-500/20 text-red-400';
      case 'rejected':
        return 'bg-orange-500/20 text-orange-400';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading payments..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Payments Management</h1>
        <button
          onClick={() => viewMode === 'search' ? fetchPayments() : fetchFailedPayments()}
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

      {/* View Selector */}
      <div className="flex gap-2">
        <button
          onClick={() => setViewMode('search')}
          className={`px-4 py-2 rounded font-medium transition ${viewMode === 'search'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
        >
          Search Payments
        </button>
        <button
          onClick={() => setViewMode('failed')}
          className={`px-4 py-2 rounded font-medium transition ${viewMode === 'failed'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
        >
          Recent Failures
        </button>
      </div>

      {/* Search View */}
      {viewMode === 'search' && (
        <form onSubmit={fetchPayments} className="flex gap-4">
          <input
            type="text"
            placeholder="Search by reference, user email, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white placeholder-gray-500"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white"
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="rejected">Rejected</option>
          </select>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white font-medium"
          >
            Search
          </button>
        </form>
      )}

      {/* Failed Payments View */}
      {viewMode === 'failed' && (
        <div className="flex gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Last (hours)</label>
            <select
              value={hoursBack}
              onChange={(e) => setHoursBack(parseInt(e.target.value))}
              className="bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white"
            >
              <option value={1}>1 hour</option>
              <option value={6}>6 hours</option>
              <option value={12}>12 hours</option>
              <option value={24}>24 hours</option>
              <option value={48}>48 hours</option>
              <option value={72}>72 hours</option>
            </select>
          </div>
        </div>
      )}

      {/* Payments Table */}
      {payments.length === 0 ? (
        <Card className="bg-gray-900 border-gray-800 p-8 text-center">
          <p className="text-gray-400">No payments found</p>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-800/50">
                <th className="text-left py-3 px-4 text-gray-400">Reference</th>
                <th className="text-left py-3 px-4 text-gray-400">User Email</th>
                <th className="text-right py-3 px-4 text-gray-400">Amount</th>
                <th className="text-left py-3 px-4 text-gray-400">Status</th>
                <th className="text-left py-3 px-4 text-gray-400">Created</th>
                <th className="text-left py-3 px-4 text-gray-400">Details</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id} className="border-b border-gray-800 hover:bg-gray-800/30">
                  <td className="py-3 px-4 text-white font-mono text-xs">{payment.reference}</td>
                  <td className="py-3 px-4 text-white">{payment.userEmail}</td>
                  <td className="py-3 px-4 text-right font-semibold text-white">
                    ₦{payment.amount.toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(payment.status)}`}>
                      {payment.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-400 text-xs">
                    {new Date(payment.createdAt).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-xs">
                    {payment.failureReason && (
                      <p className="text-red-400">{payment.failureReason}</p>
                    )}
                    {payment.completedAt && (
                      <p className="text-green-400">
                        Completed: {new Date(payment.completedAt).toLocaleString()}
                      </p>
                    )}
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
