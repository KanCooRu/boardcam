# 성운의 모루 · GPT 그림 작업 지시서 — 최종 종합본 (v166-fix13)

> **이 문서 하나만 보고 작업하세요.** 예전 문서(`GPT-전투연출-그림·UI·효과-상세.md`, `GPT-작업지시서-통합본.md` 등)는 기록용입니다.
> 코드는 이미 다 연결되어 있습니다. **그림 파일을 정해진 이름·크기로 넣고, 스위치 한 줄만 `true`로 바꾸면** 게임에 바로 나옵니다.
> **코드 파일은 고치지 마세요**(스위치 한 줄 빼고).

---

## 0. 이번에 할 일 한눈에

| 순서 | 카드 | 파일 (모두 `dist/client/assets/` 아래) | 장수 | 스위치 | 중요도 |
|---|---|---|---|---|---|
| 1 | **G1 보스 체력 게이지** | `battle-ui/gauge-frame.webp`, `gauge-fill.webp`, `time-frame.webp`, `time-fill.webp`, `time-icon.webp` | 5 | `BOSS_GAUGE_ART` | ★★★ 가장 먼저 |
| 2 | **M1 꼬마 광부** | `star-mine/miner-body.webp`, `miner-arm.webp` | 2 | `MINER_ART` | ★★★ |
| 3 | R2 치명타 폭발 (다시) | `combat-fx/crit-burst.webp` | 1 | 이미 켜짐 | ★★ |
| 4 | R3 버튼 (다시) | `ui-kit/btn-gold.webp`, `ui-kit/btn-purple.webp` | 2 | 이미 켜짐 | ★★ |
| 5 | R4 자물쇠 배지 (다시) | `ui-kit/lock-badge.webp` | 1 | 이미 켜짐 | ★ |
| 6 | R5 리본 (다시) | `ui-kit/ribbon-red.webp`, `ui-kit/ribbon-gold.webp` | 2 | 이미 켜짐 | ★ |

- **모두 13장.** 다시 그리는 R2~R5는 **같은 이름으로 덮어쓰기**만 하면 됩니다.
- **하지 않는 것**: R1 곡괭이 손(`pick-hand.webp`)은 취소. 예전 보스 창 그림 `boss-frame.webp`, `boss-medal.webp`는 더 이상 쓰지 않으니 손대지 않습니다(지우지도 않기).
- 기준 그림(안내도)은 `art/gpt-guides/` 폴더에 있습니다. **각 카드에 적힌 안내도를 반드시 먼저 열어 보고**, 이미지 생성 때 참고 그림으로 함께 넣으세요.

---

## 1. 공통 화풍 — 모든 그림이 지켜야 할 것

### 1-1. 이 게임의 느낌
- 게임 이름: **성운의 모루**. 별빛(성운)과 대장간(모루)이 섞인 판타지입니다. 금속을 두드려 무기를 만드는 대장장이 세계 + 밤하늘의 별빛.
- 화풍: **반실사 손그림 판타지 모바일 RPG**(semi-realistic, hand-painted). 금속·가죽·법랑(에나멜)·나무 질감이 손으로 칠한 듯 보여야 합니다.
- 빛: **위 왼쪽에서 들어오는 따뜻한 등불빛.** 위쪽 모서리가 밝고, 아래 오른쪽이 어둡습니다. 모든 그림이 같은 방향이어야 나란히 놓였을 때 어색하지 않습니다.

### 1-2. "심플하지만 판타지풍"이 무슨 뜻인가 (가장 중요)
사용자가 원하는 것은 **모양은 단순하고, 재료와 마감이 판타지인 것**입니다.

| 해야 할 것 (O) | 하면 안 되는 것 (X) |
|---|---|
| 모양은 직선·원·둥근 사각 같은 **단순한 큰 형태** | 도형에 색만 칠한 듯한 **평면(flat) 디자인** |
| 디테일은 **재료 질감**(낡은 금속의 미세한 긁힘, 법랑 광택, 가죽 결)과 **빛**(위 반사, 아래 그림자)으로 | 테두리 전체에 덩굴·문양이 꽉 찬 **복잡한 장식** |
| 장식은 **양 끝에만 작게**(창끝, 작은 보석, 리벳) | 가운데까지 장식이 들어와 글씨·막대를 가림 |
| 색은 **고금·청동·진홍·호박** 중심의 차분한 판타지 색 | 네온색, 형광색, 무지개 그라데이션 |
| 테두리는 **두께가 느껴지게**(바깥 어두운 선 + 안쪽 밝은 금속 선) | 굵은 **검은 외곽선**, 만화·클립아트·이모지 느낌 |
| 은은한 광택 한 줄 | 플라스틱처럼 번들거리는 광택, 렌즈 플레어 |

> 쉽게 말해: **"낡은 금속으로 정성 들여 만든, 장식은 절제된 물건"** 처럼 보이면 됩니다.

