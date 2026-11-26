# 성좌 각인 그림 — 상세 작업 지시서 (카드 A3 대체)

이 파일은 통합 지시서의 **카드 A3를 대신하는 상세판**입니다. 새 대화에 통합 지시서의 **[공통 규칙]** 블록을 먼저 붙이고, 그 아래에 이 파일의 "작업 카드" 블록을 붙여 넣으면 됩니다.

## 이 게임에 어울리는 화풍 (사람이 읽는 부분)

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

---

## 작업 카드 (이 블록을 그대로 붙여 넣기)

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
