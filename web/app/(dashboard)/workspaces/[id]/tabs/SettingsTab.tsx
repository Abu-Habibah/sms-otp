'use client';

import { useState } from 'react';
import { Workspace } from '@sms-monitor/shared-types';
import { Settings, Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface SettingsTabProps {
  workspace: Workspace;
  jwt: string;
  tenantPublicApiUrl: string | null;
  onPublicApiUrlChange?: (url: string | null) => void;
}

type ValidationStatus = 'idle' | 'checking' | 'valid' | 'invalid' | 'error';

export function SettingsTab({ workspace, jwt, tenantPublicApiUrl, onPublicApiUrlChange }: SettingsTabProps) {
  const [name, setName] = useState(workspace.name);
  const [forwardUrl, setForwardUrl] = useState(workspace.forwardUrl ?? '');
  const [retentionDays, setRetentionDays] = useState(workspace.retentionDays);
  const [publicApiUrl, setPublicApiUrl] = useState(workspace.publicApiUrl ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [publicApiStatus, setPublicApiStatus] = useState<ValidationStatus>('idle');
  const [forwardUrlStatus, setForwardUrlStatus] = useState<ValidationStatus>('idle');

  const validateUrl = async (url: string, type: 'publicApi' | 'forward'): Promise<boolean> => {
    if (!url) return true;
    try {
      new URL(url);
    } catch {
      return false;
    }

    const setStatus = type === 'publicApi' ? setPublicApiStatus : setForwardUrlStatus;
    setStatus('checking');

    try {
      const res = await fetch('/api/health/check-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId: workspace.id }),
      });
      if (!res.ok) {
        setStatus('invalid');
        return false;
      }
      const data = await res.json();
      setStatus(data.reachable ? 'valid' : 'invalid');
      return data.reachable;
    } catch {
      setStatus('error');
      return false;
    }
  };

  const handleValidatePublicApi = () => validateUrl(publicApiUrl, 'publicApi');
  const handleValidateForward = () => validateUrl(forwardUrl, 'forward');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const workspaceBody: Record<string, unknown> = { name, forwardUrl: forwardUrl || null, retentionDays, publicApiUrl: publicApiUrl || null };
      const workspaceRes = await fetch(`/api/v1/workspaces/${workspace.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workspaceBody),
      });
      if (!workspaceRes.ok) {
        const errBody = await workspaceRes.json().catch(() => null);
        throw new Error(errBody?.message ?? 'Failed to update workspace');
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  const StatusIcon = ({ status }: { status: ValidationStatus }) => {
    switch (status) {
      case 'checking': return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
      case 'valid': return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case 'invalid': return <XCircle className="h-4 w-4 text-destructive" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-amber-500" />;
      default: return null;
    }
  };

  return (
    <div className="rounded-lg border p-6">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="h-5 w-5 text-muted-foreground" />
        <h3 className="text-lg font-semibold">Workspace Settings</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <div>
          <label className="block text-sm font-medium mb-1">Workspace Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            minLength={2}
            maxLength={100}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Public API URL</label>
          <div className="flex gap-2">
            <input
              type="url"
              value={publicApiUrl}
              onChange={(e) => { setPublicApiUrl(e.target.value); setPublicApiStatus('idle'); }}
              placeholder="https://api.example.com:3000"
              className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
            />
            <Button type="button" variant="outline" size="sm" onClick={handleValidatePublicApi} disabled={!publicApiUrl || publicApiStatus === 'checking'}>
              Test
            </Button>
            <StatusIcon status={publicApiStatus} />
          </div>
          <p className="text-xs text-muted-foreground mt-1">External URL for device claim QR codes. Android devices use this to connect to your backend.</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Forward URL (Webhook)</label>
          <div className="flex gap-2">
            <input
              type="url"
              value={forwardUrl}
              onChange={(e) => { setForwardUrl(e.target.value); setForwardUrlStatus('idle'); }}
              placeholder="https://your-server.com/webhook/sms"
              className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
            />
            <Button type="button" variant="outline" size="sm" onClick={handleValidateForward} disabled={!forwardUrl || forwardUrlStatus === 'checking'}>
              Test
            </Button>
            <StatusIcon status={forwardUrlStatus} />
          </div>
          <p className="text-xs text-muted-foreground mt-1">Webhook URL where matched SMS messages are forwarded. Your server receives POST requests here with SMS data.</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Retention (days)</label>
          <input
            type="number"
            value={retentionDays}
            onChange={(e) => setRetentionDays(Number(e.target.value))}
            min={1}
            max={365}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
          />
          <p className="text-xs text-muted-foreground mt-1">How long to keep SMS logs</p>
        </div>

        {error && (
          <p className="text-sm text-destructive rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2">{error}</p>
        )}

        {success && (
          <p className="text-sm text-success rounded-md border border-success/20 bg-success/5 px-3 py-2">Settings saved successfully</p>
        )}

        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Settings
        </Button>
      </form>
    </div>
  );
}