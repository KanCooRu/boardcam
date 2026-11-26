# 성운의 모루 — GPT 작업 지시서 통합본 (에셋·사운드 중심)

기준: 웹 v156 + **fix12**(2026-11-26). fix12를 먼저 적용한 뒤에 사용합니다. 이전에 드린 지시서(v157)는 이 파일로 대체합니다.

## 사용하는 방법 (사람이 읽는 부분)

GPT는 여러 일을 한꺼번에 주면 일부만 하거나 섞어서 처리합니다. 그래서 이렇게 씁니다.

1. 새 대화를 열 때마다 **[공통 규칙]** 블록 전체를 먼저 붙여 넣습니다.
2. 그 아래에 **작업 카드 한 장만** 붙여 넣습니다. 두 장을 같이 주지 않습니다.
3. GPT가 "보고 형식"대로 답하면, 보고에 적힌 파일이 실제로 있는지만 확인하고 다음 카드로 넘어갑니다.
4. GPT가 카드에 없는 일을 했다고 보고하면 "카드에 없는 변경은 되돌려 줘"라고 말합니다.
5. GPT가 "문자열을 찾지 못함"이라고 멈추면, 그 카드보다 먼저 해야 하는 카드가 있는지 "전제" 줄을 확인합니다.

카드끼리는 순서를 바꿔도 되게 만들었습니다. 예외는 **S3(S2 다음에만 가능)** 하나입니다.

추천 순서(효과 대비 사용량이 적은 순):
**S1 → A1 → A2 → A4 → A8 → S2 → A3 → A9 → A12 → S6 → A10 → A11 → S5 → A5 → S3 → A6 → S4 → A7 → C1**

| 카드 | 내용 | 결과물 수 | 사용량 |
| --- | --- | --- | --- |
| S1 | 버튼 누르는 소리 연결(녹음은 이미 있음) | 코드 2곳 | 아주 적음 |
| A1 | 동료 소환권 아이콘 | 이미지 1 | 적음 |
| A2 | 무기 잔해 아이콘 | 이미지 1 | 적음 |
| A4 | 탑 강화 카드 아이콘 3종 | 이미지 3 | 적음 |
| A8 | 튀는 아이콘 3종 다시 그리기(강화석·별철·다이아) | 이미지 3 | 적음 |
| S2 | 강화 실패·파괴 소리 | 소리 2 | 적음 |
| A3 | 성좌 각인 별자리 지도 그림(밤하늘 1 · 별 메달 3 · 자물쇠 1) | 이미지 5 | 보통 |
| A9 | 용광로 제련 그림(전체 화면 바탕·제목 장식·용광로·불꽃·덩이·주괴 등) | 이미지 14 | 많음 |
| A12 | 용광로 제련 게이지 틀·덩이 버튼 틀·아이콘 그림 | 이미지 5 | 보통 |
| S6 | 용광로 제련 효과음 8개와 배경 음악 1곡 | 소리 9 | 많음 |
| A10 | 동료 배치전 배경·판·효과 그림(전체 화면 바탕·제목 장식·판 바닥·칸 표시·효과·리본) | 이미지 12 | 많음 |
| A11 | 동료 배치전 카드·아이콘·배지 그림(상점 카드 틀·코인·별·역할 아이콘·차례 배지) | 이미지 15 | 많음 |
| S5 | 동료 배치전 효과음 15개와 배경 음악 1곡 | 소리 16 | 많음 |
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
    - web/game/minigames.js 파일이 있다
    - web/game/first-adventure.js 안에 lockMark 라는 이름이 있다
    - web/game/minigames.js 안에 FURNACE_ART 라는 이름이 있다 (fix7이 적용된 프로젝트다)
    - web/game/minigames.js 안에 FURNACE_SOUND 라는 이름이 있다 (fix12가 적용된 프로젝트다)
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
- 이 자물쇠는 성좌 지도뿐 아니라 게임의 모든 잠긴 버튼(하단 메뉴, 탭, 바로가기, 유물, 미니게임)에 12×12 크기로도 쓰인다.
- 그래서 26×26은 물론 12×12로 줄여도 "닫힌 자물쇠"로 보여야 한다. 고리를 굵게, 장식은 최소로.
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
- 새 계정(스테이지 1)으로 보면 하단 메뉴의 잠긴 버튼과 홈의 잠긴 바로가기에도 같은 자물쇠 그림이 작게 보인다
- 열린 별을 누르면 "별 각인" 창 왼쪽 위에 그 자리의 메달 그림이 보인다
- 폭 360px 화면에서도 위 내용이 같다

■ 보고에 꼭 넣을 것
- 다섯 파일 각각의 가로×세로와 용량
- 성좌 화면 전체가 보이는 화면 캡처 1장(잠긴 자리와 열린 자리가 함께 보이게)
```

### 카드 A9 — 용광로 제련: 배경·용광로·효과 그림 14장

```
[작업 카드 A9] 용광로 제련 — 배경·용광로·효과 그림 14장

■ 먼저 확인 (하나라도 아니면 아무것도 하지 말고 그 사실만 보고한다)
- web/game/minigames.js 안에 FURNACE_SOUND 라는 이름이 있다 (fix12가 적용된 프로젝트다).
- 같은 파일 안에 "const FURNACE_ART=false," 라는 글자가 정확히 한 번 나온다.
- dist/client/assets/minigames/ 폴더가 없으면 새로 만든다.

■ 이미 만들어져 있는 것 (읽기만 한다. 규칙·배치·움직임은 고치지 않는다)
- 던전 → 미니게임 → 용광로 제련을 누르면 전체 화면으로 열린다(상단 바·탭·하단 메뉴를 덮는다).
  전체 화면의 구성: 맨 위에 제목 영역(남은 횟수, 보유 재화, 제목 글자 "용광로 제련"),
  가운데에 놀이 영역, 맨 아래에 가이드 버튼(왼쪽)과 빨간 나가기 버튼(오른쪽).
  제목 글자와 버튼은 코드가 그린다.
- 놀이 영역 위쪽에 가로 4 : 세로 3 비율의 "장면 상자"가 있다.
- 장면 상자 안의 층(뒤에서 앞 순서)과 위치는 코드가 정해 두었다:
    ① 배경: 상자 전체
    ② 용광로 몸통: 가로 가운데, 상자 너비의 58% 크기 정사각형, 바닥에서 4% 위
    ③ 불꽃: 가로 가운데, 상자 너비의 34% 크기 정사각형. 온도에 따라 0.55배~1.3배로 커지고 밝아진다.
            커질 때 기준점은 불꽃 그림의 아래쪽(위에서 85% 지점)이다.
    ④ 떨어지는 덩이: 상자 맨 위 가운데에서 나타나 아래로 떨어지며 사라진다(0.6초)
    ⑤ 증기: 용광로 위에서 위로 피어오르며 사라진다(1.1초)
    ⑥ 결과: 상자 가운데에 주괴(또는 깨진 주괴) 그림이 뜨고 그 아래에 이름과 순도가 글자로 나온다
- 지금은 그림이 없어서 코드가 그린 임시 도형이 보인다.

■ 목적
그림 14장을 만들고 스위치 한 곳을 켠다. 그 외에는 아무것도 바꾸지 않는다.

