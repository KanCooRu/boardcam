# 성운의 모루 — GPT 작업 지시서 통합본 (에셋·사운드 중심)

기준: 웹 v156 + **fix5**(2026-11-26). fix5를 먼저 적용한 뒤에 사용합니다. 이전에 드린 지시서(v157)는 이 파일로 대체합니다.

## 사용하는 방법 (사람이 읽는 부분)

GPT는 여러 일을 한꺼번에 주면 일부만 하거나 섞어서 처리합니다. 그래서 이렇게 씁니다.

1. 새 대화를 열 때마다 **[공통 규칙]** 블록 전체를 먼저 붙여 넣습니다.
2. 그 아래에 **작업 카드 한 장만** 붙여 넣습니다. 두 장을 같이 주지 않습니다.
3. GPT가 "보고 형식"대로 답하면, 보고에 적힌 파일이 실제로 있는지만 확인하고 다음 카드로 넘어갑니다.
4. GPT가 카드에 없는 일을 했다고 보고하면 "카드에 없는 변경은 되돌려 줘"라고 말합니다.
5. GPT가 "문자열을 찾지 못함"이라고 멈추면, 그 카드보다 먼저 해야 하는 카드가 있는지 "전제" 줄을 확인합니다.

카드끼리는 순서를 바꿔도 되게 만들었습니다. 예외는 **S3(S2 다음에만 가능)** 하나입니다.

추천 순서(효과 대비 사용량이 적은 순):
**S1 → A1 → A2 → A4 → A8 → S2 → A3 → A9 → A5 → S3 → A6 → S4 → A7 → C1**

| 카드 | 내용 | 결과물 수 | 사용량 |
| --- | --- | --- | --- |
| S1 | 버튼 누르는 소리 연결(녹음은 이미 있음) | 코드 2곳 | 아주 적음 |
| A1 | 동료 소환권 아이콘 | 이미지 1 | 적음 |
| A2 | 무기 잔해 아이콘 | 이미지 1 | 적음 |
| A4 | 탑 강화 카드 아이콘 3종 | 이미지 3 | 적음 |
| A8 | 튀는 아이콘 3종 다시 그리기(강화석·별철·다이아) | 이미지 3 | 적음 |
| S2 | 강화 실패·파괴 소리 | 소리 2 | 적음 |
| A3 | 성좌 각인 별자리 지도 그림(밤하늘 1 · 별 메달 3 · 자물쇠 1) | 이미지 5 | 보통 |
| A9 | 미니게임 그림(목록 그림 2 · 용광로 1 · 역할 아이콘 6) | 이미지 9 | 보통 |
| A5 | 거점 코인 4종·패스 코인·이벤트 코인 | 이미지 6 | 보통 |
| S3 | 레벨업·스테이지 클리어·보스 경고 등 소리 | 소리 9 | 보통 |
| A6 | 다이아 상품 그림 2장 + 월드보스 배경 1장 | 이미지 3 | 보통 |
| S4 | 지역별 배경 음악 4곡 | 음악 4 | 많음 |
| A7 | 난이도별 보스 변형(지역 하나씩 반복) | 지역당 이미지 9+ | 많음 |
| C1 | 초기화 시각을 한국 자정으로 통일 | 코드 | 보통 |

### 에셋 통일 상태 (2026-11-25에 직접 확인한 것)

- 아이콘 49개: 대부분 보라+금색, 같은 광택으로 통일되어 있습니다. 튀는 것은 강화석·별철(금 장식 없는 덩어리), 다이아(평면적)입니다 → 카드 A8.
- 탑 입장권 열쇠 아이콘도 튀지만, 지금 게임에서 쓰이지 않는 파일이라 카드에 넣지 않았습니다.
- 몬스터 40종: 화풍은 통일되어 있습니다.
- 크기가 다른 것: 패스 코인·거점 코인만 96px → 카드 A5. 탑 강화 카드 3장이 다른 그림을 빌려 씀 → 카드 A4.

---

## [공통 규칙] — 매 대화 맨 처음에 그대로 붙여 넣기

```
너는 모바일 방치형 RPG "성운의 모루" 웹 버전의 에셋·사운드 담당이다.
아래 규칙을 이 대화 내내 지켜라. 규칙과 작업 카드가 충돌하면 규칙이 우선이다.

[0] 시작 전 확인 (하나라도 아니면 아무것도 하지 말고 그 사실만 보고한다)
    - web/game/constellation.js 파일이 있고, 그 안에 CONSTELLATION_ART 라는 이름이 있다
    - web/game/minigames.js 파일이 있다 (fix5가 적용된 프로젝트다)
    - web/game/anvil-awakening.js 파일이 없다
    - AGENTS.md에 "성장·경제 개편 (2026-11-25)" 항목이 있다
    폴더 안내:
    - web/index.html, web/game/*.js, web/styles/*.css  : 편집 원본 (여기를 고친다)
    - dist/client/*.js, dist/client/*.css             : 이 폴더의 개별 파일도 편집 원본이다
    - dist/client/index.html, dist/client/game-bundle-*.js|css : 빌드가 만드는 파일. 손으로 고치지 않는다
    - dist/client/assets/                              : 그림·소리 파일
    용어:
    - "찾기/바꾸기": 파일에서 "찾기" 문자열을 글자 그대로 검색해 "바꾸기" 문자열로 교체한다.
      "찾기" 문자열은 그 파일에 정확히 한 번 나온다. 0번이나 2번 이상 나오면 멈추고 보고한다.
    - "\n"은 줄바꿈을 뜻한다.

[1] 이번 대화에서 할 일은 내가 붙여 넣는 "작업 카드" 한 장뿐이다.
    카드에 없는 파일은 열어 보기만 하고 고치지 않는다.
    더 좋은 방법이 떠올라도 하지 말고, 보고의 "제안" 칸에만 적는다.

[2] 절대 바꾸지 않는 것 (숫자 하나도 건드리지 않는다)
    - web/game/economy-rules.js, web/game/campaign-difficulties.js, web/game/constellation.js, web/game/minigames.js,
      web/game/trial-rules.js, web/game/growth-pass.js 안의 수치와 규칙
    - dist/server/ 폴더 전체, drizzle/ 폴더 전체, tools/rank-simulation/ 폴더 전체
    - tests/ 폴더의 기존 파일 (새 테스트 파일 추가만 가능)
    - AGENTS.md의 "서버 저장 보호", "성장·경제 개편" 항목에 적힌 수치
    - 안드로이드 앱 폴더
    카드가 위 파일의 특정 줄을 고치라고 명시한 경우에만 그 줄만 고친다.

[3] 파일을 통째로 다시 쓰지 않는다. 카드에 적힌 문자열을 찾아 그 부분만 바꾼다.
    찾는 문자열이 파일에 없으면 추측해서 비슷한 곳을 고치지 말고, 작업을 멈추고
    "문자열을 찾지 못함: <문자열>"이라고 보고한다.

[4] 그림 규칙
    - 형식: webp. 아이콘은 투명 배경. 크기는 카드에 적힌 픽셀 그대로.
    - 화풍: 기존 원화와 같은 반실사 판타지 채색. 두꺼운 외곽선의 만화풍, 단색 도형,
      글자·숫자가 들어간 그림, 이모지는 쓰지 않는다.
    - 같은 폴더의 기존 파일을 먼저 열어 보고 광원 방향(왼쪽 위), 채도, 외곽 두께를 맞춘다.
      카드마다 "기준 파일"을 적어 두었다.
    - 아이콘은 40px로 줄여도 서로 구별되어야 한다. 줄인 모습을 확인한다.
    - 그림 안의 여백: 대상이 캔버스의 80~90%를 차지하게 한다.
    - 기존 파일을 같은 이름으로 덮어쓰지 않는다. 카드가 새 이름을 준다.
    - 만든 뒤 반드시 확인한다: 가로×세로 픽셀이 카드와 같은가, 배경이 투명한가(아이콘),
      용량이 카드의 한도 이하인가, 보라색 어두운 바탕(#221c30) 위에 올렸을 때 테두리에 흰 띠가 없는가.
    - 모루는 장비 제작에만 쓰는 상징이다. 다른 기능의 그림에 모루를 넣지 않는다.

[5] 소리 규칙
    - 실제 녹음된 소리만 쓴다(CC0 또는 CC BY). 신시사이저로 만든 삐 소리, 무음 파일,
      다른 소리를 이름만 바꾼 파일은 안 된다.
    - 형식: mp3, 32kHz, 스테레오, 192kbps. 길이는 카드에 적힌 범위.
    - 각 소리의 앞 무음은 20ms 이하, 끝은 잘리지 않게 자연스럽게 줄인다.
    - 음량: 기존 효과음 묶음(dist/client/assets/048c959f1c5abcf00835.mp3)의 reward 구간과
      귀로 비교해 비슷한 크기로 맞춘다.
    - 출처와 라이선스를 web/game/soundtrack.js의 기존 크레딧 형식에 맞춰 추가한다.

[6] 연결과 빌드
    - 그림·소리 파일은 dist/client/assets/ 아래에 둔다. 빌드 도구는 이 파일을 건드리지 않는다.
    - 코드를 고친 뒤 반드시 실행한다:
        python tools/build-web.py
        python tools/build-web.py --check
        node tests/rebalance-157.cjs
        node tests/upload-protection.mjs
      넷 중 하나라도 실패하면 내 변경을 되돌리고 실패 내용을 보고한다.
    - 화면 글자는 12px 이상, 누르는 버튼은 44px 이상(기존 화면의 표준 버튼 크기가
      40px인 곳은 40px 유지).

[7] 모르면 멈춘다. 추측으로 진행하지 않는다.
    아래 중 하나라도 해당하면 작업을 멈추고 질문한다.
    - 카드에 적힌 파일이나 문자열이 없다
    - 카드의 크기·개수와 다르게 만들어야 할 것 같다
    - 테스트가 실패한다

[8] 보고 형식 (이 형식 그대로, 다른 말은 넣지 않는다)
    1. 만든 파일: 경로 / 가로×세로(또는 길이 초) / 용량
    2. 고친 파일: 경로 / 바꾼 문자열(전 → 후)
    3. 실행한 확인: 명령어와 결과(통과/실패)
    4. 직접 본 화면: 어느 화면에서 무엇을 확인했는지
    5. 하지 못한 것과 이유
    6. 제안(선택)
```

