'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Workspace } from '@sms-monitor/shared-types';
import { Settings, Smartphone, Tag, Users } from 'lucide-react';
import { DevicesTab } from './tabs/DevicesTab';
import { KeywordsTab } from './tabs/KeywordsTab';
import { MembersTab } from './tabs/MembersTab';
import { SettingsTab } from './tabs/SettingsTab';

interface WorkspaceDetailClientProps {
  workspace: Workspace;
  jwt: string;
  tenantPublicApiUrl: string | null;
}

type Tab = 'devices' | 'keywords' | 'members' | 'settings';

const TABS: { id: Tab; label: string; icon: typeof Smartphone }[] = [
  { id: 'devices', label: 'Devices', icon: Smartphone },
  { id: 'keywords', label: 'Keywords', icon: Tag },
  { id: 'members', label: 'Members', icon: Users },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function WorkspaceDetailClient({ workspace, jwt, tenantPublicApiUrl: initialPublicApiUrl }: WorkspaceDetailClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('devices');
  const [tenantPublicApiUrl, setTenantPublicApiUrl] = useState<string | null>(initialPublicApiUrl);

  return (
    <div className="space-y-6">
      <div className="border-b border-border">
        <nav className="flex gap-4">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      <div>
        {activeTab === 'devices' && <DevicesTab workspace={workspace} jwt={jwt} tenantPublicApiUrl={tenantPublicApiUrl} />}
        {activeTab === 'keywords' && <KeywordsTab workspace={workspace} jwt={jwt} />}
        {activeTab === 'members' && <MembersTab workspace={workspace} jwt={jwt} />}
        {activeTab === 'settings' && <SettingsTab workspace={workspace} jwt={jwt} tenantPublicApiUrl={tenantPublicApiUrl} onPublicApiUrlChange={setTenantPublicApiUrl} />}
      </div>
    </div>
  );
}