'use client';

import React, { useEffect, useState } from 'react';
import { Device, DeviceStatus, Workspace } from '@sms-monitor/shared-types';
import { Smartphone, Loader2, Plus, Copy, Check, X, Clock, PauseCircle, PlayCircle, Trash2, Radio, Edit3 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/Button';

interface DevicesTabProps {
  workspace: Workspace;
  jwt: string;
  tenantPublicApiUrl: string | null;
}

function statusColor(status: DeviceStatus): string {
  switch (status) {
    case 'ACTIVE': return 'text-success bg-success/10 border-success/30';
    case 'SUSPENDED': return 'text-warning bg-warning/10 border-warning/30';
    case 'REVOKED': return 'text-destructive bg-destructive/10 border-destructive/30';
    case 'PENDING_CLAIM': return 'text-muted-foreground bg-muted/30 border-border/50';
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

function GenerateCodeModal({ open, onClose, workspaceId, tenantPublicApiUrl }: { open: boolean; onClose: () => void; workspaceId: string; tenantPublicApiUrl: string | null }) {
  const [ttl, setTtl] = useState(15);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [remaining, setRemaining] = useState<string>('');

  useEffect(() => {
    if (!expiresAt) { setRemaining(''); return; }
    const tick = () => {
      const diff = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
      if (diff <= 0) { setRemaining('Expired'); return; }
      const m = Math.floor(diff / 60);
      const s = diff % 60;
      setRemaining(`${m}:${s.toString().padStart(2, '0')}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  const qrPayload = generatedCode
    ? `${tenantPublicApiUrl || (typeof window !== 'undefined' ? window.location.origin : '')}/v1/claim?code=${generatedCode}&workspaceId=${workspaceId}`
    : null;

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setGeneratedCode(null);
    try {
      const res = await fetch('/api/v1/claim-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ttlMinutes: ttl, workspaceId }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? 'Failed to generate code');
      }
      const data = await res.json();
      setGeneratedCode(data.code);
      setExpiresAt(data.expiresAt);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate code');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!generatedCode) return;
    await navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setGeneratedCode(null);
    setError(null);
    setCopied(false);
    setTtl(15);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-border/50 bg-card p-6 shadow-lg space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Generate Claim Code</h3>
          <button onClick={handleClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {!generatedCode ? (
          <>
            <div className="space-y-2">
              <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider">Code expiry (minutes)</label>
              <input
                type="range"
                min={5}
                max={60}
                value={ttl}
                onChange={(e) => setTtl(Number(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>5 min</span>
                <span className="font-medium text-primary">{ttl} min</span>
                <span>60 min</span>
              </div>
            </div>
            {error && (
              <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2 border border-destructive/20">{error}</p>
            )}
            <Button onClick={handleGenerate} disabled={loading} className="w-full">
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {loading ? 'Generating…' : 'Generate Code'}
            </Button>
          </>
        ) : (
          <div className="space-y-5">
            {qrPayload && (
              <div className="flex justify-center rounded-xl border border-border/50 bg-background/50 p-4">
                <QRCodeSVG value={qrPayload} size={180} level="M" />
              </div>
            )}
            <div className="rounded-xl border border-border/50 bg-background/50 p-5 text-center space-y-2">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Claim Code</p>
              <p className="text-3xl font-mono font-bold tracking-[0.2em] text-primary select-all">{generatedCode}</p>
              {expiresAt && (
                <p className={`flex items-center justify-center gap-1.5 text-xs font-medium ${remaining === 'Expired' ? 'text-destructive' : 'text-muted-foreground'}`}>
                  <Clock className="h-3 w-3" />
                  {remaining === 'Expired' ? 'Code expired' : `Expires in ${remaining}`}
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={handleCopy} className="flex-1 rounded-lg border border-border/50 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-accent/50 transition-all flex items-center justify-center gap-2">
                {copied ? <Check className="h-4 w-4 text-secondary" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied!' : 'Copy Code'}
              </button>
              <button onClick={handleGenerate} className="flex-1 rounded-lg bg-accent/50 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-accent transition-all flex items-center justify-center gap-2">
                <Plus className="h-4 w-4" />
                Generate Another
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function DevicesTab({ workspace, jwt, tenantPublicApiUrl }: DevicesTabProps) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [identifyingDeviceId, setIdentifyingDeviceId] = useState<string | null>(null);
  const [identifiedDevices, setIdentifiedDevices] = useState<Set<string>>(new Set());
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [editNameValue, setEditNameValue] = useState('');

  useEffect(() => {
    const fetchDevices = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/v1/workspaces/${workspace.id}/devices`);
        if (res.ok) {
          const data = await res.json();
          setDevices(Array.isArray(data) ? data : data.devices ?? []);
        }
      } catch (err) {
        console.error('Failed to fetch devices:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDevices();
  }, [workspace.id]);

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
      const listRes = await fetch(`/api/v1/workspaces/${workspace.id}/devices`);
      if (listRes.ok) {
        const data = await listRes.json();
        setDevices(Array.isArray(data) ? data : data.devices ?? []);
      }
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

  const handleAction = async (id: string, action: string) => {
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
      const listRes = await fetch(`/api/v1/workspaces/${workspace.id}/devices`);
      if (listRes.ok) {
        const data = await listRes.json();
        setDevices(Array.isArray(data) ? data : data.devices ?? []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${action} device`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleIdentify = async (id: string) => {
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
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      {error && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive flex items-center justify-between mb-4">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="underline text-xs">Dismiss</button>
        </div>
      )}

      <div className="flex items-center justify-end mb-4">
        <Button onClick={() => setShowGenerateModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Device
        </Button>
      </div>

      {devices.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/30 p-14 text-center">
          <Smartphone className="mx-auto h-10 w-10 text-muted-foreground/30" />
          <h3 className="mt-4 text-lg font-semibold">No devices yet</h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-sm mx-auto">
            Add a device by generating a claim code and scanning it with the Android app.
          </p>
          <Button onClick={() => setShowGenerateModal(true)} className="mt-5">
            <Plus className="mr-2 h-4 w-4" />
            Add Device
          </Button>
        </div>
      ) : (
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
              {devices.map((device) => (
                <tr key={device.id} className="text-sm hover:bg-accent/20 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <Smartphone className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div>
                        {editingNameId === device.id ? (
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <input type="text" value={editNameValue} onChange={(e) => setEditNameValue(e.target.value)} onKeyDown={handleNameKeyDown} className="w-full rounded-md border border-input bg-background px-2 py-0.5 text-sm font-medium" autoFocus maxLength={100} />
                            <button onClick={saveName} disabled={actionLoading === device.id} className="text-success hover:text-success/80 p-0.5"><Check className="h-4 w-4" /></button>
                            <button onClick={() => setEditingNameId(null)} className="text-muted-foreground hover:text-foreground p-0.5"><X className="h-4 w-4" /></button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 group">
                            <p className="font-medium">{device.name}</p>
                            <button onClick={(e) => startEditName(e, device)} className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground p-0.5" title="Edit name"><Edit3 className="h-3.5 w-3.5" /></button>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground font-mono">{device.id.slice(0, 8)}…</p>
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
                          <button onClick={() => handleAction(device.id, 'suspend')} disabled={actionLoading === device.id} title="Suspend" className="rounded-lg p-2 text-muted-foreground hover:text-warning hover:bg-warning/10 transition-all">
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
                        <button onClick={() => handleAction(device.id, 'revoke')} disabled={actionLoading === device.id} title="Revoke" className="rounded-lg p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all">
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
      )}

      <GenerateCodeModal open={showGenerateModal} workspaceId={workspace.id} tenantPublicApiUrl={tenantPublicApiUrl} onClose={() => setShowGenerateModal(false)} />
    </>
  );
}