---

## 작업 카드

각 카드는 그대로 복사해서 [공통 규칙] 아래에 붙여 넣습니다.

### 카드 S1 — 버튼 누르는 소리 연결

```
[작업 카드 S1] 버튼 누르는 소리 연결

목적: 버튼을 눌러도 소리가 나지 않는다. 녹음(click)은 이미 효과음 묶음 안에 있는데
     재생하는 코드가 없다. 재생만 연결한다. 새 소리 파일은 만들지 않는다.

고칠 파일: web/game/attack-audio.js (이 파일 하나만)

할 일:
1. 파일 맨 끝에 아래 코드를 그대로 추가한다.

   // Button taps play the recorded click cue.
   document.addEventListener('pointerup',event=>{
    const button=event.target.closest?.('button,[role=button]');
    if(button&&!button.disabled&&!button.closest('#battle,#skillbuttons'))playSound('click');
   },true);

2. 같은 파일의 combatSoundGain 함수에서 click의 음량을 0.6으로 정한다.
   찾을 문자열:  if(id==='reward')return 1.5;
   바꿀 문자열:  if(id==='reward')return 1.5;if(id==='click')return .6;

하지 말 것:
- 전투 화면(#battle, #skillbuttons) 안의 공격·스킬 버튼에는 소리를 붙이지 않는다(이미 타격음이 있다).
- 효과음 묶음 mp3를 수정하지 않는다.

완료 확인:
- 공통 규칙 [6]의 명령 4개 통과
- 브라우저에서 소리를 켠 상태로: 하단 메뉴 버튼, 상점의 탭, 우편함 버튼을 눌러 소리가 난다
- 전투 화면의 공격 버튼을 눌러도 click 소리는 나지 않는다
- 버튼을 빠르게 연타해도 소리가 겹쳐 찢어지지 않는다
```

### 카드 A1 — 동료 소환권 아이콘

```
[작업 카드 A1] 동료 소환권 아이콘

목적: 동료 소환권이 스킬 소환권과 같은 그림을 쓰고 있어 구별되지 않는다. 전용 아이콘을 만든다.

만들 파일 (1개):
- dist/client/assets/ui-regalia/petTicket.webp — 192×192, 투명 배경, 40KB 이하

그림 지시:
- 기준 파일: dist/client/assets/ui-regalia/summonTicket.webp (같은 종이 재질·테두리·기울기)
- 차이: 스킬 소환권이 책/마법 문양이라면, 동료 소환권은 "알과 발자국" 문양.
  바탕색은 청록(스킬 소환권과 다른 색상 계열)으로 해서 40px에서도 색만으로 구별되게 한다.
- 글자·숫자 없음.

고칠 파일과 문자열 (3곳):
1. web/game/game-core.js
   찾기:  summonTicket:'summonTicket',
   바꾸기: summonTicket:'summonTicket',petTicket:'petTicket',
2. web/game/dungeon-and-forge.js
   찾기:  petTickets:'summonTicket',
   바꾸기: petTickets:'petTicket',
3. web/game/reward-reveal.js
   찾기:  label:'동료 소환권',art:'summonTicket'
   바꾸기: label:'동료 소환권',art:'petTicket'

완료 확인:
- 공통 규칙 [6]의 명령 4개 통과
- 시즌 패스 화면(상점 → 패스 → 시즌 패스)의 Lv.8, Lv.14 보상에 새 아이콘이 보인다
- 소환 화면(상점 → 소환 → 동료)에 새 아이콘이 보인다
- 스킬 소환권 아이콘은 그대로다
```

### 카드 A2 — 무기 잔해 아이콘

```
[작업 카드 A2] 무기 잔해 아이콘

목적: 새 재화 "무기 잔해"(방지권 없이 무기가 파괴되면 받는 조각, 30개 = 방지권 1장)에 그림이 없다.

만들 파일 (1개):
- dist/client/assets/ui-regalia/forgeDebris.webp — 192×192, 투명 배경, 40KB 이하

그림 지시:
- 기준 파일: dist/client/assets/ui-regalia/starIron.webp (금속 재질과 광원)
- 내용: 부러진 칼날 조각 2~3개가 겹쳐 있고, 끊어진 면에 희미한 주황색 잔열이 남아 있다.
- 별철(보라빛 주괴)과 헷갈리지 않게 색은 어두운 강철색 + 주황 잔열.

고칠 파일과 문자열 (3곳):
1. web/game/game-core.js
   찾기:  shard:'shard',
   바꾸기: forgeDebris:'forgeDebris',shard:'shard',
2. dist/client/weapon-forge.js
   찾기:  return '<div class="forge-debris"><span>무기 잔해 <b>'
   바꾸기: return '<div class="forge-debris">'+art('forgeDebris')+'<span>무기 잔해 <b>'
3. dist/client/weapon-forge.css
   찾기:  .forge-debris{display:grid;grid-template-columns:minmax(0,1fr) auto;
   바꾸기: .forge-debris{display:grid;grid-template-columns:40px minmax(0,1fr) auto;

완료 확인:
- 공통 규칙 [6]의 명령 4개 통과
- 모루 → 무기 성장 → 무기 강화 창에서, 무기가 +15 이상일 때 "무기 잔해" 줄 왼쪽에 아이콘이 보인다
- 그 줄의 글자와 "방지권 교환" 버튼이 줄바꿈으로 깨지지 않는다(폭 360px 화면에서도)
```

