/**
 * Node test client for Sprint 2 claim flow.
 *
 * Usage:
 *   npx ts-node backend/test/clients/claim-flow.ts
 *
 * Environment variables:
 *   API_BASE_URL  — backend URL (default: http://localhost:3000)
 *   TENANT_SLUG   — tenant slug to signup/login with
 *   ADMIN_EMAIL   — admin email (default: admin@test.com)
 *   ADMIN_PASS    — admin password (default: Strong1Pass!)
 */

const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:3000';
const TENANT_SLUG = process.env.TENANT_SLUG ?? `test-${Date.now()}`;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? `admin-${TENANT_SLUG}@test.com`;
const ADMIN_PASS = process.env.ADMIN_PASS ?? 'Strong1Pass!';

interface ApiResponse {
  status: number;
  body: unknown;
  cookies: string;
}

async function request(
  method: string,
  path: string,
  body?: unknown,
  cookie?: string,
): Promise<ApiResponse> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (cookie) headers['Cookie'] = cookie;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const setCookie = res.headers.getSetCookie?.() ?? [];
  const cookies = setCookie.map((c) => c.split(';')[0]).join('; ');

  let json: unknown;
  try {
    json = await res.json();
  } catch {
    json = null;
  }

  return { status: res.status, body: json, cookies };
}

async function main(): Promise<void> {
  console.log('=== SMS Monitor — Claim Flow Test Client ===\n');
  console.log(`API: ${API_BASE}`);
  console.log(`Tenant: ${TENANT_SLUG}\n`);

  // 1. Signup
  console.log('1. Signing up...');
  const signup = await request('POST', '/v1/auth/signup', {
    tenantSlug: TENANT_SLUG,
    name: 'Test Admin',
    email: ADMIN_EMAIL,
    password: ADMIN_PASS,
  });
  console.log(`   Status: ${signup.status}`);
  if (signup.status !== 201) {
    console.error('   Signup failed:', signup.body);
    process.exit(1);
  }
  const jar = signup.cookies;
  console.log('   OK — JWT cookie set\n');

  // 2. Generate claim code
  console.log('2. Generating claim code...');
  const codeRes = await request('POST', '/v1/claim-codes', { ttlMinutes: 15 }, jar);
  console.log(`   Status: ${codeRes.status}`);
  if (codeRes.status !== 201) {
    console.error('   Failed:', codeRes.body);
    process.exit(1);
  }
  const { code, expiresAt } = codeRes.body as { code: string; expiresAt: string };
  console.log(`   Code: ${code}`);
  console.log(`   Expires: ${expiresAt}\n`);

  // 3. Claim device (public endpoint)
  console.log('3. Claiming device...');
  const claimRes = await request('POST', '/v1/claim-codes/claim', {
    code,
    publicKey: 'test-public-key-client',
    deviceInfo: { manufacturer: 'TestCo', model: 'NodeClient', osVersion: '1.0', appVersion: '0.3.0' },
  });
  console.log(`   Status: ${claimRes.status}`);
  if (claimRes.status !== 200) {
    console.error('   Claim failed:', claimRes.body);
    process.exit(1);
  }
  const { device, apiKey } = claimRes.body as { device: { id: string; status: string }; apiKey: string };
  console.log(`   Device ID: ${device.id}`);
  console.log(`   Status: ${device.status}`);
  console.log(`   API Key: ${apiKey.slice(0, 8)}...${apiKey.slice(-4)}\n`);

  // 4. Send heartbeat
  console.log('4. Sending heartbeat...');
  const hbHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
  };
  const hbFetch = await fetch(`${API_BASE}/v1/devices/${device.id}/heartbeat`, {
    method: 'POST',
    headers: hbHeaders,
  });
  console.log(`   Status: ${hbFetch.status}`);
  if (hbFetch.status !== 200) {
    const errBody = await hbFetch.json().catch(() => null);
    console.error('   Heartbeat failed:', errBody);
    process.exit(1);
  }
  const hbBody = await hbFetch.json();
  console.log(`   Last seen: ${(hbBody as { lastSeenAt: string }).lastSeenAt}\n`);

  // 5. Create a keyword
  console.log('5. Creating keyword "OTP"...');
  const kwRes = await request('POST', '/v1/keywords', { word: 'OTP', matchMode: 'CONTAINS' }, jar);
  console.log(`   Status: ${kwRes.status}`);
  if (kwRes.status !== 201) {
    console.error('   Keyword creation failed:', kwRes.body);
    process.exit(1);
  }
  console.log(`   Keyword ID: ${(kwRes.body as { id: string }).id}\n`);

  // 6. Send SMS with keyword match
  console.log('6. Sending SMS with keyword match...');
  const smsRes = await fetch(`${API_BASE}/v1/sms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      sender: '+1234567890',
      message: 'Your OTP code is 123456',
      smsId: `sms-${Date.now()}`,
      timestamp: new Date().toISOString(),
    }),
  });
  console.log(`   Status: ${smsRes.status}`);
  if (smsRes.status !== 201) {
    const errBody = await smsRes.json().catch(() => null);
    console.error('   SMS ingest failed:', errBody);
    process.exit(1);
  }
  const smsBody = await smsRes.json();
  console.log(`   Matched: ${(smsBody as { matched: boolean }).matched}`);
  console.log(`   Keyword: ${(smsBody as { matchedKeyword: string | null }).matchedKeyword}\n`);

  // 7. Send SMS without keyword match
  console.log('7. Sending SMS without keyword match...');
  const smsNoMatch = await fetch(`${API_BASE}/v1/sms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      sender: '+1234567890',
      message: 'Hello world, no keywords here',
      smsId: `sms-${Date.now()}`,
      timestamp: new Date().toISOString(),
    }),
  });
  console.log(`   Status: ${smsNoMatch.status}`);
  const smsNoMatchBody = await smsNoMatch.json();
  console.log(`   Matched: ${(smsNoMatchBody as { matched: boolean }).matched}\n`);

  // 8. List devices
  console.log('8. Listing devices...');
  const listRes = await request('GET', '/v1/devices', undefined, jar);
  console.log(`   Status: ${listRes.status}`);
  const devices = listRes.body as { id: string; status: string; displayName: string }[];
  console.log(`   Count: ${Array.isArray(devices) ? devices.length : 0}`);
  if (Array.isArray(devices)) {
    devices.forEach((d) => console.log(`   - ${d.displayName} (${d.status})`));
  }
  console.log();

  // 9. Revoke device
  console.log('9. Revoking device...');
  const revokeRes = await request('DELETE', `/v1/devices/${device.id}`, undefined, jar);
  console.log(`   Status: ${revokeRes.status}`);
  if (revokeRes.status !== 200) {
    console.error('   Revoke failed:', revokeRes.body);
    process.exit(1);
  }
  console.log('   OK\n');

  // 10. Heartbeat after revoke (should fail)
  console.log('10. Heartbeat after revoke (expect 401)...');
  const hbAfterRevoke = await fetch(`${API_BASE}/v1/devices/${device.id}/heartbeat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
  });
  console.log(`   Status: ${hbAfterRevoke.status}`);
  if (hbAfterRevoke.status === 401) {
    console.log('   OK — correctly rejected\n');
  } else {
    console.error('   Expected 401, got', hbAfterRevoke.status);
    process.exit(1);
  }

  console.log('=== All checks passed ===');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
