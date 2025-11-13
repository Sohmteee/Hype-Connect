'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface LogEntry {
  id: string;
  type: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  details: any;
  timestamp: string;
}

interface LogStats {
  failuresCount: number;
  webhookErrorsCount: number;
  duplicateAttemptsCount: number;
  rateLimitHitsCount: number;
}

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState<LogStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [logType, setLogType] = useState<'all' | 'failures' | 'webhooks' | 'duplicates'>('all');
  const [hoursBack, setHoursBack] = useState(24);
  const router = useRouter();

  useEffect(() => {
    fetchLogs();
  }, [logType, hoursBack]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('admin_token');
      if (!token) {
        router.push('/dashboard/admin-login');
        return;
      }

      const params = new URLSearchParams();
      if (logType !== 'all') params.append('type', logType);
      params.append('hoursBack', hoursBack.toString());

      const response = await fetch(`/api/internal/dashboard/logs?${params}`, {
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
        throw new Error('Failed to fetch logs');
      }

      const data = await response.json();
      setLogs(data.logs || []);
      setStats(data.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'bg-red-500/20 text-red-400';
      case 'warning':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'info':
        return 'bg-blue-500/20 text-blue-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getLogTypeColor = (type: string) => {
    switch (type) {
      case 'payment_failure':
        return 'text-red-400';
      case 'webhook_error':
        return 'text-orange-400';
      case 'duplicate_detected':
        return 'text-yellow-400';
      case 'rate_limit':
        return 'text-purple-400';
      default:
        return 'text-gray-400';
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading logs..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">System Logs</h1>
        <button
          onClick={fetchLogs}
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

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gray-900 border-gray-800 p-4">
            <h3 className="text-gray-400 text-sm font-medium">Failed Payments</h3>
            <p className="text-2xl font-bold text-red-400 mt-2">{stats.failuresCount}</p>
          </Card>
          <Card className="bg-gray-900 border-gray-800 p-4">
            <h3 className="text-gray-400 text-sm font-medium">Webhook Errors</h3>
            <p className="text-2xl font-bold text-orange-400 mt-2">{stats.webhookErrorsCount}</p>
          </Card>
          <Card className="bg-gray-900 border-gray-800 p-4">
            <h3 className="text-gray-400 text-sm font-medium">Duplicates Detected</h3>
            <p className="text-2xl font-bold text-yellow-400 mt-2">{stats.duplicateAttemptsCount}</p>
          </Card>
          <Card className="bg-gray-900 border-gray-800 p-4">
            <h3 className="text-gray-400 text-sm font-medium">Rate Limit Hits</h3>
            <p className="text-2xl font-bold text-purple-400 mt-2">{stats.rateLimitHitsCount}</p>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-2">Log Type</label>
          <select
            value={logType}
            onChange={(e) => setLogType(e.target.value as any)}
            className="bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white"
          >
            <option value="all">All Logs</option>
            <option value="failures">Payment Failures</option>
            <option value="webhooks">Webhook Errors</option>
            <option value="duplicates">Duplicate Attempts</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-2">Time Range</label>
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

      {/* Logs List */}
      {logs.length === 0 ? (
        <Card className="bg-gray-900 border-gray-800 p-8 text-center">
          <p className="text-gray-400">No logs found</p>
        </Card>
      ) : (
        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          {logs.map((log) => (
            <div
              key={log.id}
              className="bg-gray-900 border border-gray-800 rounded p-3 hover:border-gray-700 transition"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(log.severity)}`}>
                    {log.severity.toUpperCase()}
                  </span>
                  <span className={`text-xs font-mono ${getLogTypeColor(log.type)}`}>
                    {log.type}
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(log.timestamp).toLocaleString()}
                </span>
              </div>

              <p className="text-sm text-gray-300 mb-2">{log.message}</p>

              {log.details && Object.keys(log.details).length > 0 && (
                <details className="text-xs text-gray-400 bg-gray-800/50 rounded p-2">
                  <summary className="cursor-pointer font-mono">Details</summary>
                  <pre className="mt-2 overflow-x-auto text-gray-500">
                    {JSON.stringify(log.details, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