### 카드 A4 — 오늘의 탑 강화 카드 아이콘 3종

```
[작업 카드 A4] 오늘의 탑 강화 카드 아이콘 3종

목적: 탑에서 고르는 강화 카드 중 3장이 관계없는 그림(속성 문양, 메뉴 아이콘, 유물)을 빌려 쓰고 있다.

만들 파일 (3개, 모두 192×192, 투명 배경, 각 40KB 이하):
- dist/client/assets/ui-regalia/trial-skill.webp     — "스킬 피해 +40%": 펼쳐진 마도서 위로 솟는 별빛 칼날
- dist/client/assets/ui-regalia/trial-cooldown.webp  — "재사용 대기시간 -25%": 모래가 거의 다 내려간 모래시계와 소용돌이 빛
- dist/client/assets/ui-regalia/trial-time.webp      — "남은 시간 +8초": 별 무늬 회중시계

그림 지시:
- 기준 파일: dist/client/assets/ui-regalia/stat-attack.webp, stat-crit.webp
  (같은 테두리 없는 오브젝트형 아이콘, 같은 광원)
- 세 장을 나란히 40px로 줄였을 때 실루엣만으로 구별되어야 한다.

고칠 파일: web/game/mail-and-dungeons.js (2곳)
1. 찾기:  skillDamage:'storm',cooldown:'small-skills',time:'relic6',weakHp:'stat-hp'
   바꾸기: skillDamage:'trial-skill',cooldown:'trial-cooldown',time:'trial-time',weakHp:'stat-hp'
2. 찾기:  const icon=key==='time'?art(TRIAL_CARD_ART[key]):catalogIcon(TRIAL_CARD_ART[key]);
   바꾸기: const icon=catalogIcon(TRIAL_CARD_ART[key]);

완료 확인:
- 공통 규칙 [6]의 명령 4개 통과
- node tests/daily-trial.cjs 통과
- 던전 → 도전 → 오늘의 탑 입장 후 첫 강화 선택 화면에서 새 그림이 깨지지 않고 보인다
  (날짜에 따라 3장 중 일부만 나온다. 나온 카드만 확인하고 그 사실을 보고한다)
```

### 카드 A8 — 튀는 아이콘 3종 다시 그리기

```
[작업 카드 A8] 강화석·별철·다이아 아이콘 다시 그리기

목적: 재화 아이콘 대부분은 "보라색 + 금 장식 + 같은 광택"으로 통일되어 있는데,
     강화석과 별철은 금 장식이 없는 밋밋한 덩어리이고 다이아는 혼자 평면적이다. 세 개를 같은 화풍으로 맞춘다.

만들 파일 (3개, 모두 192×192, 투명 배경, 각 40KB 이하):
- dist/client/assets/ui-regalia/stone-v2.webp     — 강화석: 푸른 숫돌 덩어리. 한쪽에 금테 고리나 금 모서리 장식을 두른다
- dist/client/assets/ui-regalia/starIron-v2.webp  — 별철: 보랏빛 금속 주괴. 표면에 작은 별 무늬 각인과 금 띠를 두른다
- dist/client/assets/ui-regalia/gem-v2.webp       — 다이아: 지금과 같은 파란 보석 모양이되, 면마다 명암을 넣어 입체로 그리고 아래에 금 받침을 둔다

그림 지시:
- 기준 파일: dist/client/assets/ui-regalia/small-ore.webp (보라 수정 + 금 받침), rouletteCoin.webp, summonTicket.webp
  이 세 장과 나란히 놓았을 때 금 장식의 색·두께와 광택이 같아 보여야 한다.
- 지금 아이콘과 "같은 물건"으로 보여야 한다. 강화석은 푸른 돌, 별철은 보랏빛 금속, 다이아는 파란 보석 — 색과 기본 형태는 유지한다.
- 세 장끼리, 그리고 무기 잔해(어두운 강철 조각)·성운석(보라 수정)과 40px에서 구별되어야 한다.

고칠 파일: web/game/game-core.js (이 파일 하나만. 3곳)
1. 찾기:  stone:'stone',
   바꾸기: stone:'stone-v2',
2. 찾기:  starIron:'starIron'
   바꾸기: starIron:'starIron-v2'
3. 찾기:  gem:'small-gem',
   바꾸기: gem:'gem-v2',

하지 말 것:
- 기존 stone.webp, starIron.webp, small-gem.webp 파일은 지우지 않는다(다른 곳에서 직접 쓰는 경우가 있다).
- 재화의 이름·수량·가격은 건드리지 않는다.

완료 확인:
- 공통 규칙 [6]의 명령 4개 통과
- 홈 화면 위쪽 재화 줄의 다이아, 모루 → 무기 성장 → 무기 강화 창의 강화석·별철 칸에 새 아이콘이 보인다
  (어떤 화면이 여전히 예전 그림을 쓰면 고치지 말고, 그 화면 이름을 보고의 5번에 적는다)
- 성장 → 성좌 화면의 비용 칸(별철·강화석)에 새 아이콘이 보인다
- 아이콘이 다른 재화 아이콘보다 크거나 작아 보이지 않는다
```

### 카드 S2 — 강화 실패·파괴 소리

```
[작업 카드 S2] 무기 강화 실패 소리와 파괴 소리

목적: 무기 강화가 실패할 때와 무기가 파괴될 때 같은 타격음이 난다. 둘을 구별한다.

만들 파일 (1개):
- dist/client/assets/sfx-extra-v1.mp3 — mp3, 32kHz, 스테레오, 192kbps
  안에 소리 2개를 순서대로 넣는다. 소리 사이에 무음 0.30초.
  ① forgeFail  : 0.5~0.7초. 망치가 빗맞아 둔탁하게 울리고 금속이 식는 "치익" 소리가 짧게 따른다.
  ② forgeBreak : 1.2~1.6초. 금속이 쩍 갈라지고 조각이 모루와 바닥에 흩어지는 소리.
                 유리 깨지는 소리처럼 들리면 안 된다(강철이다).

고칠 파일: web/game/attack-audio.js, dist/client/weapon-forge.js

1. web/game/attack-audio.js — 추가 묶음을 읽는 코드를 넣는다.
   (a) 찾기:  const skillTakes=new Map();
       바꾸기: const skillTakes=new Map();
              // A second bank for cues added after the first recording set.
              const SFX_EXTRA_CUES={forgeFail:{start:<①의 시작 초>,duration:<①의 길이 초>},forgeBreak:{start:<②의 시작 초>,duration:<②의 길이 초>}};
              const sfxExtra={url:'./assets/sfx-extra-v1.mp3',buffer:null,pending:null,retryAt:0};
       <…> 자리는 네가 만든 파일의 실제 값(소수 둘째 자리)으로 채운다.
   (b) warmSoundEffects 안의 반복문이 sfxExtra도 읽게 한다.
       찾기:  for(const bank of [sfx,actionBanks[job]]){
       바꾸기: for(const bank of [sfx,sfxExtra,actionBanks[job]]){
   (c) chooseSound의 마지막 줄이 추가 묶음의 이름도 돌려주게 한다.
       찾기:  return Object.hasOwn(SFX_CUES,type)?type:null;
       바꾸기: return Object.hasOwn(SFX_CUES,type)||Object.hasOwn(SFX_EXTRA_CUES,type)?type:null;
   (d) playSound 안에서 추가 묶음의 소리는 sfxExtra에서 꺼내게 한다.
       playSound 함수에서 "bank=phased?actionBanks[job]:sfx" 부분을
       "bank=phased?actionBanks[job]:Object.hasOwn(SFX_EXTRA_CUES,id)?sfxExtra:sfx" 로 바꾸고,
       같은 함수에서 SFX_CUES[id]로 구간을 읽는 곳을 (SFX_CUES[id]||SFX_EXTRA_CUES[id])로 바꾼다.
       이 함수의 구조가 설명과 달라 정확히 바꿀 수 없으면 멈추고 보고한다.

2. dist/client/weapon-forge.js
   찾기:  a.phase='done';render();playSound(result.ok?'reward':'impact');
   바꾸기: a.phase='done';render();playSound(result.ok?'reward':result.outcome==='destroy'?'forgeBreak':'forgeFail');

3. web/game/soundtrack.js의 크레딧에 두 소리의 출처·라이선스를 기존 형식으로 추가한다.

완료 확인:
- 공통 규칙 [6]의 명령 4개 통과, node tests/weapon-audio.cjs 통과, node tests/weapon-forge.cjs 통과
- 브라우저에서 강화 성공 / 실패(단계 유지) / 방지권으로 보호 / 파괴 네 경우의 소리를 각각 들었다
  (보호된 경우는 forgeFail이 나야 한다)
- 2배속에서도 소리의 높낮이가 변하지 않는다
```

