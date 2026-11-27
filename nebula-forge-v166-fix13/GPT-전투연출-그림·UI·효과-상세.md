# 성운의 모루 · 전투 연출·UI 검수 보고서와 GPT 작업 지시서 (v166-fix13)

이 문서는 두 부분입니다.

- **1부 · 검수 보고서**: Claude가 게임을 화면마다 직접 띄워 찾은 문제와, 코드로 이미 고친 것.
- **2부 · GPT 작업 카드 A13~A22 + 재작업 카드 R1~R5**: GPT가 그릴 그림 목록. 그림만 정해진 자리에 넣고 스위치 한 줄만 바꾸면 게임에 바로 나오도록 코드가 미리 연결되어 있습니다.

> **GPT에게(수정본 13):** 이번에 할 일은 **카드 M1(꼬마 광부 2장)** 과 **재작업 카드 R2~R5**입니다. R1(곡괭이 손)은 광부 캐릭터로 바뀌어 **취소**됐습니다. A13~A22는 이미 들어가 있으니 다시 그리지 마세요.
>
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

이어서 처리한 세 가지(수정본 11):

| 부분 | 문제 | 처리 |
|---|---|---|
| 상단 재화 칸(골드·다이아·성운석) | 22px 아이콘이 칸 안에 갇혀 작아 보임 | **코드로 고침**: 아이콘을 36px로 키워 칸 왼쪽 밖으로 걸치게 함. 칸은 둥근 캡슐에 금빛 테. `+`는 금빛 원 배지. 그림 카드는 A20 |
| 상점·우편 카드 | 모두 같은 상자라 중요도가 안 보임 | **코드로 고침**: 리본을 붙임(그림 카드는 A21). 아래 표 참고 |
| 하단 메뉴·바로가기의 잠금 | 이름 밑에 "STAGE 40" 줄과 자물쇠가 붙어 답답함 | **코드로 고침**: 아이콘 오른쪽 위 작은 자물쇠 배지만 남기고, 잠긴 아이콘은 흐리게 함. 누르면 "STAGE 40 클리어 시 열립니다"가 뜸. 그림 카드는 A22 |

리본이 붙는 곳:

| 위치 | 리본 | 색 |
|---|---|---|
| 상점 · 일일 선물 | `무료` (받은 뒤에는 `수령 완료`) | 빨강 (받은 뒤 회색) |
| 상점 · 패키지 · 한정 구성 | `한정` | 금색 |
| 상점 · 다이아 · 가장 큰 상품 | `최고 가치` | 금색 |
| 우편 · 보상이 있는 편지 | `보상` | 빨강 |
| 우편 · 안 읽은 편지 | 봉투 옆 빨간 점 | 빨강 |

## 8. 이번에 손대지 않은 것(2단계 제안)

- **몬스터 동작 그림**: 몬스터는 그림 한 장을 통째로 움직이는 방식이라 맞는 동작, 쓰러지는 동작 그림이 없습니다. 보스 10종에 '맞는 자세' 그림 4장씩을 그리는 일이 다음으로 효과가 큽니다. 코드도 그에 맞게 고쳐야 해서 따로 진행하는 것을 권합니다.
- **스킬 효과 그림**: (수정본 9에서 처리) 60종 모두 16장 → 36장으로 늘리고, 원본 그림 사이를 섞어 중간 장면을 만들었습니다. 재생 시간도 1.4배(0.6~1.1초)로 늘렸습니다. 도구: `tools/bake-skill-effects-smooth.py`. 그림을 새로 그릴 필요는 없습니다.
- **소리**: 소리 기본값이 꺼져 있습니다. 치명타도 일반 공격 소리를 그대로 씁니다. 소리 카드는 그림이 끝난 뒤 따로 드리겠습니다.

---

## 9. GPT 그림을 넣은 판 검수 (수정본 12)

GPT가 A13~A22 그림 21장을 넣고 스위치 6개를 모두 켠 판(test1 `NebulaForge-Web-v166-fix11-A13-A22.zip`)을 412px 화면으로 모두 띄워 봤습니다. 자가 검사는 21장 모두 통과했고, 테스트 87개도 통과합니다. 그런데 화면에서 보면 아래 문제가 있었습니다.