■ 공통 화풍 (14장 모두)
- 반실사 판타지 채색. 부드러운 그라데이션과 또렷한 하이라이트. 두꺼운 검은 외곽선·만화풍·픽셀아트·사진 금지.
- 색: 어두운 가지색·남보라 그늘(#0f0c19, #1d1626), 무쇠의 검은 회색(#2a2630), 금테(#f1c986),
      불빛 주황(#ffb347, #e2501f), 가장 뜨거운 곳은 밝은 노랑(#fff3c0), 성운석의 보라(#7a5fd0).
- 광원: 장면의 주광원은 용광로 입구의 불빛이다. 주변 물체는 입구 쪽 면이 주황으로 밝다.
- 그리지 않는 것: 글자, 숫자, 사람, 손, 모루(모루는 장비 제작 화면 전용이다).
- 기준으로 먼저 열어 볼 파일:
    dist/client/assets/weapon-forge/workshop.webp   (대장간의 분위기와 색)
    dist/client/assets/ui-regalia/small-ore.webp    (성운석: 보라 수정)
    dist/client/assets/ui-regalia/starIron.webp     (금속 주괴의 재질)
- 모든 파일은 dist/client/assets/minigames/ 폴더에 둔다(폴더가 없으면 만든다).

■ 만들 파일

1. furnace-bg.webp — 1024×768, 불투명, 300KB 이하
   대장간 안쪽 벽과 바닥. 가운데 아래(용광로가 놓일 자리)는 비워 둔 돌바닥이다.
   양옆 벽에 걸린 집게·부삽의 어두운 실루엣, 뒤쪽에 희미한 굴뚝 벽돌.
   전체적으로 어둡게. 가운데 아래쪽 바닥에만 주황빛이 은은하게 번져 있다(용광로 불빛이 비친 것처럼).
   용광로 자체는 그리지 않는다(다음 그림이 그 위에 놓인다).
   영문 문장: "Interior of a dark fantasy blacksmith forge, stone wall and stone floor, empty floor space in the
   lower center, faint silhouettes of tongs and a shovel hanging on the side walls, dim brick chimney wall behind,
   deep aubergine and indigo shadows, a soft orange glow spilling on the floor at the lower center as if from an
   unseen fire. Semi-realistic painterly game background, low contrast, no furnace, no anvil, no people, no text."

2. furnace-body.webp — 640×640, 배경 투명, 180KB 이하
   정면에서 본 둥근 무쇠 용광로 하나. 검은 무쇠 몸통에 금테 띠 두 줄과 리벳, 짧은 다리 세 개, 위에 짧은 굴뚝.
   가운데에 아치 모양 입구가 뚫려 있고 그 안은 어두운 붉은색이다(불꽃 그림이 그 위에 겹친다).
   위치 규칙(꼭 지킨다):
   - 용광로는 캔버스 가로 가운데. 바닥에 닿는 다리 끝이 캔버스 맨 아래에서 20픽셀 위.
   - 입구(아치 구멍)의 중심이 (320, 340) 픽셀, 크기는 가로 약 260 × 세로 약 240 픽셀.
   - 입구 안쪽은 비워 둔다. 불꽃이나 쇳물을 그려 넣지 않는다.
   영문 문장: "A round cast-iron fantasy smelting furnace, front view, centered, on a fully transparent background.
   Black iron body with two gold bands and rivets, three short legs, a short chimney on top, a large arched opening
   in the middle whose inside is dark ember red and empty. Warm orange rim light around the opening.
   Semi-realistic painted metal, no flames, no text."

3. furnace-flame.webp — 512×512, 배경 투명, 90KB 이하
   불꽃 한 덩어리. 아래가 넓고 위로 갈수록 갈라지며 좁아진다.
   - 불꽃의 뿌리(가장 밝은 곳)가 캔버스의 가로 가운데, 위에서 85% 지점(세로 435픽셀 근처)에 오게 한다.
   - 가운데는 밝은 노랑, 바깥은 주황→붉은색, 가장자리는 투명으로 부드럽게 사라진다.
   - 화면에서는 밝은 부분만 더해지는 방식으로 겹쳐진다. 그래서 어두운 연기나 검은 테두리를 넣지 않는다.
   영문 문장: "A single bright forge flame on a fully transparent background, wide at the base and splitting into
   tongues toward the top, the hottest point at the bottom center, pale yellow core, orange and red outer flame,
   soft transparent edges, no smoke, no dark outline. Painted game VFX sprite."

4. ore-small.webp — 192×192, 배경 투명, 30KB 이하
   작은 성운석 덩이 하나: 보라 수정 한두 개가 박힌 주먹만 한 돌.
5. ore-large.webp — 192×192, 배경 투명, 30KB 이하
   큰 성운석 덩이: 보라 수정 네다섯 개가 솟은 큰 돌. ore-small보다 눈에 띄게 크고(캔버스의 85%) 수정이 많다.
   두 장 공통: 기준 파일 small-ore.webp와 같은 수정 색. 48px로 줄여 나란히 놓았을 때 "작은 것 / 큰 것"이 구별되어야 한다.
   영문 문장(괄호만 바꾼다): "A ( small fist-sized rock with one or two purple crystals / large rock cluster with
   four or five tall purple crystals ) of nebula ore on a fully transparent background, centered, glossy violet
   crystals with gold-flecked dark stone, highlight from the upper left. Fantasy RPG item icon, no text."

6. steam.webp — 512×512, 배경 투명, 70KB 이하
   위로 피어오르는 하얀 증기 한 덩이. 가장자리는 투명으로 부드럽게. 색은 흰색~아주 옅은 하늘색.
   영문 문장: "A soft puff of white steam rising, on a fully transparent background, wispy feathered edges,
   white to very pale blue, no dark smoke. Painted game VFX sprite."

7~10. ingot-0.webp, ingot-1.webp, ingot-2.webp, ingot-3.webp — 각 256×256, 배경 투명, 각 45KB 이하
   순도 등급별 주괴. 네 장은 같은 각도(왼쪽 위에서 내려다본 사다리꼴 주괴), 같은 크기로 그리고 재질만 달라진다.
   - ingot-0 "거친 주괴": 거뭇한 회색 금속, 표면이 거칠고 기포 자국이 있다. 빛나지 않는다.
   - ingot-1 "단단한 주괴": 매끈한 강철색, 은은한 보랏빛 광택.
   - ingot-2 "빛나는 주괴": 보랏빛 금속에 금색 줄무늬가 흐르고 가장자리가 빛난다.
   - ingot-3 "명장의 주괴": 금테를 두른 보랏빛 금속, 윗면에 작은 별 무늬가 새겨져 있고 주변에 빛 알갱이가 뜬다.
   네 장을 나란히 놓았을 때 0 → 3 순서로 점점 귀해 보여야 한다.
   영문 문장(괄호만 바꾼다): "A trapezoid metal ingot seen from the upper left, centered on a fully transparent
   background, ( rough dull dark-grey metal with pits / smooth steel with a faint violet sheen / violet metal with
   flowing gold streaks and glowing edges / gold-trimmed violet metal with a small engraved star on top and floating
   light motes ). Semi-realistic painted metal, fantasy RPG item, no text."

11. burst.webp — 256×256, 배경 투명, 45KB 이하
   과열 결과. 가운데가 갈라져 두 동강 난 검게 탄 주괴와 그 위로 오르는 회색 연기 조금.
   영문 문장: "A cracked, charred metal ingot split in two, a little grey smoke rising, centered on a fully
   transparent background. Semi-realistic painted, fantasy RPG item, no text."

12. hub-furnace.webp — 256×256, 배경 투명, 45KB 이하
   미니게임 목록에 쓰는 작은 그림. 2번과 같은 용광로를 작게, 입구에 불이 켜진 모습으로(불꽃 포함) 그린다.

13. frame-furnace.webp — 720×1280, 불투명, 320KB 이하
   전체 화면의 바탕 그림. 세로로 긴 대장간 내부.
   - 위쪽 4분의 1(세로 0~320): 그을린 들보와 매달린 사슬·등불, 등불의 주황빛. 이 부분이 제목 뒤에 보인다.
   - 그 아래(세로 320~1280): 어두운 돌벽. 무늬가 거의 없이 고르게 어둡다(그 위에 놀이 영역과 버튼이 놓인다).
   - 맨 아래로 갈수록 더 어두워진다.
   영문 문장: "A tall vertical fantasy forge interior for a full-screen mobile game backdrop. The top quarter shows
   sooty wooden beams with hanging chains and a warm glowing lantern; below it a plain dark stone wall that stays
   evenly dark and low in detail, fading darker toward the bottom. Deep aubergine and indigo shadows with orange
   lantern light at the top. Semi-realistic painterly, no furnace, no anvil, no people, no text."

14. title-furnace.webp — 1024×360, 배경 투명, 110KB 이하
   제목 글자 뒤에 깔리는 장식. 가로로 긴 무쇠 명판에 금테, 양 끝에 작은 불꽃 장식, 위 가운데에 망치 모양 장식.
   - 가운데 가로 560 × 세로 130 픽셀 영역은 무늬 없이 어둡게 비워 둔다(그 위에 코드가 제목 글자를 쓴다).
   - 그림 안에 글자를 넣지 않는다.
   영문 문장: "A wide ornate fantasy title plaque on a fully transparent background: dark cast-iron plate with a gold
   rim, small flame ornaments at both ends and a small hammer crest at the top center. The middle of the plate is
   plain, dark and empty for a title. Semi-realistic painted UI ornament, no text, no letters."

■ 만든 뒤 스스로 확인 (하나라도 아니면 다시 만든다)
1. 14개 파일의 가로×세로가 위에 적은 값과 정확히 같다.
2. furnace-bg와 frame-furnace만 불투명이고 나머지 12개는 배경이 투명하다.
3. 투명 그림을 #221c30 색 바탕 위에 올렸을 때 가장자리에 흰 띠나 회색 얼룩이 없다.
4. furnace-bg(1024×768) 위에 furnace-body를 594×594로 줄여 가로 가운데, 바닥에서 31픽셀 위에 올리고,
   그 위에 furnace-flame을 348×348로 줄여 가로 가운데, 바닥에서 169픽셀 위에 올렸을 때
   불꽃의 뿌리가 용광로 입구 안에 들어온다. 어긋나면 2번의 입구 위치를 다시 맞춘다.
5. 용량이 각각 한도 이하다.

■ 고칠 파일: web/game/minigames.js (이 파일 하나만, 한 곳만)
   찾기:  const FURNACE_ART=false,
   바꾸기: const FURNACE_ART=true,
이 한 곳 외에는 이 파일의 어떤 것도 바꾸지 않는다(온도 범위, 순도, 보상, 횟수 모두 그대로).
CSS는 이미 있다. 추가하지 않는다.

■ 완료 확인
- 공통 규칙 [6]의 명령 4개 통과, node tests/minigames.cjs 통과
- 던전 → 미니게임: 용광로 제련 카드 왼쪽에 작은 그림이 보인다
- 용광로 제련 화면(전체 화면)
  · 화면 전체에 바탕 그림이 깔리고, 제목 글자 뒤에 명판 장식이 보이며 제목 글자가 또렷이 읽힌다
  · 맨 아래의 가이드·나가기 버튼이 바탕 그림에 묻히지 않는다
  · 제련 시작 전: 배경과 용광로가 보이고 불꽃은 꺼져 있다
  · 덩이를 넣을 때: 덩이 그림이 위에서 입구로 떨어진다. 온도가 오를수록 불꽃이 커진다
  · 냉각수: 증기가 피어오른다
  · 꺼내기: 가운데에 주괴 그림이 뜬다(순도 7 이하 / 8~15 / 16~22 / 23 이상에서 그림이 다르다)
  · 과열: 깨진 주괴 그림이 뜬다
- "작은 덩이 / 큰 덩이" 버튼 안에 덩이 그림이 보인다
- 폭 360px 화면에서도 장면 상자와 아래 버튼이 겹치지 않는다

■ 보고에 꼭 넣을 것
- 14개 파일 각각의 가로×세로와 용량
- 화면 전체 캡처 3장: 불이 붙은 장면, 주괴가 뜬 장면, 과열 장면
```

### 카드 A12 — 용광로 제련: 게이지 틀·덩이 버튼 틀·아이콘 그림 5장

```
[작업 카드 A12] 용광로 제련 — 게이지 틀·덩이 버튼 틀·작은 아이콘 그림 5장

■ 먼저 확인 (하나라도 아니면 아무것도 하지 말고 그 사실만 보고한다)
- web/game/minigames.js 안에 FURNACE_SOUND 라는 이름이 있다 (fix12가 적용된 프로젝트다).
- 같은 파일 안에 "const FURNACE_UI_ART=false;" 라는 줄이 정확히 한 번 나온다.
- dist/client/assets/minigames/ 폴더가 없으면 새로 만든다.

■ 이 카드가 하는 일 (한 줄 요약)
그림 5장을 만들어 dist/client/assets/minigames/ 에 넣고, 스위치 한 곳(FURNACE_UI_ART)을 켠다. 그 외에는 아무것도 바꾸지 않는다.

■ 이미 만들어져 있는 것 (읽기만 한다. 글자·배치·크기는 고치지 않는다)
- 용광로 장면 상자 바로 아래에 차례로 놓인 것:
  (가) 온도 게이지: 가로로 긴 막대(화면 너비 전체, 세로 38픽셀). 온도만큼 왼쪽부터 색이 찬다.
       막대 한가운데에 "27 / 100" 같은 숫자를 코드가 쓴다. 막대의 색(보라→주황→빨강)도 코드가 칠한다.
  (나) 표 두 줄: "순도  7", "지금 꺼내면  별철 2 · 강화석 70". 글자는 코드가 쓴다.
  (다) 덩이 버튼 두 개가 가로로 나란히: "작은 덩이", "큰 덩이". 버튼 하나는 화면에서 가로 약 170 × 세로 약 125 픽셀이고,
       휴대폰 폭에 따라 가로가 달라진다. 버튼 안에는 위에서부터 덩이 그림, 이름, "온도 +8~14", "순도 +2"가 들어간다.
  (라) 버튼 두 개: "냉각수 · 온도 -15", "꺼내기".
- 게이지 숫자 앞, "순도" 글자 앞, "냉각수" 글자 앞에 작은 아이콘이 하나씩 붙는다(화면에서 18×18).
- 지금은 그림이 없어서 색만 칠한 막대와 네모가 보인다.

■ 아주 중요 1: 게이지 틀(gauge-frame)은 "가운데가 뚫린 테"다
코드는 이 그림을 온도 막대 "위에" 덮는다. 그래서 가운데가 뚫려 있지 않으면 막대와 숫자가 가려진다.
코드는 그림을 이렇게 쓴다.
  - 왼쪽 끝 48픽셀과 오른쪽 끝 48픽셀(끝 장식)은 모양 그대로 둔다.
  - 그 사이의 위쪽 띠(세로 0~32)와 아래쪽 띠(세로 64~96)는 가로로 늘린다.
  - 한가운데 직사각형(가로 48~672, 세로 32~64)은 쓰지 않는다. 그 자리로 온도 막대가 보인다.
그러므로 이렇게 그린다.
  1. 한가운데 직사각형(가로 48~672, 세로 32~64)은 완전히 투명하다. 아무것도 그리지 않는다.
  2. 끝 장식은 양 끝에서 48픽셀 안에만 넣는다.
  3. 위아래 띠는 길이 방향으로 무늬가 없다. 처음부터 끝까지 똑같은 띠다. 띠의 두께는 바깥에서 20픽셀을 넘지 않는다.

■ 아주 중요 2: 덩이 버튼 틀(piece-frame)은 "늘어나는 틀"이다
버튼은 휴대폰 폭에 따라 크기가 달라진다. 코드는 네 모서리(각 24×24 픽셀)는 그대로 두고, 네 변과 가운데를 늘려 쓴다.
그러므로 이렇게 그린다.
  1. 모서리 장식은 각 모서리의 24×24 픽셀 안에만 넣는다.
  2. 네 변의 테두리 띠는 길이 방향으로 무늬가 없다. 테두리 두께는 바깥에서 14픽셀을 넘지 않는다.
  3. 가운데는 무늬 없이 고른 색이다. 그라데이션은 위에서 아래로 아주 약하게만. 문양·얼룩·질감 무늬를 넣지 않는다.

■ 공통 화풍 (5장 모두 똑같이 지킨다)
- "무쇠와 금테" — 불에 그을린 어두운 무쇠판에 얇은 금 테두리. 반실사 판타지 채색. 광원 왼쪽 위.
- 쓰지 않는 것: 두꺼운 검은 외곽선, 만화풍, 픽셀아트, 사진, 글자, 숫자, 사람, 손, 모루(모루는 장비 제작 화면 전용이다).
- 색 (이 값에서 벗어나지 않는다)
    무쇠              #2a2630 (어두운 곳) , #4a4450 (밝은 곳)
    금 장식           #f1c986 (밝은 곳) , #a8823a (어두운 곳)
    불 = 주황          #ffb347 , #e2501f
    성운석 = 보라       #7a5fd0 , #c9b6ff
    냉각수 = 하늘색     #8fd8ff
- 먼저 열어 볼 기준 파일
    dist/client/assets/weapon-forge/workshop.webp   (대장간의 색과 분위기)
    dist/client/assets/ui-regalia/stat-attack.webp  (금 장식의 색과 광택)
    dist/client/assets/ui-regalia/small-ore.webp    (성운석: 보라 수정)
- 저장 위치: 5장 모두 dist/client/assets/minigames/ (하위 폴더를 만들지 않는다)
- 형식: 5장 모두 webp, 배경 투명

■ 만들 파일 5장

───────────────────────────────────────────────────────────────
[1] gauge-frame.webp          720×96     배경 투명(가운데도 투명)   30KB 이하   ← 가운데가 뚫린 테
───────────────────────────────────────────────────────────────
어디에 보이나: 온도 게이지 막대 위에 덮인다. 화면에서는 세로 38픽셀.
무엇을 그리나: 가로로 긴 무쇠 테. 얇은 금 테두리선. 왼쪽 끝 장식에는 작은 하늘색 수정 하나(차가운 쪽),
            오른쪽 끝 장식에는 작은 붉은 불씨 보석 하나(뜨거운 쪽).
꼭 지킬 것: 위의 "아주 중요 1" 세 가지.
영문 문장:
  "A long horizontal hollow gauge frame on a fully transparent background, dark wrought iron with a thin gold
   trim line, a small sky-blue crystal on the left end cap and a small red ember gem on the right end cap. The
   whole inside of the frame is empty and transparent, the top and bottom bars are plain and uniform along their
   length. Semi-realistic painted UI frame, no text, no numbers, no tick marks."

───────────────────────────────────────────────────────────────
[2] piece-frame.webp          192×192    배경 투명   25KB 이하   ← 늘어나는 틀
───────────────────────────────────────────────────────────────
어디에 보이나: "작은 덩이", "큰 덩이" 버튼의 바탕.
무엇을 그리나: 모서리가 둥근 정사각 무쇠판. 가운데는 어두운 가지색 무쇠(#2a2630에서 #1d1626으로 위→아래 아주 약한 그라데이션),
            가장자리에 얇은 금 테두리(#f1c986), 네 모서리에 작은 징 하나씩.
꼭 지킬 것: 위의 "아주 중요 2" 세 가지. 누르는 버튼처럼 보이도록 테두리의 위쪽이 조금 더 밝다.
영문 문장:
  "A blank square game button plate with rounded corners on a fully transparent background, dark wrought-iron
   panel with a thin polished gold border and a tiny rivet in each corner. The panel center is completely plain
   and flat with no pattern, the border bands are uniform along their length. Semi-realistic painted UI frame,
   no text, no icons."

───────────────────────────────────────────────────────────────
[3] icon-heat.webp   [4] icon-purity.webp   [5] icon-coolant.webp     각 96×96   배경 투명   각 12KB 이하
───────────────────────────────────────────────────────────────
어디에 보이나: 글자 앞. 화면에서는 18×18로 아주 작게 줄어든다.
  [3] icon-heat.webp     온도  → 주황색 불꽃 하나(가운데는 밝은 노랑). 게이지 숫자 앞에 붙는다.
  [4] icon-purity.webp   순도  → 보라색 수정 결정 하나와 오른쪽 위의 작은 반짝임 하나. "순도" 글자 앞에 붙는다.
  [5] icon-coolant.webp  냉각수 → 하늘색 물방울 하나와 그 위의 작은 김 두 줄. "냉각수" 버튼 글자 앞에 붙는다.
꼭 지킬 것:
  - 선이 굵고 형태가 단순하다. 대상이 캔버스의 85%를 채운다.
  - 세 장을 18×18로 줄여 나란히 놓았을 때 색과 모양으로 서로 구별된다(주황 불꽃 / 보라 수정 / 하늘색 물방울).
영문 문장(괄호 안만 바꿔 세 번 만든다):
  "A bold simple game icon of ( an orange flame with a bright yellow core / a violet crystal shard with one small
   sparkle / a sky-blue water drop with two small wisps of steam above it ) on a fully transparent background,
   centered, thick shapes readable at 18 pixels. Semi-realistic painted fantasy UI icon, no text."

■ 만든 뒤 스스로 확인 (하나라도 아니면 그 그림을 다시 만든다)
1. 5개 파일의 이름과 가로×세로가 위에 적은 것과 글자 하나, 픽셀 하나 다르지 않다.
2. 5장 모두 배경이 투명하다. gauge-frame.webp 는 한가운데 직사각형(가로 48~672, 세로 32~64)도 완전히 투명하다.
3. #221c30 색 바탕 위에 올렸을 때 가장자리에 흰 띠나 회색 얼룩이 없다.
4. gauge-frame.webp 시험: 가로 672 × 세로 76 크기의 주황색 막대 위에, 이 틀을 "양 끝 48픽셀 고정" 방식으로
   가로 672 × 세로 76 으로 늘려 덮어 본다. 막대가 가운데로 훤히 보이고, 끝 장식이 찌그러지지 않는다.
5. piece-frame.webp 시험: "모서리 24픽셀 고정" 방식으로 가로 340 × 세로 250 으로 늘려 본다.
   모서리 징이 찌그러지지 않고, 가운데에 줄무늬나 얼룩이 생기지 않는다.
6. 아이콘 3장을 18×18로 줄여 나란히 놓았을 때 서로 구별된다.
7. 어느 그림에도 글자·숫자·눈금·모루가 없다. 용량이 각각 한도 이하다.

■ 고칠 파일: web/game/minigames.js (이 파일 하나만, 한 곳만)
   찾기:  const FURNACE_UI_ART=false;
   바꾸기: const FURNACE_UI_ART=true;
이 한 곳 외에는 이 파일의 글자를 하나도 바꾸지 않는다. CSS는 이미 있다. CSS 파일을 고치지 않는다.

■ 완료 확인
- 공통 규칙 [6]의 명령 4개 통과, node tests/minigames.cjs 통과
- 던전 → 미니게임 → 용광로 제련 "입장"
  · 온도 게이지에 무쇠 테가 씌워져 보이고, 테 가운데로 색 막대와 숫자가 가려지지 않고 보인다
  · 게이지 숫자 앞에 불꽃 아이콘, "순도" 앞에 수정 아이콘이 보인다
- "제련 시작"을 누른 뒤
  · "작은 덩이", "큰 덩이" 버튼이 무쇠판 그림으로 보이고, 안의 글자 네 줄이 테두리에 겹치지 않고 읽힌다
  · "냉각수" 버튼 글자 앞에 물방울 아이콘이 보인다
  · 덩이를 넣으면 테 안에서 색 막대가 늘어난다. 온도가 100에 가까워도 막대가 테 밖으로 나오지 않는다
- 폭 360px 화면에서도 게이지와 버튼 두 개가 화면 밖으로 나가지 않는다

■ 보고에 꼭 넣을 것
- 5개 파일 각각의 가로×세로와 용량
- 화면 전체 캡처 2장: (1) 제련 시작 전(게이지 0) (2) 덩이를 두세 번 넣은 뒤(게이지가 찬 모습과 덩이 버튼이 보이게)
```

### 카드 S6 — 용광로 제련: 효과음 8개와 배경 음악 1곡

```
[작업 카드 S6] 용광로 제련 — 효과음 8개와 배경 음악 1곡

■ 먼저 확인 (하나라도 아니면 아무것도 하지 말고 그 사실만 보고한다)
- web/game/minigames.js 안에 FURNACE_UI_ART 라는 이름이 있다 (fix12가 적용된 프로젝트다).
- 같은 파일 안에 "const FURNACE_SOUND=false;" 라는 줄이 정확히 한 번 나온다.
- dist/client/assets/minigames/sfx/ 폴더가 없으면 새로 만든다.

■ 이 카드가 하는 일 (한 줄 요약)
소리 파일 9개를 만들어 dist/client/assets/minigames/sfx/ 에 넣고, 출처를 적고, 스위치 한 곳(FURNACE_SOUND)을 켠다.
그 외에는 아무것도 바꾸지 않는다.

■ 이미 만들어져 있는 것 (읽기만 한다)
- 아래 9개 파일 이름은 코드에 이미 적혀 있다. 이름이 한 글자라도 다르면 소리가 나지 않는다.
- 언제 어떤 소리를 낼지도 코드에 이미 연결되어 있다. 재생 코드를 새로 쓰지 않는다.
- 스위치를 켜기 전에는 게임의 기존 소리(제작·보상 소리)가 대신 난다.
- 스위치를 켜면 용광로 제련 화면이 열려 있는 동안 배경 음악이 furnace-bgm.mp3 로 바뀌고, 나가면 원래 음악으로 돌아온다.
- 설정에서 효과음·배경음을 끄면 이 소리들도 나지 않는다.

■ 소리의 성격 (9개 모두 똑같이 지킨다)
- 실제로 녹음된 소리만 쓴다(불, 풀무 바람, 돌, 쇠, 물, 증기, 종). 라이선스는 CC0 또는 CC BY.
- 신시사이저의 삐 소리, 8비트 게임 소리, 사람 목소리, 무음 파일, 한 소리를 이름만 바꿔 여러 번 쓰는 것은 안 된다.
- 망치로 모루를 두드리는 소리는 쓰지 않는다(그 소리는 장비 제작 화면의 것이다).
- 분위기: 따뜻하고 묵직한 대장간. 불과 쇠의 소리. 무섭거나 시끄럽지 않다.
- 형식: mp3, 32kHz, 스테레오, 192kbps (배경 음악만 128kbps).
- 각 소리의 앞 무음은 0.02초 이하. 끝은 뚝 끊기지 않게 자연스럽게 줄인다.
- 음량: 기존 효과음 묶음(dist/client/assets/048c959f1c5abcf00835.mp3)의 reward 구간과 번갈아 들어 비슷한 크기로 맞춘다.
  단, 아래 표에 "작게"라고 적힌 소리는 그보다 한 단계 작게.
- 덩이 넣는 소리 두 개는 한 판에 예닐곱 번 연달아 들어도 거슬리지 않아야 한다.

■ 만들 파일 9개 (모두 dist/client/assets/minigames/sfx/ 에 둔다)

번호  파일 이름              길이(초)     언제 나나                              어떤 소리
────────────────────────────────────────────────────────────────────────────────────────────────
 1   furnace-start.mp3     0.8~1.2     "제련 시작"을 눌렀을 때                  풀무 바람이 한 번 불고 불이 확 붙는 소리
 2   furnace-small.mp3     0.3~0.5     작은 덩이를 넣을 때 (작게)               작은 돌이 불 속에 톡 떨어지고 짧게 치익
 3   furnace-large.mp3     0.45~0.7    큰 덩이를 넣을 때                       묵직한 돌이 쿵 떨어지고 불꽃이 화르륵
 4   furnace-cool.mp3      0.9~1.3     냉각수를 쓸 때                          물을 끼얹고 증기가 치이익 피어오르는 소리
 5   furnace-take.mp3      0.8~1.2     주괴를 꺼냈을 때(순도 22 이하)           쇠집게로 주괴를 꺼내 돌 위에 놓는 맑은 쇳소리 한 번
 6   furnace-master.mp3    1.4~2.0     명장의 주괴를 꺼냈을 때(순도 23 이상)     5번과 같은 쇳소리에 맑은 종 두 음이 올라가며 반짝(특별한 보상 느낌)
 7   furnace-burst.mp3     0.9~1.3     과열됐을 때                             쇠에 금이 쩍 가고 퍽 터지며 불씨가 흩어지는 소리(크지 않게, 놀라지 않게)
 8   furnace-warn.mp3      0.35~0.6    덩이를 넣은 뒤 온도가 85 이상일 때 (작게)  달아오른 쇠가 딱딱 튀며 낮게 끓는 소리 한 번(조심하라는 신호)
 9   furnace-bgm.mp3       60~90       용광로 제련 화면이 열려 있는 동안          아래 "배경 음악" 참고

■ 배경 음악 (furnace-bgm.mp3)
- 사용자가 음악 파일을 함께 주었다면 그 파일을 쓴다(이 경우 "실제 녹음만" 규칙의 예외다. 출처에 "사용자 제공"이라고 적는다).
  할 일은 세 가지뿐이다: 60~90초로 자르기, 끝과 처음이 끊김 없이 이어지게 다듬기, 음량 맞추기.
- 사용자가 주지 않았다면 CC0 또는 CC BY 곡을 고른다. 고르는 기준:
  · 낮은 첼로(또는 비올라)와 류트·기타가 중심이고, 느린 북이 받친다
  · 빠르기는 분당 75~90박
  · 따뜻하고 차분하게 집중되는 분위기. 웅장한 전투 음악, 슬픈 음악, 전자음악은 안 된다
  · 처음부터 끝까지 세기가 비슷하다(조용히 시작해 커지는 곡, 크게 끝나는 곡은 안 된다)
  · 망치질 소리가 박자로 들어간 곡은 안 된다
- 반복: 곡이 끝나고 처음으로 돌아갈 때 "뚝" 하는 소리나 박자가 어긋나는 느낌이 없어야 한다.
- 음량: 게임의 기존 곡(dist/client/assets/9331195598f14cc5d0cc.mp3)과 번갈아 틀어 비슷하게 맞춘다.
- 형식: mp3, 32kHz, 스테레오, 128kbps, 60~90초.

■ 만든 뒤 스스로 확인 (하나라도 아니면 그 소리를 다시 만든다)
1. 9개 파일의 이름이 위 표와 글자 하나 다르지 않다(모두 소문자, 가운데는 빼기표 "-").
2. 9개 파일이 모두 dist/client/assets/minigames/sfx/ 안에 있다.
3. 각 파일의 길이가 표의 범위 안이다.
4. 9개가 모두 서로 다른 소리다. 같은 녹음을 두 파일에 쓰지 않았다(6번은 5번의 쇳소리에 종을 더한 것이어도 된다).
5. furnace-small 과 furnace-large 를 눈 감고 들어도 "가벼운 것 / 무거운 것"으로 구별된다.
6. furnace-small 을 일곱 번 연달아 틀어도 거슬리지 않는다.
7. furnace-bgm 을 두 번 이어 붙여 들었을 때 이음매에서 끊기는 소리가 없다.
8. 어느 소리에도 망치로 모루를 두드리는 소리가 없다.
9. 모든 소리의 출처 주소와 라이선스를 적어 두었다.

■ 고칠 파일 (두 파일, 각각 한 곳)
1. web/game/minigames.js
   찾기:  const FURNACE_SOUND=false;
   바꾸기: const FURNACE_SOUND=true;
   이 한 곳 외에는 이 파일의 글자를 하나도 바꾸지 않는다(소리 이름, 음량 값, 재생 코드 모두 그대로).
2. web/game/soundtrack.js
   이 파일에 있는 기존 출처(크레딧) 문장과 같은 형식으로, 이번에 쓴 소리의 제작자와 라이선스를 그 문장 뒤에 덧붙인다.
   CC BY 소리는 제작자 이름을 반드시 적는다. 다른 것은 바꾸지 않는다.

■ 완료 확인
- 공통 규칙 [6]의 명령 4개 통과, node tests/minigames.cjs 통과, node tests/music-scope.cjs 통과
- 브라우저에서 설정의 효과음과 배경음을 켠 상태로 던전 → 미니게임 → 용광로 제련 "입장"
  · 들어가면 1~2초 안에 배경 음악이 furnace-bgm 으로 바뀐다
  · "제련 시작"을 누르면 풀무와 불 붙는 소리가 난다
  · 작은 덩이와 큰 덩이를 넣을 때 서로 다른 소리가 난다
  · 온도가 85 이상이 되게 덩이를 넣으면 덩이 소리 바로 뒤에 딱딱 끓는 소리가 따라 난다
  · 냉각수를 쓰면 증기 소리가 난다
  · "꺼내기"를 누르면 맑은 쇳소리가 난다
  · 온도가 100을 넘으면 터지는 소리가 난다
  · 빨간 나가기 버튼으로 나오면 1~2초 안에 원래 배경 음악으로 돌아온다
- 설정에서 효과음을 끄면 위 효과음이 나지 않고, 배경음을 끄면 furnace-bgm 이 나지 않는다
- furnace-master(순도 23 이상)는 운이 따라야 들을 수 있다. 듣지 못했으면 보고의 5번에 "듣지 못함"이라고 적는다

■ 보고에 꼭 넣을 것
- 9개 파일 각각의 길이(초)와 용량
- 9개 파일 각각의 출처 주소, 제작자, 라이선스
- 위 "완료 확인"의 소리 중 실제로 들은 것과 듣지 못한 것
```

### 카드 A10 — 동료 배치전: 배경·판·효과 그림 12장

```
[작업 카드 A10] 동료 배치전 — 배경·판·효과 그림 12장

■ 먼저 확인 (하나라도 아니면 아무것도 하지 말고 그 사실만 보고한다)
- web/game/minigames.js 안에 FURNACE_SOUND 라는 이름이 있다 (fix12가 적용된 프로젝트다).
- 같은 파일 안에 "BOARD_ART=false;" 라는 글자가 정확히 한 번 나온다.
- dist/client/assets/minigames/ 폴더에 예전 카드로 만든 board-bg.webp, tile-ally.webp, tile-foe.webp 가
  있다면 세 파일을 지운다(크기가 달라 다시 만든다). 폴더가 없으면 새로 만든다.

■ 이 카드가 하는 일 (한 줄 요약)
그림 12장을 만들어 dist/client/assets/minigames/ 에 넣고, 스위치 한 곳(BOARD_ART)을 켠다. 그 외에는 아무것도 바꾸지 않는다.

■ 이미 만들어져 있는 것 (읽기만 한다. 규칙·배치·움직임·글자는 고치지 않는다)
- 던전 → 미니게임 → 동료 배치전 "입장"을 누르면 전체 화면으로 열린다.
- 화면 구성(위에서 아래로): 맨 위 줄(오늘 클리어 수, 보유 재화) → 제목 "동료 배치전" → 판 → 안내 글 →
  상점 카드 4장 → 내 동료 → 버튼 3개 → 맨 아래 줄(가이드 버튼, 빨간 나가기 버튼).
- "판"은 가로 5칸 × 세로 6칸 = 30칸이다. 판 전체 비율은 가로 25 : 세로 27, 칸 하나는 가로 200 : 세로 180.
  · 맨 위 두 줄: 적이 서 있는 곳
  · 가운데 두 줄: 빈 땅. 여기에 "별빛 칸"이 1~2개 있다(그 위에 서면 공격이 1.5배)
  · 맨 아래 두 줄: 내 동료를 놓는 곳
- 영입·배치 화면에서는 판을 "바로 위에서" 본다. 전투 화면에서는 코드가 같은 판을 뒤로 15도 기울인다.
  그래서 판 바닥 그림은 반드시 "바로 위에서 수직으로 내려다본 그림"이어야 한다.
- 칸 위에 서는 동료·몬스터 그림은 게임에 이미 있다(dist/client/assets/actor-poses/). 새로 그리지 않는다.
- 동료 발밑의 원(내 편 파랑, 적 빨강), 머리 위 이름표와 체력 막대, 피해 숫자는 코드가 그린다.
- 지금은 그림이 없어서 색만 칠한 판과 둥근 빛 덩어리가 보인다.

■ 공통 화풍 (12장 모두 똑같이 지킨다)
- 무대: "별빛 연무장" — 밤하늘 아래의 돌바닥 훈련장.
- 반실사 판타지 채색(붓으로 칠한 느낌). 광원은 왼쪽 위의 달빛.
- 쓰지 않는 것: 두꺼운 검은 외곽선, 만화풍, 픽셀아트, 사진, 3D 렌더 느낌, 글자, 숫자, 사람, 동료, 몬스터, 모루,
  다른 게임의 캐릭터·화면·UI.
- 색 (이 값에서 벗어나지 않는다)
    밤하늘 남보라      #17132c , #231b45
    돌바닥 회보라      #3d3550 , #2a2238
    금 장식           #f1c986 (밝은 곳) , #a8823a (어두운 곳)
    내 편 = 파랑       #4f8fff
    적 = 빨강          #e0503f
    갈 수 있는 칸 = 하늘색 #6fdcff
    별빛 칸 = 금색      #ffd98a
    회복 = 초록         #7fd08a
- 먼저 열어 보고 채도·붓 느낌을 맞출 기준 파일
    dist/client/assets/region-hd/void.webp               (어두운 배경의 채도와 붓 느낌)
    dist/client/assets/ui-regalia/stat-attack.webp       (금 장식의 색과 광택)
    dist/client/assets/actor-poses/companion-6.webp      (판 위에 서는 동료)
    dist/client/assets/actor-poses/creature_2_0.webp     (판 위에 서는 몬스터)
- 저장 위치: 12장 모두 dist/client/assets/minigames/ (하위 폴더를 만들지 않는다)
- 형식: 12장 모두 webp

■ 만들 파일 12장

───────────────────────────────────────────────────────────────
[1] frame-board.webp          720×1280   불투명   320KB 이하
───────────────────────────────────────────────────────────────
어디에 보이나: 전체 화면의 맨 뒤 바탕. 그 위에 제목, 판, 카드, 버튼이 모두 놓인다.
무엇을 그리나: 세로로 긴 "밤의 연무장" 풍경.
  - 위쪽 4분의 1 (세로 0~320픽셀): 별이 뜬 남보라 밤하늘. 왼쪽 위에 초승달 하나.
    양옆 가장자리에 돌기둥이 하나씩 있고, 기둥마다 깃발이 걸려 있다(왼쪽 깃발 파랑, 오른쪽 깃발 빨강).
    가운데(가로 110~610)는 하늘만 있고 아무것도 그리지 않는다(그 자리에 제목이 놓인다).
  - 아래쪽 4분의 3 (세로 320~1280픽셀): 어두운 돌벽이 아래로 갈수록 더 어두워진다.
    무늬가 거의 없고 고르게 어둡다. 가장 밝은 곳도 #2a2238보다 밝지 않다.
그리지 않는 것: 사람, 동물, 글자, 판, 횃불처럼 밝은 광원, 가운데의 물건.
스스로 확인: 세로 320 아래 부분을 흑백으로 바꿔 봤을 때 거의 한 가지 어두운 색으로 보여야 한다.
영문 문장:
  "A tall vertical night scene of a stone training courtyard for a full-screen mobile game backdrop.
   Top quarter: a deep indigo starry sky with a small crescent moon at the upper left, one stone pillar at each
   side edge, a blue banner hanging on the left pillar and a red banner on the right pillar, the middle of the
   sky left empty. Lower three quarters: a plain dark grey-violet stone wall that gets darker toward the bottom,
   almost no detail, low contrast. Semi-realistic painterly style, indigo and aubergine tones, no characters,
   no text, no bright light sources."

───────────────────────────────────────────────────────────────
[2] title-board.webp          1024×360   배경 투명   110KB 이하
───────────────────────────────────────────────────────────────
어디에 보이나: 제목 글자 "동료 배치전" 바로 뒤. 화면에서는 가로 약 310픽셀로 줄어든다.
무엇을 그리나: 가로로 긴 어두운 석판 명패. 금색 테두리. 양 끝에 작은 삼각 깃발 장식 하나씩.
            위쪽 가운데에 "방패 뒤로 검 두 자루가 X자로 교차한" 작은 문장 하나.
꼭 지킬 것: 그림 한가운데의 가로 560 × 세로 130 픽셀 영역(왼쪽 232~오른쪽 792, 위 115~아래 245)은
          무늬 없이 고르게 어두운 색(#231b45 근처)으로 비워 둔다. 그 위에 코드가 제목 글자를 쓴다.
그리지 않는 것: 글자, 숫자.
영문 문장:
  "A wide ornate fantasy title plaque on a fully transparent background: a dark indigo stone slab with a
   polished gold rim, a small pennant ornament at each end, and a small crest of a shield with two crossed swords
   at the top center. The middle of the slab is plain, dark and empty for a title. Semi-realistic painted UI
   ornament, no text, no letters."

───────────────────────────────────────────────────────────────
[3] board-bg.webp             1000×1080  불투명   300KB 이하
───────────────────────────────────────────────────────────────
어디에 보이나: 판 전체의 바닥. 이 위에 가로 5칸 × 세로 6칸의 칸 경계선(코드가 얇게 그림)과 동료·몬스터가 놓인다.
무엇을 그리나: 연무장의 돌바닥을 "바로 위에서 수직으로" 내려다본 모습.
  - 크고 넓적한 돌판이 깔려 있다. 돌판 사이의 틈은 아주 옅게.
  - 위쪽 3분의 1 (세로 0~360): 붉은 기운이 아주 옅게 깔린다(적의 자리).
  - 가운데 3분의 1 (세로 360~720): 붉지도 푸르지도 않은 회보라.
  - 아래쪽 3분의 1 (세로 720~1080): 푸른 기운이 아주 옅게 깔린다(내 자리).
  - 네 가장자리에서 20픽셀 안쪽에만 얇은 금색 테두리 장식을 두른다.
꼭 지킬 것:
  - 비스듬한 시점 금지. 위가 좁아지는 원근 금지. (기울이는 것은 코드가 한다)
  - 격자선·칸 테두리를 그리지 않는다. (칸 경계선은 코드가 그린다)
  - 전체가 고르게 어둡고 대비가 낮다. 가장 밝은 곳도 #4a4260보다 밝지 않다.
그리지 않는 것: 횃불, 깃발, 상자, 무기, 발자국, 사람, 동물, 글자.
영문 문장:
  "A night-time stone training ground floor seen from directly above, strict top-down orthographic view, large
   worn flagstones with very faint seams, no grid lines, a very subtle red tint on the top third, neutral
   grey-violet in the middle third, a very subtle blue tint on the bottom third, evenly dark and low contrast so
   game pieces can stand on it, a thin gold trim along the outer edge only, no objects, no characters, no text."

───────────────────────────────────────────────────────────────
[4]~[7] 칸 표시 4장           각 200×180  배경 투명  각 30KB 이하
───────────────────────────────────────────────────────────────
어디에 보이나: 판의 칸 하나 위에 겹쳐진다. 그 위에 동료가 선다.
네 장 공통: "바로 위에서 본" 납작한 빛 표시. 그림 가장자리에서 6픽셀 안쪽에 테두리를 그리고,
          가운데는 거의 비워 둔다. 네 장을 나란히 놓으면 색만으로 구별되어야 한다.
  [4] tile-ally.webp   내 동료를 놓을 수 있는 칸.
                       파란색(#4f8fff) 얇은 점선 테두리. 안쪽은 파란색을 20% 정도로 아주 옅게.
  [5] tile-move.webp   갈 수 있는 칸.
                       하늘색(#6fdcff)으로 밝게 빛나는 굵은 실선 테두리. 안쪽은 하늘색을 30% 정도로 옅게.
  [6] tile-aim.webp    공격할 수 있는 적이 선 칸.
                       빨간색(#ff6a5a)으로 빛나는 굵은 실선 테두리. 네 모서리에 ㄱ자 조준 꺾쇠. 안쪽은 빨강 30%.
  [7] tile-star.webp   별빛 칸.
                       테두리 없음. 한가운데에 금색(#ffd98a) 네 갈래 별 문양이 바닥에 새겨져 은은히 빛난다.
                       별 문양의 크기는 세로 90픽셀 정도(칸 세로의 절반).
영문 문장(괄호 안만 바꿔 네 번 만든다):
  "A flat glowing floor marker for one rectangular board tile seen from directly above, on a fully transparent
   background, ( a thin dashed blue outline with a very faint blue fill / a bright thick sky-blue outline with a
   faint sky-blue fill / a bright thick red outline with small corner brackets and a faint red fill / no outline,
   a softly glowing gold four-pointed star engraved in the center ), the center mostly empty. Painted game UI
   overlay, no text."

───────────────────────────────────────────────────────────────
[8] fx-hit.webp   [9] fx-heal.webp     각 256×256  배경 투명  각 40KB 이하
───────────────────────────────────────────────────────────────
어디에 보이나: 맞거나 회복받은 칸 위에서 0.4초만 번쩍이고 사라진다.
  [8] fx-hit.webp   타격. 가운데에서 바깥으로 터지는 날카로운 빛살(가운데 흰색, 가장자리 주황)과 비스듬한 베기 자국 한 줄.
  [9] fx-heal.webp  회복. 가운데의 부드러운 초록 빛과, 아래에서 위로 떠오르는 연두색 빛 알갱이 여섯~여덟 개.
꼭 지킬 것: 한눈에 "맞았다(흰색+주황)"와 "회복됐다(초록)"가 구별된다. 가장자리는 투명으로 부드럽게 사라진다.
영문 문장(괄호 안만 바꿔 두 번 만든다):
  "( A sharp impact burst with one diagonal slash streak, white core and orange rays / A soft green healing glow
   with small light-green motes rising upward ) on a fully transparent background, centered, feathered edges.
   Painted game VFX sprite, no text."

───────────────────────────────────────────────────────────────
[10] banner-win.webp   [11] banner-lose.webp    각 768×256  배경 투명  각 90KB 이하
───────────────────────────────────────────────────────────────
어디에 보이나: 전투가 끝나면 판 한가운데에 뜬다. 그 위에 코드가 "승리" 또는 "패배" 글자를 쓴다.
  [10] banner-win.webp   가로로 긴 리본. 금색 테두리, 양 끝이 제비꼬리처럼 갈라진다. 위쪽 가운데에 작은 금색 별 하나.
                         가운데 넓은 면은 무늬 없는 어두운 보라색.
  [11] banner-lose.webp  같은 모양. 금색 대신 빛바랜 회청색 테두리, 별 대신 금이 간 작은 방패. 가운데 면은 어두운 회색.
꼭 지킬 것: 그림 한가운데 가로 360 × 세로 110 픽셀은 글자 자리다. 무늬를 넣지 않는다. 글자를 그리지 않는다.
영문 문장(괄호 안만 바꿔 두 번 만든다):
  "A wide horizontal fantasy ribbon banner with swallow-tail ends on a fully transparent background, ( polished
   gold trim with a small gold star ornament on top, plain dark violet center / faded grey-blue trim with a small
   cracked shield ornament on top, plain dark grey center ). The center is left empty for a label. Semi-realistic
   painted UI ornament, no text, no letters."

───────────────────────────────────────────────────────────────
[12] hub-board.webp           256×256    배경 투명   45KB 이하
───────────────────────────────────────────────────────────────
어디에 보이나: 던전 → 미니게임 목록의 "동료 배치전" 줄 왼쪽에 64×64 크기로 작게 보인다.
무엇을 그리나: 칸이 나뉜 석조 작전판을 비스듬히 내려다본 모습. 판 위에 작은 금색 말 세 개와 빨간 말 두 개가 마주 서 있다.
꼭 지킬 것: 64×64로 줄여도 "판 위에 말이 놓였다"는 것이 보일 만큼 단순하게.
영문 문장:
  "A small stone tactics board with a tile grid seen at an angle, three small gold pawn pieces facing two small
   red pawn pieces on it, on a fully transparent background, simple and readable at icon size. Semi-realistic
   painted fantasy game icon, no text."

■ 만든 뒤 스스로 확인 (하나라도 아니면 그 그림을 다시 만든다)
1. 12개 파일의 이름과 가로×세로가 위에 적은 것과 글자 하나, 픽셀 하나 다르지 않다.
2. frame-board.webp 와 board-bg.webp 두 장만 불투명이다. 나머지 10장은 배경이 투명하다.
3. 투명한 그림을 #221c30 색 바탕 위에 올렸을 때 가장자리에 흰 띠나 회색 얼룩이 없다.
4. board-bg.webp 는 수직으로 내려다본 그림이다(위가 좁아지면 다시 만든다). 격자선이 없다.
5. board-bg.webp 위에 칸 표시를 올려 본다. 칸 하나가 200×180이므로
     tile-ally 를 (0, 720) 에,  tile-move 를 (400, 540) 에,  tile-aim 을 (200, 180) 에,  tile-star 를 (600, 360) 에 올린다.
   네 표시가 바닥에 묻히지 않고 한눈에 구별된다.
6. 그 위 (405, 545) 근처에 dist/client/assets/actor-poses/companion-6.webp 를 가로 190으로 줄여 올렸을 때
   동료가 바닥과 표시에 묻히지 않는다.
7. title-board.webp 의 가운데 560×130 영역, banner 두 장의 가운데 360×110 영역에 무늬가 없다.
8. 어느 그림에도 글자·숫자·사람·동물·모루가 없다.
9. 용량이 각각 한도 이하다.

■ 고칠 파일: web/game/minigames.js (이 파일 하나만, 한 곳만)
   찾기:  BOARD_ART=false;
   바꾸기: BOARD_ART=true;
이 한 곳 외에는 이 파일의 글자를 하나도 바꾸지 않는다. CSS는 이미 있다. CSS 파일을 고치지 않는다.

■ 완료 확인
- 공통 규칙 [6]의 명령 4개 통과, node tests/minigames.cjs 통과
- 던전 → 미니게임: "동료 배치전" 줄 왼쪽에 작은 그림이 보인다
- "입장"을 눌렀을 때
  · 화면 전체에 밤의 연무장 바탕이 깔리고, 제목 글자 뒤에 석판 명패가 보이며, 제목이 명패 한가운데에 놓인다
  · 판에 돌바닥이 보이고, 아래 두 줄에 파란 배치 표시가, 가운데 줄에 금색 별 표시가 보인다
  · 맨 아래의 가이드·나가기 버튼과 상점 카드의 글자가 바탕에 묻히지 않는다
- 상점 카드를 3장 눌러 영입한 뒤 "전투 시작"을 눌렀을 때
  · 판이 뒤로 기울어 보이고 동료와 몬스터가 그 위에 서 있다
  · 내 동료를 누르면 하늘색 이동 표시와 빨간 공격 표시가 보인다
  · 공격하면 맞은 칸에 타격 그림이 번쩍인다
  · 이기면 금색 리본과 "승리", 지면 회청색 리본과 "패배"가 보인다
- 폭 360px 화면에서도 판이 화면 밖으로 나가지 않는다

■ 보고에 꼭 넣을 것
- 12개 파일 각각의 가로×세로와 용량
- 화면 전체 캡처 4장: (1) 영입·배치 화면 (2) 전투 중 동료를 눌러 하늘색·빨간색 표시가 보이는 장면
  (3) 타격 그림이 보이는 장면 (4) 승리 리본이 뜬 장면
```

### 카드 A11 — 동료 배치전: 카드·아이콘·배지 그림 15장

```
[작업 카드 A11] 동료 배치전 — 카드·아이콘·배지 그림 15장

■ 먼저 확인 (하나라도 아니면 아무것도 하지 말고 그 사실만 보고한다)
- web/game/minigames.js 안에 FURNACE_SOUND 라는 이름이 있다 (fix12가 적용된 프로젝트다).
- 같은 파일 안에 "const BOARD_UI_ART=false;" 라는 줄이 정확히 한 번 나온다.
- dist/client/assets/minigames/ 폴더가 없으면 새로 만든다.

■ 이 카드가 하는 일 (한 줄 요약)
그림 15장을 만들어 dist/client/assets/minigames/ 에 넣고, 스위치 한 곳(BOARD_UI_ART)을 켠다. 그 외에는 아무것도 바꾸지 않는다.

■ 이미 만들어져 있는 것 (읽기만 한다. 글자·배치·크기는 고치지 않는다)
- 영입·배치 화면의 판 아래에 차례로 놓인 것:
  (가) 코인 표시: 둥근 알약 모양 안에 "코인 4" 같은 글자.
  (나) 상점 카드 4장: 가로로 나란히. 카드 한 장은 화면에서 가로 약 86 × 세로 약 100 픽셀이고, 휴대폰 폭에 따라 가로가 달라진다.
       카드 안에는 위에서부터 동료 그림(42픽셀), 역할 이름, 동료 이름, 값(코인 2)이 들어간다. 모두 코드가 넣는다.
       같은 동료를 이미 갖고 있으면 그 카드 오른쪽 위에 "합체" 딱지가 붙는다. 이미 산 자리는 "영입함"이라고 쓰인 빈 카드가 된다.
  (다) 내 동료: 작은 카드가 가로로 나란히(가로 약 50 × 세로 약 58 픽셀). 동료 그림과 역할 이름이 들어간다.
- 전투 화면의 맨 위에 "내 차례" 또는 "적 차례"라고 쓰인 배지가 있다(가로 108 × 세로 32 픽셀). 글자는 코드가 쓴다.
- 합체한 동료(2성, 3성)는 이름 앞에 작은 별이 2개 또는 3개 붙는다(별 하나 13픽셀).
- 역할 이름 앞에 작은 역할 아이콘이 붙는다(18픽셀. 판 위의 이름표에서는 13픽셀).
- 지금은 그림이 없어서 색만 칠한 네모와 글자 "★", "코인"이 보인다.

■ 아주 중요: "늘어나는 틀" 4장 (card-frame, card-frame-twin, card-sold, unit-frame)
카드는 휴대폰 폭에 따라 크기가 달라진다. 그래서 코드는 그림을 이렇게 쓴다.
  - 네 모서리(각 24×24 픽셀)는 모양 그대로 둔다.
  - 네 변(모서리 사이의 띠, 두께 24픽셀)은 길이 방향으로 늘린다.
  - 가운데(가장자리에서 24픽셀 안쪽 전부)는 가로세로로 늘린다.
그러므로 이 4장은 반드시 아래처럼 그린다.
  1. 모서리 장식은 각 모서리의 24×24 픽셀 안에만 넣는다. 그 밖으로 삐져나오지 않는다.
  2. 네 변의 테두리 띠는 길이 방향으로 무늬가 없다(점, 매듭, 보석을 띠 중간에 넣지 않는다). 처음부터 끝까지 똑같은 띠다.
  3. 가운데는 무늬 없이 고른 색이다. 그라데이션을 넣는다면 위에서 아래로 아주 약하게만 넣는다.
     문양, 얼룩, 빛줄기, 질감 무늬를 가운데에 넣지 않는다(늘어나면 뭉개진다).
  4. 테두리의 두께는 바깥에서 14픽셀을 넘지 않는다.

■ 공통 화풍 (15장 모두 똑같이 지킨다)
- "금테 석판" — 어두운 보라색 석판에 얇은 금 테두리. 반실사 판타지 채색. 광원 왼쪽 위.
- 쓰지 않는 것: 두꺼운 검은 외곽선, 만화풍, 픽셀아트, 사진, 글자, 숫자, 사람, 동료, 몬스터, 모루,
  다른 게임의 캐릭터·화면·UI.
- 색 (이 값에서 벗어나지 않는다)
    석판 보라         #34285a (위) → #1d1733 (아래)
    금 장식           #f1c986 (밝은 곳) , #a8823a (어두운 곳)
    합체·코인·별 = 밝은 금색 #ffd24a
    내 편 = 파랑       #2d5fc4
    적 = 빨강          #b5301f
- 먼저 열어 보고 금 장식의 색과 광택을 맞출 기준 파일
    dist/client/assets/ui-regalia/stat-attack.webp
    dist/client/assets/ui-regalia/stat-hp.webp
- 저장 위치: 15장 모두 dist/client/assets/minigames/ (하위 폴더를 만들지 않는다)
- 형식: 15장 모두 webp, 배경 투명

■ 만들 파일 15장

───────────────────────────────────────────────────────────────
[1]~[6] 역할 아이콘 6장        각 96×96   배경 투명   각 12KB 이하
───────────────────────────────────────────────────────────────
어디에 보이나: 역할 이름 앞. 화면에서는 18×18(판 위에서는 13×13)로 아주 작게 줄어든다.
  [1] role-guard.webp    방패  → 금테를 두른 둥근 방패 하나
  [2] role-striker.webp  돌격  → 오른쪽 위로 찌르는 검 한 자루와 그 뒤의 속도선 두 줄
  [3] role-piercer.webp  관통  → 고리 세 개를 꿰뚫고 지나가는 화살 하나
  [4] role-blast.webp    폭발  → 세 갈래로 터지는 불꽃
  [5] role-sniper.webp   저격  → 동그란 조준 원 안의 십자선
  [6] role-healer.webp   치유  → 잎사귀 두 장이 감싼 물방울 하나
꼭 지킬 것:
  - 선이 굵고 형태가 단순하다. 색은 밝은 금색 한 가지에 어두운 금색 그림자만.
  - 대상이 캔버스의 85%를 채운다.
  - 6장을 13×13으로 줄여 나란히 놓았을 때 여섯 개가 서로 구별되어야 한다. 구별되지 않으면 더 단순하게 다시 그린다.
영문 문장(괄호 안만 바꿔 여섯 번 만든다):
  "A bold simple gold emblem icon of ( a round shield / a thrusting sword with two speed lines / an arrow
   piercing through three rings / a three-way burst of flame / a crosshair inside a targeting circle / a water
   drop wrapped by two leaves ) on a fully transparent background, centered, thick shapes readable at 13 pixels,
   polished gold with a dark-gold shadow. Fantasy RPG UI icon, no text."

───────────────────────────────────────────────────────────────
[7] card-frame.webp           192×240    배경 투명   30KB 이하   ← 늘어나는 틀
───────────────────────────────────────────────────────────────
어디에 보이나: 상점 카드 한 장의 바탕.
무엇을 그리나: 모서리가 둥근 세로 카드. 가운데는 보라 석판(#34285a에서 #1d1733으로 위→아래 아주 약한 그라데이션),
            가장자리에 얇은 금 테두리(#f1c986), 네 모서리에 작은 금색 모서리 장식.
꼭 지킬 것: 위의 "늘어나는 틀" 규칙 4가지.

[8] card-frame-twin.webp      192×240    배경 투명   30KB 이하   ← 늘어나는 틀
어디에 보이나: 합체할 수 있는 카드의 바탕.
무엇을 그리나: [7]과 같은 모양. 테두리가 더 밝은 금색(#ffd24a)이고 테두리 안쪽으로 금빛이 은은히 번진다.
            가운데 석판은 따뜻한 어두운 금갈색(#4a3a1e)이다.
꼭 지킬 것: [7]과 나란히 놓았을 때 "이 카드가 특별하다"가 색만으로 보인다. "늘어나는 틀" 규칙 4가지.

[9] card-sold.webp            192×240    배경 투명   20KB 이하   ← 늘어나는 틀
어디에 보이나: 이미 영입해서 비어 있는 카드 자리.
무엇을 그리나: [7]과 같은 모양이지만 꺼진 상태. 테두리는 금색 대신 어두운 회보라(#5a506e)의 가는 실선,
            모서리 장식 없음, 가운데는 거의 검은 보라(#14121e)를 80% 정도의 불투명도로.
꼭 지킬 것: "늘어나는 틀" 규칙 4가지. 테두리를 점선으로 그리지 않는다(늘어나면 점의 길이가 달라진다).

영문 문장([7][8][9] 괄호 안만 바꿔 세 번 만든다):
  "A blank portrait game card frame with rounded corners on a fully transparent background, ( a dark violet stone
   panel with a thin polished gold border and tiny gold corner ornaments / a warm dark gold-brown panel with a
   bright glowing gold border and tiny gold corner ornaments / a nearly black translucent panel with a dim
   thin grey-violet solid border and no corner ornaments, switched-off look ). The panel center is completely plain and flat with no pattern,
   the border bands are uniform along their length, ornaments only inside the four corners. Semi-realistic painted
   UI frame, no text, no icons."

───────────────────────────────────────────────────────────────
[10] unit-frame.webp          192×192    배경 투명   25KB 이하   ← 늘어나는 틀
───────────────────────────────────────────────────────────────
어디에 보이나: "내 동료" 줄의 작은 카드, 전투 화면 아래쪽 동료 카드의 바탕.
무엇을 그리나: 모서리가 둥근 정사각 판. 가운데는 어두운 보라(#231b3a), 얇은 연보라 금속 테두리(#8f7fb8), 네 모서리에 작은 징.
꼭 지킬 것: "늘어나는 틀" 규칙 4가지. [7] 카드보다 수수해야 한다(상점 카드가 더 눈에 띄어야 한다).
영문 문장:
  "A blank square game slot frame with rounded corners on a fully transparent background, a dark violet panel with
   a thin muted lavender metal border and a tiny rivet in each corner. The center is completely plain and flat, the
   border bands are uniform along their length. Semi-realistic painted UI frame, no text, no icons."

───────────────────────────────────────────────────────────────
[11] coin.webp                96×96      배경 투명   12KB 이하
───────────────────────────────────────────────────────────────
어디에 보이나: 코인 표시의 숫자 앞, 카드 값의 숫자 앞. 화면에서는 18×18로 줄어든다.
무엇을 그리나: 정면에서 본 금색 주화 하나. 가운데에 네 갈래 별이 새겨져 있다. 테두리에 얇은 홈.
꼭 지킬 것: 이 게임의 골드(dist/client/assets/ui-regalia 의 금화 그림)와 헷갈리지 않게, 주화 바깥에 얇은 남보라색 고리를 두른다.
          18×18로 줄였을 때 "별이 새겨진 동전"으로 보인다.
영문 문장:
  "A single gold coin seen from the front with a four-pointed star engraved in the center and a thin indigo outer
   ring, on a fully transparent background, bold and simple, readable at 18 pixels. Semi-realistic painted fantasy
   game icon, no text, no numbers."

───────────────────────────────────────────────────────────────
[12] rank-star.webp           64×64      배경 투명   6KB 이하
───────────────────────────────────────────────────────────────
어디에 보이나: 합체한 동료의 이름 앞에 2개 또는 3개가 나란히. 화면에서는 13×13으로 줄어든다.
무엇을 그리나: 다섯 갈래 별 하나. 밝은 금색(#ffd24a), 얇은 어두운 금색 테두리. 캔버스의 90%를 채운다.
영문 문장:
  "A single bold five-pointed star, bright gold with a thin dark-gold edge, on a fully transparent background,
   filling the canvas, flat and simple, readable at 13 pixels. Game UI icon, no text."

───────────────────────────────────────────────────────────────
[13] badge-twin.webp          160×64     배경 투명   12KB 이하
───────────────────────────────────────────────────────────────
어디에 보이나: 합체할 수 있는 카드의 오른쪽 위. 그 위에 코드가 "합체"라는 글자(어두운 갈색)를 쓴다. 화면에서는 가로 약 46 × 세로 약 20.
무엇을 그리나: 가로로 긴 작은 딱지. 밝은 금색(#ffd24a) 면, 양 끝이 살짝 뾰족한 리본 모양, 얇은 어두운 금색 테두리.
꼭 지킬 것: 가운데 가로 110 × 세로 40 픽셀은 무늬 없는 밝은 금색 면이다(글자 자리). 글자를 그리지 않는다.
영문 문장:
  "A small wide bright-gold ribbon tag with slightly pointed ends and a thin dark-gold edge on a fully transparent
   background, the center plain and empty for a label. Painted game UI badge, no text, no letters."

───────────────────────────────────────────────────────────────
[14] turn-ally.webp   [15] turn-foe.webp     각 324×96   배경 투명   각 20KB 이하
───────────────────────────────────────────────────────────────
어디에 보이나: 전투 화면 맨 위 가운데. 그 위에 코드가 흰 글자로 "내 차례" 또는 "적 차례"를 쓴다. 화면에서는 108×32.
  [14] turn-ally.webp  가로로 긴 알약 모양 배지. 파란색(#2d5fc4) 면, 얇은 금 테두리, 왼쪽 끝에 작은 방패 무늬.
  [15] turn-foe.webp   같은 모양. 빨간색(#b5301f) 면, 얇은 금 테두리, 왼쪽 끝에 작은 발톱 자국 무늬.
꼭 지킬 것: 가운데 가로 200 × 세로 60 픽셀은 무늬 없는 한 가지 색 면이다(글자 자리). 글자를 그리지 않는다.
          두 장은 색만 보고도 구별된다.
영문 문장(괄호 안만 바꿔 두 번 만든다):
  "A wide pill-shaped game UI badge on a fully transparent background, ( a deep blue face with a thin gold rim and
   a tiny shield mark at the left end / a deep red face with a thin gold rim and a tiny claw-mark at the left end ),
   the middle plain and empty for a label. Semi-realistic painted UI ornament, no text, no letters."

■ 만든 뒤 스스로 확인 (하나라도 아니면 그 그림을 다시 만든다)
1. 15개 파일의 이름과 가로×세로가 위에 적은 것과 글자 하나, 픽셀 하나 다르지 않다.
2. 15장 모두 배경이 투명하다.
3. #221c30 색 바탕 위에 올렸을 때 가장자리에 흰 띠나 회색 얼룩이 없다.
4. 역할 아이콘 6장을 13×13으로 줄여 나란히 놓았을 때 서로 구별된다.
5. "늘어나는 틀" 4장 시험: card-frame.webp 를 가로 172 × 세로 200 으로, 다시 가로 120 × 세로 200 으로
   "9조각 방식(모서리 24픽셀 고정)"으로 늘려 본다. 두 경우 모두 모서리 장식이 찌그러지지 않고,
   변의 띠와 가운데가 뭉개지거나 줄무늬가 생기지 않는다. 나머지 3장도 같은 시험을 한다.
6. coin.webp 를 18×18, rank-star.webp 를 13×13으로 줄여도 무엇인지 알아볼 수 있다.
7. badge-twin, turn-ally, turn-foe 의 글자 자리에 무늬가 없다. 어느 그림에도 글자·숫자가 없다.
8. 용량이 각각 한도 이하다.

■ 고칠 파일: web/game/minigames.js (이 파일 하나만, 한 곳만)
   찾기:  const BOARD_UI_ART=false;
   바꾸기: const BOARD_UI_ART=true;
이 한 곳 외에는 이 파일의 글자를 하나도 바꾸지 않는다. CSS는 이미 있다. CSS 파일을 고치지 않는다.

■ 완료 확인
- 공통 규칙 [6]의 명령 4개 통과, node tests/minigames.cjs 통과
- 던전 → 미니게임 → 동료 배치전 "입장"
  · 상점 카드 4장이 금테 석판 그림으로 보이고, 카드 안의 동료 그림·역할 이름·동료 이름·값이 또렷이 읽힌다
  · 코인 표시와 카드 값의 숫자 앞에 동전 그림이 보인다
  · 역할 이름 앞에 역할 아이콘이 보인다
- 카드를 한 장 영입한 뒤 "새 카드"를 눌러 같은 동료가 나오면
  · 그 카드가 금빛 카드로 보이고 오른쪽 위에 금색 딱지와 "합체" 글자가 보인다
  · 그 카드를 영입하면 판 위 동료의 이름표와 "내 동료" 카드에 금색 별 두 개가 보인다
- 이미 영입한 자리는 꺼진 카드와 "영입함" 글자로 보인다
- "전투 시작"을 누르면 맨 위에 파란 배지와 "내 차례"가, 적이 움직일 때는 빨간 배지와 "적 차례"가 보인다
- 폭 360px 화면에서도 카드 4장이 화면 밖으로 나가지 않고, 카드 안의 글자가 테두리에 겹치지 않는다

■ 보고에 꼭 넣을 것
- 15개 파일 각각의 가로×세로와 용량
- 역할 아이콘 6장을 13×13으로 줄여 나란히 놓은 그림 한 장
- 화면 전체 캡처 3장: (1) 상점 카드 4장이 보이는 장면 (2) "합체" 딱지가 붙은 금빛 카드가 보이는 장면
  (3) 전투 화면에서 "내 차례" 배지가 보이는 장면
```

### 카드 S5 — 동료 배치전: 효과음 15개와 배경 음악 1곡

```
[작업 카드 S5] 동료 배치전 — 효과음 15개와 배경 음악 1곡

■ 먼저 확인 (하나라도 아니면 아무것도 하지 말고 그 사실만 보고한다)
- web/game/minigames.js 안에 FURNACE_SOUND 라는 이름이 있다 (fix12가 적용된 프로젝트다).
- 같은 파일 안에 "const BOARD_SOUND=false;" 라는 줄이 정확히 한 번 나온다.
- dist/client/assets/minigames/sfx/ 폴더가 없으면 새로 만든다.

■ 이 카드가 하는 일 (한 줄 요약)
소리 파일 16개를 만들어 dist/client/assets/minigames/sfx/ 에 넣고, 출처를 적고, 스위치 한 곳(BOARD_SOUND)을 켠다.
그 외에는 아무것도 바꾸지 않는다.

■ 이미 만들어져 있는 것 (읽기만 한다)
- 아래 16개 파일 이름은 코드에 이미 적혀 있다. 이름이 한 글자라도 다르면 소리가 나지 않는다.
- 언제 어떤 소리를 낼지도 코드에 이미 연결되어 있다. 재생 코드를 새로 쓰지 않는다.
- 스위치를 켜기 전에는 게임의 기존 소리(타격·보상 소리)가 대신 난다.
- 스위치를 켜면 동료 배치전 화면이 열려 있는 동안 배경 음악이 board-bgm.mp3 로 바뀌고, 나가면 원래 음악으로 돌아온다.
- 설정에서 효과음·배경음을 끄면 이 소리들도 나지 않는다.

■ 소리의 성격 (16개 모두 똑같이 지킨다)
- 실제로 녹음된 소리만 쓴다(나무, 돌, 쇠, 종, 북, 카드, 동전). 라이선스는 CC0 또는 CC BY.
- 신시사이저의 삐 소리, 8비트 게임 소리, 사람 목소리, 무음 파일, 한 소리를 이름만 바꿔 여러 번 쓰는 것은 안 된다.
- 분위기: 밤의 돌바닥 훈련장에서 나무 말과 카드로 하는 놀이. 따뜻하고 또렷하며, 시끄럽거나 무섭지 않다.
- 형식: mp3, 32kHz, 스테레오, 192kbps (배경 음악만 128kbps).
- 각 소리의 앞 무음은 0.02초 이하. 끝은 뚝 끊기지 않게 자연스럽게 줄인다.
- 음량: 기존 효과음 묶음(dist/client/assets/048c959f1c5abcf00835.mp3)의 reward 구간과 번갈아 들어 비슷한 크기로 맞춘다.
  단, 아래 표에 "작게"라고 적힌 소리는 그보다 한 단계 작게.
- 자주 나는 소리(이동, 놓기, 타격)는 열 번 연달아 들어도 거슬리지 않아야 한다.

■ 만들 파일 16개 (모두 dist/client/assets/minigames/sfx/ 에 둔다)

번호  파일 이름              길이(초)     언제 나나                       어떤 소리
────────────────────────────────────────────────────────────────────────────────────────────
 1   board-buy.mp3         0.25~0.45   상점 카드를 눌러 영입할 때         두꺼운 카드 한 장을 탁 내려놓는 소리에 작은 동전 소리 한 번
 2   board-merge.mp3       0.8~1.2     같은 동료 두 장이 합체할 때        맑은 유리 종 두 음이 올라가며 반짝이는 소리(기분 좋은 보상 느낌)
 3   board-reroll.mp3      0.35~0.6    "새 카드"를 눌렀을 때             카드 여러 장을 촤르륵 넘기는 소리
 4   board-place.mp3       0.15~0.3    동료를 칸에 놓을 때 (작게)         나무 말을 돌판에 톡 내려놓는 소리
 5   board-start.mp3       0.8~1.2     "전투 시작"을 눌렀을 때            북 두 번과 짧은 뿔나팔 한 음
 6   board-move.mp3        0.15~0.3    동료나 적이 칸을 옮길 때 (작게)    돌바닥 위의 가벼운 발걸음 두 번
 7   board-melee.mp3       0.25~0.45   방패·돌격이 붙어서 때릴 때         둔탁한 타격에 쇠가 부딪히는 소리가 살짝 섞인 한 방
 8   board-ranged.mp3      0.25~0.45   저격·관통·치유가 멀리서 쏠 때      화살이 날아가 탁 박히는 소리
 9   board-blast.mp3       0.5~0.8     폭발이 공격할 때                  작고 짧은 폭발(불꽃이 퍽 터지는 소리. 크지 않게)
10   board-heal.mp3        0.6~0.9     치유가 회복시킬 때                부드러운 종과 반짝이는 물방울 소리
11   board-down.mp3        0.4~0.7     누군가 쓰러질 때 (작게)           나무 말이 돌판에 넘어져 구르는 소리
12   board-turn-ally.mp3   0.3~0.5     내 차례가 시작될 때 (작게)         밝은 작은 종 한 번
13   board-turn-foe.mp3    0.3~0.5     적 차례가 시작될 때 (작게)         낮은 북 한 번
14   board-win.mp3         1.8~2.6     이겼을 때                        짧고 밝은 승리 팡파르(금관 세 음과 종)
15   board-lose.mp3        1.5~2.2     졌을 때                          낮은 현악이 두 음 내려가는 소리(슬프지만 무겁지 않게)
16   board-bgm.mp3         60~90       동료 배치전 화면이 열려 있는 동안    아래 "배경 음악" 참고

■ 배경 음악 (board-bgm.mp3)
- 사용자가 음악 파일을 함께 주었다면 그 파일을 쓴다(이 경우 "실제 녹음만" 규칙의 예외다. 출처에 "사용자 제공"이라고 적는다).
  할 일은 세 가지뿐이다: 60~90초로 자르기, 끝과 처음이 끊김 없이 이어지게 다듬기, 음량 맞추기.
- 사용자가 주지 않았다면 CC0 또는 CC BY 곡을 고른다. 고르는 기준:
  · 느린 손북과 하프(또는 칼림바·류트)가 중심이고, 낮은 현악과 작은 종이 받친다
  · 빠르기는 분당 85~100박
  · "생각하는 놀이" 분위기. 웅장한 전투 음악, 슬픈 음악, 전자음악은 안 된다
  · 처음부터 끝까지 세기가 비슷하다(조용히 시작해 커지는 곡, 크게 끝나는 곡은 안 된다)
- 반복: 곡이 끝나고 처음으로 돌아갈 때 "뚝" 하는 소리나 박자가 어긋나는 느낌이 없어야 한다.
- 음량: 게임의 기존 곡(dist/client/assets/9331195598f14cc5d0cc.mp3)과 번갈아 틀어 비슷하게 맞춘다.
- 형식: mp3, 32kHz, 스테레오, 128kbps, 60~90초.

■ 만든 뒤 스스로 확인 (하나라도 아니면 그 소리를 다시 만든다)
1. 16개 파일의 이름이 위 표와 글자 하나 다르지 않다(모두 소문자, 가운데는 빼기표 "-").
2. 16개 파일이 모두 dist/client/assets/minigames/sfx/ 안에 있다.
3. 각 파일의 길이가 표의 범위 안이다.
4. 16개가 모두 서로 다른 소리다. 같은 녹음을 두 파일에 쓰지 않았다.
5. board-melee, board-ranged, board-blast, board-heal 네 개를 눈 감고 들어도 서로 구별된다.
6. board-move 와 board-place 를 각각 열 번 연달아 틀어도 거슬리지 않는다.
7. board-bgm 을 두 번 이어 붙여 들었을 때 이음매에서 끊기는 소리가 없다.
8. 모든 소리의 출처 주소와 라이선스를 적어 두었다.

■ 고칠 파일 (두 파일, 각각 한 곳)
1. web/game/minigames.js
   찾기:  const BOARD_SOUND=false;
   바꾸기: const BOARD_SOUND=true;
   이 한 곳 외에는 이 파일의 글자를 하나도 바꾸지 않는다(소리 이름, 음량 값, 재생 코드 모두 그대로).
2. web/game/soundtrack.js
   이 파일에 있는 기존 출처(크레딧) 문장과 같은 형식으로, 이번에 쓴 소리의 제작자와 라이선스를 그 문장 뒤에 덧붙인다.
   CC BY 소리는 제작자 이름을 반드시 적는다. 다른 것은 바꾸지 않는다.

■ 완료 확인
- 공통 규칙 [6]의 명령 4개 통과, node tests/minigames.cjs 통과, node tests/music-scope.cjs 통과
- 브라우저에서 설정의 효과음과 배경음을 켠 상태로 던전 → 미니게임 → 동료 배치전 "입장"
  · 들어가면 1~2초 안에 배경 음악이 board-bgm 으로 바뀐다
  · 카드를 영입할 때, "새 카드"를 누를 때, 동료를 다른 칸으로 옮길 때 각각 다른 소리가 난다
  · 같은 동료 두 장이 합체할 때 종소리가 난다
  · "전투 시작"을 누르면 북과 뿔나팔 소리가 난다
  · 전투에서 이동·근접 타격·원거리 타격·폭발·회복·쓰러짐 소리가 각각 다르게 난다
  · 내 차례와 적 차례가 바뀔 때 종과 북이 번갈아 난다
  · 이기면 팡파르, 지면 낮은 현악 소리가 난다
  · "자동"을 켜고 한 판을 끝까지 들었을 때 소리가 겹쳐 찢어지거나 시끄럽지 않다
  · 빨간 나가기 버튼으로 나오면 1~2초 안에 원래 배경 음악으로 돌아온다
- 설정에서 효과음을 끄면 위 효과음이 나지 않고, 배경음을 끄면 board-bgm 이 나지 않는다
- 듣지 못한 소리가 있으면 보고의 5번에 적는다

■ 보고에 꼭 넣을 것
- 16개 파일 각각의 길이(초)와 용량
- 16개 파일 각각의 출처 주소, 제작자, 라이선스
- 위 "완료 확인"의 소리 중 실제로 들은 것과 듣지 못한 것
```

디자인 방향, 화면 그림, 배경 음악을 직접 만들 때의 문장은 `GPT-미니게임-그림·UI·소리-상세.md`의 1번에 있습니다.

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
- 앱(안드로이드) 버전에 fix12 반영
