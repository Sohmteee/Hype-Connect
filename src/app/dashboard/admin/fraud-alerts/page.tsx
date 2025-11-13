'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Select } from '@/components/ui/select';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface FraudAlert {
  id: string;
  transactionRef: string;
  userId: string;
  amount: number;
  status: 'unreviewed' | 'reviewed';
  severity: 'critical' | 'high' | 'medium';
  reason: string;
  createdAt: string;
  reviewedAt?: string;
  resolutionType?: string;
}

export default function FraudAlertsPage() {
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unreviewed' | 'reviewed'>('all');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'critical' | 'high' | 'medium'>('all');
  const [resolving, setResolving] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchAlerts();
  }, [statusFilter, severityFilter]);

  const fetchAlerts = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        router.push('/dashboard/admin-login');
        return;
      }

      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (severityFilter !== 'all') params.append('severity', severityFilter);

      const response = await fetch(`/api/internal/dashboard/fraud-alerts?${params}`, {
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
        throw new Error('Failed to fetch fraud alerts');
      }

      const data = await response.json();
      setAlerts(data.alerts || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resolveAlert = async (alertId: string, resolutionType: string) => {
    try {
      setResolving(alertId);
      const token = localStorage.getItem('admin_token');

      const response = await fetch('/api/internal/dashboard/fraud-alerts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          alertId,
          resolutionType,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to resolve alert');
      }

      // Remove from list
      setAlerts(alerts.filter(a => a.id !== alertId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setResolving(null);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-400 bg-red-500/10';
      case 'high':
        return 'text-orange-400 bg-orange-500/10';
      case 'medium':
        return 'text-yellow-400 bg-yellow-500/10';
      default:
        return 'text-gray-400 bg-gray-500/10';
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'unreviewed'
      ? 'text-blue-400 bg-blue-500/10'
      : 'text-green-400 bg-green-500/10';
  };

  if (loading) {
    return <LoadingSpinner text="Loading fraud alerts..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Fraud Alerts Management</h1>
        <button
          onClick={fetchAlerts}
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
        <div>
          <label className="block text-sm text-gray-400 mb-2">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
          >
            <option value="all">All</option>
            <option value="unreviewed">Unreviewed</option>
            <option value="reviewed">Reviewed</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-2">Severity</label>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value as any)}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
          >
            <option value="all">All</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
          </select>
        </div>
      </div>

      {/* Alerts List */}
      {alerts.length === 0 ? (
        <Card className="bg-gray-900 border-gray-800 p-8 text-center">
          <p className="text-gray-400">No fraud alerts found</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <Card
              key={alert.id}
              className="bg-gray-900 border-gray-800 p-6 hover:border-gray-700 transition"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-white">
                      {alert.transactionRef}
                    </h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(alert.severity)}`}>
                      {alert.severity.toUpperCase()}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(alert.status)}`}>
                      {alert.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm">
                    User: <span className="text-gray-300">{alert.userId}</span>
                  </p>
                </div>
                <p className="text-xl font-bold text-white">
                  ₦{alert.amount.toLocaleString()}
                </p>
              </div>

              <div className="mb-4 p-3 bg-gray-800 rounded">
                <p className="text-sm text-gray-300">
                  <span className="text-gray-400">Reason: </span>
                  {alert.reason}
                </p>
              </div>

              <div className="flex justify-between items-center">
                <p className="text-xs text-gray-500">
                  {new Date(alert.createdAt).toLocaleString()}
                </p>

                {alert.status === 'unreviewed' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => resolveAlert(alert.id, 'false_positive')}
                      disabled={resolving === alert.id}
                      className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm text-white disabled:opacity-50"
                    >
                      ✓ False Positive
                    </button>
                    <button
                      onClick={() => resolveAlert(alert.id, 'confirmed_fraud')}
                      disabled={resolving === alert.id}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm text-white disabled:opacity-50"
                    >
                      ✗ Confirmed Fraud
                    </button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
