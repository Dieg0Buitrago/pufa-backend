# Docker build for the NestJS backend
# Builder stage: install dependencies and transpile TypeScript
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci

COPY tsconfig*.json nest-cli.json ./
COPY src ./src
COPY public ./public
COPY scripts ./scripts

RUN npm run build

# Runtime stage: copy built app and install production dependencies
FROM node:20-alpine AS runner

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/public ./public
RUN mkdir -p uploads

EXPOSE 3000

CMD ["node", "dist/main"]
