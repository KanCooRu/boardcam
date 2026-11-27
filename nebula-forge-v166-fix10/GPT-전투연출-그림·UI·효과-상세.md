# 성운의 모루 · 전투 연출·UI 검수 보고서와 GPT 작업 지시서 (v166-fix10)

이 문서는 두 부분입니다.

- **1부 · 검수 보고서**: Claude가 게임을 화면마다 직접 띄워 찾은 문제와, 코드로 이미 고친 것.
- **2부 · GPT 작업 카드 A13~A19**: GPT가 그릴 그림 목록. 그림만 정해진 자리에 넣고 스위치 한 줄만 바꾸면 게임에 바로 나오도록 코드가 미리 연결되어 있습니다.

> **GPT에게:** 2부만 따라 하면 됩니다. 2부에 적힌 파일 말고는 어떤 코드도 고치지 마세요. 끝나면 3부의 "넘길 때"대로 돌려주세요.

---

# 1부 · 검수 보고서

## 1. 스테이지 진행 경로(별이슬 초원 밑 노란 점과 보스 아이콘)

**찾은 문제**
- 보스 아이콘은 그림 파일이 아니었습니다. 10px짜리 선 그림을 14px 원 안에 넣었는데, 가운데 정렬이 없어서 왼쪽으로 1px, 아래로 0.5px 밀려 있었습니다. 그래서 삐뚤어 보였습니다.
- 경로 전체 너비가 145px이라 화면 중앙에 놓으면 0.5px 어긋났습니다. 점 사이 간격도 8.56px처럼 소수점이라 점마다 번짐이 달랐습니다.
- 크기 규칙이 세 군데에서 서로 덮어쓰고 있었습니다(13px, 8px, 6px).

**고친 것(코드)**
- 경로를 새로 그렸습니다. 너비 180px이고, 모든 위치를 정수 픽셀로 맞췄습니다.
  - 일반 점 9개(10px): 지난 단계는 금빛, 지금 단계는 은은하게 빛납니다.
  - 지나온 길만큼 금빛 선이 차오릅니다.
  - 끝의 보스 문장(26px 원): 뿔 달린 해골입니다. 좌우 대칭이고 가운데 정렬입니다. 보스 단계에서는 붉게 맥동합니다.
- GPT 그림(A13 `route-boss.webp`)이 들어오면 문장이 그 그림으로 바뀝니다.

## 2. 보스 체력 표시

**찾은 문제**
- **스테이지 보스**: 체력바는 보스 머리 위의 4px 줄이고, 글씨는 8~10px였습니다. 피해 숫자가 그 위를 덮었고, 30초 제한 시간은 따로 떨어진 막대였습니다.
- **던전·오늘의 탑**: 상단 가운데 4px 줄에 이름과 숫자만 있었습니다.
- **월드보스**: 10px 막대 하나뿐이었습니다.
- **일반 몬스터**: 머리 위 12px 상자 안에 9px 숫자가 들어가서 답답했습니다.

**고친 것(코드)** — 스테이지 보스·던전·오늘의 탑에 공통 **보스 체력 창**을 상단에 띄웁니다.
- 왼쪽 원형 메달: 보스 문장.
- 위쪽 줄: `지역 보스`/`던전 보스`/`N층` 꼬리표, 보스 이름, 단계.
- 체력바(14px)
  - 체력을 여러 줄로 나눕니다. 스테이지 보스는 5줄, 던전은 3줄이고 줄마다 색이 다릅니다. 오른쪽에 `×4`처럼 남은 줄 수를 표시합니다.
  - 맞으면 흰 잔상이 0.3초 뒤에 따라 줄어듭니다.
  - 맞을 때마다 바가 살짝 흔들립니다.
- 아래쪽 줄: 체력 숫자, `⏱ 28초` 제한 시간(10초 이하면 붉게 깜박임), 남은 %.
- 이 창이 뜨는 동안에는 예전의 머리 위 막대와 따로 있던 시간 막대를 숨깁니다.

**나머지**
- 일반 몬스터 머리 위 막대는 7px로 날렵하게 바꾸고, 숫자를 빼고, 이름에 그림자를 넣었습니다.
- 월드보스 막대는 14px로 키우고 같은 흰 잔상을 넣었습니다.
- GPT 그림(A13 `boss-frame.webp`, `boss-medal.webp`)이 들어오면 창 테두리와 메달이 그림으로 바뀝니다.