### 카드 A3 — 성좌 각인 별자리 지도 그림 (상세판)

**이 화면에 어울리는 화풍 (사람이 읽는 부분)**

지금 게임 화면과 아이콘을 직접 놓고 본 결과입니다.

- **색**: 짙은 가지색·남보라 바탕 위에 금색 장식. 포인트는 보랏빛 수정과 푸른 다이아.
- **질감**: 반실사 채색. 금속은 부드러운 그라데이션에 또렷한 하이라이트 한 줄, 테두리는 어두운 보라.
- **장식**: 금 세공(필리그리), 별·수정 문양. 만화풍의 두꺼운 검은 외곽선은 없음.

그래서 성좌 화면은 **"금박 천문도"** 가 가장 잘 맞습니다. 옛 천구의·별자리 지도처럼 금선으로 눈금과 원을 새긴 밤하늘입니다. 이유는 세 가지입니다.

1. 게임 이름이 "성운의 모루"라 성운·별이 원래 주제입니다.
2. 금선 눈금은 이미 쓰는 금 장식과 같은 언어라 새 화면이 튀지 않습니다.
3. 배경이 어둡고 무늬가 가늘어서, 그 위의 별 버튼과 글자가 잘 읽힙니다.

보내 주신 예시 화면(나무 모양)은 **구조**(아래부터 밝아지고, 잠긴 곳은 회색+자물쇠)만 참고하고, 그림은 이 게임의 보라+금 천문도로 갑니다.

진행감은 배경의 **세 구역**으로 줍니다. 아래는 새벽빛(따뜻한 금·주황), 가운데는 푸른 보라, 위는 깊은 우주 보라와 왕관 모양 성운. 아래에서 위로 올라갈수록 깊어지는 하늘입니다.


