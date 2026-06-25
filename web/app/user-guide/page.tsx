import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function UserGuidePage() {
  return (
    <div className="min-h-screen bg-[#F5F3FF]">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <Link href="/" className="text-sm text-gray-500 hover:text-indigo-600 mb-6 inline-block">
          ← Back to SMS Monitor
        </Link>

        <div className="mb-8">
          <span className="inline-block bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-medium mb-4">
            User Guide v2.4
          </span>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">SMS Monitor User Guide</h1>
          <p className="text-gray-500">Complete guide to installing, configuring, and using the platform.</p>
        </div>

        {/* Table of Contents */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Table of Contents</h2>
          <ul className="space-y-2 text-sm">
            <li><a href="#overview" className="text-indigo-600 hover:underline">Overview</a></li>
            <li><a href="#installation" className="text-indigo-600 hover:underline">Installation</a></li>
            <li><a href="#configuration" className="text-indigo-600 hover:underline">Configuration</a></li>
            <li><a href="#getting-started" className="text-indigo-600 hover:underline">Getting Started</a></li>
            <li><a href="#workspaces" className="text-indigo-600 hover:underline">Workspaces</a></li>
            <li><a href="#devices" className="text-indigo-600 hover:underline">Devices</a></li>
            <li><a href="#keywords" className="text-indigo-600 hover:underline">Keywords</a></li>
            <li><a href="#sms-forwarding" className="text-indigo-600 hover:underline">SMS Forwarding</a></li>
            <li><a href="#api-reference" className="text-indigo-600 hover:underline">API Reference</a></li>
            <li><a href="#troubleshooting" className="text-indigo-600 hover:underline">Troubleshooting</a></li>
          </ul>
        </div>

        {/* Overview */}
        <section id="overview" className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b-2 border-indigo-200 pb-2">Overview</h2>
          <p className="text-gray-600 mb-4">
            SMS Monitor is a multi-tenant SMS monitoring platform that allows organizations to:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li>Register as a tenant and manage users</li>
            <li>Create workspaces to organize devices and keywords</li>
            <li>Claim Android devices via QR code scanning</li>
            <li>Configure keywords to filter incoming SMS messages</li>
            <li>Forward matched messages to external systems via webhooks</li>
          </ul>
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
            <p className="text-sm text-blue-800">
              <strong>Architecture:</strong> Tenant → Workspaces → Devices/Keywords. Each tenant can have multiple workspaces, and each workspace contains its own devices and keywords.
            </p>
          </div>
        </section>

        {/* Installation */}
        <section id="installation" className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b-2 border-indigo-200 pb-2">Installation</h2>

          <h3 className="text-lg font-semibold mb-3">Option 1: Docker (Recommended)</h3>
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <p className="text-sm text-gray-600 mb-3"><strong>Prerequisites:</strong> Docker and Docker Compose installed</p>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm"><code>{`# 1. Clone the repository
git clone https://github.com/your-org/sms-monitor.git
cd sms-monitor

# 2. Start all services
docker compose up -d

# 3. Verify
curl http://localhost:6001/health
# Should return: {"status":"ok"}`}</code></pre>
            <p className="text-sm text-gray-600 mt-3">This starts: PostgreSQL, Redis, MailHog, Backend API (port 6001), and Web Admin (port 6002).</p>
          </div>

          <h3 className="text-lg font-semibold mb-3">Option 2: Local Development</h3>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-3"><strong>Prerequisites:</strong> Node.js 20+, pnpm, PostgreSQL, Redis</p>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm"><code>{`# 1. Install dependencies
pnpm install

# 2. Start infrastructure
pnpm dev:infra

# 3. Apply database migration
pnpm prisma:migrate

# 4. Start backend
pnpm dev:backend

# 5. Start web admin (in another terminal)
pnpm dev:web`}</code></pre>
          </div>
        </section>

        {/* Configuration */}
        <section id="configuration" className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b-2 border-indigo-200 pb-2">Configuration</h2>

          <h3 className="text-lg font-semibold mb-3">Environment Variables</h3>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-4 py-3 text-left font-medium">Variable</th>
                  <th className="px-4 py-3 text-left font-medium">Description</th>
                  <th className="px-4 py-3 text-left font-medium">Default</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr><td className="px-4 py-3 font-mono text-xs">DATABASE_URL</td><td className="px-4 py-3">PostgreSQL connection string</td><td className="px-4 py-3 text-gray-500">postgresql://sms_monitor:sms_monitor_dev@localhost:6003/sms_monitor</td></tr>
                <tr><td className="px-4 py-3 font-mono text-xs">REDIS_URL</td><td className="px-4 py-3">Redis connection string</td><td className="px-4 py-3 text-gray-500">redis://localhost:6004</td></tr>
                <tr><td className="px-4 py-3 font-mono text-xs">JWT_SECRET</td><td className="px-4 py-3">Secret for signing JWT tokens</td><td className="px-4 py-3 text-gray-500">(required, no default)</td></tr>
                <tr><td className="px-4 py-3 font-mono text-xs">BACKEND_URL</td><td className="px-4 py-3">Backend API URL (for web proxy)</td><td className="px-4 py-3 text-gray-500">http://localhost:6001</td></tr>
              </tbody>
            </table>
          </div>

          <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg">
            <p className="text-sm text-amber-800">
              <strong>Production:</strong> Change <code className="bg-amber-100 px-1 rounded">JWT_SECRET</code> to a strong, random value. Never use the default in production.
            </p>
          </div>
        </section>

        {/* Getting Started */}
        <section id="getting-started" className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b-2 border-indigo-200 pb-2">Getting Started</h2>

          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-3">1. Dashboard</h3>
              <p className="text-gray-600 mb-3">After logging in, you&apos;ll see the dashboard with real-time statistics:</p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li><strong>Workspaces count</strong> — total workspaces in your tenant</li>
                <li><strong>Devices count</strong> — total claimed devices</li>
                <li><strong>Keywords count</strong> — total configured keywords</li>
                <li><strong>SMS count</strong> — total captured SMS messages</li>
                <li><strong>Latest SMS preview</strong> — most recent captured message</li>
              </ul>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-3">2. Create Your Account</h3>
              <ol className="list-decimal list-inside text-gray-600 space-y-2">
                <li>Go to <code className="bg-gray-100 px-1 rounded">http://localhost:6002/signup</code></li>
                <li>Enter your name, email, and password</li>
                <li>The tenant slug is auto-generated from your email domain</li>
                <li>You become the OWNER of the new tenant</li>
              </ol>
              <p className="text-gray-600 mt-3 text-sm"><strong>Adding team members:</strong> As an OWNER or ADMIN, you can invite users from the Users page in the sidebar. Enter their email, name, role, and a temporary password.</p>
              <p className="text-gray-600 mt-2 text-sm"><strong>Password reset:</strong> Use the "Forgot Password" link on the login page. A reset link is sent to your email (in development, check MailHog at <code className="bg-gray-100 px-1 rounded">http://localhost:6006</code>).</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-3">3. Set Up Your Workspace</h3>
              <ol className="list-decimal list-inside text-gray-600 space-y-2">
                <li>Go to <strong>Workspaces</strong> in the sidebar</li>
                <li>Click <strong>Create Workspace</strong></li>
                <li>Enter workspace name (e.g., &quot;HR Department&quot;)</li>
                <li>Optionally configure <strong>Forward URL</strong> (webhook for SMS forwarding)</li>
              </ol>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-3">4. Add Your Android Device</h3>
              <ol className="list-decimal list-inside text-gray-600 space-y-2">
                <li>Go to your workspace → <strong>Devices</strong> tab</li>
                <li>Click <strong>Add Device</strong></li>
                <li>Scan the QR code with the Android app</li>
                <li>Device is now connected to your workspace</li>
              </ol>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-3">5. Configure Keywords</h3>
              <ol className="list-decimal list-inside text-gray-600 space-y-2">
                <li>Go to your workspace → <strong>Keywords</strong> tab</li>
                <li>Click <strong>Add Keyword</strong></li>
                <li>Enter keyword (e.g., &quot;OTP&quot;, &quot;verification&quot;)</li>
                <li>Select match mode (EXACT, CONTAINS, REGEX)</li>
              </ol>
            </div>
          </div>
        </section>

        {/* Workspaces */}
        <section id="workspaces" className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b-2 border-indigo-200 pb-2">Workspaces</h2>
          <p className="text-gray-600 mb-4">Workspaces are logical groupings within a tenant. Each workspace contains its own devices, keywords, and SMS logs.</p>

          <h3 className="text-lg font-semibold mb-3">Workspace Settings</h3>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-4 py-3 text-left font-medium">Setting</th>
                  <th className="px-4 py-3 text-left font-medium">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr><td className="px-4 py-3">Workspace Name</td><td className="px-4 py-3">Display name for the workspace</td></tr>
                <tr><td className="px-4 py-3">Public API URL</td><td className="px-4 py-3">External URL for device claim QR codes (with Test button to verify reachability)</td></tr>
                <tr><td className="px-4 py-3">Forward URL (Webhook)</td><td className="px-4 py-3">URL where matched SMS are forwarded (with Test button to verify reachability)</td></tr>
                <tr><td className="px-4 py-3">Retention (days)</td><td className="px-4 py-3">How long to keep SMS logs</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Devices */}
        <section id="devices" className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b-2 border-indigo-200 pb-2">Devices</h2>
          <p className="text-gray-600 mb-4">Devices are Android phones running the SMS Monitor app. Each device is claimed into a workspace and monitors SMS messages.</p>

          <h3 className="text-lg font-semibold mb-3">Device Statuses</h3>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr><td className="px-4 py-3 font-mono text-xs">PENDING_CLAIM</td><td className="px-4 py-3">Device created but not yet claimed</td></tr>
                <tr><td className="px-4 py-3 font-mono text-xs">ACTIVE</td><td className="px-4 py-3">Device is claimed and sending heartbeats</td></tr>
                <tr><td className="px-4 py-3 font-mono text-xs">SUSPENDED</td><td className="px-4 py-3">Device is temporarily disabled</td></tr>
                <tr><td className="px-4 py-3 font-mono text-xs">REVOKED</td><td className="px-4 py-3">Device disabled, but can be re-activated by re-claiming with the same public key</td></tr>
              </tbody>
            </table>
          </div>

          <h3 className="text-lg font-semibold mt-6 mb-3">Claiming a Device</h3>
          <p className="text-gray-600 mb-3">There are two ways to claim a device:</p>

          <h4 className="font-semibold mb-2">Option A: QR Code (Recommended)</h4>
          <ol className="list-decimal list-inside text-gray-600 space-y-2 mb-4">
            <li>Go to workspace → Devices → Add Device</li>
            <li>QR code is generated with claim URL</li>
            <li>Open Android app → Scan QR code</li>
            <li>Device info (manufacturer, model, SIM numbers) is automatically collected</li>
            <li>Device claims and becomes ACTIVE</li>
          </ol>

          <h4 className="font-semibold mb-2">Option B: Manual Code Entry</h4>
          <ol className="list-decimal list-inside text-gray-600 space-y-2 mb-4">
            <li>Go to workspace → Devices → Add Device</li>
            <li>Note the 8-character claim code displayed</li>
            <li>Open Android app → Enter Code Manually</li>
            <li>Enter the server URL (first time only) and the claim code</li>
            <li>Device claims and becomes ACTIVE</li>
          </ol>

          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
            <p className="text-sm text-blue-800">
              <strong>Reactivated Devices:</strong> If a device was previously revoked and re-claims with the same public key, it is reactivated (status changes from REVOKED to ACTIVE) instead of creating a duplicate.
            </p>
          </div>

          <h3 className="text-lg font-semibold mt-6 mb-3">Viewing Device Details</h3>
          <p className="text-gray-600 mb-3">Click any device row in the Devices table to open a detail modal showing:</p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li>Device name (editable)</li>
            <li>Manufacturer and model</li>
            <li>OS version and app version</li>
            <li>SIM 1 and SIM 2 phone numbers</li>
            <li>Current status and last seen timestamp</li>
            <li>Creation date</li>
          </ul>

          <h3 className="text-lg font-semibold mt-6 mb-3">Editing Device Name</h3>
          <p className="text-gray-600 mb-3">Device names can be customized to make devices easier to identify (e.g., &quot;Reception Phone&quot;, &quot;HR Device&quot;). To edit:</p>
          <ol className="list-decimal list-inside text-gray-600 space-y-2">
            <li>Click the device row to open the detail modal</li>
            <li>Click the edit icon next to the device name</li>
            <li>Enter the new name and save</li>
          </ol>
        </section>

        {/* Keywords */}
        <section id="keywords" className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b-2 border-indigo-200 pb-2">Keywords</h2>
          <p className="text-gray-600 mb-4">Keywords filter which SMS messages get forwarded. Each keyword has a match mode:</p>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-4 py-3 text-left font-medium">Mode</th>
                  <th className="px-4 py-3 text-left font-medium">Description</th>
                  <th className="px-4 py-3 text-left font-medium">Example</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr><td className="px-4 py-3 font-mono text-xs">EXACT</td><td className="px-4 py-3">Case-sensitive exact match</td><td className="px-4 py-3 text-gray-500">&quot;OTP&quot; matches &quot;OTP&quot; only</td></tr>
                <tr><td className="px-4 py-3 font-mono text-xs">CONTAINS</td><td className="px-4 py-3">Case-insensitive partial match</td><td className="px-4 py-3 text-gray-500">&quot;OTP&quot; matches &quot;Your OTP is...&quot;</td></tr>
                <tr><td className="px-4 py-3 font-mono text-xs">REGEX</td><td className="px-4 py-3">Regular expression pattern</td><td className="px-4 py-3 text-gray-500">&quot;\d{6}&quot; matches any 6-digit code</td></tr>
                <tr><td className="px-4 py-3 font-mono text-xs">AT_START</td><td className="px-4 py-3">Matches at start of message</td><td className="px-4 py-3 text-gray-500">&quot;Code&quot; matches &quot;Code: 123456&quot;</td></tr>
                <tr><td className="px-4 py-3 font-mono text-xs">AT_END</td><td className="px-4 py-3">Matches at end of message</td><td className="px-4 py-3 text-gray-500">&quot;123456&quot; matches &quot;Your code: 123456&quot;</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* SMS Forwarding */}
        <section id="sms-forwarding" className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b-2 border-indigo-200 pb-2">SMS Forwarding</h2>
          <p className="text-gray-600 mb-4">When an SMS matches a keyword, it can be forwarded to an external webhook URL.</p>

          <h3 className="text-lg font-semibold mb-3">Forwarding Payload</h3>
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm mb-6"><code>{`{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "sender": "+1234567890",
  "message": "Your verification code is 123456",
  "matchedKeyword": "verification",
  "deviceId": "device-uuid",
  "smsId": "sha256-hash"
}`}</code></pre>

          <h3 className="text-lg font-semibold mb-3">Retry Policy</h3>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-4 py-3 text-left font-medium">Attempt</th>
                  <th className="px-4 py-3 text-left font-medium">Delay</th>
                  <th className="px-4 py-3 text-left font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr><td className="px-4 py-3">1</td><td className="px-4 py-3">Immediate</td><td className="px-4 py-3">HTTP POST</td></tr>
                <tr><td className="px-4 py-3">2</td><td className="px-4 py-3">1 second</td><td className="px-4 py-3">Retry</td></tr>
                <tr><td className="px-4 py-3">3</td><td className="px-4 py-3">2 seconds</td><td className="px-4 py-3">Retry</td></tr>
                <tr><td className="px-4 py-3">4</td><td className="px-4 py-3">4 seconds</td><td className="px-4 py-3">Retry</td></tr>
                <tr><td className="px-4 py-3">5</td><td className="px-4 py-3">8 seconds</td><td className="px-4 py-3">Final retry</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* API Reference */}
        <section id="api-reference" className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b-2 border-indigo-200 pb-2">API Reference</h2>

          <h3 className="text-lg font-semibold mb-3">Core Endpoints</h3>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-4 py-3 text-left font-medium">Method</th>
                  <th className="px-4 py-3 text-left font-medium">Endpoint</th>
                  <th className="px-4 py-3 text-left font-medium">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr><td className="px-4 py-3 font-mono text-xs">POST</td><td className="px-4 py-3 font-mono text-xs">/v1/auth/signup</td><td className="px-4 py-3">Create account</td></tr>
                <tr><td className="px-4 py-3 font-mono text-xs">POST</td><td className="px-4 py-3 font-mono text-xs">/v1/auth/login</td><td className="px-4 py-3">Login</td></tr>
                <tr><td className="px-4 py-3 font-mono text-xs">POST</td><td className="px-4 py-3 font-mono text-xs">/v1/auth/forgot-password</td><td className="px-4 py-3">Request password reset email</td></tr>
                <tr><td className="px-4 py-3 font-mono text-xs">POST</td><td className="px-4 py-3 font-mono text-xs">/v1/auth/reset-password</td><td className="px-4 py-3">Reset password with token</td></tr>
                <tr><td className="px-4 py-3 font-mono text-xs">GET</td><td className="px-4 py-3 font-mono text-xs">/v1/me</td><td className="px-4 py-3">Get current user</td></tr>
                <tr><td className="px-4 py-3 font-mono text-xs">GET</td><td className="px-4 py-3 font-mono text-xs">/v1/workspaces</td><td className="px-4 py-3">List workspaces</td></tr>
                <tr><td className="px-4 py-3 font-mono text-xs">GET</td><td className="px-4 py-3 font-mono text-xs">/v1/devices</td><td className="px-4 py-3">List devices</td></tr>
                <tr><td className="px-4 py-3 font-mono text-xs">GET</td><td className="px-4 py-3 font-mono text-xs">/v1/keywords</td><td className="px-4 py-3">List keywords</td></tr>
                <tr><td className="px-4 py-3 font-mono text-xs">GET</td><td className="px-4 py-3 font-mono text-xs">/v1/sms-logs</td><td className="px-4 py-3">List SMS logs (paginated)</td></tr>
                <tr><td className="px-4 py-3 font-mono text-xs">POST</td><td className="px-4 py-3 font-mono text-xs">/v1/sms</td><td className="px-4 py-3">Ingest SMS (device)</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Troubleshooting */}
        <section id="troubleshooting" className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b-2 border-indigo-200 pb-2">Troubleshooting</h2>

          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h4 className="font-semibold mb-2">Device won&apos;t claim</h4>
              <ul className="list-disc list-inside text-gray-600 text-sm space-y-1">
                <li>Ensure device and backend are on same network</li>
                <li>Check that Public API URL is set correctly in workspace settings</li>
                <li>Verify claim code hasn&apos;t expired (15 min TTL)</li>
              </ul>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h4 className="font-semibold mb-2">SMS not forwarding</h4>
              <ul className="list-disc list-inside text-gray-600 text-sm space-y-1">
                <li>Check webhook URL is reachable</li>
                <li>Verify keywords match incoming SMS</li>
                <li>Check forwarding logs for errors</li>
              </ul>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h4 className="font-semibold mb-2">Keywords not matching</h4>
              <ul className="list-disc list-inside text-gray-600 text-sm space-y-1">
                <li>Verify match mode (EXACT vs CONTAINS)</li>
                <li>Check keyword is enabled</li>
                <li>Test with exact SMS content</li>
              </ul>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h4 className="font-semibold mb-2">Revoked device won&apos;t reactivate</h4>
              <ul className="list-disc list-inside text-gray-600 text-sm space-y-1">
                <li>Ensure you&apos;re using the same public key (same physical device)</li>
                <li>Generate a new claim code (old codes are single-use)</li>
                <li>Check device status in web admin — must be REVOKED to reactivate</li>
              </ul>
            </div>
          </div>

          <h3 className="text-lg font-semibold mt-6 mb-3">Logs & Monitoring</h3>
          <ul className="list-disc list-inside text-gray-600 space-y-2">
            <li><strong>SMS Logs:</strong> View all captured and forwarded messages in the web admin</li>
            <li><strong>Backend Logs:</strong> <code className="bg-gray-100 px-1 rounded">docker-compose logs -f be</code></li>
            <li><strong>Web Logs:</strong> <code className="bg-gray-100 px-1 rounded">docker-compose logs -f web</code></li>
          </ul>

          <h3 className="text-lg font-semibold mt-6 mb-3">Quick Commands</h3>
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm"><code>{`# Start services
docker compose up -d

# Stop services
docker compose down

# View logs
docker compose logs -f

# Reset everything
docker compose down -v`}</code></pre>
        </section>

        {/* Footer */}
        <div className="border-t border-gray-200 pt-8 mt-12 text-center text-sm text-gray-500">
          <p>SMS Monitor v2.0 — User Guide</p>
          <Link href="/" className="text-indigo-600 hover:underline mt-2 inline-block">Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
