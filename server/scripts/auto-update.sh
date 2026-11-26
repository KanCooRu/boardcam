#!/usr/bin/env bash
# Keeps this server on the latest commit of its branch: when the branch has moved, pull, rebuild the game
# server image and restart it. Meant to run every few minutes from cron.
#
#   One-time install (from the server/ folder):   sudo bash scripts/auto-update.sh --install
#   Remove:                                       sudo bash scripts/auto-update.sh --uninstall
#
# A build that fails changes nothing: the running game keeps running and the log says why.
# Whoever can push to this branch decides what this server runs.
set -euo pipefail
SERVER_DIR="$(cd "$(dirname "$0")/.." && pwd)"
REPO_DIR="$(cd "$SERVER_DIR/.." && pwd)"
LOG="${NEBULA_UPDATE_LOG:-/var/log/nebula-auto-update.log}"
CRON=/etc/cron.d/nebula-auto-update
OWNER="$(stat -c %U "$REPO_DIR")"
# Git is run as the account that owns the checkout, whoever runs this script.
git_() { if [ "$(id -un)" = "$OWNER" ]; then git -C "$REPO_DIR" "$@"; else sudo -u "$OWNER" git -C "$REPO_DIR" "$@"; fi; }

case "${1:-}" in
  --install)
    [ "$(id -u)" = 0 ] || { echo "Run with sudo."; exit 1; }
    printf 'SHELL=/bin/bash\nPATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/snap/bin\n*/5 * * * * root %q >> %q 2>&1\n' "$SERVER_DIR/scripts/auto-update.sh" "$LOG" > "$CRON"
    chmod 644 "$CRON"; touch "$LOG"
    echo "Installed: this server now checks for updates every 5 minutes. Log: $LOG"
    exit 0 ;;
  --uninstall)
    [ "$(id -u)" = 0 ] || { echo "Run with sudo."; exit 1; }
    rm -f "$CRON"; echo "Removed."; exit 0 ;;
esac

exec 9>/tmp/nebula-auto-update.lock
flock -n 9 || exit 0
BRANCH="$(git_ rev-parse --abbrev-ref HEAD)"
git_ fetch --quiet origin "$BRANCH"
NOW="$(git_ rev-parse HEAD)"; NEXT="$(git_ rev-parse FETCH_HEAD)"
[ "$NOW" = "$NEXT" ] && exit 0

say() { echo "[$(date '+%F %T')] $*"; }
say "update found: ${NOW:0:7} -> ${NEXT:0:7}"
# With two servers behind a balancer, they must not restart at the same moment.
sleep $(( $(hostname | cksum | cut -d' ' -f1) % ${NEBULA_UPDATE_SPREAD:-90} ))
git_ reset --quiet --hard "$NEXT"
cd "$SERVER_DIR"
if ! docker compose build api; then
  say "BUILD FAILED; the running game was left as it is. Going back to ${NOW:0:7}."
  git_ reset --quiet --hard "$NOW"
  exit 1
fi
docker compose up -d api caddy
for i in $(seq 1 40); do
  if [ "$(docker inspect -f '{{.State.Health.Status}}' "$(docker compose ps -q api)" 2>/dev/null)" = healthy ]; then
    say "updated to ${NEXT:0:7} and healthy"; exit 0
  fi
  sleep 3
done
say "updated to ${NEXT:0:7} but the game server did not report healthy; last lines of its log:"
docker compose logs --tail 30 api || true
exit 1
