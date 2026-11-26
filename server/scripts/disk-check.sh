#!/usr/bin/env bash
# Warns when the disk passes 80% (server guide, section 8). Cron, every 10 minutes, on every server:
#   */10 * * * *  /home/app/game/server/scripts/disk-check.sh
set -euo pipefail
cd "$(dirname "$0")/.."
set -a; . ./.env; set +a
USE="$(df / | awk 'NR==2 {print $5}' | tr -d '%')"
MARK=/tmp/nebula-disk-warned
if [ "$USE" -gt 80 ]; then
  # One message a day is enough.
  if [ ! -f "$MARK" ] || [ -n "$(find "$MARK" -mmin +1440)" ]; then
    [ -n "${SNS_TOPIC_ARN:-}" ] && aws sns publish --region "${AWS_REGION:-ap-northeast-2}" --topic-arn "$SNS_TOPIC_ARN" \
      --subject "[game] Disk ${USE}%" --message "Disk usage ${USE}% on $(hostname)" >/dev/null
    touch "$MARK"
  fi
else rm -f "$MARK"; fi