```
[작업 카드 A3-상세] 성좌 각인 별자리 지도 그림 5장

■ 이미 만들어져 있는 것 (읽기만 한다. 이 동작과 배치는 고치지 않는다)
- 성장 화면의 "성좌" 탭에 별자리 지도가 있다. 지도는 가로 4 : 세로 5 비율의 둥근 모서리 상자다.
- 그 위에 코드가 그리는 것: 둥근 별 버튼 15개, 별을 잇는 선, 자리 이름표 3개, 별 안의 숫자, 자물쇠.
- 자리 3개: 아래 "여명의 기사 자리", 가운데 "쌍검 자리", 위 "성운 왕관 자리". 자리마다 별 5개.
- 잠긴 별의 회색 처리, 밝혀진 별의 금빛 발광, 선의 밝기 변화는 전부 코드가 한다.
- 지금은 그림이 없어서 임시 모양(네 갈래 별 기호, 선으로 된 자물쇠, 색만 칠한 하늘)이 보인다.

■ 목적
임시 모양을 대신할 그림 5장을 만들고, 스위치 한 줄을 켠다. 그 외에는 아무것도 바꾸지 않는다.

■ 공통 화풍 (5장 모두)
- 이름: "금박 천문도". 옛 천구의·별자리 지도처럼 금선으로 눈금과 원을 새긴 밤하늘.
- 반실사 판타지 채색. 부드러운 그라데이션과 또렷한 하이라이트. 두꺼운 검은 외곽선·만화풍·픽셀아트·사진 금지.
- 색 (이 값에서 크게 벗어나지 않는다)
    하늘 가장 어두운 곳  #0c0a18
    하늘 남보라          #17132c, #231b45
    성운 보라            #5b3fa8, #7a5fd0
    성운 청록(조금만)    #2f7f8f
    금색 장식            #f1c986, #d1b47a, 가장 밝은 점 #ffe9bd
    새벽빛(아래쪽만)     #c9853a 을 아주 옅게
- 광원: 왼쪽 위. 금속의 하이라이트도 왼쪽 위.
- 그리지 않는 것: 글자, 숫자, 로고, 사람 얼굴, 모루, 나무, 다른 게임에서 본 화면.
- 기준으로 먼저 열어 볼 파일(색과 금 장식의 느낌을 맞춘다):
    dist/client/assets/ui-regalia/rouletteCoin.webp
    dist/client/assets/ui-regalia/codex.webp
    dist/client/assets/ui-regalia/small-ore.webp
    dist/client/assets/region-hd/void.webp

■ 만들 파일 1 — 밤하늘 배경
경로: dist/client/assets/constellation/sky.webp   (constellation 폴더를 새로 만든다)
크기: 1024×1280 픽셀. 불투명(투명 없음). 350KB 이하.
만드는 순서: 세로 1024×1536으로 그린 뒤, 위아래를 똑같이 128픽셀씩 잘라 1024×1280으로 만든다.

구성 (위에서 아래로 세 구역이 부드럽게 이어진다. 경계선은 없다)
- 위 구역 (세로 0~430): 가장 깊은 우주. 짙은 보라 성운이 왕관처럼 완만한 호를 그린다. 별 가루가 가장 많다.
- 가운데 구역 (세로 430~860): 푸른 보라. 성운은 옅고, 금선으로 된 큰 원호 두세 개가 화면을 가로지른다.
- 아래 구역 (세로 860~1280): 지평선 아래에서 새벽빛이 아주 옅게 올라온다(주황을 10~15% 농도로). 맨 아래는 다시 어둡다.
- 전체에 금박 천문도 무늬: 화면 중심(512, 640)을 기준으로 한 얇은 동심원 2~3개와 눈금, 방위 표시 같은 짧은 금선.
  금선은 1~2픽셀 두께, 불투명도 25~40%로 아주 은은하게. 배경 무늬이지 주인공이 아니다.
- 가장자리: 안쪽으로 24픽셀 들어온 곳에 얇은 금색 테두리선 한 줄. 네 귀퉁이에 작은 별 장식.

지켜야 할 것
- 큰 별, 밝은 빛 덩어리, 별자리 선, 인물 그림을 넣지 않는다. 별 가루는 지름 1~3픽셀의 작은 점만.
- 아래 좌표를 중심으로 반지름 100픽셀 원 안은 특히 어둡고 고르게 둔다(그 위에 별 버튼이 놓인다).
    아래 자리:   (205,1088) (389,960) (594,1075) (778,934) (512,819)
    가운데 자리: (737,730) (881,589) (655,538) (492,666) (328,576)
    위 자리:     (184,397) (348,269) (532,371) (717,230) (860,346)
- 아래 좌표를 중심으로 가로 340 × 세로 140 직사각형 안도 어둡고 고르게 둔다(그 위에 자리 이름표가 놓인다).
    (512,1203)  (174,730)  (430,90)
- 전체 밝기: 그림을 흑백으로 바꿨을 때 가장 밝은 곳도 중간 회색보다 어두워야 한다.

그림 생성용 문장 (영문 그대로 사용):
"A vertical fantasy celestial chart background for a mobile RPG menu. Deep night sky in dark indigo and
aubergine purple, soft violet nebula forming a gentle crown-shaped arc in the upper third, faint teal
wisps, a very subtle warm dawn glow rising from the bottom edge. Thin engraved gold astrolabe lines:
two or three faint concentric circles with tick marks and small compass notches, low opacity, elegant
gilded star-atlas style. Fine star dust only, no large stars. A thin gold border line inset from the
edges with tiny star ornaments at the four corners. Semi-realistic painterly rendering, smooth
gradients, dark and low contrast so UI buttons can sit on top. No text, no letters, no numbers, no
characters, no constellation lines, no anvil, no tree."

■ 만들 파일 2~4 — 자리별 별 메달
경로: dist/client/assets/constellation/node-0.webp, node-1.webp, node-2.webp
크기: 각 192×192 픽셀. 배경 투명. 각 40KB 이하.
만드는 순서: 1024×1024로 그린 뒤 배경을 투명하게 지우고 192×192로 줄인다.

세 장 공통
- 금 부조(동전의 돋을새김 같은 금속 양각) 문양 하나. 가운데에 네 갈래 별이 있고 그 위·옆에 자리의 상징이 겹친다.
- 둥근 테두리, 원판, 바탕은 그리지 않는다. 문양만 있고 나머지는 투명이다.
  (둥근 보라색 버튼과 테두리는 코드가 그린다. 그림에 원이 있으면 이중 테두리가 된다.)
- 문양은 캔버스의 78~84%를 차지하고 정가운데에 둔다.
- 색: 금색(#f1c986)이 기본, 하이라이트는 #ffe9bd, 그림자는 #8a6a3a. 가운데 별의 중심만 흰색에 가깝게.
- 잠긴 상태·밝혀진 상태를 따로 그리지 않는다. 한 장씩만 만든다.
- 세 장을 40×40으로 줄여 나란히 놓았을 때 실루엣만으로 구별되어야 한다.

각 장의 상징
- node-0.webp (여명의 기사 자리): 네 갈래 별 뒤로 곧은 장검 한 자루가 세로로 서 있다. 칼끝이 위.
- node-1.webp (쌍검 자리): 네 갈래 별 뒤로 짧은 칼 두 자루가 X자로 교차한다.
- node-2.webp (성운 왕관 자리): 네 갈래 별 위에 봉우리 세 개짜리 작은 왕관이 얹혀 있다.

그림 생성용 문장 (영문, 괄호 안만 장마다 바꾼다):
"A single embossed gold emblem icon on a fully transparent background, centered. A four-pointed star
in the middle with ( a straight longsword standing vertically behind it, blade pointing up /
two short swords crossed in an X behind it / a small three-peaked crown resting on top of it ).
Polished gold relief like a coin engraving, warm highlights from the upper left, soft dark-gold
shading, crisp readable silhouette at very small size. Fantasy RPG UI icon, semi-realistic painted
metal. No circle, no frame, no plate, no background, no text."

■ 만들 파일 5 — 자물쇠
경로: dist/client/assets/constellation/lock.webp
크기: 96×96 픽셀. 배경 투명. 15KB 이하.
- 은색 몸통에 금테를 두른 자물쇠. 고리는 닫혀 있다. 열쇠 구멍은 작은 네 갈래 별 모양.
- 정면에서 본 모습, 정가운데, 캔버스의 80% 크기.
- 26×26으로 줄여도 "닫힌 자물쇠"로 보여야 한다. 그래서 고리를 굵게, 장식은 최소로.
- 화면에서는 회색으로 어두워진 별 위, 검은 동그라미 안에 놓인다. 그래서 몸통은 밝은 은색이어야 한다.

그림 생성용 문장 (영문):
"A small closed padlock icon on a fully transparent background, front view, centered. Bright silver
body with a thin gold trim, thick closed shackle, a tiny four-pointed star shaped keyhole. Semi-realistic
painted metal, highlight from the upper left, bold simple silhouette readable at 26 pixels.
Fantasy RPG UI icon. No background, no text."

■ 만든 뒤 스스로 확인 (하나라도 아니면 다시 만든다)
1. 파일 5개의 가로×세로가 위에 적은 값과 정확히 같다.
2. sky.webp는 투명이 없고, node-0~2와 lock은 배경이 투명하다.
3. node와 lock을 #221c30 색 바탕 위에 올렸을 때 가장자리에 흰 띠나 회색 얼룩이 없다.
4. sky.webp 위에 지름 157픽셀의 보라색 원 15개를 위 좌표에 올려 봤을 때, 원이 배경 무늬에 묻히지 않는다.
5. 용량이 각각 한도 이하다.

■ 고칠 파일: web/game/constellation.js (이 파일 하나만, 한 곳만)
   찾기:  const CONSTELLATION_ART=false;
   바꾸기: const CONSTELLATION_ART=true;
이 한 줄 외에는 이 파일의 어떤 것도 바꾸지 않는다(별의 위치·이름·비용·잠금 규칙·알림 문구 모두 그대로).
CSS는 이미 있다. 추가하지 않는다.

■ 완료 확인
- 공통 규칙 [6]의 명령 4개 통과
- 성장 → 성좌 화면
  · 배경이 sky.webp로 보인다
  · 별 15개 안에 메달 그림이 보이고, 자리마다 다른 문양이다
  · 잠긴 별은 회색이고 그 위에 자물쇠 그림이 보인다
  · 별 안의 숫자(0~20)와 자리 이름표 글자가 또렷이 읽힌다
- 잠긴 별을 누르면 "알림" 창이 뜨고 그 안에도 자물쇠 그림이 보인다
- 열린 별을 누르면 "별 각인" 창 왼쪽 위에 그 자리의 메달 그림이 보인다
- 폭 360px 화면에서도 위 내용이 같다

■ 보고에 꼭 넣을 것
- 다섯 파일 각각의 가로×세로와 용량
- 성좌 화면 전체가 보이는 화면 캡처 1장(잠긴 자리와 열린 자리가 함께 보이게)
```

### 카드 A9 — 미니게임 그림 9장

