FROM node:22
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN npm install -g typescript

# Copy entire workspace
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/ ./backend/
COPY packages/ ./packages/

# Install all deps
ENV CI=true
RUN pnpm install --shamefully-hoist

# Build shared-types
RUN tsc -p packages/shared-types/tsconfig.json

# Generate Prisma client
RUN cd backend && pnpm exec prisma generate

# Build backend
RUN pnpm --filter @sms-monitor/backend build

ENV NODE_ENV=production
ENV DATABASE_URL=postgresql://sms_monitor:sms_monitor_dev@pg:5432/sms_monitor

EXPOSE 3000

CMD ["sh", "-c", "node /app/node_modules/.pnpm/prisma@5.22.0/node_modules/prisma/build/index.js migrate deploy --schema=/app/backend/prisma/schema.prisma 2>/dev/null; node backend/dist/src/main.js"]