### 1-3. 색 팔레트 (이 색을 기준으로)
| 이름 | 색 | 쓰는 곳 |
|---|---|---|
| 고금 (antique gold) | `#E2BD73` | 테두리 금속 기본 |
| 밝은 금 반사 | `#FFF0C2` | 테두리 위쪽 반사, 하이라이트 |
| 짙은 청동 | `#7A5420` | 테두리 아래쪽, 그림자 쪽 금속 |
| 그을린 검정 | `#1A0F06` | 가장 바깥 얇은 선, 홈 |
| 진홍 (체력) | `#C81D27` | 체력 채움 기본 |
| 밝은 진홍 | `#EF4A3D` | 체력 채움 위쪽 |
| 짙은 적 | `#8E0F19` | 체력 채움 아래쪽 |
| 호박 금 (시간) | `#F0BF3A` | 시간 막대 채움 |
| 자수정 보라 | `#8C5AD6` | 광부 스카프, 보라 계열 |
| 밤보라 바탕 | `#1D1528` | 게임 UI 바탕 (참고) |

### 1-4. 모든 그림 공통 규칙
1. **글자·숫자·로고를 그리지 않습니다.** 글씨는 게임이 씁니다.
2. 배경은 **투명**(채움 그림 G1-2, G1-4만 예외 — 꽉 채움).
3. 파일은 **webp**, 크기는 카드에 적힌 **정확한 픽셀**.
4. 실제 존재하는 다른 게임의 UI·캐릭터를 따라 그리지 않습니다(이름을 프롬프트에 넣지 않기).
5. 참고 그림으로 함께 넣으면 좋은 기존 그림: `assets/battle-ui/route-boss.webp`(보스 문양), `assets/battle-ui/boss-warning.webp`(경고 띠), `assets/weapon-forge/smith-strike.webp`(대장장이 장갑). 이 그림들과 **같은 손이 그린 것처럼** 보여야 합니다.

---

## 2. 작업 방법 (모든 카드 공통)

### 2-1. 순서
1. 카드의 **안내도**를 연다 → 크기·자르는 선·위치를 눈으로 확인.
2. 프롬프트 + 안내도 + 참고 그림으로 이미지 생성 (크게 만들어도 됨: 2~4배).
3. 아래 코드로 **정확한 크기의 webp**로 바꿔 정해진 폴더에 저장.
4. `python3 tools/check-gpt-art.py 카드이름` → 모두 `통과`가 될 때까지 고치기.
5. 스위치를 `true`로 → 빌드 명령 2줄 → 미리보기로 화면 확인.
6. 6장 "넘길 때"대로 정리해서 돌려주기.

### 2-2. webp로 바꾸는 코드 (게임 폴더에서 실행)
```python
from PIL import Image
src = Image.open('만든그림.png').convert('RGBA')

# (가) 아이콘·메달·캐릭터처럼 비율을 지켜야 하는 그림
W, H = 64, 64
s = src.copy(); s.thumbnail((W, H), Image.Resampling.LANCZOS)
out = Image.new('RGBA', (W, H), (0, 0, 0, 0)); out.paste(s, ((W - s.width) // 2, (H - s.height) // 2), s)
out.save('dist/client/assets/battle-ui/time-icon.webp', 'WEBP', quality=92)

# (나) 테두리·버튼·리본처럼 늘려 쓰는 9조각 그림: 비율 무시하고 정확히 맞춤
src.resize((640, 56), Image.Resampling.LANCZOS).save('dist/client/assets/battle-ui/gauge-frame.webp', 'WEBP', quality=92)

# (다) 가로로 반복되는 채움 그림: 정확히 맞춘 뒤, 투명 없이 저장
src.convert('RGB').resize((256, 32), Image.Resampling.LANCZOS).save('dist/client/assets/battle-ui/gauge-fill.webp', 'WEBP', quality=92)
```
- **꼬마 광부(M1)** 는 줄이기만 하고 **기준점이 안내도와 맞도록 옮기기**만 합니다(돌리거나 늘리지 않기).

