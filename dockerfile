# -----------------------------
# Stage 0: Build
# -----------------------------
FROM node:lts-alpine3.22 AS build

WORKDIR /app

# Copy package.json and install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code, Prisma schema, and generated client
COPY ./src ./src
COPY ./prisma ./prisma
COPY tsconfig*.json ./
COPY nest-cli.json ./

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript → JavaScript
RUN npm run build


# -----------------------------
# Stage 1: Production
# -----------------------------
FROM node:lts-alpine3.22 AS prod

WORKDIR /app
ENV NODE_ENV=production

# Copy only production dependencies
COPY package.json package-lock.json ./

RUN npm ci --omit=dev

# Copy built app and Prisma client
COPY --from=build /app/dist ./dist

# Expose NestJS port
EXPOSE 3000

# Start the app
CMD ["node", "dist/src/main.js"]