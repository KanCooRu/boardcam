# syntax=docker/dockerfile:1.7
# Image of the game server: the game's built files plus the Node.js host that runs them.
# Build from the repository root:  docker compose -f server/docker-compose.yml build api

# ---- 1. The game files: the base archive from the release page, then this repository's overlay on top.
FROM alpine:3.20 AS game
ARG BASE_URL
ARG BASE_SHA256
ARG BASE_NAME
ARG OVERLAY
ARG DELETE=""
# The download is checked against its SHA-256; a changed or damaged archive stops the build.
ADD --checksum=sha256:${BASE_SHA256} ${BASE_URL} /tmp/base.zip
RUN mkdir /src \
 && unzip -q /tmp/base.zip "${BASE_NAME}/dist/*" "${BASE_NAME}/drizzle/*" -d /src \
 && mv "/src/${BASE_NAME}" /game && rm /tmp/base.zip
COPY ${OVERLAY}/ /overlay/
RUN cp -a /overlay/dist/. /game/dist/ \
 && if [ -d /overlay/drizzle ]; then cp -a /overlay/drizzle/. /game/drizzle/; fi \
 && for path in ${DELETE}; do rm -f "/game/${path}"; done \
 && echo '{"type":"module"}' > /game/dist/server/package.json \
 && test -f /game/dist/server/index.js && test -f /game/dist/client/index.html

# ---- 2. The host.
FROM node:24-slim
ENV NODE_ENV=production GAME_DIR=/app/game PORT=3000
WORKDIR /app/host
COPY server/host/package.json server/host/package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force
COPY server/host/*.mjs server/host/sign-in.client.js ./
COPY server/pg /app/pg
COPY --from=game /game /app/game
USER node
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=4s --start-period=25s --retries=3 \
 CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node","main.mjs"]
