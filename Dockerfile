FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
COPY client/package*.json client/
COPY server/package*.json server/
COPY frontend/package*.json frontend/
COPY backend/package*.json backend/
RUN npm ci

COPY client client
COPY server server
COPY frontend frontend
COPY backend backend
COPY scripts scripts
RUN npm run build

FROM node:22-alpine AS runtime

ENV NODE_ENV=production
ENV PORT=4000
WORKDIR /app

COPY package*.json ./
COPY client/package*.json client/
COPY server/package*.json server/
COPY frontend/package*.json frontend/
COPY backend/package*.json backend/
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/server/dist server/dist
COPY --from=build /app/client/dist client/dist

EXPOSE 4000

USER node
CMD ["node", "server/dist/index.js"]
