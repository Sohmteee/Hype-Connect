'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface Hype {
  id: string;
  userId: string;
  userEmail: string;
  message: string;
  amount: number;
  status: 'confirmed' | 'hyped' | 'new';
  createdAt?: string;
  timestamp?: string;
}

interface EventWithHypes {
  event: {
    id: string;
    name: string;
    startDateTime: string;
    endDateTime: string;
    hypemanName: string;
    isActive: boolean;
    hypesCount?: number;
    totalHyped?: number;
    [key: string]: any;
  };
  hypes: Hype[];
}

export default function HypesPage() {
  const [eventsWithHypes, setEventsWithHypes] = useState<EventWithHypes[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'confirmed' | 'hyped' | 'new'>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());
  const router = useRouter();

  useEffect(() => {
    fetchHypes();
  }, [statusFilter]);

  const fetchHypes = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('admin_token');
      if (!token) {
        router.push('/dashboard/admin-login');
        return;
      }

      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const response = await fetch(`/api/internal/dashboard/hypes?${params}`, {
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
        throw new Error('Failed to fetch hypes');
      }

      const data = await response.json();
      setEventsWithHypes(data.events || []);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const toggleEvent = (eventId: string) => {
    const newExpanded = new Set(expandedEvents);
    if (newExpanded.has(eventId)) {
      newExpanded.delete(eventId);
    } else {
      newExpanded.add(eventId);
    }
    setExpandedEvents(newExpanded);
  };

  const deleteHype = async (eventId: string, hypeId: string) => {
    try {
      setActionLoading(hypeId);
      const token = localStorage.getItem('admin_token');

      const response = await fetch('/api/internal/dashboard/hypes', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'delete',
          eventId,
          hypeId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete hype');
      }

      // Update state by removing the deleted hype
      setEventsWithHypes(
        eventsWithHypes.map((ew) => {
          if (ew.event.id === eventId) {
            return {
              ...ew,
              hypes: ew.hypes.filter((h) => h.id !== hypeId),
            };
          }
          return ew;
        })
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setActionLoading(null);
    }
  };

  const flagHype = async (eventId: string, hypeId: string, reason: string) => {
    try {
      setActionLoading(hypeId);
      const token = localStorage.getItem('admin_token');

      const response = await fetch('/api/internal/dashboard/hypes', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'flag',
          eventId,
          hypeId,
          reason: reason || 'Flagged for review',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to flag hype');
      }

      // Update state by removing the flagged hype
      setEventsWithHypes(
        eventsWithHypes.map((ew) => {
          if (ew.event.id === eventId) {
            return {
              ...ew,
              hypes: ew.hypes.filter((h) => h.id !== hypeId),
            };
          }
          return ew;
        })
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-500/20 text-green-400';
      case 'hyped':
        return 'bg-blue-500/20 text-blue-400';
      case 'new':
        return 'bg-yellow-500/20 text-yellow-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const totalHypes = eventsWithHypes.reduce((sum, ew) => sum + ew.hypes.length, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Hypes Moderation</h1>
        <div className="text-sm text-gray-400">
          {eventsWithHypes.length} events • {totalHypes} hypes
        </div>
      </div>

      {error && (
        <Card className="bg-red-500/10 border-red-500/50 p-4">
          <p className="text-red-400">{error}</p>
        </Card>
      )}

      {/* Status Filter */}
      <div className="flex gap-2">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white text-sm"
        >
          <option value="all">All Status</option>
          <option value="confirmed">✓ Confirmed</option>
          <option value="hyped">✓✓ Hyped</option>
          <option value="new">⏳ New</option>
        </select>
      </div>

      {/* Events with Hypes List */}
      {loading ? (
        <LoadingSpinner text="Loading hypes..." />
      ) : eventsWithHypes.length === 0 ? (
        <Card className="bg-gray-900 border-gray-800 p-8 text-center">
          <p className="text-gray-400">No hypes found</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {eventsWithHypes.map((eventWithHypes) => (
            <div key={eventWithHypes.event.id} className="space-y-2">
              {/* Event Header - Collapsible */}
              <button
                onClick={() => toggleEvent(eventWithHypes.event.id)}
                className="w-full text-left"
              >
                <Card className="bg-gray-900 border-gray-800 p-4 hover:bg-gray-800/50 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      {expandedEvents.has(eventWithHypes.event.id) ? (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold text-white text-lg">
                          {eventWithHypes.event.name}
                        </h3>
                        <p className="text-sm text-gray-400">
                          by {eventWithHypes.event.hypemanName}
                        </p>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="font-bold text-white">
                        {eventWithHypes.hypes.length} hypes
                      </div>
                      <div className="text-sm text-green-400">
                        ₦{eventWithHypes.hypes.reduce((sum, h) => sum + (h.amount || 0), 0).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </Card>
              </button>

              {/* Hypes - Collapsible Content */}
              {expandedEvents.has(eventWithHypes.event.id) && (
                <div className="ml-4 space-y-2">
                  {eventWithHypes.hypes.map((hype) => (
                    <Card key={hype.id} className="bg-gray-800 border-gray-700 p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-white">{hype.userEmail}</h3>
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(
                                hype.status
                              )}`}
                            >
                              {hype.status.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-gray-300 text-sm mb-2">{hype.message}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(hype.timestamp || hype.createdAt || '').toLocaleString()}
                          </p>
                        </div>
                        <p className="text-lg font-bold text-white whitespace-nowrap ml-4">
                          ₦{hype.amount.toLocaleString()}
                        </p>
                      </div>

                      <div className="flex gap-2 pt-3 border-t border-gray-700">
                        <button
                          onClick={() => deleteHype(eventWithHypes.event.id, hype.id)}
                          disabled={actionLoading === hype.id}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded text-sm text-white disabled:opacity-50"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => flagHype(eventWithHypes.event.id, hype.id, 'Flagged for review')}
                          disabled={actionLoading === hype.id}
                          className="px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 rounded text-sm text-white disabled:opacity-50"
                        >
                          Flag
                        </button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