### 2-3. 투명 배경이 안 나올 때
아주 진한 초록(#00FF00) 단색 배경에 그려 달라고 한 뒤 초록을 지웁니다.
```python
from PIL import Image
im = Image.open('초록배경그림.png').convert('RGBA'); px = im.load()
for y in range(im.height):
    for x in range(im.width):
        r, g, b, a = px[x, y]
        if g > 180 and r < 120 and b < 120: px[x, y] = (0, 0, 0, 0)
im.save('투명해진그림.png')
```
가장자리에 초록 테두리가 남으면 지운 뒤 한 번 더 `g > 140`으로 돌리세요.

### 2-4. 가로 반복 채움을 이음매 없이 만드는 법 (G1-2, G1-4)
```python
from PIL import Image
im = Image.open('채움.png').convert('RGB'); w, h = im.size
left = im.crop((0, 0, w // 2, h)); right = im.crop((w // 2, 0, w, h))
swapped = Image.new('RGB', (w, h)); swapped.paste(right, (0, 0)); swapped.paste(left, (w - w // 2, 0))
swapped.save('반으로_바꾼_채움.png')   # 가운데에 생긴 이음매를 이미지 도구로 지운 뒤 다시 반으로 바꾸면 끝이 이어집니다
```

### 2-5. 자가 검사와 빌드
```sh
python3 tools/check-gpt-art.py G1     # 카드 하나
python3 tools/check-gpt-art.py        # 전체 (마지막 줄 "켜도 되는 스위치" 확인)
python3 tools/build-web.py
python3 tools/build-web.py --check
node tools/preview.mjs --port 4173     # 브라우저로 http://127.0.0.1:4173/
```
미리보기에서 메뉴 → 설정 → 테스트 → GM을 켜면 모든 콘텐츠가 열립니다.

---

## 3. 카드 G1 · 보스 체력 게이지 5장 (스위치 `BOSS_GAUGE_ART`)

### 3-1. 어디에, 어떻게 보이나
- **안내도**: `art/gpt-guides/G1_boss-gauge_안내.png` (각 파일의 크기·투명 창·자르는 선, 그리고 화면 속 자리)
- 모든 위치·크기는 **412×915 폰 화면 기준**입니다.
- 스테이지 10·20·30…의 **지역 보스**, 그리고 던전·탑 보스가 나오면, 화면 위쪽 **스테이지 진행도 자리**(412px 폰 기준 화면 위에서 약 250~300px)에 나옵니다.
- 구성(위에서 아래로, 412px 폰 기준 실제 크기):
  1. 보스 이름 글씨 (게임이 씀, 17px)
  2. 왼쪽: **보스 문양** 원형 46px (이미 있는 `route-boss.webp`를 씀 — 그리지 않음)
  3. **빨간 체력 막대**: 가로 약 270px × 세로 19px. 가운데에 `91%` 같은 숫자를 게임이 씀
     → 막대 **테두리 = G1-1**, 막대 **채움 = G1-2**
  4. 그 아래 **노란 시간 막대**: 가로 약 250px × 세로 6px (스테이지 보스만, 30초 줄어듦)
     → 시간 막대 **테두리 = G1-3**, **채움 = G1-4**, 오른쪽 끝 **모래시계 메달 = G1-5**(화면 24px)
- 사용자 예시 그림처럼 **단순한 한 줄 게이지**입니다. 큰 창·판·배경판을 두르지 않습니다.

### 3-2. 추천 스타일 (왜 이 스타일인가)
**"오래 쓴 대장간 금속 틀 안에 담긴 진홍빛 생명"**
- 테두리: **얇은 고금 테두리**(두께는 화면에서 2~3px 느낌). 바깥은 그을린 검정 선, 안쪽은 밝은 금 반사 → 두께가 느껴짐. **위아래 변은 장식 없이 매끈**하고, **오른쪽 끝에만 작은 창끝(spearhead) 장식**, 왼쪽 끝은 보스 문양이 덮으므로 짧은 마감만.
- 체력 채움: **진홍 법랑/액체 같은 빨강.** 위 1/3에 은은한 광택 띠, 아래에 짙은 그림자. 가운데에 **아주 옅은 결**(녹은 쇳물이 흐른 듯한 미세한 물결 또는 가는 사선 결, 대비 10% 이하) — 가까이 봐야 보일 정도.
- 시간 막대: 체력 막대보다 **한 단계 가볍게**. 가는 짙은 청동 홈 안에 **호박빛 금 실**. 끝에 **놋쇠 모래시계 메달**.
- 이유: 화면을 거의 가리지 않으면서(예시처럼 한 줄), 금속·법랑 질감과 끝 장식 하나로 판타지 느낌을 냅니다. 모루·대장간 게임이라 **금속 틀** 이 세계관에 맞습니다.

### 3-3. G1-1 `battle-ui/gauge-frame.webp` — 빨간 막대 테두리
- **크기**: 640 × 56, 투명 배경. **9조각(가운데를 늘려 씀)**.
- **투명 창**: x 36~604, y 12~44 (568 × 32) — 이 안은 **완전히 투명**(빨간 채움이 비쳐 보이는 자리).
- **자르는 선**: 왼쪽 36px, 오른쪽 36px, 위 12px, 아래 12px. 게임은 이 그림을 약 0.6배로 줄여 막대 둘레에 씌웁니다.
- **그릴 것**
  - 창 둘레를 감싸는 **둥근 모서리 금속 테** (모서리 반지름 6~8px, 테 두께 6~8px).
  - 테 단면: 바깥 1~2px 그을린 검정(`#1A0F06`) → 금속 고금(`#E2BD73`) → 안쪽 1px 밝은 금(`#FFF0C2`) 반사 → 창 바로 바깥 1px 짙은 청동(`#7A5420`, 안으로 파인 홈 느낌).
  - 위 변은 밝게, 아래 변은 어둡게(빛이 위에서).
  - **오른쪽 끝 장식**(x 604~640 안에만): 테에서 오른쪽으로 튀어나온 **작은 창끝 모양** 금속(길이 약 22px, 높이 약 20px), 가운데에 **작은 진홍 보석 하나**(지름 6px).
  - **왼쪽 끝**(x 0~36 안에만): 둥글게 마감만. 큰 장식 없음(보스 문양이 덮음).
  - 위·아래 변(x 36~604)은 **처음부터 끝까지 같은 모양**(늘어나도 얼룩지지 않게). 긁힘·결도 균일하게.
- **프롬프트**:
  `9-slice game UI frame for a thin horizontal boss health bar, transparent rectangular window in the center, slim antique gold metal rim 6px thick with a dark soot outer line and a bright gold inner highlight, top edge lighter and bottom edge darker, plain uniform top and bottom edges, a small spearhead-shaped metal tip with one tiny crimson gem on the right end only, simple rounded cap on the left end, semi-realistic hand-painted fantasy RPG UI, subtle worn metal texture, no heavy ornaments, no black cartoon outline, not flat, transparent background, no text`
- **금지**: 창 안에 색·무늬, 테두리 전체 덩굴 장식, 두꺼운 판, 검은 굵은 외곽선.

### 3-4. G1-2 `battle-ui/gauge-fill.webp` — 빨간 체력 채움
- **크기**: 256 × 32, **꽉 채움(투명 없음)**. 게임이 **가로로 반복**해 붙이므로 **왼쪽 끝과 오른쪽 끝이 이어져야** 합니다(2-4 참고).
- **그릴 것**
  - 세로 그라데이션: 위 `#EF4A3D` → 가운데 `#C81D27` → 아래 `#8E0F19`.
  - 위쪽 3~9px에 **은은한 광택 띠**(흰빛 25~35%), 맨 아래 3px에 짙은 그림자.
  - 가운데에 **아주 옅은 결**: 녹은 쇳물/법랑이 흐른 듯한 가로 물결, 또는 가는 사선 결. 대비는 아주 약하게(10% 이하). **숫자(91%)가 그 위에 흰 글씨로 올라가므로** 무늬가 숫자를 방해하면 안 됩니다.
- **프롬프트**:
  `seamless horizontally tileable texture for a fantasy boss health bar fill, rich crimson red enamel like molten glass, brighter red at the top fading to deep dark red at the bottom, soft glossy highlight band near the top edge, very subtle flowing horizontal grain, low contrast, no symbols, no text, fills the whole image edge to edge`
- **금지**: 해골·문양·글자, 강한 줄무늬, 분홍색, 주황색이 강한 빨강.

### 3-5. G1-3 `battle-ui/time-frame.webp` — 노란 시간 막대 테두리
- **크기**: 384 × 24, 투명 배경, 9조각.
- **투명 창**: x 12~372, y 8~16 (360 × 8) — 완전히 투명.
- **자르는 선**: 왼·오른 12px, 위·아래 8px. 게임은 약 0.75배로 줄여 씁니다.
- **그릴 것**: 체력 테두리보다 **가볍게**. 짙은 청동(`#6B4A1C`) 가는 홈 테두리(두께 3~4px), 위쪽에 얇은 밝은 선 1px. 양 끝은 둥근 마감만, **장식 없음**(오른쪽 끝은 모래시계 메달이 덮음).
- **프롬프트**:
  `9-slice thin groove frame for a slim timer bar, transparent narrow window in the center, dark bronze metal rim 3px thick with a faint highlight line on top, plain rounded ends, uniform edges, semi-realistic hand-painted fantasy UI, transparent background, no text`

### 3-6. G1-4 `battle-ui/time-fill.webp` — 노란 시간 채움
- **크기**: 128 × 8, 꽉 채움, **가로 반복**(끝이 이어지게).
- **그릴 것**: 위 `#FFF3B8` → 가운데 `#F0BF3A` → 아래 `#B77A12`의 호박빛 금. 위쪽 1~2px 밝은 반사. 무늬 없음.
- **프롬프트**: `seamless horizontally tileable thin bar fill texture, warm amber gold, bright pale gold top fading to deep amber bottom, tiny highlight line at the top, no pattern, no text, fills the whole image`

### 3-7. G1-5 `battle-ui/time-icon.webp` — 모래시계 메달
- **크기**: 64 × 64, 투명 배경, **좌우 대칭, 정중앙, 둘레 여백 4px**. 화면에서 **24px**.
- **그릴 것**
  - 둥근 메달: 짙은 갈색 바탕(`#2A1A0C`)에 **고금 테**(위 밝게, 아래 어둡게 → 동전처럼 두께).
  - 가운데 **놋쇠 모래시계**: 위·아래 받침판, 유리 안에 **호박빛 금 모래**가 아래에 쌓이고 가는 줄기로 떨어지는 모습.
  - 24px에서도 모래시계로 읽히게 **굵고 단순한 덩어리**로. 잔선 금지.
  - 보스 문양(`route-boss.webp`)의 금테와 **같은 금속 색**.
- **프롬프트**:
  `small round medallion icon for a boss battle timer, dark brown disc with a beveled antique gold rim brighter on top, a simple brass hourglass in the center with glowing amber sand, bold clear silhouette readable at 24 pixels, perfectly symmetrical, semi-realistic hand-painted fantasy RPG icon, no black outline, transparent background, no text`

### 3-8. G1 확인
1. `python3 tools/check-gpt-art.py G1` → 5장 모두 `통과`.
   - 검사하는 것: 크기, 창이 완전히 투명한지, 위아래 변이 고른지(장식이 끝 밖으로 나왔는지), 채움이 꽉 찼는지, 채움 양 끝이 이어지는지, 메달 대칭·여백.
2. `battle-presentation.js` 맨 위 `const BOSS_GAUGE_ART=false;` → `true`, 빌드 2줄.
3. 미리보기 → GM → 스테이지 60(또는 10, 20…)으로 이동 → 게이지 확인. 던전 → 아무 던전 입장해도 같은 게이지(시간 막대 없음).
4. 볼 것: 테두리가 막대에 딱 맞는지(창 밖으로 빨강이 안 새는지), `91%` 숫자가 잘 읽히는지, 오른쪽 창끝 장식이 찌그러지지 않았는지, 모래시계가 24px에서 보이는지.

---

## 4. 카드 M1 · 꼬마 광부 2장 (스위치 `MINER_ART`)

폴더: `dist/client/assets/star-mine/`

게임에는 지금 **코드로 그린 꼬마 광부**가 들어가 있습니다. 같은 캐릭터를 **반실사 판타지 화풍의 그림 2장**으로 바꾸는 카드입니다. 게임은 두 장을 겹쳐 놓고, 팔 그림만 어깨를 축으로 돌려서 곡괭이를 휘두릅니다.

- **반드시 먼저 볼 것**: 안내도 `art/gpt-guides/M1_miner_기준점.png`
  - 왼쪽: 몸 그림, 가운데: 팔+곡괭이 그림, 오른쪽: 둘을 겹친 모습
  - 이 안내도의 캐릭터 **그대로** (자세·비율·위치) 그리되, 화풍만 고급스럽게 칠합니다.

### 4-0. 화면 속 자리
- **화면 캡처**: `art/gpt-guides/M1_miner_화면위치.png` (왼쪽: 기다리는 자세, 오른쪽: 곡괭이를 내려친 순간)
- 던전 → 별의 광산 → 채굴 시작. 광산 그림이 화면을 꽉 채우고, 광부는 **화면 아래쪽 1/4, 왼쪽~가운데 바닥**에 서서 오른쪽 벽 아래의 **보라 광석**을 칩니다.
- 412×915 폰 기준 광부 그림 한 장의 크기는 약 **240×240px**(480px 그림을 절반으로 줄여 씀). 머리~발 높이는 화면에서 약 160px.
- 광산 배경은 어둡고 보랏빛이며 왼쪽에서 등불빛이 들어옵니다 → 광부도 **왼쪽 위에서 따뜻한 빛**, 오른쪽 아래 그림자. 헬멧 램프의 노란빛이 얼굴 오른쪽을 살짝 비춥니다.

### 4-1. 캐릭터 설정 (그대로 지킬 것)
- 2~2.5등신의 꼬마 광부. **머리가 몸보다 큼**. 오른쪽(광석 쪽)을 보는 3/4 옆모습.
- **헬멧**: 둥근 놋쇠 광부 헬멧(#E2AD52, 위는 밝게 #FFE7A6, 아래 테는 #B57A33). 이마 앞 램프 안에 **노란 별**(#FFC94A)이 빛나고, 램프 둘레에 은은한 노란 빛.
- **얼굴**: 살구빛 피부(#F3C39D), 커다란 까만 눈 두 개(흰 반짝임 점), 분홍 볼, 작게 웃는 입. 헬멧 뒤로 갈색 머리카락 조금.
- **옷**: 보라 작업복(#8A6A9E → #4B3560), 그 위에 가죽 앞치마(#A7764E), 짙은 갈색 허리띠에 금빛 버클, 앞치마 단추 2개(금빛).
- **스카프**: 진한 보라(#8C5AD6) 목도리, 꼬리가 뒤(왼쪽)로 날림.
- **신발**: 짙은 갈색 가죽 부츠 두 짝.
- **팔·곡괭이**: 보라 소매, 갈색 가죽 장갑 두 손으로 나무 손잡이를 쥠. 곡괭이 머리는 은빛 쇠(#E9EEF5 → #4C5566), 손잡이와 머리 사이에 놋쇠 띠.

### 4-2. 파일 1 `star-mine/miner-body.webp` — 몸
- **크기**: 480 × 480, 투명 배경.
- **들어갈 것**: 헬멧·머리·얼굴·스카프·몸·앞치마·부츠·발밑 그림자. **팔과 곡괭이는 빼고** 그립니다(어깨에서 끊김 → 팔 그림이 덮음).
- **위치(픽셀, 왼쪽 위가 0,0)**: 두 부츠 사이 가운데 바닥 = **(164, 456)**. 머리 꼭대기(헬멧)는 y ≈ 136. 그림은 **왼쪽 절반(x 60~290)** 안에만.

### 4-3. 파일 2 `star-mine/miner-arm.webp` — 팔과 곡괭이 (내려친 순간 자세)
- **크기**: 480 × 480, 투명 배경. 몸 그림과 **같은 판 위의 같은 자리**에 그립니다(두 장을 겹치면 안내도 오른쪽 그림이 됨).
- **들어갈 것**: 두 팔(어깨부터), 장갑 낀 두 손, 곡괭이. **머리·몸은 그리지 않습니다.**
- **위치**
  - **어깨(팔이 시작하는 곳, 회전 축)**: **(184, 324)**
  - **곡괭이 날 끝(광석에 닿는 점)**: **(428, 372)** — 곡괭이가 오른쪽으로 뻗고 날이 아래로 꽂히는 자세
  - 손잡이는 손(약 (240~270, 345))에서 오른쪽 위 (392, 292) 쪽으로 뻗고, 그 끝에 곡괭이 머리가 손잡이와 직각으로 붙습니다.
- 게임이 이 그림을 어깨 축으로 **-115°(뒤로 치켜든 자세)까지** 돌립니다. 그러니 팔이 어깨에서 **둥글게 시작**해야 돌려도 어깨가 끊겨 보이지 않습니다.

### 4-4. 프롬프트
- **몸**: `cute chibi star miner character, 2.5 heads tall, three-quarter view facing right, round brass miner helmet with a small glowing star lamp on the front, big dark sparkling eyes, rosy cheeks, small smile, brown hair under the helmet, purple work suit with leather apron and gold buckle belt, violet scarf with tail blowing back, brown leather boots, NO arms and NO tool (shoulders end cleanly), soft contact shadow under the boots, semi-realistic hand-painted fantasy mobile game style, warm lantern light from the upper left, transparent background, no text`
- **팔**: `the two arms of the same chibi star miner, purple sleeves and brown leather gloves gripping a wooden pickaxe handle with both hands, pickaxe extended to the right with the curved steel blade pointing down at the moment of impact, brass band at the head, arms start with rounded shoulders on the left, NO head and NO body, same painting style and light as the body, transparent background, no text`
- 두 프롬프트 모두 **안내도 `M1_miner_기준점.png`를 참고 그림으로 함께 넣으세요.**

### 4-5. 맞추기와 검사
1. 각 그림을 480×480 판에 놓고, 안내도의 표시점(발, 어깨, 곡괭이 끝)에 맞도록 **옮기기·크기만** 조정합니다.
2. `python3 tools/check-gpt-art.py M1` → 둘 다 `통과`.
3. `battle-presentation.js` 맨 위의 `const MINER_ART=false;` → `true` → 빌드 명령 2줄.
4. 던전 → 별의 광산 → 채굴 시작 → 화면을 눌러 곡괭이 끝이 광석에 닿는지 봅니다.

---

## 5. 다시 그리는 카드 R2~R5 (이미 켜져 있음 — 같은 이름으로 덮어쓰기)

> 공통 화풍(1장)을 그대로 따릅니다. 특히 1-2의 O/X 표.

### 5-1. R2 `combat-fx/crit-burst.webp` — 치명타 폭발 (다시)
- **무엇이 문제였나**: 빨강·주황 렌즈 플레어(카메라 빛 번짐)라 '쾅 때렸다'가 아니라 '빛이 반짝'으로 보입니다. 빨강이 금색 치명타 숫자와 부딪힙니다.
- **크기**: 256 × 256, 투명 배경. 화면에서 약 76px, 0.5초 동안 커지며 사라집니다. 밝게 더하기(screen)로 겹치므로 **어두운 색은 보이지 않습니다.**
- **그릴 것: 금빛 충격 파열**
  1. **가운데**: 흰색에 가까운 금빛 중심(#FFF6D8), 지름 약 50px.
  2. **충격 고리**: 중심 둘레에 얇게 깨진 금빛 원형 충격파 한 줄(#FFD36A), 지름 약 150px. 고리는 끊어진 조각 6~8개로.
  3. **빛살**: 굵고 짧은 쐐기 모양 빛살 **6줄**(길이 들쭉날쭉, 가장 긴 것이 가장자리에서 16px 안쪽까지). 가는 선 빛살·렌즈 플레어 줄무늬는 넣지 않습니다.
  4. **불티**: 바깥쪽으로 튀는 작은 금빛 불똥 8~12개.
  5. **색 범위**: 흰 금 → 금 → 따뜻한 호박색(#F2A33A)까지만. **빨강·분홍·파랑은 쓰지 않습니다.**
  6. 둘레 16px은 완전히 투명.
- **프롬프트**:
  `critical hit impact burst VFX sprite for a fantasy mobile RPG, white-gold hot core, a broken golden shockwave ring made of 6 to 8 fragments, six thick short wedge-shaped light spikes of uneven length, small golden sparks flying outward, colors only white gold to gold to warm amber, no red, no pink, no blue, no lens flare streaks, punchy and solid like a hammer strike, centered, soft transparent falloff, transparent background, no text`
- 검은 배경 위에 그려졌다면 0-2의 '투명 배경이 안 나올 때'처럼 지우되, **어두운 부분이 남으면 화면에서 지저분한 테두리가 됩니다.** 가장자리 반투명이 남지 않게 지우세요.

### 5-2. R3 `ui-kit/btn-gold.webp`, `ui-kit/btn-purple.webp` — 버튼 두 장 (다시)
- **무엇이 문제였나**: 납작한 플라스틱 판 같습니다. 두께가 안 느껴지고 모서리 장식이 거의 안 보입니다. 보라는 파스텔(분유색)입니다.
- **크기**: 각 192 × 72, 투명 배경, **모서리 24px 9조각 규칙 그대로**(안내도 `art/gpt-guides/A17_button_안내.png`).
- **두께를 만드는 다섯 겹**(위에서 아래로, 금색 기준):
  1. **바깥 테**: 2px 짙은 금(#8A5A22) 선. 버튼 윤곽.
  2. **안쪽 금속 테**: 그 안에 2px 밝은 금(#F6D48A) 선. 위쪽은 더 밝고(#FFF0C4) 아래쪽은 어둡게(#B07A35) → 가장자리가 둥글게 솟아 보입니다.
  3. **판**: 위 45%는 밝은 크림 금(#FCE7B0) → 아래로 진한 호박 금(#D39A4C). 위와 아래 색 차이를 **지금보다 확실히** 크게.
  4. **위 반사**: 판 맨 위 4~6px에 흰빛 띠(투명도 50%). **왼쪽 끝부터 오른쪽 끝까지 같은 굵기·같은 밝기로** 이어지게 합니다(게임이 가운데를 늘려 쓰므로, 띠가 가운데에서만 밝으면 늘어날 때 얼룩이 됩니다).
  5. **아래 그림자**: 판 맨 아래 3px에 진한 갈색(#7A4A1C) 그림자 줄.
  - **모서리 장식**: 네 모서리 24px 안에만, 작은 금속 꺾쇠(ㄱ자) 또는 작은 리벳(지름 4px) 하나. 지금보다 **진하게**(#7A4A1C 선) 그려서 보이게.
  - **가운데는 그라데이션만.** 무늬·글씨 없음.
- **보라 버튼**: 모양·겹은 금색과 **똑같이**, 색만 바꿉니다.
  - 바깥 테 #3A2350, 안쪽 테 #C9A6E6(위)~#6C4A8C(아래), 판 #9A6CC0(위) → #4A2D66(아래), 아래 그림자 #2A1838.
  - **파스텔 금지**: 판 위쪽도 #9A6CC0보다 밝게 하지 않습니다. 진한 자수정 보석 느낌.
- **프롬프트(금)**:
  `9-slice mobile RPG button, thick beveled gold metal plate with visible depth, dark gold outer rim, bright inner metal rim lighter on top and darker at the bottom, cream gold top fading strongly to deep amber bottom, white glossy highlight strip along the whole top edge, dark brown shadow line along the bottom edge, tiny dark metal corner brackets or rivets only inside the 24px corners, plain gradient center for text, semi-realistic hand-painted fantasy UI, not flat, not plastic, transparent background, no text`
- **프롬프트(보라)**: 위 문장의 `gold metal plate`를 `deep amethyst purple enamel plate with silver-violet metal rims`로, `cream gold top fading strongly to deep amber bottom`을 `medium amethyst top fading strongly to deep violet bottom, not pastel`로 바꿉니다.
- 만든 뒤 `src.resize((192, 72))`로 정확히 맞추고 `python3 tools/check-gpt-art.py A17~A19`를 통과시킵니다(카드 이름은 `A17~A19` 그대로 입력).

### 5-3. R4 `ui-kit/lock-badge.webp` — 자물쇠 배지 (다시)
- **무엇이 문제였나**: 아이콘 모음집 같은 만화체 자물쇠(두꺼운 노란 판·단순한 열쇠 구멍)라 다른 그림과 화풍이 다릅니다.
- **크기**: 64 × 64, 투명 배경, **좌우 대칭, 정중앙, 둘레 여백 4px**. 화면에서 19~20px.
- **그릴 것**
  1. **원판**: 짙은 자주 법랑(#3A1630 가운데 → #22101E 가장자리), 위쪽에 작은 흰 반사 한 점.
  2. **테**: 3px 금속 금테. 위쪽은 밝게(#F6D48A), 아래는 어둡게(#8A5A22) → 동전처럼 두께가 보이게.
  3. **자물쇠**: 낡은 **쇠·청동 맹꽁이 자물쇠**. 몸통은 둥근 어깨의 방패 모양, 고리(걸쇠)는 두꺼운 반원. 몸통 가운데에 작은 열쇠 구멍. 색은 어두운 청동(#9C7A45)에 위쪽 모서리만 밝은 금(#F2D493) 반사.
  4. 자물쇠는 원판 지름의 약 55%. 20px로 줄여도 자물쇠로 읽히게 **덩어리로** 그리고, 잔선은 넣지 않습니다.
- **금지**: 평면 노란 자물쇠, 굵은 검은 외곽선, 이모지 느낌.
- **프롬프트**:
  `small round locked-feature badge for a fantasy mobile RPG, dark plum enamel disc with a tiny glossy highlight, thick beveled gold coin rim brighter on top darker at the bottom, an old bronze-and-iron padlock with rounded shield-shaped body and thick shackle centered on the disc, small keyhole, warm metal highlights on the upper edges, semi-realistic hand-painted metal, perfectly symmetrical, bold silhouette readable at 20 pixels, not cartoon, not flat, no black outline, transparent background, no text`

### 5-4. R5 `ui-kit/ribbon-red.webp`, `ui-kit/ribbon-gold.webp` — 리본 두 장 (다시)
- **무엇이 문제였나**: 단색 띠라 종이처럼 보입니다.
- **크기**: 각 160 × 40, 투명 배경. **왼쪽 끝 곧게, 오른쪽 끝 제비꼬리**, 안내도 `art/gpt-guides/A21_ribbon_안내.png` 그대로.
- **이번에 더할 것**
  1. **비단 광택**: 띠 위쪽 1/3에 가로로 길게 밝은 광택(빨강은 #F27A8C, 금은 #FFF1C8). 가운데 글씨 자리(가로 15~80%, 세로 25~75%)는 **고른 색**을 유지해야 하므로 광택은 그 위쪽(세로 8~25%)에만.
  2. **접힌 끝**: 오른쪽 제비꼬리 쪽 20px은 조금 더 어둡게(빨강 #7E1A2C, 금 #A8742E) 칠해 뒤로 접힌 느낌.
  3. **금선**: 위아래 가는 금선(1~2px, #F2D493)은 지금처럼.
  4. **왼쪽 끝**: 카드 가장자리 안으로 들어가는 쪽이라 맨 왼쪽 4px만 살짝 어둡게.
- **프롬프트(빨강)**:
  `horizontal satin silk ribbon label for a shop card, rich crimson red with a soft glossy sheen band along the upper edge only, thin gold trim lines on top and bottom, straight left end slightly shaded, swallowtail notch on the right end with a darker folded tail, perfectly even flat color in the middle area for text, semi-realistic hand-painted fantasy mobile RPG UI, transparent background, no text`
- **프롬프트(금)**: 위 문장의 `rich crimson red`를 `warm antique gold`로 바꿉니다.
- `python3 tools/check-gpt-art.py A20~A22`를 통과해야 합니다(가운데가 고르지 않으면 `plain_middle`에서 걸립니다).

---

## 6. 넘길 때 (GPT → 사용자 → Claude)
1. 바꾼 그림 **13장**의 파일 이름 목록.
2. `python3 tools/check-gpt-art.py` 전체 결과(마지막 줄 포함)를 텍스트 파일로: `fix13-그림-검사결과.txt`.
3. 미리보기 화면 캡처 4장(412px 폭): ① 스테이지 60 보스 게이지 ② 광산 채굴 중(곡괭이를 내려친 순간) ③ 상점 교환 탭(버튼·리본) ④ 홈 화면(잠금 배지).
4. 게임 폴더 전체를 zip으로 (unity 폴더 빼고) → 사용자가 GitHub `test1`에 올림.
5. **코드 파일을 고쳤다면 반드시 적어 주세요**(원래는 스위치 2줄만 바뀌어야 정상: `BOSS_GAUGE_ART`, `MINER_ART`).

## 7. 참고: 지금 들어가 있는 그림 현황
| 카드 | 그림 | 상태 |
|---|---|---|
| A13 | `route-boss.webp` | 사용 중 (진행도 끝 + 보스 게이지 문양) |
| A13 | `boss-medal.webp`, `boss-frame.webp` | **안 씀** (보스 창을 한 줄 게이지로 바꿈) |
| A14 | `crit-burst.webp` | 사용 중 → **R2로 다시** |
| A15 | `ore-node-0~3.webp`, `gem.webp` | 사용 중 (잘 됨) |
| A15 | `pick-hand.webp` | **안 씀** (꼬마 광부 M1로 바뀜) |
| A16 | `boss-warning.webp` | 사용 중 |
| A17~A19 | `panel-frame`, `divider`, `nav-glow` | 사용 중 (잘 됨) |
| A17 | `btn-gold`, `btn-purple` | 사용 중 → **R3로 다시** |
| A20~A22 | `wallet-frame`, `plus-badge` | 사용 중 (잘 됨) |
| A21~A22 | `ribbon-red`, `ribbon-gold`, `lock-badge` | 사용 중 → **R4·R5로 다시** |
