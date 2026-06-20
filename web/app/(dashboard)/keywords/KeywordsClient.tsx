'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Keyword, MatchMode, Workspace } from '@sms-monitor/shared-types';
import { Tag, Plus, Edit, Trash2, X, Loader2 } from 'lucide-react';

const MATCH_MODES: MatchMode[] = ['EXACT', 'CONTAINS', 'REGEX', 'AT_START', 'AT_END'];

function matchModeColor(mode: MatchMode): string {
  switch (mode) {
    case 'EXACT':
      return 'text-[#6366F1] bg-[#EEF2FF] border-[#6366F1]/20';
    case 'CONTAINS':
      return 'text-[#10B981] bg-[#ECFDF5] border-[#10B981]/20';
    case 'REGEX':
      return 'text-[#8B5CF6] bg-[#F5F3FF] border-[#8B5CF6]/20';
    case 'AT_START':
      return 'text-[#F59E0B] bg-[#FFFBEB] border-[#F59E0B]/20';
    case 'AT_END':
      return 'text-[#EC4899] bg-[#FDF2F8] border-[#EC4899]/20';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-sm rounded-lg border bg-card p-6 shadow-lg space-y-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{message}</p>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onCancel} disabled={loading}>Cancel</Button>
          <Button variant="destructive" onClick={onConfirm} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm
          </Button>
        </div>
      </div>
    </div>
  );
}

function KeywordModal({ open, onClose, keyword, workspaceId }: {
  open: boolean;
  onClose: () => void;
  keyword?: Keyword;
  workspaceId?: string;
}) {
  const [word, setWord] = useState(keyword?.word ?? '');
  const [matchMode, setMatchMode] = useState<MatchMode>(keyword?.matchMode ?? 'CONTAINS');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = !!keyword;

  const handleSubmit = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = isEdit ? `/api/v1/keywords/${keyword.id}` : '/api/v1/keywords';
      const method = isEdit ? 'PATCH' : 'POST';
      const body: Record<string, unknown> = { word, matchMode };
      if (!isEdit && workspaceId) body.workspaceId = workspaceId;
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? `Failed to ${isEdit ? 'update' : 'create'} keyword`);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [word, matchMode, isEdit, keyword, onClose, workspaceId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-lg space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{isEdit ? 'Edit Keyword' : 'Add Keyword'}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium">Keyword</label>
            <input
              type="text"
              value={word}
              onChange={(e) => setWord(e.target.value)}
              placeholder="e.g. OTP, CODE, verification"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              minLength={2}
              maxLength={50}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">Match Mode</label>
            <select
              value={matchMode}
              onChange={(e) => setMatchMode(e.target.value as MatchMode)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {MATCH_MODES.map((mode) => (
                <option key={mode} value={mode}>{mode}</option>
              ))}
            </select>
          </div>

          {error && (
            <p className="text-sm text-destructive rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2">
              {error}
            </p>
          )}
        </div>

        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading || word.length < 2}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? 'Save' : 'Add'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function KeywordsClient({ initialKeywords, workspaceId }: { initialKeywords: Keyword[]; workspaceId?: string }) {
  const router = useRouter();
  const [keywords, setKeywords] = useState(initialKeywords);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>(workspaceId ?? '');
  const [showModal, setShowModal] = useState(false);
  const [editingKeyword, setEditingKeyword] = useState<Keyword | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<Keyword | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!workspaceId) {
      fetch('/api/v1/workspaces')
        .then(res => res.ok ? res.json() : [])
        .then(data => setWorkspaces(Array.isArray(data) ? data : []))
        .catch(() => {});
    }
  }, [workspaceId]);

  const refreshKeywords = useCallback(async () => {
    const effectiveWorkspaceId = workspaceId || selectedWorkspaceId;
    const keywordsUrl = effectiveWorkspaceId ? `/api/v1/workspaces/${effectiveWorkspaceId}/keywords` : '/api/v1/keywords';
    const res = await fetch(keywordsUrl);
    if (res.ok) {
      const data = await res.json();
      setKeywords(Array.isArray(data) ? data : data.keywords ?? []);
    }
  }, [workspaceId, selectedWorkspaceId]);

  const handleToggle = useCallback(async (id: string) => {
    setActionLoading(id);
    setError(null);
    try {
      const res = await fetch(`/api/v1/keywords/${id}/toggle`, { method: 'PATCH' });
      if (!res.ok) throw new Error('Failed to toggle keyword');
      await refreshKeywords();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle keyword');
    } finally {
      setActionLoading(null);
    }
  }, [refreshKeywords]);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setActionLoading(deleteTarget.id);
    setError(null);
    try {
      const res = await fetch(`/api/v1/keywords/${deleteTarget.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete keyword');
      await refreshKeywords();
      setDeleteTarget(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete keyword');
    } finally {
      setActionLoading(null);
    }
  }, [deleteTarget, refreshKeywords]);

  return (
    <>
      {error && (
        <div className="rounded-md border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline">Dismiss</button>
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {!workspaceId && workspaces.length > 0 && (
            <select
              value={selectedWorkspaceId}
              onChange={(e) => {
                setSelectedWorkspaceId(e.target.value);
              }}
              className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
            >
              <option value="">All keywords</option>
              {workspaces.map((ws) => (
                <option key={ws.id} value={ws.id}>{ws.name}</option>
              ))}
            </select>
          )}
          <p className="text-sm text-muted-foreground">{keywords.length} keywords</p>
        </div>
        <Button onClick={() => { setEditingKeyword(undefined); setShowModal(true); }} disabled={!workspaceId && !selectedWorkspaceId}>
          <Plus className="mr-2 h-4 w-4" />
          Add Keyword
        </Button>
      </div>

      {keywords.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <Tag className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">No keywords</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {!workspaceId && !selectedWorkspaceId
              ? 'Select a workspace above to add keywords.'
              : 'Add keywords to filter which SMS messages get forwarded.'}
          </p>
          {selectedWorkspaceId && (
            <Button onClick={() => { setEditingKeyword(undefined); setShowModal(true); }} className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              Add Keyword
            </Button>
          )}
          </div>
        ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50 text-left text-sm text-muted-foreground">
                <th className="px-4 py-3 font-medium">Keyword</th>
                <th className="px-4 py-3 font-medium">Match Mode</th>
                <th className="px-4 py-3 font-medium">Enabled</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {keywords.map((kw) => (
                <tr key={kw.id} className="text-sm">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Tag className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="font-medium font-mono">{kw.word}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-md border px-2.5 py-0.5 text-xs font-medium ${matchModeColor(kw.matchMode)}`}>
                      {kw.matchMode}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggle(kw.id)}
                      disabled={actionLoading === kw.id}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                        kw.enabled ? 'bg-primary' : 'bg-muted'
                      }`}
                    >
                      <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
                        kw.enabled ? 'translate-x-4' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { setEditingKeyword(kw); setShowModal(true); }}
                        disabled={actionLoading === kw.id}
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteTarget(kw)}
                        disabled={actionLoading === kw.id}
                        title="Delete"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <KeywordModal
          open={showModal}
          onClose={() => {
            setShowModal(false);
            setEditingKeyword(undefined);
            refreshKeywords();
          }}
          keyword={editingKeyword}
          workspaceId={workspaceId || selectedWorkspaceId || undefined}
        />
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete Keyword"
        message={`Are you sure you want to delete "${deleteTarget?.word}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteTarget ? actionLoading === deleteTarget.id : false}
      />
    </>
  );
}
