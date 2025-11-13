'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { useRouter } from 'next/navigation';

interface PaymentStats {
  total: number;
  completed: number;
  failed: number;
  rejected: number;
  successRate: number;
  recentFailures: number;
}

interface PlatformEarnings {
  bookingFees: number;
  hypeFees: number;
  totalEarned: number;
}

interface WithdrawalStats {
  totalRequests: number;
  pending: number;
  completed: number;
  totalWithdrawn: number;
}

interface Hypeman {
  id: string;
  displayName: string;
  totalEarned: number;
  balance: number;
}

interface AnalyticsData {
  paymentStats: PaymentStats;
  platformEarnings: PlatformEarnings;
  withdrawals: WithdrawalStats;
  topHypemen: Hypeman[];
  timestamp: string;
}

export default function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        router.push('/dashboard/admin-login');
        return;
      }

      const response = await fetch('/api/internal/dashboard/analytics', {
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
        throw new Error('Failed to fetch analytics');
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString()}`;
  };

  // Safety checks before rendering
  if (!isClient || loading || !data) {
    if (loading) {
      return <div className="text-center py-8">Loading analytics...</div>;
    }
    if (error) {
      return <div className="text-red-400 text-center py-8">Error: {error}</div>;
    }
    return <div className="text-center py-8">No data available</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <button
          onClick={fetchAnalytics}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm"
        >
          Refresh
        </button>
      </div>

      {/* Payment Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="bg-gray-900 border-gray-800 p-6">
          <h3 className="text-gray-400 text-sm font-medium">Total Transactions</h3>
          <p className="text-3xl font-bold text-white mt-2">{data?.paymentStats?.total || 0}</p>
        </Card>
        <Card className="bg-gray-900 border-gray-800 p-6">
          <h3 className="text-gray-400 text-sm font-medium">Completed</h3>
          <p className="text-3xl font-bold text-green-400 mt-2">{data?.paymentStats?.completed || 0}</p>
        </Card>
        <Card className="bg-gray-900 border-gray-800 p-6">
          <h3 className="text-gray-400 text-sm font-medium">Failed</h3>
          <p className="text-3xl font-bold text-red-400 mt-2">{data?.paymentStats?.failed || 0}</p>
        </Card>
        <Card className="bg-gray-900 border-gray-800 p-6">
          <h3 className="text-gray-400 text-sm font-medium">Success Rate</h3>
          <p className="text-3xl font-bold text-blue-400 mt-2">{(data?.paymentStats?.successRate || 0).toFixed(1)}%</p>
        </Card>
        <Card className="bg-gray-900 border-gray-800 p-6">
          <h3 className="text-gray-400 text-sm font-medium">Recent Failures (24h)</h3>
          <p className="text-3xl font-bold text-yellow-400 mt-2">{data?.paymentStats?.recentFailures || 0}</p>
        </Card>
        <Card className="bg-gray-900 border-gray-800 p-6">
          <h3 className="text-gray-400 text-sm font-medium">Rejected</h3>
          <p className="text-3xl font-bold text-orange-400 mt-2">{data?.paymentStats?.rejected || 0}</p>
        </Card>
      </div>

      {/* Platform Earnings */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-900 to-gray-900 border-blue-800 p-6">
          <h3 className="text-blue-400 text-sm font-medium">Booking Fees</h3>
          <p className="text-2xl font-bold text-white mt-2">
            {formatCurrency(data?.platformEarnings?.bookingFees || 0)}
          </p>
        </Card>
        <Card className="bg-gradient-to-br from-purple-900 to-gray-900 border-purple-800 p-6">
          <h3 className="text-purple-400 text-sm font-medium">Hype Fees (20%)</h3>
          <p className="text-2xl font-bold text-white mt-2">
            {formatCurrency(data?.platformEarnings?.hypeFees || 0)}
          </p>
        </Card>
        <Card className="bg-gradient-to-br from-green-900 to-gray-900 border-green-800 p-6">
          <h3 className="text-green-400 text-sm font-medium">Total Earned</h3>
          <p className="text-2xl font-bold text-white mt-2">
            {formatCurrency(data?.platformEarnings?.totalEarned || 0)}
          </p>
        </Card>
      </div>

      {/* Withdrawal Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gray-900 border-gray-800 p-6">
          <h3 className="text-gray-400 text-sm font-medium">Withdrawal Requests</h3>
          <p className="text-3xl font-bold text-white mt-2">{data?.withdrawals?.totalRequests || 0}</p>
        </Card>
        <Card className="bg-gray-900 border-gray-800 p-6">
          <h3 className="text-gray-400 text-sm font-medium">Pending</h3>
          <p className="text-3xl font-bold text-yellow-400 mt-2">{data?.withdrawals?.pending || 0}</p>
        </Card>
        <Card className="bg-gray-900 border-gray-800 p-6">
          <h3 className="text-gray-400 text-sm font-medium">Completed</h3>
          <p className="text-3xl font-bold text-green-400 mt-2">{data?.withdrawals?.completed || 0}</p>
        </Card>
        <Card className="bg-gray-900 border-gray-800 p-6">
          <h3 className="text-gray-400 text-sm font-medium">Total Withdrawn</h3>
          <p className="text-2xl font-bold text-white mt-2">
            {formatCurrency(data?.withdrawals?.totalWithdrawn || 0)}
          </p>
        </Card>
      </div>

      {/* Top Hypemen */}
      <Card className="bg-gray-900 border-gray-800 p-6">
        <h2 className="text-xl font-bold text-white mb-4">Top 10 Hypemen</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left py-2 px-4 text-gray-400">Rank</th>
                <th className="text-left py-2 px-4 text-gray-400">Name</th>
                <th className="text-right py-2 px-4 text-gray-400">Total Earned</th>
                <th className="text-right py-2 px-4 text-gray-400">Current Balance</th>
              </tr>
            </thead>
            <tbody>
              {(data?.topHypemen || []).map((hypeman, index) => (
                <tr key={hypeman?.id || index} className="border-b border-gray-800 hover:bg-gray-800/50">
                  <td className="py-3 px-4 text-white font-medium">#{index + 1}</td>
                  <td className="py-3 px-4 text-white">{hypeman?.displayName || 'N/A'}</td>
                  <td className="py-3 px-4 text-right text-green-400">
                    {formatCurrency(hypeman?.totalEarned || 0)}
                  </td>
                  <td className="py-3 px-4 text-right text-blue-400">
                    {formatCurrency(hypeman?.balance || 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Timestamp */}
      <div className="text-right text-xs text-gray-500">
        Last updated: {data?.timestamp ? new Date(data.timestamp).toLocaleString() : 'N/A'}
      </div>
    </div>
  );
}
