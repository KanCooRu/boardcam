#!/usr/bin/env bash
# Rolling deploy (server guide, section 9): one server at a time, so the load balancer always has one to send
# players to. Run from your PC or from GitHub Actions:
#   SERVERS="api-2.example.com api-1.example.com" ./deploy.sh
# Each server must have the repository at ~/game (account "app") and a filled-in server/.env.
set -euo pipefail
: "${SERVERS:?Set SERVERS to the server addresses, the one to update first coming first}"
BRANCH="${BRANCH:-main}"
for HOST in $SERVERS; do
  echo "==== $HOST ===="
  ssh -o StrictHostKeyChecking=accept-new "app@$HOST" BRANCH="$BRANCH" 'bash -s' <<'REMOTE'
set -euo pipefail
cd ~/game
git fetch --quiet origin "$BRANCH" && git reset --quiet --hard "origin/$BRANCH"
cd server
docker compose build api
# The new container must answer /health before this server counts as updated.
docker compose up -d api caddy
for i in $(seq 1 40); do
  if [ "$(docker inspect -f '{{.State.Health.Status}}' "$(docker compose ps -q api)")" = healthy ]; then echo "healthy"; exit 0; fi
  sleep 3
done
echo "api did not become healthy"; docker compose logs --tail 60 api; exit 1
REMOTE
  echo "Deployed on $HOST"
  sleep 20   # the balancer needs a few checks to send traffic back before the next server goes down
done
echo "Deploy done"
