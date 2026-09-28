FROM node:24-alpine AS base
RUN npm install -g pnpm

WORKDIR /app

COPY core-api/package.json ./
RUN pnpm install --no-frozen-lockfile --ignore-scripts

COPY core-api/ .

# core_api.proto là contract giữa core-api (server) và web (client) — hai repo
# khác nhau — nên nó sống ở contracts/proto/ của da-platform, không thuộc repo
# nào trong hai. grpc-server.service.ts resolve process.cwd()/proto/core_api.proto
# nên file phải nằm đúng /app/proto.
COPY contracts/proto ./proto

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
# Thiếu dòng này thì start:prod chết ngay khi dựng gRPC server: runtime đọc
# proto theo đường dẫn tương đối với cwd, mà stage prod không có nó.
COPY --from=build /app/proto ./proto
CMD ["pnpm", "run", "start:prod"]
