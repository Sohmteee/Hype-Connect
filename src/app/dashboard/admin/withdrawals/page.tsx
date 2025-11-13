'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface Withdrawal {
  id: string;
  userId: string;
  userEmail: string;
  amount: number;
  status: 'pending_verification' | 'verified' | 'approved' | 'processing' | 'completed';
  accountDetails: {
    accountNumber: string;
    accountName: string;
    bankCode: string;
  };
  createdAt: string;
  approvedAt?: string;
  rejectionReason?: string;
}

export default function WithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending_verification' | 'verified' | 'approved' | 'processing' | 'completed'>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchWithdrawals();
  }, [statusFilter]);

  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('admin_token');
      if (!token) {
        router.push('/dashboard/admin-login');
        return;
      }

      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const response = await fetch(`/api/internal/dashboard/withdrawals?${params}`, {
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
        throw new Error('Failed to fetch withdrawals');
      }

      const data = await response.json();
      setWithdrawals(data.withdrawals || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const approveWithdrawal = async (withdrawalId: string) => {
    try {
      setActionLoading(withdrawalId);
      const token = localStorage.getItem('admin_token');

      const response = await fetch('/api/internal/dashboard/withdrawals', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'approve',
          withdrawalId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to approve withdrawal');
      }

      setWithdrawals(withdrawals.map(w =>
        w.id === withdrawalId ? { ...w, status: 'approved' as const } : w
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setActionLoading(null);
    }
  };

  const rejectWithdrawal = async (withdrawalId: string) => {
    try {
      setActionLoading(withdrawalId);
      const token = localStorage.getItem('admin_token');

      const response = await fetch('/api/internal/dashboard/withdrawals', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'reject',
          withdrawalId,
          rejectionReason: rejectionReason || 'Rejected by admin',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to reject withdrawal');
      }

      setWithdrawals(withdrawals.map(w =>
        w.id === withdrawalId ? { ...w, status: 'rejected' as any } : w
      ));
      setRejectionReason('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-400';
      case 'approved':
        return 'bg-blue-500/20 text-blue-400';
      case 'processing':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'verified':
        return 'bg-cyan-500/20 text-cyan-400';
      case 'pending_verification':
        return 'bg-orange-500/20 text-orange-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading withdrawals..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Withdrawal Approvals</h1>
        <button
          onClick={fetchWithdrawals}
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

      {/* Filter */}
      <div>
        <label className="block text-sm text-gray-400 mb-2">Status Filter</label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white"
        >
          <option value="all">All Status</option>
          <option value="pending_verification">Pending Verification</option>
          <option value="verified">Verified</option>
          <option value="approved">Approved</option>
          <option value="processing">Processing</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* Withdrawals List */}
      {withdrawals.length === 0 ? (
        <Card className="bg-gray-900 border-gray-800 p-8 text-center">
          <p className="text-gray-400">No withdrawals found</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {withdrawals.map((withdrawal) => (
            <Card key={withdrawal.id} className="bg-gray-900 border-gray-800 p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">
                    {withdrawal.userEmail}
                  </h3>
                  <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getStatusColor(withdrawal.status)}`}>
                    {withdrawal.status.replace(/_/g, ' ').toUpperCase()}
                  </span>
                </div>
                <p className="text-2xl font-bold text-white">
                  ₦{withdrawal.amount.toLocaleString()}
                </p>
              </div>

              <div className="mb-4 p-3 bg-gray-800 rounded">
                <p className="text-sm text-gray-300 mb-2">
                  <span className="text-gray-400">Account: </span>
                  {withdrawal.accountDetails.accountName}
                </p>
                <p className="text-sm text-gray-300 mb-2">
                  <span className="text-gray-400">Account Number: </span>
                  <span className="font-mono">{withdrawal.accountDetails.accountNumber}</span>
                </p>
                <p className="text-sm text-gray-300">
                  <span className="text-gray-400">Requested: </span>
                  {new Date(withdrawal.createdAt).toLocaleString()}
                </p>
              </div>

              {withdrawal.status === 'pending_verification' || withdrawal.status === 'verified' ? (
                <div className="flex gap-2 pt-4 border-t border-gray-800">
                  <button
                    onClick={() => approveWithdrawal(withdrawal.id)}
                    disabled={actionLoading === withdrawal.id}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-white font-medium disabled:opacity-50"
                  >
                    ✓ Approve
                  </button>
                  <button
                    onClick={() => rejectWithdrawal(withdrawal.id)}
                    disabled={actionLoading === withdrawal.id}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-white font-medium disabled:opacity-50"
                  >
                    ✗ Reject
                  </button>
                </div>
              ) : (
                <div className="pt-4 border-t border-gray-800 text-sm text-gray-400">
                  {withdrawal.approvedAt && (
                    <p>Approved: {new Date(withdrawal.approvedAt).toLocaleString()}</p>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
