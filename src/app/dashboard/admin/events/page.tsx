'use client';

import { useEffect, useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface Event {
  id: string;
  title: string;
  startDateTime: string;
  endDateTime?: string;
  location: string;
  hypemanName: string;
  isActive: boolean;
  hypesCount: number;
  totalHyped: number;
  hypesEarnings: number;
  createdAt: string;
}

type FilterStatus = 'all' | 'active' | 'ended' | 'upcoming';
type SortBy = 'newest' | 'oldest' | 'most-hypes' | 'most-revenue' | 'starts-soon' | 'ends-soon';

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [sortBy, setSortBy] = useState<SortBy>('newest');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('admin_token');
      if (!token) {
        router.push('/dashboard/admin-login');
        return;
      }

      const response = await fetch(`/api/internal/dashboard/events`, {
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
        throw new Error('Failed to fetch events');
      }

      const data = await response.json();
      setEvents(data.events || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort events client-side
  const filteredAndSortedEvents = useMemo(() => {
    let filtered = [...events];

    // Apply filter
    const now = new Date();
    filtered = filtered.filter((event) => {
      const startTime = new Date(event.startDateTime);
      const endTime = event.endDateTime ? new Date(event.endDateTime) : null;
      const hasStarted = startTime <= now;
      const hasEnded = endTime && endTime < now;

      switch (filterStatus) {
        case 'active':
          return event.isActive && hasStarted && !hasEnded;
        case 'ended':
          return hasEnded || !event.isActive;
        case 'upcoming':
          return !hasStarted;
        case 'all':
        default:
          return true;
      }
    });

    // Apply sort
    filtered.sort((a, b) => {
      const aStart = new Date(a.startDateTime);
      const bStart = new Date(b.startDateTime);
      const aEnd = a.endDateTime ? new Date(a.endDateTime) : null;
      const bEnd = b.endDateTime ? new Date(b.endDateTime) : null;

      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'most-hypes':
          return b.hypesCount - a.hypesCount;
        case 'most-revenue':
          return b.totalHyped - a.totalHyped;
        case 'starts-soon':
          return aStart.getTime() - bStart.getTime();
        case 'ends-soon':
          const now = new Date();
          const aEndTime = aEnd ? aEnd.getTime() : Infinity;
          const bEndTime = bEnd ? bEnd.getTime() : Infinity;
          const aTimeUntilEnd = aEndTime - now.getTime();
          const bTimeUntilEnd = bEndTime - now.getTime();
          return aTimeUntilEnd - bTimeUntilEnd;
        default:
          return 0;
      }
    });

    return filtered;
  }, [events, filterStatus, sortBy]);

  const toggleEventStatus = async (eventId: string, isActive: boolean) => {
    try {
      setActionLoading(eventId);
      const token = localStorage.getItem('admin_token');

      const response = await fetch('/api/internal/dashboard/events', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: isActive ? 'deactivate' : 'reactivate',
          eventId,
          reason: 'Admin action',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update event');
      }

      setEvents(events.map(e =>
        e.id === eventId ? { ...e, isActive: !isActive } : e
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading events..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Events Management</h1>
        <button
          onClick={fetchEvents}
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

      {/* Filter and Sort Controls */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-2">Filter by Status</label>
          <div className="flex flex-wrap gap-2">
            {(['all', 'active', 'ended', 'upcoming'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 rounded text-sm font-medium transition ${filterStatus === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
              >
                {status === 'all' ? 'All Events' : status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">Sort by</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-600"
          >
            <option value="newest">Newest Created</option>
            <option value="oldest">Oldest Created</option>
            <option value="most-hypes">Most Hypes</option>
            <option value="most-revenue">Most Revenue</option>
            <option value="starts-soon">Starts Soon</option>
            <option value="ends-soon">Ends Soon</option>
          </select>
        </div>

        <div className="flex justify-between items-center bg-gray-800 rounded px-4 py-2">
          <p className="text-sm text-gray-400">
            Showing {filteredAndSortedEvents.length} of {events.length} events
          </p>
          <button
            onClick={fetchEvents}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm transition"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Events List */}
      {filteredAndSortedEvents.length === 0 ? (
        <Card className="bg-gray-900 border-gray-800 p-8 text-center">
          <p className="text-gray-400">
            {events.length === 0 ? 'No events found' : 'No events match your filters'}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredAndSortedEvents.map((event) => (
            <Card key={event.id} className="bg-gray-900 border-gray-800 p-6">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white">{event.title}</h3>
                  <p className="text-sm text-gray-400">{event.hypemanName}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${event.isActive
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-gray-500/20 text-gray-400'
                  }`}>
                  {event.isActive ? 'ACTIVE' : 'ENDED'}
                </span>
              </div>

              <div className="space-y-2 mb-4 text-sm">
                <p className="text-gray-400">
                  <span className="text-gray-500">📍 </span>
                  <span className="text-white">{event.location}</span>
                </p>
                <p className="text-gray-400">
                  <span className="text-gray-500">Start: </span>
                  <span className="text-white">{new Date(event.startDateTime).toLocaleString()}</span>
                </p>
                {event.endDateTime && (
                  <p className="text-gray-400">
                    <span className="text-gray-500">End: </span>
                    <span className="text-white">{new Date(event.endDateTime).toLocaleString()}</span>
                  </p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4 p-3 bg-gray-800 rounded">
                <div className="text-center">
                  <p className="text-xs text-gray-400">Hypes</p>
                  <p className="text-lg font-bold text-blue-400">{event.hypesCount}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-400">Total</p>
                  <p className="text-lg font-bold text-green-400">₦{event.totalHyped.toLocaleString()}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-400">Earnings</p>
                  <p className="text-lg font-bold text-purple-400">₦{event.hypesEarnings.toLocaleString()}</p>
                </div>
              </div>

              <button
                onClick={() => toggleEventStatus(event.id, event.isActive)}
                disabled={actionLoading === event.id}
                className={`w-full px-4 py-2 rounded text-white font-medium transition disabled:opacity-50 ${event.isActive
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-green-600 hover:bg-green-700'
                  }`}
              >
                {event.isActive ? 'Deactivate' : 'Reactivate'}
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
