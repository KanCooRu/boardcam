# 미니게임 그림 — 상세 작업 지시서 (카드 A9, A10)

A9는 fix7 이후, **A10은 fix9 이후**가 적용된 프로젝트에서 씁니다(배치전이 fix9에서 5×6 판의 턴제 전투로 바뀌어 A10의 그림 목록이 달라졌습니다). 새 대화에 통합 지시서의 **[공통 규칙]** 블록을 먼저 붙이고, 그 아래에 카드 **한 장만** 붙여 넣습니다. A9와 A10은 서로 독립이라 어느 쪽을 먼저 해도 됩니다.

## 지금 상태와 목표 (사람이 읽는 부분)

두 미니게임은 규칙·서버 판정·화면 움직임까지 이미 만들어져 있습니다. 다만 그림 자리에 **코드로 그린 임시 도형**(둥근 사각형 용광로, 색 덩어리 불꽃, 빈 칸)이 들어가 있습니다. 아래 카드는 그 자리에 들어갈 그림만 만들고, 스위치 한 곳을 켭니다.

미니게임에 들어가면 **전체 화면**으로 열립니다(상단 바·탭·하단 메뉴를 모두 덮습니다). 위에는 제목, 가운데는 놀이 영역, 아래에는 가이드 버튼과 나가기 버튼이 있습니다.

화면이 움직이는 방식은 이미 정해져 있습니다.

- **용광로**: 대장간 배경 위에 용광로가 서 있고, 온도가 오를수록 입구의 불꽃이 커지고 밝아집니다. 덩이를 넣으면 덩이가 위에서 입구로 떨어지고, 냉각수를 쓰면 증기가 피어오릅니다. 꺼내면 순도에 따라 네 등급 중 하나의 주괴가 화면 가운데에 나타나고, 과열되면 깨진 주괴가 나타납니다.
- **배치전**: 가로 5칸 × 세로 6칸의 판 하나입니다. 위 두 줄에 적이 서 있고 아래 두 줄에 오늘의 동료를 놓습니다. 전투가 시작되면 판이 뒤로 기울어지고 동료와 몬스터가 그 위에 서서 턴마다 이동·공격합니다. 갈 수 있는 칸은 하늘색, 공격할 수 있는 칸은 붉은색으로 표시되고, 맞은 칸에는 타격 효과가, 회복받은 칸에는 회복 효과가 번쩍입니다. 끝나면 승리/패배 리본이 덮입니다.

화풍은 게임의 기존 그림과 같은 **반실사 채색, 보라+금색**이고, 용광로 쪽에만 불빛의 주황을 더합니다.

---

## 카드 A9 — 용광로 제련 그림 14장

```
[작업 카드 A9] 용광로 제련 그림 14장

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

---

## 카드 A10 — 동료 배치전 그림 18장

```
[작업 카드 A10] 동료 배치전 그림 18장

■ 먼저 확인 (아니면 작업을 멈추고 사용자에게 알린다)
- web/game/minigames.js 안에 BOARD_TURNS 라는 이름이 있다 (fix9가 적용된 프로젝트다).
  없으면 이 카드를 진행하지 않는다.
- 예전 A10 카드로 만든 그림이 dist/client/assets/minigames/ 에 이미 있다면:
  tile-foe.webp 는 지우고, board-bg.webp 와 tile-ally.webp 는 이 카드의 새 크기로 다시 만든다.
  나머지(역할 아이콘 6장, fx 2장, 리본 2장, frame-board, title-board)는 그대로 써도 된다.

■ 이미 만들어져 있는 것 (읽기만 한다. 규칙·배치·움직임은 고치지 않는다)
- 던전 → 미니게임 → 동료 배치전을 누르면 전체 화면으로 열린다(상단 바·탭·하단 메뉴를 덮는다).
  전체 화면의 구성: 맨 위에 제목 영역(오늘 클리어 수, 보유 재화, 제목 글자 "동료 배치전"),
  가운데에 놀이 영역, 맨 아래에 가이드 버튼(왼쪽)과 빨간 나가기 버튼(오른쪽).
  제목 글자와 버튼은 코드가 그린다.
