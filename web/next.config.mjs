/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  transpilePackages: ['@sms-monitor/shared-types'],
  // The web admin talks to the NestJS backend over HTTP.
  // In dev, the backend runs on :3000 and the web on :3001.
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000',
  },
};

export default nextConfig;