### 코드로 고친 것
| 화면 | 문제 | 고친 내용 |
|---|---|---|
| 보스 등장 | WARNING 띠 위에 데미지 숫자와 스킬 이름이 겹쳐 지저분함 | 경고 띠가 나오는 1.7초 동안은 숫자·스킬 이름을 잠시 숨김 |
| 전투 숫자 | 연타 숫자가 같은 자리(10px 차이)에 떠서 `-9,994` `-9,995`가 `-9,994995`처럼 한 덩어리로 보임 | 0.34초 안에 이어지는 숫자는 계단처럼 22px씩(치명타 32px) 위로 쌓고, 좌우 간격도 2배로 |
| 스킬 이름 | 보스 머리 위(숫자가 뜨는 자리)에 나와 숫자와 겹침 | 캐릭터 머리 위 왼쪽에 작은 띠로 옮김 |
| 타격 반짝임 | 맞을 때 보스가 통째로 하얗게 바래 보임 | 밝기 2.6배 → 1.75배(치명타), 1.9배 → 1.4배(일반), 색 빠짐 제거 |
| 별의 광산 | 광맥 그림이 가운데 상자에만 있고 위아래가 빈 검은 띠 | 광맥이 화면 전체를 채우고, 세로로 긴 폰에서도 빛나는 광맥이 화면 안에 오도록 그림 위치를 자동 조정 |
| 별의 광산 | 광석이 작고 `+1` 글씨가 잘 안 보임 | 광석 84~150px → 110~200px, 글씨 16 → 20px, 콤보 표시는 시간 막대 아래로 |
| 채굴 완료 | 결과 창과 "보상 수령 완료" 알림이 동시에 두 번 뜸 | 결과 창만 띄우고 알림은 생략 |
| 설정 스위치 | 꺼짐(OFF)인데 손잡이가 밝은 금색이라 켜진 것처럼 보임 | 꺼짐일 때 손잡이를 어두운 회색으로 |

### 그림이 약한 것 → 2부 끝 재작업 카드 R1~R5
| 그림 | 문제 |
|---|---|
| `pick-hand.webp` | 장갑 손이 왼쪽 아래 모서리의 작은 주먹뿐이라, 화면에서 "손으로 쥐었다"가 안 보임. 곡괭이와 따로 붙인 티가 남 |
| `crit-burst.webp` | 빨강·주황 렌즈 플레어(사진 빛 번짐) 느낌. 금색 치명타 숫자와 색이 부딪히고 '때렸다'는 느낌이 없음 |
| `btn-gold.webp`, `btn-purple.webp` | 플라스틱처럼 납작함. 두께(위 반사·아래 그림자)가 거의 없고 모서리 장식이 안 보임. 보라는 파스텔 톤 |
| `lock-badge.webp` | 아이콘 모음집 같은 만화체 자물쇠. 다른 그림(반실사 판타지)과 화풍이 다름 |
| `ribbon-red.webp`, `ribbon-gold.webp` | 단색 띠. 비단 주름·광택이 없어 종이처럼 보임 |

잘 된 것(그대로 둠): 경로 보스 문장, 보스 메달, 보스 창 테두리, 광석 4단계, 보석, 경고 띠, 팝업 테두리, 구분선, 하단 메뉴 빛, 재화 칸, `+` 단추.

## 10. 수정본 13 (사용자 피드백 반영)