- 놀이 영역 가운데에 "판"이 하나 있다. 판은 가로 5칸 × 세로 6칸 = 30칸이고,
  판 전체의 비율은 가로 25 : 세로 27, 칸 하나의 비율은 가로 200 : 세로 180 이다.
  · 맨 위 두 줄에 적이 서 있다.
  · 맨 아래 두 줄이 동료를 놓는 구역이다.
  · 가운데 두 줄에는 "별빛 칸"이 1~2개 있다(그 위에 서면 공격이 1.5배).
- 화면은 두 단계다.
  (1) 배치 화면: 판을 위에서 똑바로 내려다본 모습. 아래 두 줄의 빈 칸에 + 표시가 있고,
      판 아래에 오늘의 동료 3~4마리 목록과 "자동 배치 / 전체 해제 / 전투 시작" 버튼이 있다.
  (2) 전투 화면(턴제): 같은 판이 뒤로 15도 기울어지고(코드가 기울인다) 동료와 몬스터가 칸 위에 서 있다.
      동료를 누르면 갈 수 있는 칸이 하늘색으로, 공격할 수 있는 적의 칸이 붉은색으로 표시된다.
      판 아래에 동료 목록(체력 막대)과 "자동 / 나가기 / 턴 종료" 버튼이 있다.
- 칸 위에 서는 동료·몬스터 그림은 게임에 이미 있는 것을 쓴다(dist/client/assets/actor-poses/).
  발밑의 원(아군 파랑, 적 빨강), 머리 위의 이름표(역할 이름+체력 숫자)와 체력 막대는 코드가 그린다.
- 공격받은 칸 위에 타격 효과가, 회복받은 칸 위에 회복 효과가 0.4초 번쩍이고, 숫자(-14, +8)는 코드가 쓴다.
- 전투가 끝나면 판 전체를 어둡게 덮고 가운데에 리본 그림과 "승리" 또는 "패배" 글자가 나온다.
  글자는 코드가 쓴다.
- 이름표와 아래쪽 동료 목록의 역할 이름 앞에 18px 크기의 역할 아이콘이 붙는다.
- 지금은 그림이 없어서 색만 칠한 판과 빛 덩어리가 보인다.

■ 목적
그림 18장을 만들고 스위치 한 곳을 켠다. 그 외에는 아무것도 바꾸지 않는다.