## 3. 타격감·연출

**찾은 문제**
- 내 공격이 맞을 때는 작은 빛 한 번만 나고, 불꽃·파편은 적이 나를 때만 나왔습니다.
- 적이 맞아도 하얗게 번쩍이지 않았고, 밀려나는 폭은 몸 크기의 2.6%뿐이었습니다.
- 화면 흔들림은 ±2px, 0.24초였습니다.
- 멈칫(히트스톱)은 치명타 0.06초, 보스 처치 0.12초였습니다.
- 데미지 숫자는 1px 외곽선만 있었습니다.
- 치명타용 그림(`critical-hit.webp`)이 있었는데 어디에도 쓰이지 않았습니다.
- 스킬과 기본 공격의 동작 길이가 같았고, 스킬 이름이 나오지 않았습니다.
- 보스가 등장해도 아무 연출이 없었습니다.
- 진동은 맞을 때 한 번도 울리지 않았습니다.

**고친 것(코드)**
- **맞는 쪽 번쩍임**: 맞은 몬스터가 0.1초 하얗게 번쩍입니다. 치명타·스킬은 더 강하게 번쩍입니다.
- **불꽃·파편**: 내 공격에도 불꽃·파편·먼지가 튑니다.
- **화면 흔들림**: ±5px, 0.3초이고 살짝 확대됩니다.
- **히트스톱**: 치명타·스킬 0.095초, 보스 처치 0.19초로 늘렸습니다. 월드보스도 같습니다.
- **데미지 숫자**: 굵은 흰 글씨에 진한 테두리를 넣었습니다. 치명타는 금빛에 붉은 후광이 나고, 치명타 폭발 그림이 함께 터집니다.
- **스킬 이름 띠**: 스킬을 쓰면 화면 가운데 위쪽에 스킬 이름이 원소 색으로 0.8초 뜨고, 화면 가장자리가 그 색으로 살짝 어두워집니다.
- **보스 등장**: 붉은 화면 테두리, 가로 띠의 `WARNING · 지역 보스 · 보스 이름`, 큰 화면 흔들림, 진동이 함께 나옵니다. 던전 보스도 같습니다.
- **진동**: 치명타와 보스 등장 때 짧게 울립니다. 효과 끄기나 절전 모드에서는 울리지 않습니다.
- GPT 그림(A14 `crit-burst.webp`, A16 `boss-warning.webp`)이 들어오면 그림으로 바뀝니다.

## 4. 보스와 캐릭터 비율

**찾은 문제(실측)**

| 장면 | 보스 키 ÷ 캐릭터 키 | 비고 |
|---|---|---|
| 스테이지 보스 | 약 1.0배 | 보스를 1.2배 키우는 규칙이 있었는데 다른 규칙에 덮여 한 번도 적용되지 않았습니다 |
| 던전 보스 | 약 1.07배 | |
| 월드보스 | 약 1.2배 | 가로로만 넓었습니다 |
| 레이드 | 1.7~2.0배 | 유일하게 보스다운 크기 |

- 스테이지 보스는 쓰러질 때 오히려 커지는 문제도 있었습니다. 살아 있을 때 47%, 쓰러진 모습은 62%였습니다.

**고친 것(코드)**

| 장면 | 바뀐 비율 |
|---|---|
| 스테이지 보스 | 약 1.5배 |
| 던전 보스 | 약 1.4배 |
| 월드보스 | 약 1.8배 |

- 쓰러지는 모습도 같은 크기로 맞췄습니다.
- 지금 그림 해상도(보스 480px, 월드보스 614px)로도 흐려지지 않는 범위입니다.

## 5. 별의 광산

**찾은 문제**
- 배경 그림 위에 곡괭이 하나만 떠서 흔들렸습니다.
- 캐릭터, 깨지는 광석, 얻는 숫자, 콤보, 시간 막대, 결과 화면이 하나도 없었습니다.
- 끝나면 알림 한 줄만 뜨고 별철 보상은 말해 주지도 않았습니다.