```
[작업 카드 A9] 미니게임 그림 9장

이미 만들어져 있는 것 (읽기만 한다. 규칙과 화면 배치는 고치지 않는다):
- 던전 화면에 "미니게임" 탭이 있고, 그 안에 두 가지가 있다.
  ① 용광로 제련: 성운석 덩이를 넣어 순도를 올리고, 온도가 100을 넘기 전에 꺼낸다. 하루 3판.
  ② 동료 배치전: 3×3 칸에 동료를 배치하면 적 진형과 자동으로 싸우는 퍼즐. 하루 3단계.
     동료는 역할 6가지 중 하나를 가진다: 방패, 돌격, 관통, 폭발, 저격, 치유.
- 지금은 그림 없이 글자와 색으로만 되어 있다.

목적: 그림 9장을 만들고, 스위치 한 줄을 켠다.

만들 파일 (9개, 폴더 dist/client/assets/minigames/ 를 새로 만든다):
1. hub-furnace.webp — 256×256, 투명 배경, 45KB 이하
   미니게임 목록의 작은 그림. 불이 지펴진 둥근 용광로(검은 무쇠 몸통 + 금테), 입구에서 주황빛이 새어 나온다.
2. hub-board.webp   — 256×256, 투명 배경, 45KB 이하
   미니게임 목록의 작은 그림. 3×3 칸이 그려진 작전판 위에 작은 금색 말 세 개가 놓여 있다.
3. furnace.webp     — 768×480, 불투명, 150KB 이하
   용광로 제련 화면 위쪽에 깔리는 그림. 대장간 안쪽, 가운데에 큰 용광로가 있고 입구에서 쇳물 빛이 비친다.
   주변은 어둡게(보라빛 그늘). 사람·글자·모루는 그리지 않는다.
4. role-guard.webp   — 96×96, 투명 배경, 12KB 이하. 방패 문양 (금테 둥근 방패)
5. role-striker.webp — 96×96, 투명 배경, 12KB 이하. 돌격 문양 (앞으로 찌르는 검 한 자루와 속도선)
6. role-piercer.webp — 96×96, 투명 배경, 12KB 이하. 관통 문양 (세 개의 고리를 꿰뚫는 화살)
7. role-blast.webp   — 96×96, 투명 배경, 12KB 이하. 폭발 문양 (세 갈래로 터지는 불꽃)
8. role-sniper.webp  — 96×96, 투명 배경, 12KB 이하. 저격 문양 (조준 원 안의 별)
9. role-healer.webp  — 96×96, 투명 배경, 12KB 이하. 치유 문양 (잎사귀를 두른 물방울)

그림 지시:
- 화풍: 기존 아이콘과 같은 반실사 채색, 보라+금색. 광원 왼쪽 위.
- 기준 파일: dist/client/assets/ui-regalia/stat-attack.webp, stat-hp.webp (역할 아이콘의 크기감과 금 장식)
             dist/client/assets/weapon-forge/workshop.webp (용광로 그림의 대장간 분위기와 색)
- 역할 아이콘 6장은 18px로 줄여서 쓰인다. 그래서 선을 굵게, 형태를 단순하게 하고
  18×18로 줄여 나란히 놓았을 때 여섯 개가 서로 구별되는지 꼭 확인한다.
- 1번과 3번의 용광로는 같은 용광로로 보여야 한다(같은 형태·색).

고칠 파일: web/game/minigames.js (이 파일 하나만, 한 곳만)
   찾기:  const MINIGAME_ART=false;
   바꾸기: const MINIGAME_ART=true;
이 한 줄 외에는 이 파일의 어떤 것도 바꾸지 않는다(보상, 확률, 횟수, 역할 수치, 적 진형 규칙 모두 그대로).
CSS는 이미 있다. 추가하지 않는다.

완료 확인:
- 공통 규칙 [6]의 명령 4개 통과, node tests/minigames.cjs 통과
- 던전 → 미니게임: 두 카드 왼쪽에 작은 그림이 보인다
- 용광로 제련 화면: 온도 막대 위에 furnace.webp가 보이고, 막대와 버튼이 그림에 가려지지 않는다
- 동료 배치전 화면: 아래 동료 목록의 역할 이름 앞에 역할 아이콘이 보인다
- 폭 360px 화면에서도 위 내용이 같다
```

### 카드 A5 — 거점 코인·패스 코인·이벤트 코인 아이콘

```
[작업 카드 A5] 코인 아이콘 6종

목적: 길드·아레나·월드보스·레이드 코인이 건물 아이콘(96px)을 그대로 쓰고 있어 "코인"으로 보이지 않는다.
     패스 코인은 96px라 흐리고, 이벤트 코인은 재화 아이콘 표에 없다.

만들 파일 (6개, 모두 192×192, 투명 배경, 각 40KB 이하):
- dist/client/assets/ui-regalia/coin-guild.webp      — 길드 문장(방패와 깃발)이 새겨진 청동 코인
- dist/client/assets/ui-regalia/coin-arena.webp      — 교차한 검이 새겨진 붉은 구리 코인
- dist/client/assets/ui-regalia/coin-worldBoss.webp  — 용의 눈이 새겨진 검은 강철 코인
- dist/client/assets/ui-regalia/coin-raid.webp       — 월식(초승달과 원)이 새겨진 은 코인
- dist/client/assets/ui-regalia/passCoin-192.webp    — 기존 passCoin.webp와 같은 디자인을 192px로 다시 그린 것
- dist/client/assets/ui-regalia/eventCoin.webp       — dist/client/assets/event-wheel-token.webp와 같은 디자인을 192px로 다시 그린 것

그림 지시:
- 기준 파일: dist/client/assets/ui-regalia/rouletteCoin.webp (코인의 두께·기울기·광택)
- 여섯 장 모두 같은 각도와 두께. 금속 색과 새겨진 문양으로 구별한다.

고칠 파일과 문자열:
1. web/game/coin-exchange.js
   찾기:  src="${catalogPath('haven-'+kind)}"
   바꾸기: src="${catalogPath('coin-'+kind)}"
2. web/game/game-core.js
   찾기:  passCoin:'passCoin',
   바꾸기: passCoin:'passCoin-192',eventCoin:'eventCoin',
3. web/game/dungeon-and-forge.js 의 RESOURCE_ART 표
   찾기:  passCoins:'passCoin',
   바꾸기: passCoins:'passCoin',eventCoins:'eventCoin',

하지 말 것:
- 거점 건물 아이콘(haven-guild.webp 등)은 지우거나 바꾸지 않는다. 건물 표시에는 계속 쓴다.

완료 확인:
- 공통 규칙 [6]의 명령 4개 통과
- 거점 → 코인 교환 화면의 지갑 4칸에 새 코인이 보이고, 거점 지도의 건물 아이콘은 그대로다
- 상점 → 교환 → 패스 코인 교환 화면에서 패스 코인이 선명하다
```

### 카드 S3 — 진행·전투 알림 소리 9종

