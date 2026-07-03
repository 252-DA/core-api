FROM node:24-alpine AS base
RUN npm install -g pnpm

WORKDIR /app

COPY core-api/package.json ./
RUN pnpm install --no-frozen-lockfile --ignore-scripts

COPY core-api/ .
RUN npx prisma generate

FROM base AS dev
CMD ["./node_modules/.bin/nest", "start", "--watch"]

FROM base AS build
RUN pnpm run build
RUN pnpm prune --prod

FROM node:24-alpine AS prod
RUN npm install -g pnpm
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
CMD ["pnpm", "run", "start:prod"]
