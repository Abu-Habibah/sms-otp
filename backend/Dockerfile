# Node
FROM node:20-alpine AS base
RUN apk add --no-cache openssl libc6-compat
WORKDIR /app

# Deps
COPY package.json pnpm-workspace.yaml ./
COPY backend/package.json ./backend/package.json
COPY packages/shared-types/package.json ./packages/shared-types/package.json
RUN corepack enable && corepack prepare [email protected] --activate
RUN pnpm install --frozen-lockfile --filter @sms-monitor/backend... --filter @sms-monitor/shared-types...

# Build
COPY backend ./backend
COPY packages/shared-types ./packages/shared-types
RUN pnpm --filter @sms-monitor/shared-types build
RUN cd backend && pnpm exec prisma generate
RUN cd backend && pnpm build

# Runtime
FROM base AS runtime
ENV NODE_ENV=production
COPY --from=base /app/backend/dist ./dist
COPY --from=base /app/backend/prisma ./prisma
COPY --from=base /app/backend/node_modules ./node_modules
EXPOSE 3000
USER node
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
