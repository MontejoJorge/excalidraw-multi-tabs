FROM node:20.19.2-slim AS build

WORKDIR /app

COPY . .

RUN npm install -g pnpm@10
RUN pnpm install --frozen-lockfile -r

RUN pnpm run build

FROM nginx:1.27-alpine

COPY --from=build /app/dist /usr/share/nginx/html