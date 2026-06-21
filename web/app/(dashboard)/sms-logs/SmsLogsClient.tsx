'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SmsLog, SmsStatus, Workspace } from '@sms-monitor/shared-types';
import { MessageSquare, Clock, CheckCircle, XCircle, AlertCircle, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react';

type StatusFilter = 'ALL' | SmsStatus;

const PAGE_SIZE = 20;

function statusColor(status: SmsStatus): string {
  switch (status) {
    case 'PENDING':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'FORWARDED':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'FAILED':
      return 'text-red-600 bg-red-50 border-red-200';
  }
}

function statusIcon(status: SmsStatus) {
  switch (status) {
    case 'PENDING':
      return <Clock className="h-4 w-4" />;
    case 'FORWARDED':
      return <CheckCircle className="h-4 w-4" />;
    case 'FAILED':
      return <XCircle className="h-4 w-4" />;
  }
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString();
}

export function SmsLogsClient({ initialLogs }: { initialLogs: SmsLog[] }) {
  const router = useRouter();
  const [logs, setLogs] = useState(initialLogs);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>('');
  const [filter, setFilter] = useState<StatusFilter>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetch('/api/v1/workspaces')
      .then(res => res.ok ? res.json() : [])
      .then(data => setWorkspaces(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const refreshLogs = useCallback(async () => {
    const baseUrl = selectedWorkspaceId ? `/api/v1/workspaces/${selectedWorkspaceId}/sms-logs` : '/api/v1/sms-logs';
    const smsUrl = `${baseUrl}?page=${page}&limit=${PAGE_SIZE}`;
    const res = await fetch(smsUrl);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        setLogs(data);
        setTotal(data.length);
      } else if (data.logs) {
        setLogs(data.logs);
        setTotal(data.total);
      } else {
        setLogs([]);
        setTotal(0);
      }
    }
  }, [selectedWorkspaceId, page]);

  useEffect(() => {
    refreshLogs();
  }, [refreshLogs]);

  // Reset page when workspace or filter changes
  useEffect(() => {
    setPage(1);
  }, [selectedWorkspaceId, filter]);

  const filteredLogs = filter === 'ALL' ? logs : logs.filter((log) => log.status === filter);

  const toggleExpand = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <div className="flex items-center gap-2 flex-wrap">
        {workspaces.length > 0 && (
          <select
            value={selectedWorkspaceId}
            onChange={(e) => setSelectedWorkspaceId(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
          >
            <option value="">All workspaces</option>
            {workspaces.map((ws) => (
              <option key={ws.id} value={ws.id}>{ws.name}</option>
            ))}
          </select>
        )}
        <span className="text-sm text-muted-foreground">Status:</span>
        {(['ALL', 'PENDING', 'FORWARDED', 'FAILED'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              filter === status
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {status}
          </button>
        ))}
        <span className="ml-auto text-sm text-muted-foreground">
          {total} entries{totalPages > 1 && ` (page ${page} of ${totalPages})`}
        </span>
      </div>

      {filteredLogs.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">No SMS logs</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {filter === 'ALL'
              ? 'SMS logs will appear here when devices send messages that match keywords.'
              : `No ${filter.toLowerCase()} logs found.`}
          </p>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50 text-left text-sm text-muted-foreground">
                <th className="px-4 py-3 font-medium">Sender</th>
                <th className="px-4 py-3 font-medium">Message</th>
                <th className="px-4 py-3 font-medium">Keyword</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">Received</th>
                <th className="px-4 py-3 font-medium w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredLogs.map((log) => (
                <>
                  <tr
                    key={log.id}
                    className="text-sm cursor-pointer hover:bg-muted/30"
                    onClick={() => toggleExpand(log.id)}
                  >
                    <td className="px-4 py-3 font-mono">{log.sender}</td>
                    <td className="px-4 py-3 max-w-xs truncate">{log.message}</td>
                    <td className="px-4 py-3">
                      <span className="inline-block rounded-md border px-2 py-0.5 text-xs font-medium bg-muted">
                        {log.matchedKeyword}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-0.5 text-xs font-medium ${statusColor(log.status)}`}>
                        {statusIcon(log.status)}
                        {log.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                      {formatDate(log.receivedAt)}
                    </td>
                    <td className="px-4 py-3">
                      {expandedId === log.id ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </td>
                  </tr>
                  {expandedId === log.id && (
                    <tr key={`${log.id}-detail`}>
                      <td colSpan={6} className="px-4 py-4 bg-muted/20">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Full Message</p>
                            <p className="mt-1 whitespace-pre-wrap">{log.message}</p>
                          </div>
                          <div className="space-y-2">
                            <div>
                              <p className="text-muted-foreground">SMS ID</p>
                              <p className="font-mono text-xs">{log.smsId}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Retry Count</p>
                              <p>{log.retryCount}</p>
                            </div>
                            {log.errorMessage && (
                              <div>
                                <p className="text-muted-foreground">Error</p>
                                <p className="text-destructive">{log.errorMessage}</p>
                              </div>
                            )}
                            {log.forwardedAt && (
                              <div>
                                <p className="text-muted-foreground">Forwarded At</p>
                                <p>{formatDate(log.forwardedAt)}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 py-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </>
  );
}
