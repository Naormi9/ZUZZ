FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.29.3 --activate
RUN apk add --no-cache libc6-compat

FROM base AS pruner
WORKDIR /app
RUN npm i -g turbo@2
COPY . .
RUN turbo prune @zuzz/admin --docker

FROM base AS installer
WORKDIR /app
COPY --from=pruner /app/out/json/ .
RUN pnpm install --frozen-lockfile
COPY --from=pruner /app/out/full/ .
RUN pnpm --filter @zuzz/admin build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=installer /app/apps/admin/.next/standalone ./
COPY --from=installer /app/apps/admin/.next/static ./apps/admin/.next/static
COPY --from=installer /app/apps/admin/public ./apps/admin/public

EXPOSE 3001
USER node
CMD ["node", "apps/admin/server.js"]
