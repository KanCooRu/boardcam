# 성운의 모루 — 게임 서버 묶음

`게임 서버 구축·운영·보안 가이드`(v1.3)의 **확정 구성**(범용 8GB 2대 + 로드밸런서 + 관리형 Postgres 스몰)에 맞춘 서버 프로그램과 설치 도구입니다. 게임 파일은 고치지 않고, 게임의 서버 모듈(`dist/server/index.js`)을 그대로 불러 씁니다.

## 들어 있는 것

| 경로 | 내용 |
|---|---|
| `host/` | 운영용 실행기(Node 24). `/health`, CPU 수만큼 프로세스, 로그인 검증, Postgres 연결, 순위표 스냅샷 |
| `pg/migrations/` | Postgres용 스키마(게임의 SQLite 스키마 14개를 옮긴 것 + 실행기용 1개). 서버가 켜질 때 자동 적용 |
| `Dockerfile`, `docker-compose.yml`, `Caddyfile`, `.env.example` | 가이드 4장의 구성. 두 서버에서 같은 파일을 씁니다 |
| `scripts/setup-server.sh` | 가이드 5장 ②~⑤(패키지, 자동 보안 업데이트, 스왑, app 계정, SSH, 방화벽, fail2ban) |
| `scripts/deploy.sh`, `../.github/workflows/deploy.yml` | 가이드 9장의 롤링 배포 |
| `scripts/backup-db.sh`, `scripts/disk-check.sh` | 가이드 7·8장의 S3 백업과 디스크 알림 |
| `loadtest/` | 부하 시험(k6용, Node만으로 도는 것) |
| `test/` | Postgres 계층과 로그인 검증 시험 |

어떤 게임 버전을 올릴지는 `docker-compose.yml`의 `api` → `args` 한 곳에서 정합니다(지금: **v166**, 릴리스 `test1`의 압축을 그대로 씁니다).

## 여기서 확인한 것

- **Postgres 이전**: 게임의 서버 테스트 11개가 DB에 보내는 문장 4,863건을 그대로 Postgres에 다시 보내 비교했고, 차이는 0건입니다(`test/replay.mjs`).
- **전체 구성**: Docker Compose로 Caddy + 게임 서버 + Postgres를 띄워 브라우저로 플레이했습니다(가입, 저장, 미니게임 보상, 새로고침 후 유지).
- **부하**: 가상 플레이어 3,000명이 15초마다 저장과 순위표 조회를 했을 때 초당 286건, 응답 시간 중앙값 11ms, 95% 61ms, 실패 0건. 프로세스 2개, 4코어 한 대에 부하 발생기와 DB까지 같이 올린 조건입니다.
- **순위표**: 20만 명일 때 게임 원래 방식은 요청당 0.3초였고, 실행기의 스냅샷(30초마다 갱신)을 쓰면 0.003초입니다.
- **로그인**: 서버의 Firebase 토큰 검증은 시험을 통과했습니다(만료·위조·다른 프로젝트 토큰 거부). 게임 안 로그인 화면은 **가짜 로그인 서비스로만** 확인했습니다. 실제 Firebase 프로젝트로는 아직 켜 보지 못했습니다.

## 아직 안 된 것 (가이드에는 있지만 이 묶음에 없는 것)

- 영수증 검증(결제), 관리 명령(`gm ban` 등), 점검 모드, 휴면 유저 보관, 재화 변동 로그
- Redis: 게임이 아직 쓰지 않습니다. Compose에 자리는 있고(`--profile redis`) 기본으로는 켜지 않습니다
- 로그인 없이 시작한 계정을 나중에 Google 계정에 잇는 설정 화면(연결 함수 `hostAccount.linkGoogle`만 있음)
- 구글 플레이용 앱 포장
- 실제 Lightsail에서의 실행. 스크립트는 문법과 여기서 가능한 부분만 확인했습니다

알아 둘 차이:

- 가이드는 정적 파일을 S3에 두지만, 여기서는 게임 서버가 직접 내보내고 Cloudflare가 캐시합니다(이름에 해시가 든 파일은 1년 캐시). 파일이 한 곳에만 있어 배포가 단순합니다.
- 같은 플레이어의 요청은 서버 두 대에 걸쳐서도 한 번에 하나씩 처리합니다. 다만 **서로 다른 플레이어**가 같은 순간에 같은 길드에 들어오면 정원(30명)을 한 명 넘길 수 있습니다.
- Lightsail 인스턴스는 CPU를 계속 100% 쓰면 속도가 제한됩니다(버스트 방식). 부하 시험은 실제 인스턴스에서 10분 이상 돌려 봐야 합니다.

---

## 설치 순서 (한 번만)

터미널에 치는 명령은 그대로 복사하면 됩니다. `< >` 안만 바꿉니다.

### 1. Lightsail 콘솔 (가이드 5장 ①)

1. 인스턴스 2대: 서울, Ubuntu 24.04, 범용 8GB. 이름 `api-1`, `api-2`
2. 관리형 DB: PostgreSQL, **스몰**, 같은 리전, **퍼블릭 모드 OFF**. 마스터 계정 이름과 비밀번호, 엔드포인트 주소를 적어 둡니다
3. 로드밸런서: 헬스체크 경로 `/health`, `api-1`·`api-2` 연결, 인증서에 게임 도메인 등록
4. 각 인스턴스 방화벽(네트워킹 탭): SSH 22는 내 IP만(+ "Lightsail 브라우저 SSH 허용" 체크), HTTP 80
5. 자동 스냅샷 켜기(두 대 모두)

### 2. 서버 기본 설정 (두 대 모두)

브라우저 터미널(`>_`)에서:

```
curl -fsSL https://raw.githubusercontent.com/KanCooRu/boardcam/claude/upload-capacity-limit-73zpqg/server/scripts/setup-server.sh -o setup-server.sh && sudo bash setup-server.sh
```

### 3. DB 만들기 (한 대에서 한 번)

```
sudo docker run --rm -it postgres:16 psql "postgres://<마스터계정>:<마스터비밀번호>@<DB엔드포인트>:5432/postgres?sslmode=require"
```

열린 `postgres=>` 창에 아래 세 줄을 넣습니다. `<앱비밀번호>`는 32자 무작위(`openssl rand -hex 16`으로 만들 수 있습니다).

```
CREATE ROLE game_app LOGIN PASSWORD '<앱비밀번호>';
CREATE DATABASE game OWNER game_app TEMPLATE template0 LC_COLLATE 'C' LC_CTYPE 'en_US.UTF-8';
\q
```

`LC_COLLATE 'C'`는 이름 순서를 게임이 원래 쓰던 방식과 같게 하기 위한 것입니다.

### 4. 게임 올리기 (두 대 모두)

```
sudo -iu app
git clone -b claude/upload-capacity-limit-73zpqg https://github.com/KanCooRu/boardcam.git ~/game
cd ~/game/server && cp .env.example .env && chmod 600 .env && nano .env
```

`.env`에서 고칠 줄:

```
SITE_ADDRESS=:80
PUBLIC_ORIGIN=https://<게임 도메인>
DATABASE_URL=postgres://game_app:<앱비밀번호>@<DB엔드포인트>:5432/game?sslmode=require
AUTH_MODE=firebase
FIREBASE_PROJECT_ID=<Firebase 프로젝트 ID>
FIREBASE_WEB_API_KEY=<Firebase 웹 API 키>
```

저장(`Ctrl+O`, 엔터, `Ctrl+X`)한 뒤:

```
docker compose up -d --build
docker compose ps
```

`api`가 `healthy`로 나오면 됩니다. 처음 빌드는 게임 본체(약 390MB)를 받느라 몇 분 걸립니다. 스키마는 처음 켜질 때 자동으로 만들어집니다.

### 5. Firebase (가이드 4장 "인증")

1. https://console.firebase.google.com 에서 프로젝트 생성
2. Authentication → 로그인 방법: **Google**과 **익명**을 켭니다
3. Authentication → 설정 → 승인된 도메인에 게임 도메인 추가
4. 프로젝트 설정 → 일반 → 웹 앱 추가. 거기 나오는 `projectId`와 `apiKey`를 4번의 `.env`에 넣습니다(이 두 값은 비밀이 아닙니다)

### 6. 도메인과 Cloudflare (가이드 5장 ⑦)