**고친 것(코드)**
- **광석 덩어리**: 곡괭이가 내려치는 자리에 보랏빛 광석 덩어리를 놓았습니다. 은은하게 빛나며 숨을 쉽니다.
- **금 가기와 부서짐**: 칠 때마다 광석이 움찔하고 금이 3단계로 번집니다. 12번 치면 `광맥 파괴!`와 함께 터지고, 보석이 튀어 오른 뒤 새 광석이 솟습니다.
- **떠오르는 숫자**: 칠 때마다 `+1`이 떠오릅니다.
- **콤보**: 빠르게 연타하면 `콤보 ×N`이 뜨고, 10콤보부터 금빛입니다.
- **화면**: 칠 때마다 화면이 살짝 흔들리고, 왼쪽 등불 빛이 일렁입니다.
- **시간 막대**: 상단에 60초 막대가 생겼고, 10초 이하면 붉어집니다.
- **결과 창**: 끝나면 `채굴 완료 · N회 타격`과 성운석·강화석·별철 세 칸이 뜹니다.
- GPT 그림(A15)이 들어오면 아래 세 가지가 바뀝니다.
  - 곡괭이 → 장갑 낀 손이 쥔 곡괭이
  - 광석 → 금 간 단계별 광석 그림
  - 튀는 보석 → 전용 보석

## 6. 데미지 숫자 통일 (수정본 10)

**찾은 문제**
- **스테이지**: `−12.5K`처럼 표시됩니다. 굵은 흰 글씨이고, 치명타는 금빛 기울임체에 별과 폭발이 붙습니다.
- **월드보스**: `치명타 334,448`처럼 '치명타'라는 글자와 전체 자릿수를 씁니다. 글꼴·크기·움직임도 스테이지와 달랐습니다.
- **레이드**: 데미지 숫자가 아예 없었습니다.

**고친 것(코드)**
- 세 곳 모두 같은 숫자를 씁니다. 텍스트, 크기, 색, 튀어 오르는 움직임, 치명타 별과 폭발까지 같습니다(`battlePresentation.damageNumber`).
- 레이드는 내 공격에만 숫자를 띄웁니다. 대원 숫자까지 띄우면 화면이 어지러워집니다.

## 7. UI 전반 검수 (수정본 10)

화면 12곳(모험, 성장, 장비, 스킬, 상점, 모루, 설정, 우편함, 임무, 출석, 월드보스, 레이드)을 띄워 보고 기준에 맞지 않는 부분을 골랐습니다. 기준은 "화려하지만 과하지 않은, 요즘 게임의 세련된 느낌, 남보라·금테 판타지"입니다.

| 부분 | 문제 | 이번 처리 |
|---|---|---|
| 금색 버튼 | 밋밋한 베이지 그라데이션이라 '누르는 물건'처럼 보이지 않음 | **코드로 고침**: 위는 밝고 아래는 어둡게, 금테 1px, 안쪽 빛 반사, 누르면 살짝 눌림. 그림 카드는 A17 |
| 보라 버튼(가격·보조) | 같은 문제 | **코드로 고침**: 같은 입체감과 누름. 그림 카드는 A17 |
| 켜기/끄기 스위치 | 꺼짐(OFF)이 진한 주황빨강이라 켜진 것처럼 보임 | **코드로 고침**: OFF는 어두운 회보라, ON은 은은하게 빛나는 비취색 |
| 팝업 창 | 테두리 한 줄뿐이라 화면과 구분이 약함 | **코드로 고침**: 바깥 금빛 후광, 제목 아래 금빛 구분선. 그림 카드는 A18 |
| 상단 바로가기 줄 | 오른쪽 끝 아이콘이 잘려 보임 | **코드로 고침**: 오른쪽 끝이 흐려지며 넘길 수 있다는 표시 |
| 하단 메뉴 | 지금 탭 표시가 약함 | **코드로 고침**: 위쪽에 금빛 선과 아이콘 빛. 그림 카드는 A19 |