■ 공통 화풍 (18장 모두)
- 반실사 판타지 채색, 보라+금색. 광원 왼쪽 위. 두꺼운 검은 외곽선·만화풍·픽셀아트·사진 금지.
- 색: 밤하늘 남보라(#17132c, #231b45), 돌의 회보라(#3d3550), 금 장식(#f1c986),
      아군 쪽 포인트는 푸른색(#4f8fff), 적 쪽 포인트는 붉은색(#e0503f),
      이동 표시는 하늘색(#6fdcff), 별빛 칸은 금색(#ffd98a).
- 그리지 않는 것: 글자, 숫자, 사람, 동료나 몬스터(이미 있는 그림이 칸 위에 놓인다), 모루,
  다른 게임의 캐릭터·화면·UI.
- 기준으로 먼저 열어 볼 파일:
    dist/client/assets/ui-regalia/stat-attack.webp, stat-hp.webp   (아이콘의 금 장식과 크기감)
    dist/client/assets/region-hd/void.webp                         (어두운 배경의 채도)
    dist/client/assets/actor-poses/companion-6.webp                (칸 위에 서는 동료 그림의 화풍)
    dist/client/assets/actor-poses/creature_2_0.webp               (칸 위에 서는 몬스터 그림의 화풍)
- 모든 파일은 dist/client/assets/minigames/ 폴더에 둔다.

■ 만들 파일

1. board-bg.webp — 1000×1080, 불투명, 300KB 이하
   판 전체의 바닥. 밤의 석조 연무장 바닥을 "바로 위에서 수직으로" 내려다본 모습(비스듬한 시점 금지.
   기울이는 것은 코드가 한다).
   - 넓적한 돌판이 깔린 바닥. 돌 이음매는 아주 옅게. 격자선은 그리지 않는다(칸 경계선은 코드가 얇게 그린다).
   - 위쪽 3분의 1(세로 0~360)은 붉은 기운이 아주 옅게(적 진영), 아래쪽 3분의 1(세로 720~1080)은
     푸른 기운이 아주 옅게(아군 진영), 가운데(세로 360~720)는 중립의 회보라.
   - 전체가 고르게 어둡고 대비가 낮아야 한다(그 위에 동료·몬스터·이름표가 놓인다).
   - 네 가장자리 20픽셀 안쪽에만 얇은 금색 테두리 장식을 둔다. 물건(횃불, 깃발, 상자)은 그리지 않는다.
   영문 문장: "A night-time stone training ground floor seen from directly above, strict top-down orthographic view,
   large worn flagstones with very faint seams, no grid lines, a very subtle crimson tint on the top third,
   neutral grey-violet in the middle, a very subtle blue tint on the bottom third, evenly dark and low contrast so
   game pieces can stand on it, a thin gold trim along the outer edge only, no objects, no characters, no text."

2~5. 칸 표시 4장 — 각 200×180, 배경 투명, 각 30KB 이하
   판의 칸 하나 위에 겹쳐 놓는 표시다. 네 장 모두 "바로 위에서 본" 납작한 빛 표시이고,
   칸 가장자리를 따라 테두리가 있고 가운데는 거의 비어 있다(그 위에 동료가 선다).
   - tile-ally.webp  배치 구역 칸: 푸른색(#4f8fff) 점선 느낌의 얇은 테두리, 안쪽은 푸른색이 20% 정도로 옅게.
   - tile-move.webp  이동 가능 칸: 하늘색(#6fdcff)으로 밝게 빛나는 굵은 테두리, 안쪽은 하늘색이 30% 정도로 옅게.
   - tile-aim.webp   공격 대상 칸: 붉은색(#ff6a5a)으로 빛나는 굵은 테두리, 네 모서리에 조준 꺾쇠 표시,
                     안쪽은 붉은색이 30% 정도로 옅게.
   - tile-star.webp  별빛 칸: 테두리 없이, 가운데에 금색(#ffd98a) 네 갈래 별 문양이 바닥에 새겨져 은은히 빛난다.
                     별 문양의 크기는 칸 세로의 절반 정도.
   네 장 공통: 테두리는 그림 가장자리에서 6픽셀 안쪽에 그린다. 네 장을 나란히 놓았을 때 색만으로 구별되어야 한다.
   영문 문장(괄호만 바꾼다): "A flat glowing floor marker for one board tile seen from directly above, on a fully
   transparent background, ( a thin dashed blue outline with a faint blue fill / a bright thick sky-blue outline with
   a faint sky-blue fill / a bright thick red outline with small corner brackets and a faint red fill / no outline,
   a softly glowing gold four-pointed star engraved in the center ), the center mostly empty. Painted game UI
   overlay, no text."

6~11. 역할 아이콘 6장 — 각 96×96, 배경 투명, 각 12KB 이하
   - role-guard.webp   방패: 금테 둥근 방패
   - role-striker.webp 돌격: 앞으로 찌르는 검 한 자루와 속도선 두 줄
   - role-piercer.webp 관통: 고리 세 개를 꿰뚫고 지나가는 화살
   - role-blast.webp   폭발: 세 갈래로 터지는 불꽃
   - role-sniper.webp  저격: 조준 원 안의 네 갈래 별
   - role-healer.webp  치유: 잎사귀 두 장이 감싼 물방울
   여섯 장은 화면에서 18×18로 줄여 쓴다. 그래서 선을 굵게, 형태를 단순하게, 색은 밝은 금색 위주로.
   18×18로 줄여 나란히 놓았을 때 여섯 개가 서로 구별되는지 꼭 확인한다.
   영문 문장(괄호만 바꾼다): "A bold simple gold emblem icon of ( a round shield / a thrusting sword with two
   speed lines / an arrow piercing through three rings / a three-way burst of flame / a four-pointed star inside
   a targeting circle / a water drop wrapped by two leaves ) on a fully transparent background, centered, thick
   shapes readable at 18 pixels, polished gold with a dark-gold shadow. Fantasy RPG UI icon, no text."

12. fx-hit.webp — 256×256, 배경 투명, 40KB 이하
   타격 효과. 가운데에서 바깥으로 터지는 날카로운 빛살(흰색 중심, 주황 가장자리)과 비스듬한 베기 자국 한 줄.
13. fx-heal.webp — 256×256, 배경 투명, 40KB 이하
   회복 효과. 아래에서 위로 떠오르는 연두색 빛 알갱이와 가운데의 부드러운 초록 빛.
   두 장 공통: 화면에서 0.4초만 보인다. 한눈에 "맞았다 / 회복됐다"가 구별되게 색을 분명히 한다
   (타격은 흰색+주황, 회복은 초록). 가장자리는 투명으로 사라진다.
   영문 문장(괄호만 바꾼다): "( A sharp impact burst with a diagonal slash streak, white core and orange rays /
   A soft healing glow with small green light motes rising ) on a fully transparent background, centered,
   feathered edges. Painted game VFX sprite, no text."

14. banner-win.webp — 768×256, 배경 투명, 90KB 이하
   가로로 긴 금색 리본. 양 끝이 제비꼬리 모양으로 갈라지고, 가운데 위에 작은 별 장식. 가운데 넓은 면은
   무늬 없이 어두운 보라색이다(그 위에 "승리" 글자가 놓인다).
15. banner-lose.webp — 768×256, 배경 투명, 90KB 이하
   같은 모양의 리본이되 금색 대신 빛바랜 회청색, 별 장식 대신 금이 간 방패 장식. 가운데 면은 어두운 회색.
   두 장 공통: 가운데 가로 360 × 세로 110 픽셀 영역은 글자 자리이므로 무늬를 넣지 않는다. 글자를 그리지 않는다.
   영문 문장(괄호만 바꾼다): "A wide horizontal fantasy ribbon banner with swallow-tail ends on a fully transparent
   background, ( polished gold trim with a small star ornament on top, dark violet plain center / faded grey-blue
   trim with a small cracked shield ornament on top, dark grey plain center ). The center is left empty for a
   label. Semi-realistic painted UI ornament, no text, no letters."

16. hub-board.webp — 256×256, 배경 투명, 45KB 이하
   미니게임 목록에 쓰는 작은 그림. 칸이 나뉜 석조 작전판을 비스듬히 본 모습, 그 위에 작은 금색 말 세 개와
   붉은 말 두 개가 마주 서 있다.

17. frame-board.webp — 720×1280, 불투명, 320KB 이하
   전체 화면의 바탕 그림. 세로로 긴 밤의 연무장.
   - 위쪽 4분의 1(세로 0~320): 별이 뜬 밤하늘과 양옆에 걸린 깃발 두 개(왼쪽 푸른색, 오른쪽 붉은색). 이 부분이 제목 뒤에 보인다.
   - 그 아래(세로 320~1280): 어두운 돌벽과 바닥. 무늬가 거의 없이 고르게 어둡다(그 위에 판과 버튼이 놓인다).
   영문 문장: "A tall vertical night-time stone training yard for a full-screen mobile game backdrop. The top quarter
   shows a starry sky with two hanging banners, blue on the left and crimson on the right; below it plain
   dark stone that stays evenly dark and low in detail, fading darker toward the bottom. Semi-realistic painterly,
   indigo and aubergine tones, no characters, no text."

18. title-board.webp — 1024×360, 배경 투명, 110KB 이하
   제목 글자 뒤에 깔리는 장식. 가로로 긴 석판에 금테, 양 끝에 작은 깃발 장식, 위 가운데에 방패와 교차한 검 장식.
   - 가운데 가로 560 × 세로 130 픽셀 영역은 무늬 없이 어둡게 비워 둔다(그 위에 코드가 제목 글자를 쓴다).
   - 그림 안에 글자를 넣지 않는다.
   영문 문장: "A wide ornate fantasy title plaque on a fully transparent background: dark stone slab with a gold rim,
   small pennant ornaments at both ends and a shield with crossed swords crest at the top center. The middle of the
   slab is plain, dark and empty for a title. Semi-realistic painted UI ornament, no text, no letters."

■ 만든 뒤 스스로 확인 (하나라도 아니면 다시 만든다)
1. 18개 파일의 가로×세로가 위에 적은 값과 정확히 같다.
2. board-bg와 frame-board 두 장만 불투명이고, 나머지 16개는 배경이 투명하다.
3. 투명 그림을 #221c30 색 바탕 위에 올렸을 때 가장자리에 흰 띠나 회색 얼룩이 없다.
4. board-bg는 수직으로 내려다본 그림이다(원근으로 위가 좁아지는 그림이면 다시 만든다).
5. board-bg 위에 칸 표시를 겹쳐 본다. 칸 하나는 200×180이므로
   tile-ally는 (0,720)에, tile-move는 (400,540)에, tile-aim은 (200,180)에, tile-star는 (600,360)에 올린다.
   네 표시가 바닥 무늬에 묻히지 않고 한눈에 구별된다.
6. 그 위에 dist/client/assets/actor-poses/companion-6.webp를 가로 190으로 줄여 (405,545) 근처 칸에 올렸을 때
   동료가 바닥과 칸 표시에 묻히지 않는다.
7. 역할 아이콘 6장을 18×18로 줄여 나란히 놓았을 때 서로 구별된다.
8. 용량이 각각 한도 이하다.

■ 고칠 파일: web/game/minigames.js (이 파일 하나만, 한 곳만)
   찾기:  BOARD_ART=false;
   바꾸기: BOARD_ART=true;
이 한 곳 외에는 이 파일의 어떤 것도 바꾸지 않는다(역할 수치, 이동·사거리, 적의 움직임, 보상, 턴 수 모두 그대로).
CSS는 이미 있다. 추가하지 않는다.

■ 완료 확인
- 공통 규칙 [6]의 명령 4개 통과, node tests/minigames.cjs 통과
- 던전 → 미니게임: 동료 배치전 카드 왼쪽에 작은 그림이 보인다
- 동료 배치전 배치 화면(전체 화면)
  · 화면 전체에 바탕 그림이 깔리고, 제목 글자 뒤에 석판 장식이 보이며 제목 글자가 또렷이 읽힌다
  · 맨 아래의 가이드·나가기 버튼이 바탕 그림에 묻히지 않는다
  · 판에 바닥 그림이 보이고, 아래 두 줄에 푸른 배치 표시가, 가운데 줄에 금색 별 표시가 보인다
  · 적과 동료의 이름표(역할 이름·체력 숫자)가 또렷이 읽힌다
- 전투 화면 ("자동 배치" → "전투 시작")
  · 판이 뒤로 기울어 보이고 동료와 몬스터가 그 위에 서 있다
  · 동료를 누르면 하늘색 이동 표시와 붉은 공격 표시가 보인다
  · 공격하면 맞은 칸에 타격 그림이, 치유하면 회복 그림이 번쩍인다
  · 이겼을 때 금색 리본과 "승리", 졌을 때 회청색 리본과 "패배"가 보인다
  · 이름표와 아래 동료 목록의 역할 이름 앞에 역할 아이콘이 보인다
- 폭 360px 화면에서도 판이 화면 밖으로 나가지 않는다

■ 보고에 꼭 넣을 것
- 18개 파일 각각의 가로×세로와 용량
- 화면 전체 캡처 4장: 배치 화면, 전투 중 동료를 눌러 이동·공격 표시가 보이는 장면,
  타격 효과가 보이는 장면, 승리 리본이 뜬 장면
```
