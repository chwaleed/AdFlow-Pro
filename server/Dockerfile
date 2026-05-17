# 1. Install deps
FROM node:26-alpine AS deps 

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

# 2. Build stage
FROM node:26-alpine AS builder 

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm run build

# 3. Final runtime image
FROM node:26-alpine AS runner

WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

RUN chown -R appuser:appgroup /app

USER appuser

EXPOSE 5000

CMD ["node", "dist/index.js"]
