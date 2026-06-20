FROM node:22-slim AS base

# Install pnpm and TypeScript globally
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN npm install -g typescript

# Build stage
FROM base AS builder
WORKDIR /app

# Copy root workspace files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY web/package.json ./web/
COPY packages/shared-types/package.json ./packages/shared-types/

# Install dependencies
ENV CI=true
RUN pnpm install --shamefully-hoist

# Copy source files
COPY packages/shared-types/ ./packages/shared-types/
COPY web/ ./web/

# Build shared-types
RUN tsc -p packages/shared-types/tsconfig.json

# Build Next.js
RUN pnpm --filter @sms-monitor/web build

# Production stage
FROM node:22-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3001

# Copy built files
COPY --from=builder /app/web/.next/standalone ./
COPY --from=builder /app/web/.next/static ./web/.next/static
COPY --from=builder /app/web/public ./web/public

EXPOSE 3001

CMD ["node", "web/server.js"]