```
[작업 카드 S3] 진행·전투 알림 소리 9종

전제: 카드 S2가 끝나 있어야 한다(sfx-extra-v1.mp3와 SFX_EXTRA_CUES가 있어야 한다).
     없으면 멈추고 "S2가 먼저 필요함"이라고 보고한다.

목적: 레벨업, 스테이지 클리어, 보스 등장 같은 순간에 소리가 없다.

만들 파일 (1개): dist/client/assets/sfx-extra-v2.mp3
- S2의 두 소리(forgeFail, forgeBreak)를 같은 순서로 먼저 넣고, 그 뒤에 아래 9개를 순서대로 잇는다.
- 소리 사이 무음 0.30초. 형식은 공통 규칙 [5].
  ③ levelUp     0.9~1.2초  맑은 종 두 번이 올라가며 울림
  ④ stageClear  0.5~0.8초  짧은 금속 차임 한 번(자주 나므로 작고 짧게)
  ⑤ bossWarning 1.2~1.6초  낮은 뿔나팔과 북 한 번
  ⑥ bossHurry   0.3~0.4초  시계 초침 같은 나무 타격 한 번
  ⑦ heroHit     0.2~0.35초 갑옷 위를 때리는 둔탁한 타격
  ⑧ heroDown    0.9~1.2초  무릎을 꿇으며 갑옷이 내려앉는 소리
  ⑨ rareReveal  1.4~1.8초  유리 종과 합창 한 음이 부풀어 오름
  ⑩ engrave     1.0~1.4초  유리 종 한 번이 맑게 울리고 낮은 여운이 따라온다(별 하나가 켜지는 소리)
  ⑪ salvage     0.4~0.6초  쇠붙이를 부수어 조각이 떨어지는 소리

고칠 파일:
1. web/game/attack-audio.js
   - sfxExtra의 url을 './assets/sfx-extra-v2.mp3'로 바꾼다.
   - SFX_EXTRA_CUES에 ③~⑪을 추가한다. ①②의 start/duration도 새 파일 기준으로 다시 적는다.
   - combatSoundGain에 음량을 정한다: stageClear .5, bossHurry .6, heroHit .7, 나머지는 1.
2. 재생 연결 (각 1줄 추가. 다른 코드는 건드리지 않는다)
   - levelUp     : web/game/progression.js 의 gainXP 함수에서 레벨이 오르는 줄 바로 뒤
   - stageClear  : web/game/campaign-difficulties.js 의 advanceCampaign 함수에서
                   "const next=defeated+1;" 줄 바로 뒤에  if(defeated%10!==0)playSound('stageClear');
                   (이 파일은 이 한 줄만 추가한다. 수치는 건드리지 않는다)
   - bossWarning : dist/client/boss-and-art.js 에서 스테이지 보스전이 시작되는 곳
   - bossHurry   : dist/client/boss-and-art.js 에서 보스 남은 시간이 10초 이하일 때 1초에 한 번
   - heroHit     : dist/client/player-hit.js 에서 영웅이 피해를 입는 곳(0.25초에 한 번 이하)
   - heroDown    : 영웅이 쓰러지는 곳(resolveHeroDefeat가 불리는 곳)
   - rareReveal  : web/game/reward-reveal.js 에서 소환·룰렛 결과 중 신화·천상 등급이 공개될 때
   - engrave     : web/game/constellation.js 의 engraveStar 함수에서
                   찾기:  playSound('reward');notice(CONSTELLATION_STARS[i].name+' '
                   바꾸기: playSound('engrave');notice(CONSTELLATION_STARS[i].name+' '
                   (이 파일은 이 한 곳만 고친다. 수치는 건드리지 않는다)
   - salvage     : dist/client/gear-selection.js 의 dismantleGear 함수에서 분해가 1개 이상 된 뒤
   정확한 위치를 찾지 못한 항목은 건너뛰고 보고의 5번에 적는다. 추측으로 넣지 않는다.
3. web/game/soundtrack.js 크레딧 추가.
4. S2에서 만든 sfx-extra-v1.mp3는 지운다.

완료 확인:
- 공통 규칙 [6]의 명령 4개 통과
- node tests/weapon-audio.cjs, node tests/music-scope.cjs, node tests/campaign-survival.cjs 통과
- 브라우저에서 9개 소리를 각각 실제 상황에서 들었다. 못 들은 것은 보고의 5번에 적는다
- 자동 전투로 1분간 사냥할 때 stageClear가 시끄럽지 않다
```

### 카드 A6 — 다이아 상품 그림 2장과 월드보스 배경

```
[작업 카드 A6] 다이아 상품 그림 2장, 월드보스 전투 배경 1장

목적: 다이아 상품 7개가 그림 5장을 나눠 쓰고 있다(3,600개와 6,000개, 10,000개와 14,000개가 같은 그림).
     월드보스 전투에는 전용 배경이 없다.

만들 파일 (3개):
- dist/client/assets/package-loot/diamonds-5.webp — 512×512, 투명 배경, 90KB 이하
  다이아가 가득 든 열린 보물 상자(기존 4번 그림보다 많고, 6번보다 적게)
- dist/client/assets/package-loot/diamonds-6.webp — 512×512, 투명 배경, 90KB 이하
  다이아가 넘쳐흐르는 큰 금고와 그 앞에 쌓인 다이아 더미(가장 많은 양)
- dist/client/assets/region-hd/world-boss-arena.webp — 1536×1024, 불투명, 650KB 이하
  무너진 천공 투기장. 가운데 아래 60%는 비워 둔다(보스와 영웅이 서는 자리). 바닥은 수평.

그림 지시:
- 다이아 그림의 기준: 상점 → 다이아 화면의 기존 상품 그림(같은 다이아 색·광택).
- 배경의 기준: dist/client/assets/region-hd/void.webp (같은 원근과 지평선 높이, 채도)

고칠 파일:
1. web/game/equipment-and-pets.js 의 DIAMOND_PRODUCTS 표에서
   6,000개 상품과 14,000개 상품이 쓰는 그림 키만 새 그림으로 바꾼다.
   새 그림은 표의 다른 항목과 같은 방식으로 연결한다. 가격·수량은 바꾸지 않는다.
   표의 형식이 atlas 칸(diamonds0..4)이라 새 그림을 그대로 넣을 수 없으면,
   멈추고 "연결 방식 확인 필요"라고 보고한다(그림 파일은 만들어 둔다).
2. dist/client/world-boss.css: 월드보스 전투 화면의 배경으로 world-boss-arena.webp를 지정한다.
   전투 화면의 배경을 정하는 규칙을 찾지 못하면 멈추고 보고한다.

완료 확인:
- 공통 규칙 [6]의 명령 4개 통과, node tests/world-boss.cjs 통과
- 상점 → 다이아 화면에서 7개 상품의 그림이 모두 다르다
- 월드보스 전투 화면에서 보스·체력바·버튼이 배경에 묻히지 않는다
```

### 카드 S4 — 지역별 배경 음악 4곡

```
[작업 카드 S4] 지역별 배경 음악 4곡

목적: 10개 지역 × 4개 난이도 전부가 음악 한 곡("어둠숲의 여정")만 쓴다.

만들 파일 (4개): mp3, 32kHz, 스테레오, 128kbps, 각 85~100초, 끝과 처음이 끊김 없이 이어지는 반복곡
- dist/client/assets/music/region-canyon.mp3  — 지역 2·3 (바위협곡, 안개늪): 느린 타악과 저음 현악, 건조하고 긴장된 분위기
- dist/client/assets/music/region-ember.mp3   — 지역 4·5 (용암동굴, 설원): 낮은 금관과 금속 타악, 무겁고 넓은 분위기
- dist/client/assets/music/region-ruin.mp3    — 지역 6·7 (폐허성, 마왕성): 합창과 오르간 계열, 어둡고 장엄한 분위기
- dist/client/assets/music/region-astral.mp3  — 지역 8·9 (천공의 성역, 별의 심연): 하프·종·여린 합창, 신비로운 분위기
지역 0·1은 기존 곡을 그대로 쓴다.
- 라이선스가 CC0 또는 CC BY인 곡만 쓴다. 출처를 보고에 적는다.
- 기존 곡과 음량을 맞춘다(기존 곡과 번갈아 틀어 귀로 비교).

고칠 파일: web/game/soundtrack.js (이 파일 하나만)
1. BGM_TRACKS에 네 곡을 추가한다. 형식은 기존 'lunar-vanguard' 항목과 같되 encounter 값은 넣지 않는다.
   키 이름: 'region-canyon', 'region-ember', 'region-ruin', 'region-astral'
   title: '협곡의 바람', '잿불과 서리', '잊힌 왕좌', '별의 심연'   scene: '스테이지'
   duration은 실제 파일 길이(초).
2. bgmScene 함수
   찾기:  return 'starlit-path';
   바꾸기: return ['starlit-path','starlit-path','region-canyon','region-canyon','region-ember','region-ember','region-ruin','region-ruin','region-astral','region-astral'][campaignPosition().area]||'starlit-path';
3. 크레딧 추가.

완료 확인:
- 공통 규칙 [6]의 명령 4개 통과, node tests/music-scope.cjs 통과
- 지역 지도에서 지역 3, 5, 7, 9로 이동했을 때 각각 다른 곡으로 1.2초에 걸쳐 바뀐다
- 설정에서 음악을 끄면 네 곡 모두 나지 않는다
- 곡이 끝나고 처음으로 돌아갈 때 "뚝" 끊기지 않는다
```

