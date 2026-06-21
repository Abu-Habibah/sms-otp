'use client';

import React, { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { Device, DeviceStatus, Workspace } from '@sms-monitor/shared-types';
import { Smartphone, Loader2, PauseCircle, PlayCircle, Trash2, FolderKanban, Radio, Check, Info, X, Clock, Hash, Monitor, Cpu, Smartphone as PhoneIcon, Wifi, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface DevicesClientProps {
  initialDevices: Device[];
  jwt: string;
  tenantPublicApiUrl: string | null;
  workspaceId?: string;
  workspaceName?: string;
}

function statusColor(status: DeviceStatus): string {
  switch (status) {
    case 'ACTIVE':
      return 'text-success bg-success/10 border-success/30';
    case 'SUSPENDED':
      return 'text-warning bg-warning/10 border-warning/30';
    case 'REVOKED':
      return 'text-destructive bg-destructive/10 border-destructive/30';
    case 'PENDING_CLAIM':
      return 'text-muted-foreground bg-muted/30 border-border/50';
  }
}

function statusDot(status: DeviceStatus): string {
  switch (status) {
    case 'ACTIVE': return 'bg-secondary';
    case 'SUSPENDED': return 'bg-warning';
    case 'REVOKED': return 'bg-destructive';
    case 'PENDING_CLAIM': return 'bg-muted-foreground';
  }
}

function ConfirmDialog({ open, title, message, onConfirm, onCancel, loading }: {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-xl border border-border/50 bg-card p-6 shadow-lg space-y-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} disabled={loading} className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground border border-border/50 hover:bg-accent/50 transition-all">Cancel</button>
          <button onClick={onConfirm} disabled={loading} className="rounded-lg bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground hover:brightness-110 disabled:opacity-50 transition-all">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin inline" />}
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

function DeviceDetailModal({ device, open, onClose }: { device: Device | null; open: boolean; onClose: () => void }) {
  if (!open || !device) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-xl border border-border/50 bg-card p-6 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Smartphone className="h-5 w-5 text-indigo-500" />
            <h3 className="text-lg font-semibold">Device Details</h3>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Name</p>
            <p className="text-sm font-medium mt-0.5">{device.name || 'Claimed Device'}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {device.manufacturer && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Manufacturer</p>
                <p className="text-sm font-medium mt-0.5">{device.manufacturer}</p>
              </div>
            )}
            {device.model && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Model</p>
                <p className="text-sm font-medium mt-0.5">{device.model}</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {device.osVersion && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">OS Version</p>
                <p className="text-sm font-medium mt-0.5">Android {device.osVersion}</p>
              </div>
            )}
            {device.appVersion && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">App Version</p>
                <p className="text-sm font-medium mt-0.5">v{device.appVersion}</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {device.simSlot1Number && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">SIM 1</p>
                <p className="text-sm font-medium font-mono mt-0.5">{device.simSlot1Number}</p>
              </div>
            )}
            {device.simSlot2Number && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">SIM 2</p>
                <p className="text-sm font-medium font-mono mt-0.5">{device.simSlot2Number}</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Status</p>
              <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium font-mono ${statusColor(device.status)}`}>
                {device.status}
              </span>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Device ID</p>
              <p className="text-sm font-mono font-medium mt-0.5">{device.id.slice(0, 12)}…</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Last Seen</p>
              <p className="text-sm font-medium mt-0.5">
                {device.lastSeenAt ? new Date(device.lastSeenAt).toLocaleString() : 'Never'}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Created</p>
              <p className="text-sm font-medium mt-0.5">
                {new Date(device.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}

export function DevicesClient({ initialDevices, jwt, tenantPublicApiUrl, workspaceId, workspaceName }: DevicesClientProps) {
  const [devices, setDevices] = useState(initialDevices);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>(workspaceId ?? '');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ id: string; action: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showRevoked, setShowRevoked] = useState(false);
  const [identifyingDeviceId, setIdentifyingDeviceId] = useState<string | null>(null);
  const [identifiedDevices, setIdentifiedDevices] = useState<Set<string>>(new Set());
  const [detailDevice, setDetailDevice] = useState<Device | null>(null);
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [editNameValue, setEditNameValue] = useState('');

  const filteredDevices = showRevoked ? devices : devices.filter(d => d.status !== 'REVOKED');
  const revokedCount = devices.filter(d => d.status === 'REVOKED').length;

  useEffect(() => {
    if (!workspaceId) {
      fetch('/api/v1/workspaces')
        .then(res => res.ok ? res.json() : [])
        .then(data => setWorkspaces(Array.isArray(data) ? data : []))
        .catch(() => {});
    }
  }, [workspaceId]);

  useEffect(() => {
    if (!workspaceId) {
      refreshDevices();
    }
  }, [selectedWorkspaceId]);

  const refreshDevices = useCallback(async () => {
    const effectiveWorkspaceId = workspaceId || selectedWorkspaceId;
    const devicesUrl = effectiveWorkspaceId ? `/api/v1/workspaces/${effectiveWorkspaceId}/devices` : '/api/v1/devices';
    const listRes = await fetch(devicesUrl);
    if (listRes.ok) {
      const data = await listRes.json();
      setDevices(Array.isArray(data) ? data : data.devices ?? []);
    }
  }, [workspaceId, selectedWorkspaceId]);

  const handleAction = useCallback(async (id: string, action: string) => {
    setActionLoading(id);
    setError(null);
    try {
      const method = action === 'revoke' ? 'DELETE' : 'POST';
      const url = action === 'revoke' ? `/api/v1/devices/${id}` : `/api/v1/devices/${id}/${action}`;
      const res = await fetch(url, { method });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? `Failed to ${action} device`);
      }
      await refreshDevices();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${action} device`);
    } finally {
      setActionLoading(null);
      setConfirmAction(null);
    }
  }, [refreshDevices]);

  const handleIdentify = useCallback(async (id: string) => {
    setIdentifyingDeviceId(id);
    setError(null);
    try {
      const res = await fetch(`/api/v1/devices/${id}/identify`, { method: 'POST' });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? 'Failed to identify device');
      }
      setIdentifiedDevices(prev => new Set([...prev, id]));
      setTimeout(() => {
        setIdentifiedDevices(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to identify device');
    } finally {
      setIdentifyingDeviceId(null);
    }
  }, []);

  const startEditName = (e: React.MouseEvent, device: Device) => {
    e.stopPropagation();
    setEditingNameId(device.id);
    setEditNameValue(device.name || '');
  };

  const saveName = async () => {
    if (!editingNameId || !editNameValue.trim()) return;
    setActionLoading(editingNameId);
    setError(null);
    try {
      const res = await fetch(`/api/v1/devices/${editingNameId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editNameValue.trim() }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? 'Failed to update device name');
      }
      setEditingNameId(null);
      await refreshDevices();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update device name');
    } finally {
      setActionLoading(null);
    }
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') saveName();
    if (e.key === 'Escape') setEditingNameId(null);
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="underline text-xs">Dismiss</button>
        </div>
      )}

      {devices.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/30 p-14 text-center">
          <Smartphone className="mx-auto h-10 w-10 text-muted-foreground/30" />
          <h3 className="mt-4 text-lg font-semibold">No devices yet</h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-sm mx-auto">
            Add devices from a workspace. Go to Workspaces to create one and add devices.
          </p>
          <Button asChild className="mt-5">
            <Link href="/workspaces">
              <FolderKanban className="mr-2 h-4 w-4" />
              Go to Workspaces
            </Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {!workspaceId && workspaces.length > 0 && (
                <select
                  value={selectedWorkspaceId}
                  onChange={(e) => setSelectedWorkspaceId(e.target.value)}
                  className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                >
                  <option value="">All devices</option>
                  {workspaces.map((ws) => (
                    <option key={ws.id} value={ws.id}>{ws.name}</option>
                  ))}
                </select>
              )}
              <span className="text-sm text-muted-foreground">{filteredDevices.length} devices</span>
              {revokedCount > 0 && (
                <button
                  onClick={() => setShowRevoked(!showRevoked)}
                  className="text-xs text-muted-foreground hover:text-foreground underline"
                >
                  {showRevoked ? 'Hide' : 'Show'} {revokedCount} revoked
                </button>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border/50 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50 bg-muted/30 text-left text-xs text-muted-foreground uppercase tracking-wider">
                  <th className="px-5 py-3.5 font-medium">Device</th>
                  <th className="px-5 py-3.5 font-medium">Status</th>
                  <th className="px-5 py-3.5 font-medium hidden sm:table-cell">Model</th>
                  <th className="px-5 py-3.5 font-medium hidden md:table-cell">Last Seen</th>
                  <th className="px-5 py-3.5 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {filteredDevices.map((device) => (
                  <tr key={device.id} className="text-sm hover:bg-accent/20 transition-colors cursor-pointer" onClick={() => setDetailDevice(device)}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Smartphone className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div>
                          {editingNameId === device.id ? (
                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="text"
                                value={editNameValue}
                                onChange={(e) => setEditNameValue(e.target.value)}
                                onKeyDown={handleNameKeyDown}
                                className="w-full rounded-md border border-input bg-background px-2 py-0.5 text-sm font-medium"
                                autoFocus
                                maxLength={100}
                              />
                              <button onClick={saveName} disabled={actionLoading === device.id} className="text-success hover:text-success/80 p-0.5">
                                <Check className="h-4 w-4" />
                              </button>
                              <button onClick={() => setEditingNameId(null)} className="text-muted-foreground hover:text-foreground p-0.5">
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 group">
                              <p className="font-medium">{device.name || 'Claimed Device'}</p>
                              <button
                                onClick={(e) => startEditName(e, device)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground p-0.5"
                                title="Edit name"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground">
                            <span className="font-mono">{device.id.slice(0, 8)}…</span>
                            {device.model && <span className="ml-2">• {device.model}</span>}
                            {device.manufacturer && !device.model && <span className="ml-2">• {device.manufacturer}</span>}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium font-mono ${statusColor(device.status)}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${statusDot(device.status)}`} />
                        {device.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground hidden sm:table-cell">
                      {device.model || device.manufacturer || '—'}
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground hidden md:table-cell text-xs font-mono">
                      {device.lastSeenAt ? new Date(device.lastSeenAt).toLocaleString() : 'Never'}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {device.status === 'ACTIVE' && (
                          <>
                            <button
                              onClick={() => handleIdentify(device.id)}
                              disabled={identifyingDeviceId === device.id}
                              title="Identify"
                              className={`rounded-lg p-2 transition-all ${
                                identifiedDevices.has(device.id)
                                  ? 'text-success bg-success/10'
                                  : 'text-muted-foreground hover:text-primary hover:bg-primary/10'
                              }`}
                            >
                              {identifyingDeviceId === device.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : identifiedDevices.has(device.id) ? (
                                <Check className="h-4 w-4" />
                              ) : (
                                <Radio className="h-4 w-4" />
                              )}
                            </button>
                            <button onClick={() => setConfirmAction({ id: device.id, action: 'suspend' })} disabled={actionLoading === device.id} title="Suspend" className="rounded-lg p-2 text-muted-foreground hover:text-warning hover:bg-warning/10 transition-all">
                              <PauseCircle className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        {device.status === 'SUSPENDED' && (
                          <button onClick={() => handleAction(device.id, 'resume')} disabled={actionLoading === device.id} title="Resume" className="rounded-lg p-2 text-muted-foreground hover:text-secondary hover:bg-secondary/10 transition-all">
                            <PlayCircle className="h-4 w-4" />
                          </button>
                        )}
                        {(device.status === 'ACTIVE' || device.status === 'SUSPENDED') && (
                          <button onClick={() => setConfirmAction({ id: device.id, action: 'revoke' })} disabled={actionLoading === device.id} title="Revoke" className="rounded-lg p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                        {device.status === 'REVOKED' && (
                          <button onClick={() => handleAction(device.id, 'reactivate')} disabled={actionLoading === device.id} title="Reactivate" className="rounded-lg p-2 text-muted-foreground hover:text-success hover:bg-success/10 transition-all">
                            <PlayCircle className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <ConfirmDialog
        open={confirmAction !== null}
        title={confirmAction?.action === 'suspend' ? 'Suspend Device' : 'Revoke Device'}
        message={confirmAction?.action === 'suspend'
          ? 'This will suspend the device. It will stop sending heartbeats and can be resumed later.'
          : 'This will permanently revoke the device. This action cannot be undone.'}
        onConfirm={() => { if (confirmAction) handleAction(confirmAction.id, confirmAction.action); }}
        onCancel={() => setConfirmAction(null)}
        loading={confirmAction?.id === actionLoading}
      />

      <DeviceDetailModal device={detailDevice} open={detailDevice !== null} onClose={() => setDetailDevice(null)} />
    </div>
  );
}