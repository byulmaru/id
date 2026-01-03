# Build stage
FROM node:24-alpine AS base
WORKDIR /app

# Install dependencies
FROM base AS install
RUN pnpm install
COPY package.json pnpm-lock.yaml ./

# Install production dependencies
RUN pnpm install --frozen-lockfile --production

# Build stage
FROM base AS build
COPY --from=install /app/node_modules ./node_modules
COPY . .

# Set environment for build
ENV PUBLIC_OIDC_ISSUER=https://id.byulmaru.co
ENV PUBLIC_COOKIE_DOMAIN=.byulmaru.co

RUN pnpm run build

# Production stage
FROM base AS release
COPY --from=build /app/.svelte-kit/output ./
COPY --from=build /app/package.json ./

# Set production environment
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/.well-known/openid_configuration || exit 1

# Run the application
CMD ["pnpm", "run", "start"]
