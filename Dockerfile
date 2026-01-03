FROM node:24-alpine AS base
RUN corepack enable
WORKDIR /app

FROM base AS build
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm run build

# Production stage
FROM base AS release
COPY --from=build /app/build ./
COPY --from=build /app/package.json ./

# Set production environment
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=8080

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/.well-known/openid_configuration || exit 1

# Run the application
CMD ["pnpm", "run", "start"]
