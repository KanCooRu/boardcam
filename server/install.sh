#!/usr/bin/env bash
# One-time setup of a game server for "성운의 모루" on a fresh Linux machine (Ubuntu, Debian or Amazon Linux).
# Run as root:  curl -fsSL <this file> | sudo bash
# It installs Node.js, puts the game under /opt/nebula, starts it on port 80, and sets three timers:
# an update check every 5 minutes, a database backup every night, and nothing else.
set -euo pipefail

REPO_URL="https://github.com/KanCooRu/boardcam.git"
BRANCH="claude/upload-capacity-limit-73zpqg"
HOME_DIR="/opt/nebula"
DATA_DIR="/var/lib/nebula"
PORT=80

say() { echo; echo "==== $* ===="; }
fail() { echo; echo "!!!! 설치 중단: $*" >&2; exit 1; }
[ "$(id -u)" = 0 ] || fail "관리자 권한이 필요합니다. 명령 앞에 sudo 를 붙여 다시 실행해 주세요."
command -v systemctl >/dev/null || fail "이 서버에는 systemd 가 없습니다."

case "$(uname -m)" in
  x86_64) ARCH=x64 ;;
  aarch64|arm64) ARCH=arm64 ;;
  *) fail "지원하지 않는 CPU 입니다: $(uname -m)" ;;
esac

say "1/7 필요한 도구 설치"
if command -v apt-get >/dev/null; then
  export DEBIAN_FRONTEND=noninteractive
  apt-get update -y -q
  apt-get install -y -q git unzip curl rsync xz-utils ca-certificates util-linux
elif command -v dnf >/dev/null; then
  dnf install -y -q git unzip rsync xz tar util-linux
  command -v curl >/dev/null || dnf install -y -q curl-minimal
elif command -v yum >/dev/null; then
  yum install -y -q git unzip curl rsync xz tar util-linux
else
  fail "apt, dnf, yum 중 아무것도 없습니다."
fi

say "2/7 메모리 확인"
# Small instances run out of memory while unpacking. A swap file gives them room.
MEM_MB=$(awk '/MemTotal/{print int($2/1024)}' /proc/meminfo)
if [ "$MEM_MB" -lt 1500 ] && [ "$(swapon --noheadings | wc -l)" = 0 ]; then
  echo "메모리 ${MEM_MB}MB: 보조 메모리(스왑) 1GB를 만듭니다."
  if fallocate -l 1G /swapfile 2>/dev/null || dd if=/dev/zero of=/swapfile bs=1M count=1024 status=none; then
    chmod 600 /swapfile && mkswap -q /swapfile && swapon /swapfile
    grep -q '^/swapfile ' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
  fi
else
  echo "메모리 ${MEM_MB}MB: 그대로 진행합니다."
fi
FREE_MB=$(df -Pm / | awk 'NR==2{print $4}')
[ "$FREE_MB" -ge 2500 ] || fail "디스크 여유 공간이 부족합니다(${FREE_MB}MB). 2.5GB 이상 필요합니다."

# Another program already answering on the web port would be knocked out by nothing here, but the game
# could not start beside it. Stop before changing anything else.
if command -v ss >/dev/null && ss -ltn 2>/dev/null | grep -qE "[:.]$PORT[[:space:]]" && ! systemctl is-active --quiet nebula-game.service; then
  fail "이 서버에서 다른 프로그램이 이미 ${PORT}번 포트(웹)를 쓰고 있습니다. 게임은 새 서버에 설치하는 편이 안전합니다."
fi

say "3/7 게임 전용 계정과 폴더"
id nebula >/dev/null 2>&1 || useradd --system --home-dir "$HOME_DIR" --shell /usr/sbin/nologin nebula
mkdir -p "$HOME_DIR/bin" "$DATA_DIR/backup"
chown nebula:nebula "$HOME_DIR" "$DATA_DIR" "$DATA_DIR/backup"
chown root:root "$HOME_DIR/bin"