| 요청 | 바꾼 것 |
|---|---|
| 보스 체력 창이 공간만 차지하고 다 가림 | 테두리 창을 없애고 사용자 예시대로 바꿨습니다: 위에 보스 이름, 왼쪽에 보스 문양(`route-boss.webp`), 굵은 빨간 막대 안에 남은 체력 %, 아래에 노란 시간 막대와 시계. 그래서 A13-2 `boss-medal`, A13-3 `boss-frame` 그림은 **더 이상 쓰지 않습니다**(지우지는 않음). |
| 보스가 나오면 진행도 자리에 체력바 | 보스가 나오면 스테이지 진행도가 사라지고 **그 자리에** 체력바가 나옵니다. 던전·탑도 같은 바입니다. |
| 진행도 노란 공이 도형에 색만 칠한 것 같음 | 가는 금실 선 위에 **깎은 보석 모양 마름모**로 바꿨습니다. 지난 웨이브는 금빛, 남은 웨이브는 빈 테두리, 지금 웨이브는 조금 크고 빛이 퍼지는 고리. |
| 광산에 곡괭이와 손만 있음 | **꼬마 광부 캐릭터**(별 램프 헬멧, 보라 스카프)가 광석 앞 바닥에 서서, 누를 때마다 곡괭이를 치켜들었다 내려칩니다. 숨쉬기·눈 깜빡임·램프 깜빡임·스카프 흔들림이 있습니다. 광석은 벽 아래 바닥으로 옮겼습니다. 지금은 코드로 그린 캐릭터이고, **카드 M1** 그림이 오면 그림으로 바뀝니다. |
| 화면 흔들림이 너무 큼, 이펙트로 타격감 | 흔들림을 5~7px → 2~3px로 줄였습니다. 대신 **모든 평타·스킬이 맞는 자리에 '타격 섬광'**(흰 중심 섬광 + 퍼지는 충격 고리 + 튀는 빛줄기, 스킬은 베기 호까지)이 몬스터 그림 **위에** 터집니다. 스킬 속성 색(불·얼음·번개…)을 따릅니다. 월드보스도 같습니다. |
| 월드보스가 너무 가까움 | 용을 오른쪽 뒤로 물리고(땅 높이 14% → 19%) 크기는 더 키웠습니다(화면 폭의 108%). **꼬리·뒷다리는 화면 오른쪽 밖으로** 잘립니다. 캐릭터와 거리가 생겼습니다. |
| 스테이지 보스도 너무 가까움 | 보스 크기 66% → 55%, 던전 보스 64% → 55%. |
| 보스가 그냥 떡 하고 생김 | 보스 단계가 되면 캐릭터가 웨이브 사이처럼 앞으로 걷고, **보스가 오른쪽에서 묵직하게 세 걸음 걸어 들어오며** 발밑에 흙먼지가 일어납니다. 보스 제한시간 규칙(30초)은 그대로입니다. |

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
7. **바꿀 코드는 단 한 곳**: `dist/client/battle-presentation.js` 맨 위의 스위치 6줄뿐입니다.
   ```js
   const BATTLE_UI_ART=false;   // A13
   const COMBAT_FX_ART=false;   // A14
   const MINE_ART=false;        // A15
   const BOSS_INTRO_ART=false;  // A16
   const UI_KIT_ART=false;      // A17~A19
   const UI_EXTRA_ART=false;    // A20~A22
   ```
   카드의 그림을 **전부** 넣은 뒤에만 그 카드의 줄을 `true`로 바꿉니다. 하나라도 빠졌으면 `false`로 둡니다.
8. **스위치를 바꾼 뒤 반드시 실행할 명령**(게임 폴더에서):
   ```sh
   python3 tools/build-web.py
   python3 tools/build-web.py --check
   ```
   두 번째 명령이 오류 없이 끝나야 합니다.

## 0-2. 만드는 방법 (순서 · 변환 · 자가 검사 · 화면 확인)

### 하는 순서
**한 번에 한 카드씩** 진행합니다. 카드 하나를 끝내고 검사를 통과하면 스위치를 켜고 다음 카드로 넘어갑니다. 화면에 잘 보이는 것부터 하면 됩니다.

1. A13 전투 UI(보스 체력 창, 경로 보스 문장)
2. A17~A19 UI(버튼, 팝업, 구분선, 탭 빛)
3. A16 보스 경고 띠
4. A15 광산
5. A14 치명타 폭발
6. A20~A22 재화 칸, 리본, 잠금 배지

### 기준 그림(안내도) — 그리기 전에 반드시 보기
`art/gpt-guides/` 폴더에 카드별 안내도가 있습니다. 이미지를 만들 때 참고 그림으로 함께 넣으세요.

| 안내도 | 무엇을 알려 주나 |
|---|---|
| `A13-1_route-boss_안내.png` | 원 바깥 한계(여백 4%)와 좌우 대칭 축 |
| `A13-2_boss-medal_안내.png` | 고리 바깥 한계와, 완전히 투명하게 비울 안쪽 원(70%) |
| `A13-3_boss-frame_안내.png` | 빨강=모서리 28px(장식은 여기만), 파랑=변(같은 무늬 반복), 초록=가운데(고르게) |
| `A15-1_pick-hand_기준점.png` | 기존 곡괭이 위에 날 끝 (375,152)과 손잡이 축 (53,334) 표시 |
| `A16-1_boss-warning_안내.png` | 글씨가 들어갈 가운데 60% |
| `A17_button_안내.png` | 버튼 모서리 24px 규칙(빨강·파랑·초록) |
| `A18-1_panel-frame_안내.png` | 팝업 모서리 48px 규칙 |
| `A20-1_wallet-frame_안내.png` | 재화 칸 모서리 24px 규칙과 숫자 자리 |
| `A21_ribbon_안내.png` | 리본의 글씨 자리와 오른쪽 끝 모양 |

