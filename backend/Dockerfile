# ----- Builder -----
FROM node:20-alpine AS builder
WORKDIR /app

# Install deps
COPY package*.json ./
RUN npm ci

# Generate Prisma client (needs schema)
COPY prisma ./prisma
RUN npx prisma generate

# Copy TS sources and config, then build to /app/dist
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ----- Runtime -----
FROM node:20-alpine
WORKDIR /app

# Only prod deps
COPY package*.json ./
RUN npm ci --omit=dev

# Copy prisma client files and compiled app
COPY --from=builder /app/node_modules/.prisma /app/node_modules/.prisma
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production
EXPOSE 4000
CMD ["node", "dist/index.js"]