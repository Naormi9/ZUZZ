FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.29.3 --activate
RUN apk add --no-cache libc6-compat

FROM base AS pruner
WORKDIR /app
RUN npm i -g turbo@2
COPY . .
RUN turbo prune @zuzz/api --docker

FROM base AS installer
WORKDIR /app
COPY --from=pruner /app/out/json/ .
RUN pnpm install --frozen-lockfile
COPY --from=pruner /app/out/full/ .
RUN pnpm db:generate
RUN pnpm --filter @zuzz/api build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy built API and dependencies
COPY --from=installer /app/apps/api/dist ./dist
COPY --from=installer /app/node_modules ./node_modules
COPY --from=installer /app/packages/database/prisma ./prisma
COPY --from=installer /app/packages/ ./packages/

# Create uploads directory
RUN mkdir -p /app/uploads && chown -R node:node /app

EXPOSE 4000
USER node
CMD ["node", "dist/index.js"]