say "4/7 Node.js 24 설치"
NODE_DIR="$HOME_DIR/node"
if ! "$NODE_DIR/bin/node" -e 'process.exit(Number(process.versions.node.split(".")[0])>=24?0:1)' 2>/dev/null; then
  SUMS="$(curl -fsSL https://nodejs.org/dist/latest-v24.x/SHASUMS256.txt)"
  LINE="$(echo "$SUMS" | grep -E "  node-v24\.[0-9.]+-linux-$ARCH\.tar\.xz$" | head -n 1)"
  [ -n "$LINE" ] || fail "Node.js 내려받기 목록을 읽지 못했습니다."
  NODE_SHA="${LINE%% *}"; NODE_FILE="${LINE##* }"
  curl -fL --retry 5 -o "/tmp/$NODE_FILE" "https://nodejs.org/dist/latest-v24.x/$NODE_FILE"
  [ "$(sha256sum "/tmp/$NODE_FILE" | cut -d' ' -f1)" = "$NODE_SHA" ] || fail "Node.js 파일이 손상됐습니다. 다시 실행해 주세요."
  rm -rf "$NODE_DIR" && mkdir -p "$NODE_DIR"
  tar -xJf "/tmp/$NODE_FILE" -C "$NODE_DIR" --strip-components=1 && rm -f "/tmp/$NODE_FILE"
fi
"$NODE_DIR/bin/node" --version

say "5/7 저장소 받기"
if [ ! -d "$HOME_DIR/repo/.git" ]; then
  rm -rf "$HOME_DIR/repo"
  runuser -u nebula -- git clone --quiet --depth 1 --branch "$BRANCH" "$REPO_URL" "$HOME_DIR/repo"
fi
# The updater and the backup script are copied once, here. Later changes in the repository to these two
# files do not reach the server until this installer is run again.
install -m 755 -o root -g root "$HOME_DIR/repo/server/update.sh" "$HOME_DIR/bin/update.sh"
install -m 755 -o root -g root "$HOME_DIR/repo/server/backup.sh" "$HOME_DIR/bin/backup.sh"

say "6/7 서비스 등록"
cat > /etc/systemd/system/nebula-game.service <<UNIT
[Unit]
Description=Nebula Forge game server
After=network-online.target
Wants=network-online.target

[Service]
User=nebula
Group=nebula
WorkingDirectory=$HOME_DIR/game
Environment=NEBULA_PREVIEW_DB=$DATA_DIR/game.sqlite
Environment=NODE_ENV=production
ExecStart=$NODE_DIR/bin/node tools/preview.mjs --port $PORT
AmbientCapabilities=CAP_NET_BIND_SERVICE
CapabilityBoundingSet=CAP_NET_BIND_SERVICE
NoNewPrivileges=true
ProtectSystem=full
ProtectHome=true
PrivateTmp=true
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
UNIT
cat > /etc/systemd/system/nebula-update.service <<UNIT
[Unit]
Description=Nebula Forge update check
After=network-online.target

[Service]
Type=oneshot
ExecStart=$HOME_DIR/bin/update.sh
UNIT
cat > /etc/systemd/system/nebula-update.timer <<UNIT
[Unit]
Description=Nebula Forge update check every 5 minutes

[Timer]
OnBootSec=2min
OnUnitActiveSec=5min

[Install]
WantedBy=timers.target
UNIT
cat > /etc/systemd/system/nebula-backup.service <<UNIT
[Unit]
Description=Nebula Forge database backup

[Service]
Type=oneshot
User=nebula
ExecStart=$HOME_DIR/bin/backup.sh
UNIT
cat > /etc/systemd/system/nebula-backup.timer <<UNIT
[Unit]
Description=Nebula Forge database backup every night

[Timer]
OnCalendar=*-*-* 19:30:00 UTC
Persistent=true

[Install]
WantedBy=timers.target
UNIT
systemctl daemon-reload

say "7/7 게임 설치와 시작 (본체 약 390MB를 내려받습니다. 몇 분 걸립니다)"
NEBULA_SERVICE="" "$HOME_DIR/bin/update.sh"
systemctl enable --now nebula-game.service
systemctl enable --now nebula-update.timer nebula-backup.timer

sleep 4
CODE="$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:$PORT/" || true)"
IP="$(curl -fsS --max-time 8 https://checkip.amazonaws.com 2>/dev/null | tr -d '[:space:]' || true)"
echo
if [ "$CODE" = 200 ]; then
  echo "########################################################"
  echo "#  설치 성공"
  echo "#  접속 주소:  http://${IP:-<이 서버의 공인 IP>}/"
  echo "#  (접속이 안 되면 Lightsail 의 네트워킹 탭에서 HTTP 80 이 열려 있는지 확인)"
  echo "########################################################"
else
  echo "!!!! 서버가 응답하지 않습니다(응답 코드: ${CODE:-없음}). 아래 기록을 캡처해서 보내 주세요."
  systemctl --no-pager --lines=30 status nebula-game.service || true
  exit 1
fi
