'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useAdminAPI } from '@/hooks/useAdminAPI';

interface Booking {
  id: string;
  hypemanUserId: string;
  email: string;
  name: string;
  occasion: string;
  amount: number;
  hypemanAmount: number;
  platformFee: number;
  status: 'pending' | 'confirmed' | 'completed' | 'failed' | 'cancelled';
  paymentReference: string;
  paymentUrl?: string;
  videoDetails: string;
  createdAt: string;
  updatedAt?: string;
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed' | 'failed' | 'cancelled'>('all');
  const [hypemanIdFilter, setHypemanIdFilter] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const router = useRouter();
  const { fetchWithTokenRefresh } = useAdminAPI();

  useEffect(() => {
    fetchBookings();
  }, [statusFilter]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('admin_token');
      if (!token) {
        router.push('/dashboard/admin-login');
        return;
      }

      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (hypemanIdFilter) params.append('hypemanId', hypemanIdFilter);

      const response = await fetchWithTokenRefresh(`/api/internal/dashboard/bookings?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch bookings');
      }

      const data = await response.json();
      setBookings(data.bookings || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      setActionLoading(bookingId);

      const response = await fetchWithTokenRefresh('/api/internal/dashboard/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'update-status',
          bookingId,
          status: newStatus,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update booking status');
      }

      setBookings(bookings.map(b =>
        b.id === bookingId ? { ...b, status: newStatus as any } : b
      ));
      setSelectedStatus('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setActionLoading(null);
    }
  };

  const cancelBooking = async (bookingId: string) => {
    try {
      setActionLoading(bookingId);

      const response = await fetchWithTokenRefresh('/api/internal/dashboard/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'cancel',
          bookingId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to cancel booking');
      }

      setBookings(bookings.map(b =>
        b.id === bookingId ? { ...b, status: 'cancelled' as const } : b
      ));
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
      case 'confirmed':
        return 'bg-blue-500/20 text-blue-400';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'failed':
        return 'bg-red-500/20 text-red-400';
      case 'cancelled':
        return 'bg-gray-500/20 text-gray-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading bookings..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Bookings Management</h1>
        <button
          onClick={fetchBookings}
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

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block text-sm text-gray-400 mb-2">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-sm text-gray-400 mb-2">Hypeman ID</label>
          <input
            type="text"
            placeholder="Filter by hypeman..."
            value={hypemanIdFilter}
            onChange={(e) => setHypemanIdFilter(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && fetchBookings()}
            className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white placeholder-gray-500"
          />
        </div>
      </div>

      {/* Bookings Table */}
      {bookings.length === 0 ? (
        <Card className="bg-gray-900 border-gray-800 p-8 text-center">
          <p className="text-gray-400">No bookings found</p>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-800/50">
                <th className="text-left py-3 px-4 text-gray-400">Hypeman</th>
                <th className="text-left py-3 px-4 text-gray-400">Spotlight Email</th>
                <th className="text-left py-3 px-4 text-gray-400">Occasion</th>
                <th className="text-right py-3 px-4 text-gray-400">Amount</th>
                <th className="text-left py-3 px-4 text-gray-400">Status</th>
                <th className="text-left py-3 px-4 text-gray-400">Created</th>
                <th className="text-left py-3 px-4 text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking.id} className="border-b border-gray-800 hover:bg-gray-800/30">
                  <td className="py-3 px-4 text-white text-xs">{booking.name}</td>
                  <td className="py-3 px-4 text-white text-xs">{booking.email}</td>
                  <td className="py-3 px-4 text-white text-xs">{booking.occasion}</td>
                  <td className="py-3 px-4 text-right font-semibold text-white">
                    ₦{booking.amount.toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(booking.status)}`}>
                      {booking.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-400 text-xs">
                    {new Date(booking.createdAt).toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                      <div className="flex gap-2">
                        <select
                          value={selectedStatus}
                          onChange={(e) => updateBookingStatus(booking.id, e.target.value)}
                          disabled={actionLoading === booking.id}
                          className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-white disabled:opacity-50"
                        >
                          <option value="">Change status...</option>
                          <option value="confirmed">Confirm</option>
                          <option value="completed">Complete</option>
                          <option value="failed">Failed</option>
                        </select>
                        <button
                          onClick={() => cancelBooking(booking.id)}
                          disabled={actionLoading === booking.id}
                          className="px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs text-white disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>
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
