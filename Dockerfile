FROM node:24-alpine AS base
RUN npm install -g pnpm

WORKDIR /app

# Copy cả pnpm-lock.yaml và cài với --frozen-lockfile: hai lần build cùng một
# commit phải ra cùng một bộ phiên bản (trước đây lockfile bị bỏ qua).
COPY core-api/package.json core-api/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --ignore-scripts

COPY core-api/ .

# core_api.proto là contract giữa core-api (server) và web (client) — hai repo
# khác nhau — nên nó sống ở contracts/proto/ của da-platform, không thuộc repo
# nào trong hai. grpc-server.service.ts resolve process.cwd()/proto/core_api.proto
# nên file phải nằm đúng /app/proto.
COPY contracts/proto ./proto

RUN npx prisma generate

FROM base AS dev
CMD ["./node_modules/.bin/nest", "start", "--watch"]

# Chạy `prisma migrate deploy` ở prod. Stage `prod` không làm được việc này:
# prisma là devDependency (đã bị `pnpm prune --prod` xóa) và stage đó cũng không
# có thư mục prisma/ lẫn prisma.config.ts. Stage này giữ cả hai từ `base`.
# Tài khoản quản trị truyền lúc chạy qua MIGRATION_DATABASE_URL (prisma.config.ts),
# để nó không nằm trong env của core-api.
FROM base AS migrate
CMD ["./node_modules/.bin/prisma", "migrate", "deploy"]

FROM base AS build
RUN pnpm run build
# --ignore-scripts như lúc install: pnpm mới coi build script bị bỏ qua là lỗi
# (ERR_PNPM_IGNORED_BUILDS) và làm `prune` thoát mã 1. prisma generate đã chạy
# tường minh ở stage base nên không cần các script đó.
RUN pnpm prune --prod --ignore-scripts

FROM node:24-alpine AS prod
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
# Thiếu dòng này thì start:prod chết ngay khi dựng gRPC server: runtime đọc
# proto theo đường dẫn tương đối với cwd, mà stage prod không có nó.
COPY --from=build /app/proto ./proto
# Chạy node trực tiếp (không qua pnpm) để SIGTERM của `docker stop` tới thẳng
# process. Đầu ra nằm ở dist/src/main.js, không phải dist/main.js: tsc lấy
# rootDir là gốc dự án vì prisma/ và prisma.config.ts cũng được biên dịch.
CMD ["node", "dist/src/main"]