화풍 참고 그림으로 게임의 기존 그림도 함께 넣으면 톤이 맞습니다.
- `dist/client/assets/boss-challenge.webp`: 보스 도전 버튼
- `dist/client/assets/critical-hit.webp`: 기존 치명타
- `dist/client/assets/weapon-forge/smith-strike.webp`: 장갑 낀 손
- `dist/client/assets/star-mine/vein.webp`: 광산 배경
- `dist/client/assets/ui-regalia/small-home.webp`: 하단 메뉴 아이콘

### 이미지 만들기 → webp로 바꾸기
이미지 생성 도구는 보통 PNG를 줍니다. 아래 파이썬 코드로 **정확한 크기의 투명 webp**로 바꿉니다. 파일 이름과 크기만 바꿔서 쓰면 됩니다.

```python
from PIL import Image
src = Image.open('만든그림.png').convert('RGBA')          # 생성된 그림
W, H = 128, 128                                              # 카드에 적힌 크기
src.thumbnail((W, H), Image.Resampling.LANCZOS)              # 비율 유지하며 줄이기
out = Image.new('RGBA', (W, H), (0, 0, 0, 0))                # 투명한 판
out.paste(src, ((W - src.width) // 2, (H - src.height) // 2), src)   # 가운데 놓기
out.save('dist/client/assets/battle-ui/route-boss.webp', 'WEBP', quality=92)
```

- **9조각 그림(버튼, 팝업, 보스 창 테두리)**: 비율을 유지하지 말고 `src.resize((W, H), Image.Resampling.LANCZOS)`로 정확히 맞춥니다.
- **곡괭이(`pick-hand.webp`)**: 줄이거나 옮기지 않습니다. 380×380으로 그려서 기준점이 맞아야 합니다.