### 카드 A7 — 난이도별 보스 변형 (지역 하나씩 반복)

```
[작업 카드 A7] 난이도별 보스 변형 — 이번 대화에서는 지역 <N> 하나만

※ 붙여 넣기 전에 <N>을 0~9 중 하나로 바꾼다. 처음에는 0으로 한다.

목적: 하드·엑스퍼트·나이트메어 난이도에서도 노말과 똑같은 보스 그림이 나온다.
     지역 <N>의 보스 1종에 난이도별 변형 3종을 만든다.

만들 것: 지역 <N> 보스(키 creature_<N>_3)의 변형 3종. 각 변형마다 기존 보스와 같은 종류의 파일을 만든다.
- 하드       (키 creature_<N>_3_t1): 같은 보스가 서리 낀 강철 갑주와 푸른 발광 문양을 두른 모습
- 엑스퍼트   (키 creature_<N>_3_t2): 같은 보스가 금빛 문양과 타오르는 불씨를 두른 모습
- 나이트메어 (키 creature_<N>_3_t3): 같은 보스의 몸에 공허 균열(보라·검정)이 갈라져 빛이 새는 모습
각 변형의 파일(기존 creature_<N>_3과 같은 크기·같은 칸 수·같은 발 위치):
- dist/client/assets/actor-poses/<키>.webp        (320×320 대기 그림)
- 공격 6칸 원본 띠 그림 → tools/bake-enemy-motion.py로 구운
  dist/client/assets/enemy-motion/<키>.webp 와 enemy-motion/rest/<키>.webp

그림 지시:
- 체형·실루엣·자세·크기는 노말 보스와 같아야 한다. 색만 바꾼 그림은 안 되고,
  위에 적은 재질·장식이 실제로 그려져 있어야 한다.
- 팔·턱·날개를 잘라 돌리거나 몸을 늘여서 동작을 만들지 않는다(AGENTS.md 규칙).
- 6칸 공격 띠는 노말 보스의 6칸과 같은 동작 순서(준비 3칸, 타격 1칸, 회수 2칸).

고칠 파일:
1. tools/bake-enemy-motion.py: 새 키 3개를 기존 creature_<N>_3과 같은 설정으로 목록에 추가하고 실행한다.
2. web/game/campaign-difficulties.js 의 encounterFor (이 줄만 고친다. 수치는 건드리지 않는다)
   찾기:  art:'creature_'+CAMPAIGN_CREATURE_REGIONS[p.area]+'_'+species,
   바꾸기: art:campaignCreatureArt(CAMPAIGN_CREATURE_REGIONS[p.area],species,p.tier),
   그리고 encounterFor 정의 바로 위에 추가:
   // A difficulty variant is used where its art has been registered; otherwise the Normal art.
   function campaignCreatureArt(region,species,tier){
    const base='creature_'+region+'_'+species,variant=base+'_t'+tier;
    return tier&&typeof enemyRegistration!=='undefined'&&enemyRegistration[variant]?variant:base;
   }
   (enemyRegistration의 실제 이름이 다르면, 구운 띠 그림의 등록 표 이름으로 바꾸고 그 사실을 보고한다)
3. 새 키가 메뉴용 그림(HD_ART)을 필요로 하면 web/game/art-bounds.js에 기존 보스와 같은 방식으로 등록한다.

완료 확인:
- 공통 규칙 [6]의 명령 4개 통과
- node tests/enemy-motion.cjs, node tests/boss-and-art.cjs, node tests/stage-enemy-attacks.cjs 통과
- 노말에서는 기존 보스, 하드·엑스퍼트·나이트메어의 같은 지역 보스 스테이지에서는 각 변형이 나온다
- 변형이 없는 다른 지역의 보스는 전과 똑같이 나온다
- 보스의 발이 바닥에 붙어 있고, 공격 6칸이 끊기지 않는다
```

### 카드 C1 — 초기화 시각 통일 (코드 작업)

```
[작업 카드 C1] 월드보스·아레나·거점 상점의 하루 초기화를 한국 자정으로 통일

목적: 일일 임무·출석·오늘의 탑은 한국 시간 00:00에 초기화되는데,
     월드보스·아레나·길드·거점 코인 상점·추가 입장권은 한국 시간 09:00에 초기화된다. 00:00으로 맞춘다.

고칠 파일과 문자열:
1. web/game/online-service.js
   찾기:  function onlineDay(){return new Date().toISOString().slice(0,10)}
   바꾸기: function onlineDay(){return attendanceDay()}
2. dist/server/economy-protection.js (이 카드에 한해 이 한 곳만 수정 허용)
   sameEconomy 함수의 마지막 return 문에서 dayCounterValid(oldShop?.day, … ,day) 의 마지막 인자 day를 gameDay로 바꾼다.
   그 위 주석의 "UTC day"를 "Korean day"로 바꾼다.
3. 안내 문구 (글자만 바꾼다)
   - dist/client/admission.js:      '종류별 하루 3회 · 오전 9시 초기화' → '종류별 하루 3회 · 자정 초기화'
   - dist/client/world-boss.js:     '오전 9시 횟수 초기화' → '자정에 횟수 초기화'
   - web/game/online-service.js:    '매일 한국 시간 오전 9시' → '매일 한국 시간 자정'
   - dist/client/player-experience.js: online:'매일 09:00 · 한국 시간' → online:'매일 00:00 · 한국 시간'
     같은 파일의 playerResetTime 함수에서 'online' 종류가 09:00을 계산하는 부분을 'daily'와 같은 계산으로 바꾼다.
4. node tools/rank-simulation/build.cjs 를 실행해 서버용 규칙 파일을 다시 만든다.

완료 확인:
- 공통 규칙 [6]의 명령 4개 통과
- node tests/world-boss.cjs, node tests/save-protection.cjs, node tests/earned-claims.cjs,
  node tests/flows.cjs, node tests/server-economy.mjs, node tests/admission.cjs 통과
  (테스트가 09:00을 기대해서 실패하면, 그 기대값만 00:00 기준으로 고치고 어떤 줄을 고쳤는지 보고한다)
- 기기 시간을 한국 시간 23:59 → 00:01로 넘겼을 때 월드보스 도전 횟수와 일일 임무가 같이 초기화된다
```

---

## 카드로 만들지 않은 것 (지금은 GPT에게 시키지 않습니다)

아래는 규모가 크거나, 게임 안에서 어떻게 쓰이는지 먼저 확인해야 해서 지금 맡기면 틀리기 쉬운 일입니다. 필요할 때 따로 쪼개서 요청하세요.

- **7~9번 지역 보스의 정지 그림 크기**: 다른 지역 보스는 그림 칸의 76~86% 높이로 그려져 있는데 마왕성·성역·심연 보스는 59~64%입니다. 전투 화면에서 실제로 작게 보이는지 먼저 확인해야 합니다.
- **직업별 기본 무기 그림 크기**(섀도우 88×64, 워리어 125×672 등 제각각): 어느 화면에서 쓰이는지 확인이 필요합니다.
- **선으로 된 기호를 그림으로 바꾸기**(스테이지 보스 표시, 칭호 배지, 자동 전투 버튼)
- **탑 입장권 열쇠 아이콘**: 지금 게임에서 쓰이지 않는 파일입니다.
- 몬스터 피격·사망 자세(40종 × 2자세)와 보스 기술 예고 자세
- 일반 몬스터 30종의 난이도별 변형(카드 A7을 보스로 먼저 검증한 뒤)
- 능력 강화·유물·동료·스킬 레벨·장비 구매를 서버 명령으로 옮기기
- 유료 시즌 패스·월 정액 결제 연결
- 앱(안드로이드) 버전에 fix5 반영