다음 단계로 권하는 것(이번에 손대지 않음):
- **상단 재화 칸(골드·다이아·성운석)**: 아이콘이 칸 안에 갇혀 작아 보입니다. 아이콘을 칸 왼쪽 밖으로 조금 걸치게 크게 두는 요즘 방식이 어울립니다. 상단 구조를 바꾸는 일이라 화면 전체를 다시 확인해야 합니다.
- **카드형 칸(상점·우편)**: 모두 같은 어두운 상자라 중요도가 구분되지 않습니다. 무료·한정 상품에 리본이나 띠를 붙이는 일을 다음에 권합니다.
- **잠금 표시 "STAGE 40"**: 하단 메뉴 글자 밑에 붙어 답답합니다. 아이콘 위 작은 자물쇠 배지로 옮기는 편이 깔끔합니다.

## 8. 이번에 손대지 않은 것(2단계 제안)

- **몬스터 동작 그림**: 몬스터는 그림 한 장을 통째로 움직이는 방식이라 맞는 동작, 쓰러지는 동작 그림이 없습니다. 보스 10종에 '맞는 자세' 그림 4장씩을 그리는 일이 다음으로 효과가 큽니다. 코드도 그에 맞게 고쳐야 해서 따로 진행하는 것을 권합니다.
- **스킬 효과 그림**: (수정본 9에서 처리) 60종 모두 16장 → 36장으로 늘리고, 원본 그림 사이를 섞어 중간 장면을 만들었습니다. 재생 시간도 1.4배(0.6~1.1초)로 늘렸습니다. 도구: `tools/bake-skill-effects-smooth.py`. 그림을 새로 그릴 필요는 없습니다.
- **소리**: 소리 기본값이 꺼져 있습니다. 치명타도 일반 공격 소리를 그대로 씁니다. 소리 카드는 그림이 끝난 뒤 따로 드리겠습니다.

---

# 2부 · GPT 작업 카드

## 0. 모든 카드 공통 규칙(반드시 지키기)

