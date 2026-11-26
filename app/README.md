# 성운의 모루 — 안드로이드 앱

앱은 **게임 서버 주소를 여는 창**입니다. 게임 파일과 계정은 모두 서버에 있어서, 웹(브라우저)과 앱이 항상 같은 게임을 보여 주고, 서버를 고치면 앱도 함께 바뀝니다. 앱을 다시 올릴 필요가 없습니다.

예전 앱은 게임 파일을 앱 안에 넣는 방식이었고, 그 묶는 스크립트가 지금 게임과 맞지 않아 빌드가 되지 않았습니다. 계정 저장과 보상도 서버가 있어야 해서, 서버를 여는 방식으로 바꿨습니다.

## 앱이 하는 일

- 서버 주소를 열고, 그 주소 밖으로 나가는 링크는 휴대폰의 브라우저로 넘깁니다.
- 로딩 화면과 진행률, 연결 실패 시 "다시 불러오기".
- 뒤로가기: 열린 메뉴나 미니게임을 닫고, 닫을 것이 없으면 종료를 묻습니다.
- 앱이 뒤로 갈 때 저장을 서버로 보냅니다.
- 저장 파일 내보내기·불러오기.

## 로그인

앱 안의 브라우저에서는 Google 로그인 창이 열리지 않습니다(Google의 정책). 그래서 앱에서는 **로그인 창 없이 이 설치본의 게스트 계정**으로 바로 시작합니다. 앱을 지우면 그 계정에 다시 들어갈 수 없습니다. 스토어 출시 전에는 안드로이드의 Google 로그인을 앱에 직접 붙여야 합니다(아직 안 됨).

웹에서는 "Google 계정으로 시작"과 "로그인 없이 시작"을 고릅니다.

## 빌드

Android SDK(build-tools 35, platform 35)와 JDK가 필요합니다.

```
# 시험용: 처음 켤 때 서버 주소를 묻습니다. http:// 주소(IP)도 열 수 있습니다.
NEBULA_KEY_PASSWORD=<키 비밀번호> python build.py --build-tools <sdk>/build-tools/35.0.0 \
  --platform <sdk>/platforms/android-35/android.jar --keystore test.keystore --output NebulaForge-test.apk --allow-http

# 배포용: 주소를 앱에 넣습니다. https 만 됩니다.
NEBULA_KEY_PASSWORD=<키 비밀번호> python build.py --build-tools ... --platform ... \
  --keystore release.keystore --key-alias forge --package kr.nebulaforge.game \
  --url https://<게임 도메인> --version-name 1.0.0 --version-code 10 --output NebulaForge.apk
```

키 파일(`*.keystore`)과 APK는 저장소에 올리지 않습니다(`.gitignore`).

## 아직 안 된 것

- **실제 기기나 에뮬레이터에서 켜 보지 못했습니다.** 빌드와 서명, 그리고 앱 환경을 흉내 낸 브라우저에서 자동 로그인과 뒤로가기 동작까지만 확인했습니다.
- 구글 플레이는 새 앱을 AAB 형식으로만 받습니다. 지금 스크립트는 APK만 만듭니다.
- 앱 안 Google 로그인, 결제(인앱 구매), 푸시 알림.
- 처음 켤 때 게임 파일(약 220MB)을 서버에서 받습니다. 그다음부터는 휴대폰에 캐시됩니다.