### 투명 배경이 안 나올 때
이미지 도구가 투명 배경을 못 만들면, **아주 진한 초록 단색 배경(#00FF00)** 위에 그려 달라고 한 뒤 초록을 지웁니다. 그림에 초록색이 많으면 배경을 진한 분홍(#FF00FF)으로 하고, 코드의 조건을 분홍에 맞게 바꿉니다.

```python
from PIL import Image
im = Image.open('초록배경그림.png').convert('RGBA')
px = im.load()
for y in range(im.height):
    for x in range(im.width):
        r, g, b, a = px[x, y]
        if g > 180 and r < 120 and b < 120:      # 초록 배경 → 투명
            px[x, y] = (0, 0, 0, 0)
im.save('투명해진그림.png')
```

### 자가 검사 (반드시)
그림을 넣은 뒤 게임 폴더에서 실행합니다.

```sh
python3 tools/check-gpt-art.py          # 전체
python3 tools/check-gpt-art.py A13      # 카드 하나
```

- 파일마다 `통과` 또는 `고칠것 → 이유`가 나옵니다. 이유를 읽고 고친 뒤 다시 돌립니다.
- 검사하는 것
  - 크기와 투명 배경
  - 대칭
  - 9조각 규칙: 변에 장식이 있는지, 가운데에 무늬가 있는지
  - 메달 가운데가 비었는지
  - 곡괭이 기준점
  - 광석 4단계가 같은 자리에 있는지
- 마지막 줄 **"켜도 되는 스위치"**에 나온 스위치만 `true`로 바꿉니다.

### 화면에서 확인
스위치를 켜고 빌드 명령 2줄을 실행한 뒤, 게임 폴더에서 아래를 실행합니다.

```sh
node tools/preview.mjs --port 4173
```

브라우저로 `http://127.0.0.1:4173/`을 엽니다. 메뉴 → 설정 → 테스트 → GM을 켜면 모든 콘텐츠가 열립니다.

| 카드 | 어디서 보나 |
|---|---|
| A13 | 스테이지 10·20·30… (보스 단계)로 이동하면 상단 보스 체력 창과 경로 끝 문장 |
| A14 | 아무 전투에서 치명타가 뜰 때 |
| A15 | 던전 → 별의 광산 → 채굴 시작 |
| A16 | 보스 단계로 이동하는 순간 |
| A17~A19 | 상점(버튼), 설정·우편함(팝업), 하단 메뉴 |
| A20~A22 | 화면 맨 위 재화 칸, 상점(교환·패키지·다이아)과 우편함의 리본, 잠긴 하단 메뉴(거점·던전 등) |

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

## A20~A22 · 재화 칸 · 리본 · 잠금 배지 (스위치 `UI_EXTRA_ART`)

폴더: `dist/client/assets/ui-kit/`

### A20-1 `wallet-frame.webp` — 상단 재화 칸
- **크기**: 200 × 56, 투명 배경. **9조각**이고, 게임은 **모서리 24px**을 고정하고 늘려 씁니다(화면 높이 44px).
- **그릴 것**: 양 끝이 완전히 둥근 캡슐 모양입니다.
  - 짙은 자주 판(위 #2A2036 → 아래 #160F20)입니다.
  - 테두리는 1~2px 금선이고, 위쪽 가장자리에 가는 빛 반사를 넣습니다.
  - 장식은 넣지 않거나, 왼쪽 끝 모서리(24px 안)에 아주 작은 금빛 꺾쇠 하나만 넣습니다.
  - 가운데는 숫자 자리라 고르게 칠합니다.
- **아이콘(골드·다이아·성운석)은 그리지 않습니다.** 게임이 기존 아이콘을 칸 왼쪽 밖으로 걸쳐 올립니다.
- 안내도: `art/gpt-guides/A20-1_wallet-frame_안내.png`
- **프롬프트**: `9-slice horizontal capsule frame for a currency counter, fully rounded ends, dark plum gradient fill, thin gold rim, subtle highlight along the top edge, plain uniform middle for numbers, elegant fantasy mobile RPG HUD, transparent background, no icons, no text`

### A20-2 `plus-badge.webp` — 재화 칸 오른쪽 `+` 버튼
- **크기**: 64 × 64, 투명 배경. 화면에서 22px입니다.
- **그릴 것**: 둥근 금빛 보석 단추 가운데에 짙은 갈색 `+` 표시를 넣습니다. 위쪽은 밝게, 아래는 진하게 칠하고, 테두리는 얇은 진한 금입니다.
- **좌우 대칭, 정중앙, 둘레 여백 4px**으로 그립니다.
- **프롬프트**: `round glossy gold button with a dark brown plus sign in the center, bright top and deeper bottom, thin dark gold rim, perfectly symmetrical, game UI icon, transparent background, no text`

### A21-1 `ribbon-red.webp`, A21-2 `ribbon-gold.webp` — 카드 리본
- **크기**: 각 160 × 40, 투명 배경. 화면에서는 글자 길이에 맞춰 가로로 늘어납니다(높이 약 20px).
- **쓰이는 곳**
  - 빨강: `무료`, `보상`
  - 금색: `한정`, `최고 가치`
  - **글씨는 게임이 쓰므로 그리지 않습니다.**
- **그릴 것**: 비단 리본 띠입니다.
  - **왼쪽 끝은 곧게** 둡니다. 카드 가장자리에 붙는 쪽입니다.
  - **오른쪽 끝은 제비꼬리(V자 홈)**로 처리합니다.
  - 위아래에 가는 금선을 넣습니다.
  - 가운데(가로 15%~80%, 세로 25%~75%)는 글씨 자리라 무늬 없이 고르게 칠합니다.
  - 빨강은 #E2556A → #A9263D, 금색은 #FFE7AB → #D9A24F입니다.
- 안내도: `art/gpt-guides/A21_ribbon_안내.png`
- **프롬프트(빨강)**: `horizontal silk ribbon banner for a shop card label, crimson red gradient, thin gold lines along top and bottom edges, straight left end, swallowtail notch on the right end, plain uniform middle for text, fantasy mobile RPG UI, transparent background, no text`
- **프롬프트(금색)**: 위 문장의 `crimson red`를 `warm gold`로 바꿉니다.

### A22-1 `lock-badge.webp` — 잠긴 메뉴의 자물쇠 배지
- **크기**: 64 × 64, 투명 배경. 화면에서 20px입니다. 하단 메뉴와 상단 바로가기의 잠긴 아이콘 오른쪽 위에 붙습니다.
- **그릴 것**: 짙은 자주 원판에 금빛 테를 두르고, 가운데에 작은 금빛 자물쇠를 넣습니다. 자물쇠는 정면을 보고, 고리는 위쪽입니다.
  - 20px로 줄여도 자물쇠로 읽혀야 하므로 잔선 없이 덩어리로 그립니다.
- **좌우 대칭, 정중앙, 둘레 여백 4px**으로 그립니다.
- **프롬프트**: `small round badge, dark plum disc with thin gold ring, simple golden padlock in the center facing front, bold clean silhouette readable at 20px, perfectly symmetrical, game UI icon, transparent background, no text`

**A20~A22 완료 후**: 다섯 파일(`wallet-frame`, `plus-badge`, `ribbon-red`, `ribbon-gold`, `lock-badge`)이 모두 들어가고 자가 검사를 통과하면 `const UI_EXTRA_ART=true;` → 빌드 명령 2줄. 그림을 켜도 재화 칸·카드 크기는 바뀌지 않습니다.



## M1 · 꼬마 광부 (스위치 `MINER_ART`) — 수정본 13 신규

폴더: `dist/client/assets/star-mine/`

게임에는 지금 **코드로 그린 꼬마 광부**가 들어가 있습니다. 같은 캐릭터를 **반실사 판타지 화풍의 그림 2장**으로 바꾸는 카드입니다. 게임은 두 장을 겹쳐 놓고, 팔 그림만 어깨를 축으로 돌려서 곡괭이를 휘두릅니다.

- **반드시 먼저 볼 것**: 안내도 `art/gpt-guides/M1_miner_기준점.png`
  - 왼쪽: 몸 그림, 가운데: 팔+곡괭이 그림, 오른쪽: 둘을 겹친 모습
  - 이 안내도의 캐릭터 **그대로** (자세·비율·위치) 그리되, 화풍만 고급스럽게 칠합니다.

### 캐릭터 설정 (그대로 지킬 것)
- 2~2.5등신의 꼬마 광부. **머리가 몸보다 큼**. 오른쪽(광석 쪽)을 보는 3/4 옆모습.
- **헬멧**: 둥근 놋쇠 광부 헬멧(#E2AD52, 위는 밝게 #FFE7A6, 아래 테는 #B57A33). 이마 앞 램프 안에 **노란 별**(#FFC94A)이 빛나고, 램프 둘레에 은은한 노란 빛.
- **얼굴**: 살구빛 피부(#F3C39D), 커다란 까만 눈 두 개(흰 반짝임 점), 분홍 볼, 작게 웃는 입. 헬멧 뒤로 갈색 머리카락 조금.
- **옷**: 보라 작업복(#8A6A9E → #4B3560), 그 위에 가죽 앞치마(#A7764E), 짙은 갈색 허리띠에 금빛 버클, 앞치마 단추 2개(금빛).
- **스카프**: 진한 보라(#8C5AD6) 목도리, 꼬리가 뒤(왼쪽)로 날림.
- **신발**: 짙은 갈색 가죽 부츠 두 짝.
- **팔·곡괭이**: 보라 소매, 갈색 가죽 장갑 두 손으로 나무 손잡이를 쥠. 곡괭이 머리는 은빛 쇠(#E9EEF5 → #4C5566), 손잡이와 머리 사이에 놋쇠 띠.

### 파일 1 `miner-body.webp` — 몸
- **크기**: 480 × 480, 투명 배경.
- **들어갈 것**: 헬멧·머리·얼굴·스카프·몸·앞치마·부츠·발밑 그림자. **팔과 곡괭이는 빼고** 그립니다(어깨에서 끊김 → 팔 그림이 덮음).
- **위치(픽셀, 왼쪽 위가 0,0)**: 두 부츠 사이 가운데 바닥 = **(164, 456)**. 머리 꼭대기(헬멧)는 y ≈ 136. 그림은 **왼쪽 절반(x 60~290)** 안에만.

### 파일 2 `miner-arm.webp` — 팔과 곡괭이 (내려친 순간 자세)
- **크기**: 480 × 480, 투명 배경. 몸 그림과 **같은 판 위의 같은 자리**에 그립니다(두 장을 겹치면 안내도 오른쪽 그림이 됨).
- **들어갈 것**: 두 팔(어깨부터), 장갑 낀 두 손, 곡괭이. **머리·몸은 그리지 않습니다.**
- **위치**
  - **어깨(팔이 시작하는 곳, 회전 축)**: **(184, 324)**
  - **곡괭이 날 끝(광석에 닿는 점)**: **(428, 372)** — 곡괭이가 오른쪽으로 뻗고 날이 아래로 꽂히는 자세
  - 손잡이는 손(약 (240~270, 345))에서 오른쪽 위 (392, 292) 쪽으로 뻗고, 그 끝에 곡괭이 머리가 손잡이와 직각으로 붙습니다.
- 게임이 이 그림을 어깨 축으로 **-115°(뒤로 치켜든 자세)까지** 돌립니다. 그러니 팔이 어깨에서 **둥글게 시작**해야 돌려도 어깨가 끊겨 보이지 않습니다.

### 프롬프트
- **몸**: `cute chibi star miner character, 2.5 heads tall, three-quarter view facing right, round brass miner helmet with a small glowing star lamp on the front, big dark sparkling eyes, rosy cheeks, small smile, brown hair under the helmet, purple work suit with leather apron and gold buckle belt, violet scarf with tail blowing back, brown leather boots, NO arms and NO tool (shoulders end cleanly), soft contact shadow under the boots, semi-realistic hand-painted fantasy mobile game style, warm lantern light from the upper left, transparent background, no text`
- **팔**: `the two arms of the same chibi star miner, purple sleeves and brown leather gloves gripping a wooden pickaxe handle with both hands, pickaxe extended to the right with the curved steel blade pointing down at the moment of impact, brass band at the head, arms start with rounded shoulders on the left, NO head and NO body, same painting style and light as the body, transparent background, no text`
- 두 프롬프트 모두 **안내도 `M1_miner_기준점.png`를 참고 그림으로 함께 넣으세요.**

### 맞추기와 검사
1. 각 그림을 480×480 판에 놓고, 안내도의 표시점(발, 어깨, 곡괭이 끝)에 맞도록 **옮기기·크기만** 조정합니다.
2. `python3 tools/check-gpt-art.py M1` → 둘 다 `통과`.
3. `battle-presentation.js` 맨 위의 `const MINER_ART=false;` → `true` → 빌드 명령 2줄.
4. 던전 → 별의 광산 → 채굴 시작 → 화면을 눌러 곡괭이 끝이 광석에 닿는지 봅니다.

## 재작업 카드 R1~R5 (수정본 12 검수 결과)

> **이번에 할 일은 이 다섯 장뿐입니다.** 파일 이름·크기·자리는 A13~A22와 **똑같습니다.** 같은 이름으로 덮어쓰기만 하면 되고, 스위치는 이미 모두 켜져 있으니 건드리지 않습니다.
>
> **공통 화풍(다섯 장 모두):** 반실사 판타지 모바일 RPG. 손으로 칠한 듯한 금속·가죽 질감, 따뜻한 등불 빛이 위 왼쪽에서 들어옵니다. **만화체·클립아트·평면(flat) 디자인·이모지 느낌은 안 됩니다.** 게임 안 기존 그림 `assets/weapon-forge/smith-strike.webp`(대장장이 장갑), `assets/battle-ui/boss-medal.webp`(보스 메달)과 나란히 놓았을 때 같은 손이 그린 것처럼 보여야 합니다. 두 그림을 **참고 그림으로 함께 넣으세요.**

### R1 `star-mine/pick-hand.webp` — **취소(수정본 13)**: 광산은 이제 카드 M1의 꼬마 광부가 곡괭이를 휘두르므로 이 그림은 쓰지 않습니다. 아래 내용은 기록으로만 둡니다.
- **무엇이 문제였나**: 손이 왼쪽 아래 모서리에 잘린 작은 주먹(약 50px)뿐이라 화면에서 손이 안 보입니다. 곡괭이와 손의 빛 방향·선명도가 달라 붙인 티가 납니다.
- **크기**: 380 × 380, 투명 배경. **기준점은 그대로**입니다.
  - 곡괭이 날 끝: **(375, 152)**
  - 손이 쥐는 자리(회전 축): **(53, 334)**
  - 안내도 `art/gpt-guides/A15-1_pick-hand_기준점.png`를 먼저 보세요.
- **이번에 바꿀 것**
  1. **손을 크게**: 장갑 낀 손이 손잡이 아래쪽 **약 1/3(손잡이 길이의 30%)을 감싸 쥡니다.** 손 크기는 대략 가로 110px × 세로 100px.
  2. **손가락이 보이게**: 손잡이를 감은 네 손가락 마디와, 손잡이 위로 걸친 엄지가 보여야 합니다. 주먹 덩어리 하나로 뭉개지 않습니다.
  3. **팔목과 소매**: 손목 뒤로 가죽 팔 보호대(브레이서)와 천 소매 끝이 보이고, 그 뒤는 그림 **왼쪽 아래 모서리 밖으로 자연스럽게 잘립니다.**
  4. **한 장으로 그리기**: 곡괭이와 손을 **처음부터 한 장의 그림으로** 그립니다. 따로 그려 붙이지 않습니다. 빛은 둘 다 위 왼쪽에서 들어옵니다.
  5. 곡괭이 머리 모양(룬 새긴 쇠 띠, 휘어진 날)은 지금 그림을 그대로 따릅니다.
- **색**: 장갑은 짙은 고동 가죽(#4A2E1F~#6B4630), 박음질은 밝은 황토(#C9A06A). 소매는 짙은 남보라 천(#2E2440).
- **프롬프트**:
  `first-person view of a large leather-gloved hand firmly gripping the lower third of a rune-engraved iron pickaxe handle, four finger knuckles wrapped around the shaft and thumb over the top clearly visible, leather bracer and dark cloth sleeve behind the wrist exiting the bottom-left corner, pickaxe head pointing right with curved iron blade, painted as one single coherent image with consistent warm lantern light from the upper left, semi-realistic hand-painted fantasy mobile RPG style, transparent background, no text, not cartoon, not flat`
- **맞춤**: 생성된 그림을 380×380에 놓은 뒤, 날 끝이 (375,152), 손 가운데가 (53,334)에 오도록 **옮기기만** 합니다(돌리거나 늘리지 않기). 자가 검사 `python3 tools/check-gpt-art.py A15`가 통과해야 합니다.

### R2 `combat-fx/crit-burst.webp` — 치명타 폭발 (다시)
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

### R3 `ui-kit/btn-gold.webp`, `ui-kit/btn-purple.webp` — 버튼 두 장 (다시)
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

### R4 `ui-kit/lock-badge.webp` — 자물쇠 배지 (다시)
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

### R5 `ui-kit/ribbon-red.webp`, `ui-kit/ribbon-gold.webp` — 리본 두 장 (다시)
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

### R1~R5를 마친 뒤
1. `python3 tools/check-gpt-art.py` → 마지막 줄에 스위치 6개가 모두 나와야 합니다.
2. 빌드 명령 2줄(`python3 tools/build-web.py`, `python3 tools/build-web.py --check`).
3. 3부대로, **바꾼 파일**(`miner-body`, `miner-arm`, `crit-burst`, `btn-gold`, `btn-purple`, `lock-badge`, `ribbon-red`, `ribbon-gold`)의 이름과 자가 검사 결과를 적어 돌려줍니다. **코드 파일은 고치지 않습니다.** (수정본 12의 코드 수정이 들어간 파일을 기준으로 작업하세요.)

---

# 3부 · 넘길 때와 검수

## GPT → 사용자 → Claude로 넘길 것
0. `python3 tools/check-gpt-art.py` 결과 전체(복사해서 붙여 넣기).
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
- `battle-presentation.js`의 스위치 6줄 말고 다른 코드를 고치는 것.
- 기존 그림 파일을 덮어쓰거나 지우는 것. 특히 `pick.webp`, `vein.webp`, `chips.webp`, `critical-hit.webp`.
- 그림 안에 글자를 넣는 것.
- 자가 검사에서 `고칠것`이 남은 카드의 스위치를 켜는 것.
- `art/gpt-guides/` 안내도를 게임 그림 폴더(`dist/client/assets/`)에 넣는 것(안내도는 참고용입니다).
- 파일 이름을 바꾸는 것. 예: `boss_frame.webp`, `bossFrame.webp`는 안 됩니다.