1. **파일 형식**: `.webp`, 투명 배경(알파), 품질 90 이상.
2. **파일 이름과 위치**: 카드에 적힌 그대로. 대소문자, 하이픈까지 똑같이 씁니다.
3. **그림 크기**: 카드에 적힌 가로×세로 픽셀 그대로.
4. **분위기(게임 전체 톤)**
   - 어두운 남보라 밤하늘, 성운 판타지입니다.
   - 금빛 테두리(#E9C37B 부근)와 짙은 자주 바탕(#1D1528)이 기본입니다.
   - 보스와 위험 신호는 진홍(#D9485A~#FF6A5A)입니다.
   - 반실사 판타지 일러스트 질감입니다. 기존 장비·몬스터 그림과 같은 붓 터치로 그립니다.
5. **세련됨의 기준**: 요즘 모바일 RPG 수준으로, 화려하되 과하지 않게 그립니다.
   - 금속 테두리는 얇고 정교하게 그리고, 장식은 모서리에만 둡니다.
   - 가운데(글씨·막대가 들어가는 자리)는 비웁니다.
   - 네온 같은 형광색, 두꺼운 만화 외곽선, 글자는 넣지 않습니다.
6. **글자를 그림에 넣지 않습니다.** 글씨는 게임이 따로 씁니다. 예외는 카드에 따로 적습니다.
7. **바꿀 코드는 단 한 곳**: `dist/client/battle-presentation.js` 맨 위의 스위치 5줄뿐입니다.
   ```js
   const BATTLE_UI_ART=false;   // A13
   const COMBAT_FX_ART=false;   // A14
   const MINE_ART=false;        // A15
   const BOSS_INTRO_ART=false;  // A16
   const UI_KIT_ART=false;      // A17~A19
   ```
   카드의 그림을 **전부** 넣은 뒤에만 그 카드의 줄을 `true`로 바꿉니다. 하나라도 빠졌으면 `false`로 둡니다.
8. **스위치를 바꾼 뒤 반드시 실행할 명령**(게임 폴더에서):
   ```sh
   python3 tools/build-web.py
   python3 tools/build-web.py --check
   ```
   두 번째 명령이 오류 없이 끝나야 합니다.

## A13 · 전투 UI 그림 (스위치 `BATTLE_UI_ART`)

폴더: `dist/client/assets/battle-ui/` (이미 만들어 둠)

### A13-1 `route-boss.webp` — 진행 경로 끝의 보스 문장
- **크기**: 128 × 128, 투명 배경.
- **쓰이는 곳**: 스테이지 제목 아래 점 9개 끝. 화면에서는 30×30px로 작게 보입니다.
- **그릴 것**: 둥근 메달 안에 뿔 달린 해골 문장.
  - 테두리: 얇은 금빛 고리 2겹. 바깥 고리에 작은 가시 장식 4개(위·아래·좌·우).
  - 안쪽: 짙은 진홍~검자주 그라데이션.
  - 해골: 상아빛. 눈구멍은 어둡게, 뿔 두 개는 좌우 대칭으로 위로 휘게.
- **중요**: **완벽한 좌우 대칭, 정중앙.** 메달 지름은 그림의 92%(약 118px)이고 가장자리에 5px씩 여백을 둡니다. 기울이지 않습니다.
- **작게 줄였을 때(30px)도 해골로 읽혀야 합니다.** 잔선은 빼고 덩어리 위주로 그립니다.
- **이미지 생성 프롬프트(영문)**:
  `game UI emblem, circular medallion, perfectly symmetrical horned skull crest centered, thin double gold rim with four tiny spikes at top bottom left right, deep crimson to dark purple enamel background, ivory skull with dark eye sockets, semi-realistic fantasy mobile RPG style, clean silhouette readable at small size, transparent background, centered, front view, no text`

### A13-2 `boss-medal.webp` — 보스 체력 창 왼쪽 메달의 테두리
- **크기**: 160 × 160, 투명 배경.
- **쓰이는 곳**: 보스 체력 창 왼쪽 원(화면 52×52px). 안쪽에 게임이 해골 문장을 그리므로, **고리만** 그립니다.
- **그릴 것**: 금빛 금속 고리.
  - 굵기: 지름의 약 12%.
  - 위쪽 가운데에 작은 왕관 장식, 아래쪽 가운데에 작은 보석(진홍) 하나.
  - 고리 안쪽은 **완전히 투명**하게 비웁니다(지름의 약 70%).
- **좌우 대칭, 정중앙.**
- **프롬프트**: `ornate circular gold frame ring for a boss portrait, small crown ornament at top center, small crimson gem at bottom center, hollow transparent center, thin elegant filigree, semi-realistic fantasy mobile RPG UI, perfectly symmetrical, transparent background, no text`

### A13-3 `boss-frame.webp` — 보스 체력 창 테두리(9조각 늘림 그림)
- **크기**: 384 × 128, 투명 배경.
- **쓰이는 곳**: 화면 상단의 보스 체력 창 전체 테두리. 게임이 이 그림을 **모서리 28px만 그대로 두고 나머지를 늘려서** 씁니다(9-slice).
- **반드시 지킬 것**
  - 네 모서리 28×28px 안에만 장식(금빛 꺾쇠, 작은 보석)을 넣습니다.
  - 모서리 사이의 가장자리(위·아래·좌·우 변)는 **어디를 잘라도 같은 무늬**여야 합니다. 얇은 금선 1~2줄이면 됩니다.
  - 가운데(모서리 28px 안쪽 전부)는 반투명 짙은 자주(#150E1E, 불투명도 90%)를 고르게 칠합니다. 무늬를 넣지 않습니다.
- **프롬프트**: `9-slice game UI panel frame, dark translucent purple plate, thin gold border lines, ornate gold corner brackets with tiny crimson gems only in the four corners, plain uniform edges between corners, flat uniform center, semi-realistic fantasy mobile RPG HUD, transparent background, no text`

**A13 완료 후**: 세 파일이 모두 들어갔으면 `const BATTLE_UI_ART=true;` → 빌드 명령 2줄.

## A14 · 치명타 폭발 (스위치 `COMBAT_FX_ART`)

폴더: `dist/client/assets/combat-fx/` (이미 만들어 둠)

### A14-1 `crit-burst.webp`
- **크기**: 256 × 256, 투명 배경.
- **쓰이는 곳**: 치명타 숫자 뒤에서 0.5초 동안 커지며 회전하고 사라집니다. 화면에서 약 76px이고, '밝게 더하기(screen)' 방식으로 겹칩니다.
- **그릴 것**: 가운데가 가장 밝은 별 폭발.
  - 날카로운 빛살 8줄: 긴 것 4줄, 짧은 것 4줄이 번갈아.
  - 금백색 중심에서 주황·진홍으로 번집니다.
  - 가장자리는 부드럽게 투명해집니다.
- **배경은 반드시 투명.** 검은 배경으로 그리지 않습니다.
- **프롬프트**: `critical hit impact burst VFX sprite, bright white-gold core, eight sharp light rays alternating long and short, orange to crimson glow falloff, soft transparent edges, additive light effect, game VFX, centered, transparent background, no text`

**A14 완료 후**: `const COMBAT_FX_ART=true;` → 빌드 명령 2줄.

## A15 · 별의 광산 (스위치 `MINE_ART`)

폴더: `dist/client/assets/star-mine/` (기존 `vein.webp`, `pick.webp`, `chips.webp`는 **지우지 말 것**)

### A15-1 `pick-hand.webp` — 장갑 낀 손이 쥔 곡괭이
- **크기**: 380 × 380, 투명 배경. 기존 `pick.webp`와 **같은 크기, 같은 자리.**
- **쓰이는 곳**: 지금 허공에 떠 있는 곡괭이를 대신합니다. 게임이 이 그림을 손잡이 끝을 축으로 돌려 내려칩니다.
- **반드시 지킬 위치(픽셀 좌표, 왼쪽 위가 0,0)**
  - **곡괭이 날 끝(광석에 닿는 점)**: (375, 152). 오른쪽 끝, 위에서 40% 높이.
  - **손이 쥐는 자리(회전 축)**: (53, 334). 왼쪽 아래.
  - 곡괭이 모양과 기울기는 기존 `pick.webp`를 그대로 따라 그리고, 그 위에 손만 더합니다.
- **그릴 것**: 가죽 장갑을 낀 손이 손잡이 아래쪽을 꽉 쥔 모습.
  - 팔목은 그림 왼쪽 아래 모서리 밖으로 자연스럽게 잘립니다.
  - 모루 '무기 강화' 화면의 망치를 쥔 장갑(`assets/weapon-forge/smith-strike.webp`)과 같은 장갑, 같은 화풍입니다.
- **프롬프트**: `first-person view, leather gloved hand gripping the lower handle of a rune-engraved iron pickaxe, wrist exiting bottom-left corner, pickaxe head pointing right, same angle as reference, semi-realistic fantasy painting, warm lantern rim light, transparent background, no text` (기존 `pick.webp`와 `smith-strike.webp`를 참고 그림으로 함께 넣으세요.)

### A15-2 `ore-node-0.webp` ~ `ore-node-3.webp` — 금 가는 광석 4단계
- **크기**: 각 256 × 256, 투명 배경. 네 장 모두 **같은 덩어리, 같은 자리, 같은 크기**이고 금만 늘어납니다.
- **쓰이는 곳**: 곡괭이가 내려치는 자리의 광석 덩어리(화면 약 84~150px). 12번 치면 부서지고 새로 솟습니다.
- **그릴 것**: 바위에 박힌 보랏빛 자수정 결정 덩어리. 결정 5~7개가 위로 솟은 형태입니다. 배경 그림 `vein.webp`의 보랏빛 광맥과 같은 색입니다.
  - `ore-node-0`: 금 없음. 결정 안쪽이 은은하게 빛납니다.
  - `ore-node-1`: 가운데에서 짧은 금 2줄.
  - `ore-node-2`: 금이 덩어리 절반까지 번지고, 작은 조각 1개가 떨어져 나갈 듯합니다.
  - `ore-node-3`: 금이 전체로 번지고, 틈 사이로 밝은 보랏빛이 새어 나옵니다. 곧 터질 느낌입니다.
- **프롬프트(0단계)**: `cluster of glowing purple amethyst crystals embedded in dark rock, five to seven crystal spires pointing up, inner violet glow, semi-realistic fantasy mining game asset, centered, transparent background, no text`
  - 1~3단계는 같은 그림에 `with a few cracks` / `with cracks spreading across half` / `heavily cracked with bright violet light leaking from the cracks`를 덧붙입니다.

### A15-3 `gem.webp` — 튀어 오르는 보석
- **크기**: 96 × 96, 투명 배경.
- **그릴 것**: 깎인 보랏빛 보석 한 알. 위쪽에 흰 반짝임 하나를 넣고, 은은한 보랏빛 후광을 둡니다.
- **프롬프트**: `single faceted violet gemstone, small white sparkle highlight, soft purple glow, game item icon, centered, transparent background, no text`

**A15 완료 후**: 여섯 파일(`pick-hand`, `ore-node-0~3`, `gem`)이 모두 들어갔으면 `const MINE_ART=true;` → 빌드 명령 2줄.

## A16 · 보스 등장 경고 띠 (스위치 `BOSS_INTRO_ART`)

폴더: `dist/client/assets/battle-ui/`

### A16-1 `boss-warning.webp`
- **크기**: 1024 × 256, 투명 배경.
- **쓰이는 곳**: 보스가 나타날 때 화면 가운데를 가로지르는 띠입니다. 게임이 그 위에 `WARNING · 지역 보스 · 보스 이름`을 씁니다. **그림에 글자를 넣지 않습니다.**
- **그릴 것**
  - 가로로 긴 진홍·검정 띠: 위아래 가장자리에 얇은 금선, 가운데는 반투명 검정.
  - 양 끝은 날카로운 칼날 모양으로 가늘어지며 투명해집니다.
  - 띠 안쪽에 아주 옅은 빗금 무늬(경고 표시 느낌)를 넣습니다.
  - 가운데 60%는 글씨가 들어가도록 어둡고 고르게 칠합니다.
- **프롬프트**: `horizontal boss warning banner for a fantasy mobile RPG, crimson and black band with thin gold edge lines, faint diagonal hazard stripes, blade-shaped tapered ends fading to transparent, dark even center area for text, dramatic but elegant, transparent background, no text`

**A16 완료 후**: `const BOSS_INTRO_ART=true;` → 빌드 명령 2줄.

## A17~A19 · UI 그림 (스위치 `UI_KIT_ART`)

폴더: `dist/client/assets/ui-kit/` (이미 만들어 둠)

**공통**
- 버튼과 팝업 테두리는 **9조각 늘림 그림**입니다. 게임이 모서리 일정 픽셀만 그대로 두고 나머지를 늘립니다.
- 모서리 안에만 장식을 넣고, 변(가장자리)은 어디를 잘라도 같은 무늬로, 가운데는 고르게 칠합니다.
- 버튼·팝업의 크기는 게임이 정하므로, 그림 크기가 달라도 칸 크기는 바뀌지 않습니다.

### A17-1 `btn-gold.webp` — 금색 버튼
- **크기**: 192 × 72, 투명 배경. 게임은 **모서리 24px**을 고정하고 늘려 씁니다.
- **그릴 것**: 둥근 모서리(반지름 약 18px)의 금속 금빛 판입니다.
  - 위쪽 1/3은 밝은 크림 금빛(#FBE8B8), 아래로 갈수록 진한 호박 금빛(#C8934A)입니다.
  - 위 가장자리에 가는 흰 반사광 한 줄, 아래 가장자리에 진한 그림자 한 줄을 넣습니다.
  - 테두리는 1~2px의 밝은 금선입니다.
  - 네 모서리에 아주 작은 꺾쇠 장식을 넣습니다(24px 안).
  - 가운데는 무늬 없이 그라데이션만 둡니다(글씨 자리).
- **프롬프트**: `9-slice mobile game button, rounded gold metal plate, light cream gold top fading to deep amber bottom, thin bright gold rim, subtle white highlight line along the top edge, soft dark line along the bottom edge, tiny ornate corner brackets only inside the corners, plain center, semi-realistic fantasy RPG UI, transparent background, no text`

### A17-2 `btn-purple.webp` — 보라 버튼(가격·보조)
- **크기**: 192 × 72, 모서리 24px. A17-1과 **같은 모양**에 색만 바꿉니다.
  - 밝은 자수정(#A47AC4)에서 짙은 보라(#4F3368)로 갑니다.
  - 테두리는 은은한 연보라 금속(#C3A2DA)입니다.
- **프롬프트**: A17-1 프롬프트의 `gold`를 `amethyst purple`로, `cream gold top fading to deep amber`를 `light amethyst top fading to deep violet`으로 바꿉니다.

### A18-1 `panel-frame.webp` — 팝업 창 테두리
- **크기**: 256 × 256, 투명 배경. 게임은 **모서리 48px**을 고정하고 늘려 씁니다(화면에서 24px).
- **그릴 것**: 짙은 자주 판(#1D1528, 불투명도 95%)에 얇은 금테 2줄을 두릅니다.
  - 네 모서리(48px 안)에 금빛 덩굴 장식과 작은 자수정 보석을 넣습니다.
  - 변은 금테 2줄만 반복합니다.
  - 가운데는 고르게 칠하고 무늬를 넣지 않습니다.
- **프롬프트**: `9-slice fantasy popup window frame, dark plum translucent panel, double thin gold border lines, ornate gold filigree with tiny amethyst gems only in the four corners, plain repeating edges, flat uniform center, elegant semi-realistic mobile RPG UI, transparent background, no text`

### A18-2 `divider.webp` — 팝업 제목 아래 구분선
- **크기**: 512 × 48, 투명 배경. 화면에서는 가로로 늘어나 높이 12px로 보입니다.
- **그릴 것**: 가운데 작은 마름모 보석(금빛 테에 자수정)에서 좌우로 가늘게 뻗는 금선입니다. 양 끝은 투명하게 사라집니다. **좌우 대칭**으로 그립니다.
- **프롬프트**: `ornamental horizontal divider, small diamond gem with gold setting in the center, thin gold lines extending left and right and fading to transparent, perfectly symmetrical, fantasy RPG UI, transparent background, no text`

### A19-1 `nav-glow.webp` — 하단 메뉴 '지금 탭' 빛
- **크기**: 160 × 48, 투명 배경. 지금 열린 하단 메뉴 탭의 위쪽에 깔립니다.
- **그릴 것**: 위쪽 가운데에서 아래로 퍼지는 부드러운 금빛 빛무리입니다. 맨 위에 가는 밝은 선 하나를 두고, 아래로 갈수록 투명해집니다. 좌우 대칭입니다.
- **프롬프트**: `soft golden light glow for an active tab indicator, bright thin line at the top center spreading down into a fading warm glow, symmetrical, transparent background, no text`

**A17~A19 완료 후**: 다섯 파일(`btn-gold`, `btn-purple`, `panel-frame`, `divider`, `nav-glow`)이 모두 들어갔으면 `const UI_KIT_ART=true;` → 빌드 명령 2줄.

---

# 3부 · 넘길 때와 검수

## GPT → 사용자 → Claude로 넘길 것
1. 게임 폴더 전체(또는 바뀐 파일만): `dist/client/assets/battle-ui/`, `dist/client/assets/combat-fx/`, `dist/client/assets/star-mine/`, `dist/client/assets/ui-kit/`의 새 그림과 `dist/client/battle-presentation.js`, 빌드로 바뀐 `dist/client/index.html`과 `dist/client/game-bundle-*.js`.
2. 어느 카드를 끝냈는지, 어느 스위치를 `true`로 바꿨는지 한 줄 메모.

## Claude가 검수할 것
- 파일 이름·크기·투명 배경이 맞는지.
- 대칭과 중앙: 보스 문장·메달.
- 9조각 테두리가 늘어날 때 깨지지 않는지.
- 곡괭이 날 끝과 손 위치가 좌표에 맞는지. 맞지 않으면 광석과 어긋납니다.
- 실제 게임 화면(360·412·480px 폭)에서 겹침이나 번짐이 없는지.
- 문제가 있으면 Claude가 위치·크기를 코드로 보정하거나, 다시 그릴 부분을 구체적으로 적어 드립니다.

## GPT가 하면 안 되는 것
- `battle-presentation.js`의 스위치 5줄 말고 다른 코드를 고치는 것.
- 기존 그림 파일을 덮어쓰거나 지우는 것. 특히 `pick.webp`, `vein.webp`, `chips.webp`, `critical-hit.webp`.
- 그림 안에 글자를 넣는 것.
- 파일 이름을 바꾸는 것. 예: `boss_frame.webp`, `bossFrame.webp`는 안 됩니다.
