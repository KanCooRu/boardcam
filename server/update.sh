#!/usr/bin/env bash
# Brings the game on this server in line with the repository: the base archive named in
# server/deploy.conf, the overlay folder on top of it, then a restart. Run by a timer every few
# minutes and once by the installer. It does nothing when nothing has changed.
set -euo pipefail

HOME_DIR="${NEBULA_HOME:-/opt/nebula}"
BRANCH="${NEBULA_BRANCH:-claude/upload-capacity-limit-73zpqg}"
RUN_AS="${NEBULA_USER-nebula}"          # empty: run file work as the current user (used when testing)
SERVICE="${NEBULA_SERVICE-nebula-game.service}"
REPO="$HOME_DIR/repo"
STATE="$HOME_DIR/state"
LOCK="${NEBULA_LOCK:-/run/nebula-update.lock}"   # outside the game account's reach

as_user() { if [ -n "$RUN_AS" ]; then runuser -u "$RUN_AS" -- "$@"; else "$@"; fi; }
say() { echo "[$(date '+%F %T')] $*"; }
fail() { say "중단: $*" >&2; exit 1; }

exec 9>"$LOCK"
flock -n 9 || { say "다른 갱신이 진행 중입니다."; exit 0; }

as_user git -C "$REPO" fetch --quiet --depth 1 origin "$BRANCH"
as_user git -C "$REPO" reset --quiet --hard FETCH_HEAD

# Read the settings as text. Nothing from the repository is run as a script here.
conf() { grep -E "^$1=" "$REPO/server/deploy.conf" | head -n 1 | cut -d= -f2- | tr -d '\r'; }
BASE_NAME="$(conf BASE_NAME)"; BASE_URL="$(conf BASE_URL)"; BASE_SHA256="$(conf BASE_SHA256)"
OVERLAY="$(conf OVERLAY)"; DELETE="$(conf DELETE)"
[[ "$BASE_NAME" =~ ^[A-Za-z0-9._-]+$ ]] || fail "BASE_NAME 값이 올바르지 않습니다."
[[ "$BASE_URL" =~ ^https://github\.com/KanCooRu/boardcam/releases/download/[A-Za-z0-9._/-]+\.zip$ ]] || fail "BASE_URL 값이 올바르지 않습니다."
[[ "$BASE_SHA256" =~ ^[0-9a-f]{64}$ ]] || fail "BASE_SHA256 값이 올바르지 않습니다."
[[ "$OVERLAY" =~ ^[A-Za-z0-9._-]+$ ]] || fail "OVERLAY 값이 올바르지 않습니다."
for path in $DELETE; do
  [[ "$path" =~ ^[A-Za-z0-9._/-]+$ && "$path" != /* && "$path" != *..* ]] || fail "DELETE 값이 올바르지 않습니다: $path"
done
[ -d "$REPO/$OVERLAY" ] || fail "저장소에 $OVERLAY 폴더가 없습니다."

WANT="$BASE_SHA256 $(as_user git -C "$REPO" rev-parse "HEAD:$OVERLAY") $(sha256sum "$REPO/server/deploy.conf" | cut -d' ' -f1)"
if [ -f "$STATE" ] && [ "$(cat "$STATE")" = "$WANT" ] && [ -d "$HOME_DIR/game/dist/client" ]; then
  exit 0
fi
say "새 버전을 적용합니다: $BASE_NAME + $OVERLAY"

# The untouched base archive is kept unpacked, so a later update only copies what differs.
BASE_DIR="$HOME_DIR/base/$BASE_SHA256"
if [ ! -d "$BASE_DIR/$BASE_NAME/dist/client" ]; then
  ZIP="$HOME_DIR/cache/$BASE_SHA256.zip"
  as_user mkdir -p "$HOME_DIR/cache" "$HOME_DIR/base"
  if [ ! -f "$ZIP" ] || [ "$(sha256sum "$ZIP" | cut -d' ' -f1)" != "$BASE_SHA256" ]; then
    say "게임 본체를 내려받습니다(약 390MB). 몇 분 걸립니다."
    as_user curl -fL --retry 5 --retry-delay 5 -o "$ZIP.part" "$BASE_URL"
    [ "$(sha256sum "$ZIP.part" | cut -d' ' -f1)" = "$BASE_SHA256" ] || fail "내려받은 파일이 손상됐습니다. 다시 실행해 주세요."
    as_user mv "$ZIP.part" "$ZIP"
  fi
  say "압축을 풉니다."
  as_user rm -rf "$BASE_DIR.tmp"; as_user mkdir -p "$BASE_DIR.tmp"
  as_user unzip -q -o "$ZIP" -d "$BASE_DIR.tmp"
  [ -d "$BASE_DIR.tmp/$BASE_NAME/dist/client" ] || fail "압축 안에 $BASE_NAME 폴더가 없습니다."
  as_user rm -rf "$BASE_DIR"; as_user mv "$BASE_DIR.tmp" "$BASE_DIR"
  # Older bases and archives are no longer needed.
  for old in "$HOME_DIR"/base/* "$HOME_DIR"/cache/*.zip; do
    case "$old" in "$BASE_DIR"|"$ZIP") ;; *) as_user rm -rf "$old" ;; esac
  done
fi

as_user mkdir -p "$HOME_DIR/game"
as_user rsync -a --delete "$BASE_DIR/$BASE_NAME/" "$HOME_DIR/game/"
as_user rsync -a "$REPO/$OVERLAY/" "$HOME_DIR/game/"
for path in $DELETE; do as_user rm -f "$HOME_DIR/game/$path"; done
[ -f "$HOME_DIR/game/tools/preview.mjs" ] || fail "게임 폴더에 tools/preview.mjs 가 없습니다."

echo "$WANT" | as_user tee "$STATE" >/dev/null
if [ -n "$SERVICE" ] && command -v systemctl >/dev/null 2>&1; then
  systemctl restart "$SERVICE" && say "게임 서버를 다시 시작했습니다."
fi
say "적용 완료."