1. 도메인 네임서버를 Cloudflare로
2. 게임 도메인 CNAME → 로드밸런서 DNS 이름, 프록시(주황 구름) ON
3. SSL 모드 Full(strict), "Always Use HTTPS"
4. 레이트 리밋: 같은 IP 1분 300요청 초과 차단

### 7. 백업과 알림 (가이드 7·8장)

1. S3 버킷 생성(버저닝 ON, 30일 뒤 삭제 규칙), SNS 주제 생성 후 이메일 구독
2. 그 버킷에 쓰기와 그 주제에 게시만 할 수 있는 IAM 사용자를 만들고, `api-1`에서 `sudo -iu app aws configure`로 등록
3. `.env`에 `S3_BUCKET`, `SNS_TOPIC_ARN` 입력
4. `api-1`에서 `crontab -e`:

```
0 19 * * *   /home/app/game/server/scripts/backup-db.sh >> /home/app/backup.log 2>&1
*/10 * * * * /home/app/game/server/scripts/disk-check.sh
```

5. UptimeRobot에 `https://<게임 도메인>/health` 등록(1분 간격)

### 8. 출시 전 확인

- `https://<게임 도메인>/health`가 `{"ok":true,...}`
- 한 대를 끄고(`docker compose stop api`) 게임이 계속 되는지 확인한 뒤 다시 켜기
- 부하 시험(아래)
- 최신 백업을 개발용 DB에 복원해 보기

---

## 한 대로 먼저 시험하기 (가이드 13장 "개발 단계")

관리형 DB와 Firebase 없이, 서버 한 대에서 IP 주소로 바로 띄우는 방법입니다. 기존 봇 서버에서도 됩니다(80번 포트가 비어 있어야 합니다).

```
sudo apt-get update && sudo apt-get install -y docker.io docker-compose-v2 docker-buildx git
git clone -b claude/upload-capacity-limit-73zpqg https://github.com/KanCooRu/boardcam.git ~/game
cd ~/game/server && cp .env.example .env && chmod 600 .env
sed -i "s|^GUEST_SECRET=.*|GUEST_SECRET=$(openssl rand -hex 24)|; s|change-me|$(openssl rand -hex 12)|g" .env
sudo docker compose --profile localdb up -d --build
```

이 방법은 방화벽이나 SSH 설정을 건드리지 않습니다(봇 서버에 영향을 주지 않기 위해서입니다).

끝나면 `http://<서버 IP>/` 로 접속합니다. 이 방식의 계정은 브라우저 쿠키로 구분됩니다.

## 게임 버전 바꾸기

저장소의 `docker-compose.yml`에서 `args`(본체 주소·해시·덮어쓸 폴더)를 고쳐 올린 뒤:

```
SERVERS="<api-2 주소> <api-1 주소>" BRANCH=claude/upload-capacity-limit-73zpqg bash server/scripts/deploy.sh
```

한 대씩 바꾸므로 플레이어는 끊기지 않습니다. GitHub Actions를 쓰려면 저장소 Secrets에 `DEPLOY_SSH_KEY`, `DEPLOY_SERVERS`를 넣고 `main` 브랜치에 합치면 됩니다.

## 부하 시험

시험용 서버(`AUTH_MODE=guest`)에만 돌립니다. 실제 플레이어 데이터가 있는 DB에는 돌리지 않습니다.

```
# k6 (가이드 10장): 가상 플레이어 1만 명, 30초마다 저장과 순위표 조회, 10분
k6 run -e URL=https://<시험 주소> -e PLAYERS=10000 -e MINUTES=10 server/loadtest/k6-players.js

# k6 없이 Node만으로
node server/loadtest/node-load.mjs <게임 폴더> --url http://<시험 주소> --players 3000 --interval 15 --seconds 60
```

95%가 200ms 안에 응답하고 실패가 없으면 통과입니다.

## 서버의 SQL을 고쳤을 때

게임의 `dist/server/*.js` 안 SQL이 바뀌면 `test/README.md`의 순서로 Postgres 비교 시험을 다시 돌립니다. "differences: 0"이 나와야 합니다. 이 시험이 SQLite와 Postgres의 차이(정렬에서 NULL의 위치, 참/거짓 값, `INSERT OR IGNORE` 등)를 잡아 줍니다.
