#!/usr/bin/env bash
# Nightly database dump to S3 (server guide, section 7). Run by cron as the app account on ONE server:
#   0 19 * * *  /home/app/game/server/scripts/backup-db.sh >> /home/app/backup.log 2>&1     (19:00 UTC = 04:00 KST)
# Needs in server/.env: DATABASE_URL, S3_BUCKET, AWS_REGION, and optionally SNS_TOPIC_ARN.
# The AWS CLI must be signed in as a user that may only write to that bucket and publish to that topic.
set -euo pipefail
cd "$(dirname "$0")/.."
set -a; . ./.env; set +a
: "${DATABASE_URL:?DATABASE_URL is not set}" "${S3_BUCKET:?S3_BUCKET is not set}"
STAMP="$(date -u +%Y%m%d-%H%M)"
FILE="/tmp/game-$STAMP.sql.gz"
notify() { [ -n "${SNS_TOPIC_ARN:-}" ] && aws sns publish --region "${AWS_REGION:-ap-northeast-2}" --topic-arn "$SNS_TOPIC_ARN" --subject "$1" --message "$2" >/dev/null || true; }
trap 'notify "[game] DB backup FAILED" "Backup failed at $STAMP on $(hostname). See backup.log."; rm -f "$FILE"' ERR
# pg_dump runs from the PostgreSQL image, so nothing has to be installed on the server.
# The address inside the compose network ("postgres") also works because the container joins that network when it exists.
NETWORK="$(docker network ls --format '{{.Name}}' | grep -x nebula_default || true)"
docker run --rm ${NETWORK:+--network "$NETWORK"} -e PGURL="$DATABASE_URL" postgres:16 sh -c 'pg_dump --no-owner --no-privileges "$PGURL"' | gzip -9 > "$FILE"
SIZE="$(stat -c %s "$FILE")"
[ "$SIZE" -gt 1000 ] || { echo "dump is suspiciously small ($SIZE bytes)"; false; }
aws s3 cp "$FILE" "s3://$S3_BUCKET/db/game-$STAMP.sql.gz" --storage-class STANDARD_IA --only-show-errors --region "${AWS_REGION:-ap-northeast-2}"
rm -f "$FILE"
echo "Backup OK: $STAMP ($SIZE bytes)"
notify "[game] DB backup OK" "Backup OK: $STAMP ($SIZE bytes)"
